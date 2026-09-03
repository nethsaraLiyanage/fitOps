import { stringify } from "csv-stringify/sync";
import { AttendanceRecord, Equipment, Member } from "../models/index.js";
import { GYM_TIMEZONE, daysAgo, mondayFirstWeekday, toDayKey } from "../utils/time.js";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type MemberTrendPoint = { month: string; new: number; total: number };
export type AttendanceTrendPoint = { week: string; avg: number };
export type WeekdayPoint = { day: string; checkins: number };
export type CategorySlice = { name: string; value: number };

/** ["2026-04" … "2026-09"] for the trailing `months` months, oldest first. */
function lastMonthKeys(months: number): string[] {
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);
  cursor.setMonth(cursor.getMonth() - (months - 1));

  return Array.from({ length: months }, () => {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    cursor.setMonth(cursor.getMonth() + 1);
    return key;
  });
}

const monthLabel = (key: string) => MONTH_LABELS[Number(key.slice(5, 7)) - 1] ?? key;

/**
 * New signups per month plus the running roster size at each month's end.
 * There is no churn tracking in this app, so nothing here pretends to measure it.
 */
export async function memberTrend(months = 6): Promise<MemberTrendPoint[]> {
  const keys = lastMonthKeys(months);

  // `joined` is stored as a "YYYY-MM-DD" string, so the month is a plain substring.
  const rows = await Member.aggregate([{ $group: { _id: { $substrBytes: ["$joined", 0, 7] }, count: { $sum: 1 } } }]);
  const byMonth = new Map<string, number>(rows.map((row) => [row._id, row.count]));

  // Everyone who joined before the window is the running total's starting point.
  let running = 0;
  for (const [month, count] of byMonth) {
    if (month < keys[0]) running += count;
  }

  return keys.map((key) => {
    const added = byMonth.get(key) ?? 0;
    running += added;
    return { month: monthLabel(key), new: added, total: running };
  });
}

/** Check-in counts keyed by "YYYY-MM-DD" in the gym's timezone. */
async function dailyCheckIns(since: Date): Promise<Map<string, number>> {
  const rows = await AttendanceRecord.aggregate([
    { $match: { checkIn: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { date: "$checkIn", format: "%Y-%m-%d", timezone: GYM_TIMEZONE } },
        count: { $sum: 1 },
      },
    },
  ]);

  return new Map<string, number>(rows.map((row) => [row._id, row.count]));
}

/** Average daily check-ins per trailing week, W1 oldest. The final week includes today so far. */
export async function attendanceTrend(weeks = 6): Promise<AttendanceTrendPoint[]> {
  const totalDays = weeks * 7;
  const daily = await dailyCheckIns(daysAgo(totalDays - 1));

  return Array.from({ length: weeks }, (_, week) => {
    let total = 0;
    for (let dayInWeek = 0; dayInWeek < 7; dayInWeek++) {
      total += daily.get(toDayKey(daysAgo(totalDays - 1 - (week * 7 + dayInWeek)))) ?? 0;
    }
    return { week: `W${week + 1}`, avg: Math.round(total / 7) };
  });
}

/**
 * What a typical Monday, Tuesday … looks like. Today is excluded because a day
 * still in progress would drag its own weekday's average down.
 */
export async function attendanceByWeekday(weeks = 8): Promise<WeekdayPoint[]> {
  const totalDays = weeks * 7;
  const daily = await dailyCheckIns(daysAgo(totalDays));

  const totals = Array(7).fill(0);
  const occurrences = Array(7).fill(0);

  for (let offset = totalDays; offset >= 1; offset--) {
    const date = daysAgo(offset);
    const weekday = mondayFirstWeekday(date);
    totals[weekday] += daily.get(toDayKey(date)) ?? 0;
    occurrences[weekday] += 1;
  }

  return DAY_LABELS.map((day, i) => ({
    day,
    checkins: occurrences[i] ? Math.round(totals[i] / occurrences[i]) : 0,
  }));
}

/**
 * How the equipment roster splits across categories. Deliberately a composition of
 * what the gym owns — there is no per-equipment usage tracking to report on.
 */
export async function equipmentByCategory(): Promise<CategorySlice[]> {
  const rows = await Equipment.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
  ]);

  return rows.map((row) => ({ name: row._id, value: row.count }));
}

export async function summary() {
  const [members, attendance, weekday, equipment] = await Promise.all([
    memberTrend(),
    attendanceTrend(),
    attendanceByWeekday(),
    equipmentByCategory(),
  ]);

  return {
    memberTrend: members,
    attendanceTrend: attendance,
    attendanceByWeekday: weekday,
    equipmentByCategory: equipment,
  };
}

const clock = (date: Date) => `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

export async function membersCsv(): Promise<string> {
  const members = await Member.find().sort({ membershipId: 1 });

  return stringify(
    members.map((member) => ({
      membershipId: member.membershipId,
      name: member.name,
      nic: member.nic,
      email: member.email,
      phone: member.phone,
      status: member.status,
      plan: member.plan,
      paymentMethod: member.paymentMethod,
      joined: member.joined,
      outstanding: member.payments.filter((p) => p.status !== "paid").reduce((sum, p) => sum + p.amount, 0),
    })),
    {
      header: true,
      columns: [
        { key: "membershipId", header: "Membership ID" },
        { key: "name", header: "Name" },
        { key: "nic", header: "NIC" },
        { key: "email", header: "Email" },
        { key: "phone", header: "Phone" },
        { key: "status", header: "Status" },
        { key: "plan", header: "Plan" },
        { key: "paymentMethod", header: "Payment Method" },
        { key: "joined", header: "Joined" },
        { key: "outstanding", header: "Outstanding" },
      ],
    },
  );
}

export async function attendanceCsv(days = 90): Promise<string> {
  const records = await AttendanceRecord.find({ checkIn: { $gte: daysAgo(days - 1) } })
    .sort({ checkIn: -1 })
    .populate("memberId", "name membershipId");

  return stringify(
    records.map((record) => {
      const member: any = record.memberId;
      return {
        date: toDayKey(record.checkIn),
        member: member?.name ?? "Unknown member",
        membershipId: member?.membershipId ?? "",
        checkIn: clock(record.checkIn),
        checkOut: record.checkOut ? clock(record.checkOut) : "",
        minutes: record.checkOut ? Math.round((record.checkOut.getTime() - record.checkIn.getTime()) / 60000) : "",
      };
    }),
    {
      header: true,
      columns: [
        { key: "date", header: "Date" },
        { key: "member", header: "Member" },
        { key: "membershipId", header: "Membership ID" },
        { key: "checkIn", header: "Check In" },
        { key: "checkOut", header: "Check Out" },
        { key: "minutes", header: "Duration (min)" },
      ],
    },
  );
}

export async function equipmentCsv(): Promise<string> {
  const equipment = await Equipment.find().sort({ category: 1, name: 1 });

  return stringify(
    equipment.map((item) => ({
      name: item.name,
      category: item.category,
      condition: item.condition,
      status: item.status,
      technician: item.technician ?? "",
      lastMaintenance: item.lastMaintenance,
      logs: item.maintenanceLogs.length,
    })),
    {
      header: true,
      columns: [
        { key: "name", header: "Equipment" },
        { key: "category", header: "Category" },
        { key: "condition", header: "Condition" },
        { key: "status", header: "Status" },
        { key: "technician", header: "Technician" },
        { key: "lastMaintenance", header: "Last Maintenance" },
        { key: "logs", header: "Maintenance Entries" },
      ],
    },
  );
}
