import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { connectDb, disconnectDb } from "../config/db.js";
import { Counter, Member, User } from "../models/index.js";
import { signToken } from "../services/token.service.js";

describe("members routes", () => {
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
    await Promise.all([Member.deleteMany({}), Counter.deleteMany({}), User.deleteMany({})]);
    const user = await User.create({ name: "Admin", email: "admin@fitops.lk", passwordHash: "x", role: "Administrator" });
    token = signToken({ sub: String(user._id), role: user.role });
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it("rejects requests without a token", async () => {
    const res = await request(app).get("/api/members");
    expect(res.status).toBe(401);
  });

  it("GET /plan-fees returns the fee table", async () => {
    const res = await request(app).get("/api/members/plan-fees").set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ Basic: { Monthly: 3500, Annual: 38000 }, Premium: { Monthly: 6500, Annual: 70000 } });
  });

  it("creates a member with a server-generated sequential membershipId and a first pending payment", async () => {
    const payload = {
      name: "Jane Doe",
      nic: "200012345678",
      email: "jane@example.com",
      phone: "+1 555-0100",
      plan: "Premium",
      paymentMethod: "Monthly",
      status: "active",
      joined: "2026-01-01",
    };

    const res1 = await request(app).post("/api/members").set(auth()).send(payload);
    expect(res1.status).toBe(201);
    expect(res1.body.membershipId).toBe("GYM-0001");
    expect(res1.body.payments).toHaveLength(1);
    expect(res1.body.payments[0]).toMatchObject({ amount: 6500, status: "pending", verified: false, paidOn: null });

    const res2 = await request(app).post("/api/members").set(auth()).send({ ...payload, email: "jane2@example.com" });
    expect(res2.body.membershipId).toBe("GYM-0002");
  });

  it("rejects an invalid member payload with 400", async () => {
    const res = await request(app).post("/api/members").set(auth()).send({ name: "" });
    expect(res.status).toBe(400);
  });

  it("GET / supports searching across name, email, nic and membershipId", async () => {
    await request(app).post("/api/members").set(auth()).send({
      name: "Sarah Connor", nic: "199254801234", email: "sarah@example.com", phone: "+1 555-0101",
      plan: "Premium", paymentMethod: "Monthly", status: "active", joined: "2024-01-15",
    });
    await request(app).post("/api/members").set(auth()).send({
      name: "John Doe", nic: "198812503456", email: "john@example.com", phone: "+1 555-0102",
      plan: "Basic", paymentMethod: "Monthly", status: "active", joined: "2024-02-20",
    });

    const res = await request(app).get("/api/members?search=sarah").set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Sarah Connor");
  });

  it("updates a payment's status and clears verification", async () => {
    const created = await request(app).post("/api/members").set(auth()).send({
      name: "Jane Doe", nic: "200012345678", email: "jane@example.com", phone: "+1 555-0100",
      plan: "Basic", paymentMethod: "Monthly", status: "active", joined: "2026-01-01",
    });
    const period = created.body.payments[0].period;
    const memberId = created.body.id;

    // Verify the pending payment first.
    const verifyRes = await request(app)
      .patch(`/api/members/${memberId}/payments/${period}`)
      .set(auth())
      .send({ verified: true });
    expect(verifyRes.body.payments[0].verified).toBe(true);

    // Changing the status should clear that verification again.
    const statusRes = await request(app)
      .patch(`/api/members/${memberId}/payments/${period}`)
      .set(auth())
      .send({ status: "paid" });
    expect(statusRes.body.payments[0]).toMatchObject({ status: "paid", verified: false });
    expect(statusRes.body.payments[0].paidOn).not.toBeNull();
  });

  it("creates a placeholder payment on the fly for a period with no existing record", async () => {
    const created = await request(app).post("/api/members").set(auth()).send({
      name: "Jane Doe", nic: "200012345678", email: "jane@example.com", phone: "+1 555-0100",
      plan: "Basic", paymentMethod: "Monthly", status: "active", joined: "2026-01-01",
    });
    const memberId = created.body.id;

    const res = await request(app)
      .patch(`/api/members/${memberId}/payments/2020-01`)
      .set(auth())
      .send({ verified: true });

    expect(res.status).toBe(200);
    const created202001 = res.body.payments.find((p: any) => p.period === "2020-01");
    expect(created202001).toMatchObject({ verified: true, amount: 3500 });
  });

  it("404s when updating a payment for an unknown member", async () => {
    const res = await request(app)
      .patch("/api/members/000000000000000000000000/payments/2026-01")
      .set(auth())
      .send({ verified: true });
    expect(res.status).toBe(404);
  });
});
