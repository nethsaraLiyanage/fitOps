import { isValidObjectId } from "mongoose";
import { AttendanceRecord, Member } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { CheckInInput } from "../schemas/attendance.schema.js";
import { GYM_TIMEZONE, daysAgo, startOfToday, startOfTomorrow } from "../utils/time.js";
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
