import bcrypt from "bcryptjs";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { connectDb, disconnectDb } from "../config/db.js";
import { User } from "../models/index.js";

describe("auth routes", () => {
  let mongo: MongoMemoryServer;
  const app = createApp();

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await connectDb(mongo.getUri());
  });

  afterAll(async () => {
    await disconnectDb();
    await mongo.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await User.create({
      name: "Admin",
      email: "admin@fitops.lk",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "Administrator",
    });
  });

  it("logs in with correct credentials and returns a token + user", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "admin@fitops.lk", password: "admin123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ name: "Admin", email: "admin@fitops.lk", role: "Administrator" });
  });

  it("rejects an unknown email", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "nope@fitops.lk", password: "admin123" });
    expect(res.status).toBe(401);
  });

  it("rejects a wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "admin@fitops.lk", password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("rejects a malformed payload with 400", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "not-an-email", password: "" });
    expect(res.status).toBe(400);
  });

  it("GET /me rejects requests without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("GET /me returns the current user for a valid token", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({ email: "admin@fitops.lk", password: "admin123" });
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${loginRes.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: "Admin", email: "admin@fitops.lk", role: "Administrator" });
  });

  it("GET /me rejects a garbage token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer garbage");
    expect(res.status).toBe(401);
  });
});
