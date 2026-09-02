import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { connectDb, disconnectDb } from "../config/db.js";
import { Equipment, User } from "../models/index.js";
import { signToken } from "../services/token.service.js";

describe("equipment routes", () => {
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
    await Promise.all([Equipment.deleteMany({}), User.deleteMany({})]);
    const user = await User.create({ name: "Admin", email: "admin@fitops.lk", passwordHash: "x", role: "Administrator" });
    token = signToken({ sub: String(user._id), role: user.role });
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it("rejects requests without a token", async () => {
    const res = await request(app).get("/api/equipment");
    expect(res.status).toBe(401);
  });

  it("creates equipment defaulting to working status and today's lastMaintenance", async () => {
    const res = await request(app)
      .post("/api/equipment")
      .set(auth())
      .send({ name: "Treadmill X1", category: "Cardio", condition: "Excellent" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "Treadmill X1", status: "working", technician: null, maintenanceLogs: [] });
    expect(res.body.lastMaintenance).toBe(new Date().toISOString().slice(0, 10));
  });

  it("rejects an invalid condition with 400", async () => {
    const res = await request(app)
      .post("/api/equipment")
      .set(auth())
      .send({ name: "Treadmill X1", category: "Cardio", condition: "Amazing" });
    expect(res.status).toBe(400);
  });

  it("updates status without touching maintenance logs", async () => {
    const created = await request(app)
      .post("/api/equipment")
      .set(auth())
      .send({ name: "Bench Press", category: "Strength", condition: "Good" });

    const res = await request(app)
      .patch(`/api/equipment/${created.body.id}/status`)
      .set(auth())
      .send({ status: "broken" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("broken");
    expect(res.body.maintenanceLogs).toHaveLength(0);
  });

  it("appends a maintenance log entry scoped to that equipment only, and sets technician + lastMaintenance", async () => {
    const a = await request(app).post("/api/equipment").set(auth()).send({ name: "Treadmill A", category: "Cardio", condition: "Good" });
    const b = await request(app).post("/api/equipment").set(auth()).send({ name: "Treadmill B", category: "Cardio", condition: "Good" });

    const res = await request(app)
      .post(`/api/equipment/${a.body.id}/maintenance`)
      .set(auth())
      .send({ technician: "Mike T.", action: "Belt replacement" });

    expect(res.status).toBe(200);
    expect(res.body.maintenanceLogs).toHaveLength(1);
    expect(res.body.maintenanceLogs[0]).toMatchObject({ action: "Belt replacement", technician: "Mike T." });
    expect(res.body.technician).toBe("Mike T.");
    expect(res.body.lastMaintenance).toBe(new Date().toISOString().slice(0, 10));

    // The other equipment's log must stay empty — this is the bug the real app had (one shared array).
    const list = await request(app).get("/api/equipment").set(auth());
    const bAfter = list.body.find((e: any) => e.id === b.body.id);
    expect(bAfter.maintenanceLogs).toHaveLength(0);
  });

  it("404s when logging maintenance for an unknown equipment id", async () => {
    const res = await request(app)
      .post("/api/equipment/000000000000000000000000/maintenance")
      .set(auth())
      .send({ technician: "Mike T.", action: "Check" });
    expect(res.status).toBe(404);
  });
});
