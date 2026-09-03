import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { connectDb, disconnectDb } from "../config/db.js";
import { AttendanceRecord, Equipment, Member, User } from "../models/index.js";
import { signToken } from "../services/token.service.js";
import { daysAgo, mondayFirstWeekday } from "../utils/time.js";

describe("reports routes", () => {
  let mongo: MongoMemoryServer;
  const app = createApp();
  let token: string;

  const monthKey = (monthsAgo: number) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - monthsAgo);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  const makeMember = (membershipId: string, joined: string, extra: Record<string, unknown> = {}) =>
    Member.create({
      membershipId,
      name: `Member ${membershipId}`,
      nic: "990000000V",
      email: `${membershipId.toLowerCase()}@example.com`,
      phone: "0770000000",
      joined,
      plan: "Standard",
      paymentMethod: "Monthly",
      ...extra,
    });

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await connectDb(mongo.getUri());
  });

  afterAll(async () => {
    await disconnectDb();
    await mongo.stop();
  });

  beforeEach(async () => {
    await Promise.all([
      AttendanceRecord.deleteMany({}),
      Member.deleteMany({}),
      Equipment.deleteMany({}),
      User.deleteMany({}),
    ]);
    const user = await User.create({ name: "Admin", email: "admin@fitops.lk", passwordHash: "x", role: "Administrator" });
    token = signToken({ sub: String(user._id), role: user.role });
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });
  const getSummary = async () => (await request(app).get("/api/reports/summary").set(auth())).body;

  it("rejects requests without a token", async () => {
    expect((await request(app).get("/api/reports/summary")).status).toBe(401);
    expect((await request(app).get("/api/reports/export/members.csv")).status).toBe(401);
  });

  it("counts new signups per month and carries a running roster total", async () => {
    await makeMember("GYM-0001", "2019-04-02"); // long before the window
    await makeMember("GYM-0002", `${monthKey(1)}-05`);
    await makeMember("GYM-0003", `${monthKey(0)}-08`);
    await makeMember("GYM-0004", `${monthKey(0)}-19`);

    const { memberTrend } = await getSummary();

    expect(memberTrend).toHaveLength(6);
    expect(memberTrend[4]).toMatchObject({ new: 1, total: 2 });
    expect(memberTrend[5]).toMatchObject({ new: 2, total: 4 });
    // The pre-window member seeds the running total rather than appearing as a signup.
    expect(memberTrend[0]).toMatchObject({ new: 0, total: 1 });
  });

  it("reports zeroes for every month when nobody has joined", async () => {
    const { memberTrend } = await getSummary();

    expect(memberTrend).toHaveLength(6);
    expect(memberTrend.every((p: { new: number; total: number }) => p.new === 0 && p.total === 0)).toBe(true);
  });

  it("averages check-ins per trailing week with the newest week last", async () => {
    const member = await makeMember("GYM-0001", "2026-01-01");

    // 14 check-ins inside the most recent week, none earlier.
    const recent = Array.from({ length: 14 }, () => ({ memberId: member._id, checkIn: daysAgo(2), checkOut: null }));
    await AttendanceRecord.create(recent);

    const { attendanceTrend } = await getSummary();

    expect(attendanceTrend).toHaveLength(6);
    expect(attendanceTrend[0]).toEqual({ week: "W1", avg: 0 });
    expect(attendanceTrend[5]).toEqual({ week: "W6", avg: 2 }); // 14 over 7 days
  });

  it("averages a typical weekday and excludes the partial current day", async () => {
    const member = await makeMember("GYM-0001", "2026-01-01");
    const sevenDaysAgo = daysAgo(7);

    await AttendanceRecord.create([
      { memberId: member._id, checkIn: sevenDaysAgo, checkOut: null },
      { memberId: member._id, checkIn: sevenDaysAgo, checkOut: null },
      // Today is in progress, so these must not count towards today's weekday.
      { memberId: member._id, checkIn: daysAgo(0), checkOut: null },
      { memberId: member._id, checkIn: daysAgo(0), checkOut: null },
      { memberId: member._id, checkIn: daysAgo(0), checkOut: null },
    ]);

    const { attendanceByWeekday } = await getSummary();
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    expect(attendanceByWeekday.map((p: { day: string }) => p.day)).toEqual(labels);

    // Seven days ago is the same weekday as today; over an 8-week window it occurs 8 times.
    const todayWeekday = mondayFirstWeekday(new Date());
    expect(attendanceByWeekday[todayWeekday].checkins).toBe(0); // round(2/8)
  });

  it("splits equipment into category slices, largest first", async () => {
    await Equipment.create([
      { name: "Treadmill 1", category: "Cardio", condition: "Good", lastMaintenance: "2026-08-01" },
      { name: "Treadmill 2", category: "Cardio", condition: "Good", lastMaintenance: "2026-08-01" },
      { name: "Rack", category: "Strength", condition: "Good", lastMaintenance: "2026-08-01" },
    ]);

    const { equipmentByCategory } = await getSummary();

    expect(equipmentByCategory).toEqual([
      { name: "Cardio", value: 2 },
      { name: "Strength", value: 1 },
    ]);
  });

  it("exports members as a downloadable CSV with an outstanding-balance column", async () => {
    await makeMember("GYM-0001", "2026-02-10", {
      name: "Sarah Connor",
      payments: [
        { period: "2026-08", amount: 6500, status: "paid", verified: true, paidOn: "2026-08-05" },
        { period: "2026-09", amount: 6500, status: "pending", verified: false, paidOn: null },
      ],
    });

    const res = await request(app).get("/api/reports/export/members.csv").set(auth());

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toMatch(/attachment; filename="fitops-members-\d{4}-\d{2}-\d{2}\.csv"/);

    const [header, row] = res.text.trim().split("\n");
    expect(header).toContain("Membership ID,Name,NIC");
    expect(header.trim().endsWith("Outstanding")).toBe(true);
    expect(row).toContain("Sarah Connor");
    expect(row.trim().endsWith("6500")).toBe(true); // only the unpaid period counts
  });

  it("exports attendance rows with a computed duration and a blank check-out for open sessions", async () => {
    const member = await makeMember("GYM-0001", "2026-01-01", { name: "Emily Chen" });
    const checkIn = daysAgo(1);
    const checkOut = new Date(checkIn.getTime() + 90 * 60_000);

    await AttendanceRecord.create([
      { memberId: member._id, checkIn, checkOut },
      { memberId: member._id, checkIn: daysAgo(0), checkOut: null },
    ]);

    const res = await request(app).get("/api/reports/export/attendance.csv").set(auth());
    const lines = res.text.trim().split("\n");

    expect(res.headers["content-disposition"]).toContain("fitops-attendance-");
    expect(lines[0]).toContain("Date,Member,Membership ID,Check In,Check Out,Duration (min)");
    expect(lines).toHaveLength(3);
    expect(lines.some((l) => l.includes("Emily Chen") && l.trim().endsWith("90"))).toBe(true);
    // The still-open session ends on two empty fields.
    expect(lines.some((l) => l.trim().endsWith(",,"))).toBe(true);
  });

  it("exports equipment with its maintenance entry count", async () => {
    await Equipment.create({
      name: "Treadmill 3",
      category: "Cardio",
      condition: "Fair",
      lastMaintenance: "2026-08-20",
      status: "maintenance",
      technician: "Nuwan",
      maintenanceLogs: [{ date: "2026-08-20", action: "Belt replaced", technician: "Nuwan" }],
    });

    const res = await request(app).get("/api/reports/export/equipment.csv").set(auth());
    const [header, row] = res.text.trim().split("\n");

    expect(header).toBe("Equipment,Category,Condition,Status,Technician,Last Maintenance,Maintenance Entries");
    expect(row).toBe("Treadmill 3,Cardio,Fair,maintenance,Nuwan,2026-08-20,1");
  });

  it("returns only headers when there is nothing to export", async () => {
    const res = await request(app).get("/api/reports/export/equipment.csv").set(auth());

    expect(res.status).toBe(200);
    expect(res.text.trim().split("\n")).toHaveLength(1);
  });
});
