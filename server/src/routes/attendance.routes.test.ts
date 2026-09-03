import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { connectDb, disconnectDb } from "../config/db.js";
import { AttendanceRecord, Member, User } from "../models/index.js";
import { signToken } from "../services/token.service.js";

describe("attendance routes", () => {
  let mongo: MongoMemoryServer;
  const app = createApp();
  let token: string;
  let memberId: string;

  const makeMember = async (name: string, membershipId: string) =>
    Member.create({
      membershipId,
      name,
      nic: "990000000V",
      email: `${membershipId.toLowerCase()}@example.com`,
      phone: "0770000000",
      joined: "2026-01-15",
      plan: "Standard",
      paymentMethod: "Monthly",
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
    await Promise.all([AttendanceRecord.deleteMany({}), Member.deleteMany({}), User.deleteMany({})]);
    const user = await User.create({ name: "Admin", email: "admin@fitops.lk", passwordHash: "x", role: "Administrator" });
    token = signToken({ sub: String(user._id), role: user.role });
    memberId = String((await makeMember("Sarah Connor", "GYM-0001"))._id);
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it("rejects requests without a token", async () => {
    const res = await request(app).get("/api/attendance/today");
    expect(res.status).toBe(401);
  });

  it("checks a member in and returns the member's name with the record", async () => {
    const res = await request(app).post("/api/attendance/check-in").set(auth()).send({ memberId });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ memberId, memberName: "Sarah Connor", membershipId: "GYM-0001", checkOut: null });
    expect(typeof res.body.checkIn).toBe("string");
  });

  it("rejects a malformed member id with 400 and an unknown member with 404", async () => {
    const malformed = await request(app).post("/api/attendance/check-in").set(auth()).send({ memberId: "not-an-id" });
    expect(malformed.status).toBe(400);

    const unknown = await request(app)
      .post("/api/attendance/check-in")
      .set(auth())
      .send({ memberId: "000000000000000000000000" });
    expect(unknown.status).toBe(404);
  });

  it("rejects a second check-in while the member is still in the gym", async () => {
    await request(app).post("/api/attendance/check-in").set(auth()).send({ memberId });

    const res = await request(app).post("/api/attendance/check-in").set(auth()).send({ memberId });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toContain("Sarah Connor");
  });

  it("allows a fresh check-in after checking out", async () => {
    const first = await request(app).post("/api/attendance/check-in").set(auth()).send({ memberId });
    await request(app).patch(`/api/attendance/${first.body.id}/check-out`).set(auth());

    const again = await request(app).post("/api/attendance/check-in").set(auth()).send({ memberId });
    expect(again.status).toBe(201);
  });

  it("allows a check-in when yesterday's record was never checked out", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await AttendanceRecord.create({ memberId, checkIn: yesterday, checkOut: null });

    const res = await request(app).post("/api/attendance/check-in").set(auth()).send({ memberId });
    expect(res.status).toBe(201);
  });

  it("checks out an open record and refuses to check out twice", async () => {
    const created = await request(app).post("/api/attendance/check-in").set(auth()).send({ memberId });

    const res = await request(app).patch(`/api/attendance/${created.body.id}/check-out`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.checkOut).not.toBeNull();

    const twice = await request(app).patch(`/api/attendance/${created.body.id}/check-out`).set(auth());
    expect(twice.status).toBe(409);
  });

  it("404s checking out an unknown or malformed record id", async () => {
    const unknown = await request(app).patch("/api/attendance/000000000000000000000000/check-out").set(auth());
    expect(unknown.status).toBe(404);

    const malformed = await request(app).patch("/api/attendance/nope/check-out").set(auth());
    expect(malformed.status).toBe(404);
  });

  it("lists only today's check-ins, newest first", async () => {
    const other = await makeMember("John Doe", "GYM-0002");

    const earlier = new Date();
    earlier.setHours(6, 0, 0, 0);
    const later = new Date();
    later.setHours(9, 0, 0, 0);
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    await AttendanceRecord.create([
      { memberId, checkIn: earlier, checkOut: null },
      { memberId: other._id, checkIn: later, checkOut: null },
      { memberId, checkIn: lastWeek, checkOut: null },
    ]);

    const res = await request(app).get("/api/attendance/today").set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((r: { memberName: string }) => r.memberName)).toEqual(["John Doe", "Sarah Connor"]);
  });

  it("buckets check-ins by weekday and hour, Monday-first", async () => {
    const daysAgoAt = (daysAgo: number, hour: number) => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(hour, 30, 0, 0);
      return date;
    };
    // JS getDay() is 0=Sunday..6=Saturday; the API re-indexes onto the UI's Monday-first 0..6.
    const mondayFirst = (date: Date) => (date.getDay() + 6) % 7;

    const evening = daysAgoAt(3, 18);
    const morning = daysAgoAt(5, 7);

    await AttendanceRecord.create([
      { memberId, checkIn: evening, checkOut: null },
      { memberId, checkIn: evening, checkOut: null },
      { memberId, checkIn: morning, checkOut: null },
    ]);

    const res = await request(app).get("/api/attendance/heatmap?days=14").set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(
      expect.arrayContaining([
        { weekday: mondayFirst(evening), hour: 18, count: 2 },
        { weekday: mondayFirst(morning), hour: 7, count: 1 },
      ]),
    );
  });

  it("excludes check-ins older than the requested window", async () => {
    const longAgo = new Date();
    longAgo.setDate(longAgo.getDate() - 30);
    await AttendanceRecord.create({ memberId, checkIn: longAgo, checkOut: null });

    const res = await request(app).get("/api/attendance/heatmap?days=7").set(auth());
    expect(res.body).toEqual([]);
  });

  it("rejects an invalid heatmap window with 400", async () => {
    const res = await request(app).get("/api/attendance/heatmap?days=0").set(auth());
    expect(res.status).toBe(400);
  });
});
