import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { connectDb, disconnectDb } from "../config/db.js";
import { ClassSession, TrainingClass, User } from "../models/index.js";
import { signToken } from "../services/token.service.js";

describe("classes routes", () => {
  let mongo: MongoMemoryServer;
  const app = createApp();
  let token: string;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await connectDb(mongo.getUri());
  });

  afterAll(async () => {
    await disconnectDb();
    await mongo.stop();
  });

  beforeEach(async () => {
    await Promise.all([TrainingClass.deleteMany({}), ClassSession.deleteMany({}), User.deleteMany({})]);
    const user = await User.create({ name: "Admin", email: "admin@fitops.lk", passwordHash: "x", role: "Administrator" });
    token = signToken({ sub: String(user._id), role: user.role });
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  const basePayload = {
    title: "Fundamentals",
    discipline: "Kung Fu",
    coach: "Sifu Lee",
    day: "Mon",
    startTime: "18:00",
    durationMin: 60,
    level: "Beginner",
    capacity: 20,
    ring: "Ring A",
  };

  it("rejects requests without a token", async () => {
    const res = await request(app).get("/api/classes");
    expect(res.status).toBe(401);
  });

  it("creates a class with any discipline string, not just Muay Thai", async () => {
    const res = await request(app).post("/api/classes").set(auth()).send(basePayload);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ discipline: "Kung Fu", title: "Fundamentals", booked: 0 });
  });

  it("rejects a class missing discipline with 400", async () => {
    const { discipline: _discipline, ...payload } = basePayload;
    const res = await request(app).post("/api/classes").set(auth()).send(payload);
    expect(res.status).toBe(400);
  });

  it("409s on a same-day same-ring overlapping time, regardless of discipline", async () => {
    await request(app).post("/api/classes").set(auth()).send(basePayload);

    const overlapping = { ...basePayload, title: "Taekwondo Basics", discipline: "Taekwondo", startTime: "18:30" };
    const res = await request(app).post("/api/classes").set(auth()).send(overlapping);

    expect(res.status).toBe(409);
    expect(res.body.error.details).toMatchObject({ discipline: "Kung Fu" });
  });

  it("allows two different disciplines back-to-back with no overlap", async () => {
    await request(app).post("/api/classes").set(auth()).send(basePayload);
    const backToBack = { ...basePayload, title: "Taekwondo Basics", discipline: "Taekwondo", startTime: "19:00" };
    const res = await request(app).post("/api/classes").set(auth()).send(backToBack);
    expect(res.status).toBe(201);
  });

  it("only auto-logs today's session when the new class's day matches today", async () => {
    const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
    const today = DAYS[new Date().getDay()];
    const otherDay = DAYS[(new Date().getDay() + 1) % 7];

    await request(app).post("/api/classes").set(auth()).send({ ...basePayload, day: today });
    const todaySessions = await ClassSession.find({});
    expect(todaySessions).toHaveLength(1);
    expect(todaySessions[0].discipline).toBe("Kung Fu");

    await request(app)
      .post("/api/classes")
      .set(auth())
      .send({ ...basePayload, title: "Another Day Class", day: otherDay, startTime: "20:00" });
    const allSessions = await ClassSession.find({});
    expect(allSessions).toHaveLength(1); // no new session logged for the class on a different day
  });

  it("completes a session, defaulting attended to 80% capacity and rounds to 10", async () => {
    const created = await ClassSession.create({
      classId: null,
      date: "2026-08-29",
      title: "Ad-hoc",
      discipline: "Boxing",
      coach: "Coach K",
      attended: 0,
      capacity: 20,
      rounds: 0,
      status: "Scheduled",
    });

    const res = await request(app).patch(`/api/classes/sessions/${created._id}/complete`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "Completed", attended: 16, rounds: 10 });
  });

  it("GET /sessions lists sessions with their discipline", async () => {
    await ClassSession.create({
      classId: null, date: "2026-08-29", title: "Ad-hoc", discipline: "Judo",
      coach: "Coach K", attended: 0, capacity: 20, rounds: 0, status: "Scheduled",
    });
    const res = await request(app).get("/api/classes/sessions").set(auth());
    expect(res.status).toBe(200);
    expect(res.body[0].discipline).toBe("Judo");
  });
});
