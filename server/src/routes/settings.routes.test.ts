import bcrypt from "bcryptjs";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { connectDb, disconnectDb } from "../config/db.js";
import { GymProfile, User } from "../models/index.js";
import { signToken } from "../services/token.service.js";

describe("settings routes", () => {
  let mongo: MongoMemoryServer;
  const app = createApp();
  let token: string;
  let userId: string;

  const PASSWORD = "admin123";

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await connectDb(mongo.getUri());
  });

  afterAll(async () => {
    await disconnectDb();
    await mongo.stop();
  });

  beforeEach(async () => {
    await Promise.all([GymProfile.deleteMany({}), User.deleteMany({})]);
    const user = await User.create({
      name: "Admin",
      email: "admin@fitops.lk",
      passwordHash: await bcrypt.hash(PASSWORD, 10),
      role: "Administrator",
    });
    userId = String(user._id);
    token = signToken({ sub: userId, role: user.role });
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  const validProfile = {
    name: "FitZone Gym",
    phone: "+94 11 555 0100",
    address: "123 Fitness Avenue, Colombo",
    hours: "5:00 AM - 10:00 PM",
    maxCapacity: 150,
  };

  it("rejects every settings route without a token", async () => {
    expect((await request(app).get("/api/settings/gym")).status).toBe(401);
    expect((await request(app).patch("/api/settings/gym").send(validProfile)).status).toBe(401);
    expect((await request(app).patch("/api/settings/account").send({ name: "X", email: "x@y.z" })).status).toBe(401);
    expect((await request(app).patch("/api/settings/account/password").send({ currentPassword: "a", newPassword: "b" })).status).toBe(401);
  });

  it("creates the singleton profile on first read so the form can always open", async () => {
    expect(await GymProfile.countDocuments()).toBe(0);

    const res = await request(app).get("/api/settings/gym").set(auth());

    expect(res.status).toBe(200);
    expect(res.body.name).toBeTruthy();
    expect(await GymProfile.countDocuments()).toBe(1);
  });

  it("saves the gym profile and reads it back", async () => {
    const res = await request(app).patch("/api/settings/gym").set(auth()).send({ ...validProfile, maxCapacity: 220 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: "FitZone Gym", maxCapacity: 220 });

    const read = await request(app).get("/api/settings/gym").set(auth());
    expect(read.body.maxCapacity).toBe(220);
    // Still exactly one document — updates must not create a second profile.
    expect(await GymProfile.countDocuments()).toBe(1);
  });

  it("rejects an invalid gym profile with 400", async () => {
    const blankName = await request(app).patch("/api/settings/gym").set(auth()).send({ ...validProfile, name: "" });
    expect(blankName.status).toBe(400);

    const badCapacity = await request(app).patch("/api/settings/gym").set(auth()).send({ ...validProfile, maxCapacity: 0 });
    expect(badCapacity.status).toBe(400);
  });

  it("updates the account name and email", async () => {
    const res = await request(app).patch("/api/settings/account").set(auth()).send({ name: "Nimesha", email: "Nimesha@FitOps.LK" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: "Nimesha", email: "nimesha@fitops.lk" });
    expect(res.body.passwordHash).toBeUndefined();
  });

  it("refuses an email another account already uses", async () => {
    await User.create({ name: "Staff", email: "staff@fitops.lk", passwordHash: "x", role: "Staff" });

    const res = await request(app).patch("/api/settings/account").set(auth()).send({ name: "Admin", email: "staff@fitops.lk" });

    expect(res.status).toBe(409);
  });

  it("keeps the account's own email available to itself", async () => {
    const res = await request(app).patch("/api/settings/account").set(auth()).send({ name: "Admin Renamed", email: "admin@fitops.lk" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Admin Renamed");
  });

  it("changes the password only when the current one is right", async () => {
    const wrong = await request(app)
      .patch("/api/settings/account/password")
      .set(auth())
      .send({ currentPassword: "not-my-password", newPassword: "brand-new-secret" });

    expect(wrong.status).toBe(400);
    expect(wrong.body.error.message).toMatch(/current password is incorrect/i);

    const ok = await request(app)
      .patch("/api/settings/account/password")
      .set(auth())
      .send({ currentPassword: PASSWORD, newPassword: "brand-new-secret" });

    expect(ok.status).toBe(204);

    // The stored hash really changed: the new password now logs in, the old one does not.
    const relogin = await request(app).post("/api/auth/login").send({ email: "admin@fitops.lk", password: "brand-new-secret" });
    expect(relogin.status).toBe(200);

    const stale = await request(app).post("/api/auth/login").send({ email: "admin@fitops.lk", password: PASSWORD });
    expect(stale.status).toBe(401);
  });

  it("rejects a too-short new password and reusing the current one", async () => {
    const tooShort = await request(app)
      .patch("/api/settings/account/password")
      .set(auth())
      .send({ currentPassword: PASSWORD, newPassword: "short" });
    expect(tooShort.status).toBe(400);

    const reused = await request(app)
      .patch("/api/settings/account/password")
      .set(auth())
      .send({ currentPassword: PASSWORD, newPassword: PASSWORD });
    expect(reused.status).toBe(400);
    expect(reused.body.error.message).toMatch(/already using/i);
  });
});
