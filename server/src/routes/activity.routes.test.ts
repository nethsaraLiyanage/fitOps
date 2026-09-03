import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { connectDb, disconnectDb } from "../config/db.js";
import { ActivityLog, Equipment, InventoryItem, Member, User } from "../models/index.js";
import { signToken } from "../services/token.service.js";

describe("activity log", () => {
  let mongo: MongoMemoryServer;
  const app = createApp();
  let token: string;
  let userId: string;

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
      ActivityLog.deleteMany({}),
      Member.deleteMany({}),
      Equipment.deleteMany({}),
      InventoryItem.deleteMany({}),
      User.deleteMany({}),
    ]);
    const user = await User.create({ name: "Admin", email: "admin@fitops.lk", passwordHash: "x", role: "Administrator" });
    userId = String(user._id);
    token = signToken({ sub: userId, role: user.role });
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });
  const feed = async (query = "") => (await request(app).get(`/api/activity${query}`).set(auth())).body;

  it("rejects requests without a token", async () => {
    expect((await request(app).get("/api/activity")).status).toBe(401);
  });

  it("returns the newest entries first, capped by limit", async () => {
    for (let i = 1; i <= 4; i++) {
      await ActivityLog.create({ type: "member.joined", text: `Member ${i} joined` });
    }

    const all = await feed();
    expect(all).toHaveLength(4);
    expect(all[0].text).toBe("Member 4 joined");

    const limited = await feed("?limit=2");
    expect(limited).toHaveLength(2);
    expect(limited[0].text).toBe("Member 4 joined");
  });

  it("rejects a nonsensical limit with 400", async () => {
    expect((await request(app).get("/api/activity?limit=0").set(auth())).status).toBe(400);
    expect((await request(app).get("/api/activity?limit=500").set(auth())).status).toBe(400);
  });

  it("records a member signup, attributed to the signed-in user", async () => {
    await request(app).post("/api/members").set(auth()).send({
      name: "Sarah Connor",
      nic: "199254801234",
      email: "sarah@example.com",
      phone: "0770000000",
      plan: "Premium",
      paymentMethod: "Monthly",
      status: "active",
      joined: "2026-09-01",
    });

    const [entry] = await feed();
    expect(entry).toMatchObject({ type: "member.joined", text: "Sarah Connor joined as a new member" });

    const stored = await ActivityLog.findById(entry.id);
    expect(String(stored?.actorId)).toBe(userId);
  });

  it("records an equipment status change and a technician assignment", async () => {
    const created = await request(app)
      .post("/api/equipment")
      .set(auth())
      .send({ name: "Treadmill 3", category: "Cardio", condition: "Fair" });

    await request(app).patch(`/api/equipment/${created.body.id}/status`).set(auth()).send({ status: "maintenance" });
    await request(app)
      .post(`/api/equipment/${created.body.id}/maintenance`)
      .set(auth())
      .send({ action: "Belt replaced", technician: "Nuwan" });

    const entries = await feed();
    expect(entries[0]).toMatchObject({ type: "equipment.maintenance_logged", text: "Treadmill 3 assigned to Nuwan" });
    expect(entries[1]).toMatchObject({ type: "equipment.status_changed", text: "Treadmill 3 marked maintenance" });
  });

  it("records a restock, and flags an item that a removal drops below its threshold", async () => {
    const item = await request(app)
      .post("/api/inventory")
      .set(auth())
      .send({ name: "Yoga Mats", category: "Accessories", stock: 40, minStock: 15, supplier: "FitGear" });

    await request(app).post(`/api/inventory/${item.body.id}/stock`).set(auth()).send({ direction: "add", quantity: 10 });
    const restocked = await feed();
    expect(restocked[0]).toMatchObject({ type: "inventory.restocked", text: "Yoga Mats restocked (+10 units)" });

    await request(app).post(`/api/inventory/${item.body.id}/stock`).set(auth()).send({ direction: "remove", quantity: 48 });
    const afterRemoval = await feed();
    expect(afterRemoval[0]).toMatchObject({ type: "inventory.low_stock" });
    expect(afterRemoval[0].text).toMatch(/critically low \(2 left\)/);
  });

  it("does not log anything when the mutation itself was rejected", async () => {
    const res = await request(app).post("/api/members").set(auth()).send({ name: "" });

    expect(res.status).toBe(400);
    expect(await feed()).toEqual([]);
  });
});
