import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { connectDb, disconnectDb } from "../config/db.js";
import { InventoryItem, User } from "../models/index.js";
import { signToken } from "../services/token.service.js";

describe("inventory routes", () => {
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
    await Promise.all([InventoryItem.deleteMany({}), User.deleteMany({})]);
    const user = await User.create({ name: "Admin", email: "admin@fitops.lk", passwordHash: "x", role: "Administrator" });
    token = signToken({ sub: String(user._id), role: user.role });
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it("rejects requests without a token", async () => {
    const res = await request(app).get("/api/inventory");
    expect(res.status).toBe(401);
  });

  it("creates an item and derives status server-side", async () => {
    const res = await request(app)
      .post("/api/inventory")
      .set(auth())
      .send({ name: "Yoga Mats", category: "Accessories", stock: 3, minStock: 15, supplier: "FitGear Ltd." });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("critical"); // 3 <= 15*0.25
  });

  it("derives 'low' and 'active' status correctly", async () => {
    const low = await request(app).post("/api/inventory").set(auth()).send({ name: "Bands", category: "Accessories", stock: 8, minStock: 15, supplier: "X" });
    expect(low.body.status).toBe("low");

    const active = await request(app).post("/api/inventory").set(auth()).send({ name: "Towels", category: "Amenities", stock: 85, minStock: 30, supplier: "X" });
    expect(active.body.status).toBe("active");
  });

  it("rejects an invalid category with 400", async () => {
    const res = await request(app)
      .post("/api/inventory")
      .set(auth())
      .send({ name: "Widget", category: "NotACategory", stock: 5, minStock: 10, supplier: "X" });
    expect(res.status).toBe(400);
  });

  it("adds stock, appends a movement, and recomputes status", async () => {
    const created = await request(app).post("/api/inventory").set(auth()).send({ name: "Yoga Mats", category: "Accessories", stock: 3, minStock: 15, supplier: "X" });

    const res = await request(app)
      .post(`/api/inventory/${created.body.id}/stock`)
      .set(auth())
      .send({ direction: "add", quantity: 50, note: "Restocked" });

    expect(res.status).toBe(200);
    expect(res.body.stock).toBe(53);
    expect(res.body.status).toBe("active");
    expect(res.body.movements).toHaveLength(1);
    expect(res.body.movements[0]).toMatchObject({ direction: "add", quantity: 50, note: "Restocked" });
  });

  it("removes stock and rejects removing more than available", async () => {
    const created = await request(app).post("/api/inventory").set(auth()).send({ name: "Gloves", category: "Accessories", stock: 10, minStock: 5, supplier: "X" });

    const ok = await request(app).post(`/api/inventory/${created.body.id}/stock`).set(auth()).send({ direction: "remove", quantity: 4 });
    expect(ok.status).toBe(200);
    expect(ok.body.stock).toBe(6);

    const tooMuch = await request(app).post(`/api/inventory/${created.body.id}/stock`).set(auth()).send({ direction: "remove", quantity: 100 });
    expect(tooMuch.status).toBe(400);
  });

  it("404s adjusting stock for an unknown item id", async () => {
    const res = await request(app)
      .post("/api/inventory/000000000000000000000000/stock")
      .set(auth())
      .send({ direction: "add", quantity: 1 });
    expect(res.status).toBe(404);
  });
});
