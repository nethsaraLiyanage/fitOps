import { isValidObjectId } from "mongoose";
import { AttendanceRecord, DevicePunch, Member } from "../models/index.js";
import { PUNCH_OUTCOMES } from "../models/DevicePunch.js";
import { ApiError } from "../utils/ApiError.js";
import { CheckInInput } from "../schemas/attendance.schema.js";
import { PunchBatchInput } from "../schemas/device.schema.js";
import { GYM_TIMEZONE, daysAgo, startOfDay, startOfToday, startOfTomorrow } from "../utils/time.js";
import { logActivity } from "./activity.service.js";

const toClientRecord = (doc: any) => {
  const member = doc.memberId;
  const populated = member && typeof member === "object" && "name" in member;

  return {
    id: String(doc._id),
    memberId: String(populated ? member._id : member),
    memberName: populated ? member.name : "Unknown member",
    membershipId: populated ? member.membershipId : null,
    checkIn: doc.checkIn.toISOString(),
    checkOut: doc.checkOut ? doc.checkOut.toISOString() : null,
    source: doc.source ?? "manual",
  };
};

const withMember = (query: any) => query.populate("memberId", "name membershipId");

export async function listToday() {
  const records = await withMember(
    AttendanceRecord.find({ checkIn: { $gte: startOfToday(), $lt: startOfTomorrow() } }).sort({ checkIn: -1 }),
  );
  return records.map(toClientRecord);
}

export async function checkIn(input: CheckInInput, actorId?: string) {
  const member = await Member.findById(input.memberId);
  if (!member) throw ApiError.notFound("Member not found");

  // Scoped to today so a forgotten check-out from a previous day doesn't lock the member out.
  const openToday = await AttendanceRecord.findOne({
    memberId: member._id,
    checkOut: null,
    checkIn: { $gte: startOfToday() },
  });
  if (openToday) throw ApiError.conflict(`${member.name} is already checked in.`);

  const record = await AttendanceRecord.create({ memberId: member._id, checkIn: new Date(), checkOut: null });
  await logActivity("attendance.checked_in", `${member.name} checked in`, actorId);

  await record.populate("memberId", "name membershipId");
  return toClientRecord(record);
}

export async function checkOut(id: string) {
  if (!isValidObjectId(id)) throw ApiError.notFound("Attendance record not found");

  const record = await AttendanceRecord.findById(id);
  if (!record) throw ApiError.notFound("Attendance record not found");
  if (record.checkOut) throw ApiError.conflict("This member has already checked out.");

  record.checkOut = new Date();
  await record.save();
  await record.populate("memberId", "name membershipId");
  return toClientRecord(record);
}

/** Two punches this close together are one press repeated, not an exit followed by a re-entry. */
export const REPEAT_PUNCH_WINDOW_MS = 2 * 60 * 1000;

/** Device clocks drift; a punch further ahead of the server than this means a misconfigured clock, not a visit. */
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

type PunchOutcome = (typeof PUNCH_OUTCOMES)[number];
type Punch = PunchBatchInput["punches"][number];

export type PunchResult = {
  biometricId: string;
  punchedAt: string;
  /** "duplicate" means this exact punch was already processed — safe for the bridge to drop. */
  outcome: PunchOutcome | "duplicate";
  memberName?: string;
  /** Present for matched members, so the bridge (or a display beside it) can flag an expired membership. */
  membershipStatus?: string;
};

/**
 * Fingerprint devices report a bare "punch" with no notion of in or out, so the
 * direction is inferred: a punch while the member has an open visit that day
 * closes it, any other punch opens a new one. A punch within the repeat window
 * of an existing check-in or check-out is a double press and changes nothing,
 * which also makes re-applying the same punch harmless.
 */
async function applyPunch(punch: Punch, deviceId: string) {
  if (punch.punchedAt.getTime() > Date.now() + MAX_CLOCK_SKEW_MS) {
    return { outcome: "invalid_time" as const, member: null, record: null };
  }

  const member = await Member.findOne({ biometricId: punch.biometricId });
  if (!member) return { outcome: "unknown_member" as const, member: null, record: null };

  const dayStart = startOfDay(punch.punchedAt);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const visits = await AttendanceRecord.find({ memberId: member._id, checkIn: { $gte: dayStart, $lt: dayEnd } }).sort({
    checkIn: 1,
  });

  const at = punch.punchedAt.getTime();
  const near = (date: Date | null | undefined) => !!date && Math.abs(date.getTime() - at) < REPEAT_PUNCH_WINDOW_MS;
  if (visits.some((v) => near(v.checkIn) || near(v.checkOut))) {
    return { outcome: "repeat" as const, member, record: null };
  }

  const latest = visits.filter((v) => v.checkIn.getTime() <= at).at(-1);

  if (latest && !latest.checkOut) {
    latest.checkOut = punch.punchedAt;
    await latest.save();
    return { outcome: "checked_out" as const, member, record: latest };
  }

  // Falls inside a visit that already has both ends — neither an entry nor an exit.
  if (latest?.checkOut && latest.checkOut.getTime() > at) {
    return { outcome: "repeat" as const, member, record: null };
  }

  const record = await AttendanceRecord.create({
    memberId: member._id,
    checkIn: punch.punchedAt,
    checkOut: null,
    source: "biometric",
    deviceId,
  });
  await logActivity("attendance.checked_in", `${member.name} checked in (fingerprint)`);
  return { outcome: "checked_in" as const, member, record };
}

async function recordPunch(punch: Punch, deviceId: string): Promise<PunchResult> {
  const base = { biometricId: punch.biometricId, punchedAt: punch.punchedAt.toISOString() };
  const eventId = `${deviceId}:${punch.biometricId}:${base.punchedAt}`;

  if (await DevicePunch.exists({ eventId })) return { ...base, outcome: "duplicate" };

  const { outcome, member, record } = await applyPunch(punch, deviceId);

  try {
    await DevicePunch.create({
      eventId,
      deviceId,
      biometricId: punch.biometricId,
      punchedAt: punch.punchedAt,
      outcome,
      memberId: member?._id ?? null,
      attendanceRecordId: record?._id ?? null,
    });
  } catch (error) {
    // A concurrent retry of the same batch got there first; applyPunch saw its effect as a repeat.
    if ((error as { code?: number }).code === 11000) return { ...base, outcome: "duplicate" };
    throw error;
  }

  return member ? { ...base, outcome, memberName: member.name, membershipStatus: member.status } : { ...base, outcome };
}

/**
 * Applies a batch of device punches. They're processed oldest first — a bridge
 * flushing a backlog may send them in any order, and in/out inference depends on
 * sequence — but results come back in the order they were sent.
 */
export async function recordPunches(input: PunchBatchInput, deviceId: string): Promise<PunchResult[]> {
  const order = input.punches
    .map((punch, index) => ({ punch, index }))
    .sort((a, b) => a.punch.punchedAt.getTime() - b.punch.punchedAt.getTime());

  const results: PunchResult[] = new Array(input.punches.length);
  for (const { punch, index } of order) {
    results[index] = await recordPunch(punch, deviceId);
  }
  return results;
}

export type HeatmapCell = { weekday: number; hour: number; count: number };

/** Check-in counts bucketed by weekday × hour over the last `days` days. Only non-empty buckets are returned. */
export async function heatmap(days: number): Promise<HeatmapCell[]> {
  const since = daysAgo(days - 1);

  const rows = await AttendanceRecord.aggregate([
    { $match: { checkIn: { $gte: since } } },
    {
      $group: {
        _id: {
          weekday: { $dayOfWeek: { date: "$checkIn", timezone: GYM_TIMEZONE } },
          hour: { $hour: { date: "$checkIn", timezone: GYM_TIMEZONE } },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.hour": 1, "_id.weekday": 1 } },
  ]);

  // Mongo's $dayOfWeek is 1=Sunday..7=Saturday; the UI grid is Monday-first 0..6.
  return rows.map((row) => ({
    weekday: (row._id.weekday + 5) % 7,
    hour: row._id.hour,
    count: row.count,
  }));
}
