import bcrypt from "bcryptjs";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { connectDb, disconnectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { User } from "./models/index.js";

describe("hardening", () => {
  let mongo: MongoMemoryServer;

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

  it("sends helmet's security headers", async () => {
    const res = await request(createApp()).get("/api/health");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
    // helmet strips the framework fingerprint.
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("rate-limits repeated login attempts and keeps the error shape", async () => {
    const app = createApp();
    const attempt = () => request(app).post("/api/auth/login").send({ email: "admin@fitops.lk", password: "wrong-password" });

    for (let i = 0; i < env.LOGIN_RATE_LIMIT; i++) {
      expect((await attempt()).status).toBe(401);
    }

    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatchObject({ code: "RATE_LIMITED" });
    expect(blocked.body.error.message).toMatch(/too many login attempts/i);
  });

  it("counts successful logins against the limit too", async () => {
    const app = createApp();
    const attempt = () => request(app).post("/api/auth/login").send({ email: "admin@fitops.lk", password: "admin123" });

    for (let i = 0; i < env.LOGIN_RATE_LIMIT; i++) {
      expect((await attempt()).status).toBe(200);
    }

    expect((await attempt()).status).toBe(429);
  });

  it("gives each app instance its own limiter so one busy client cannot block another", async () => {
    const busy = createApp();
    for (let i = 0; i <= env.LOGIN_RATE_LIMIT; i++) {
      await request(busy).post("/api/auth/login").send({ email: "admin@fitops.lk", password: "admin123" });
    }

    const fresh = createApp();
    const res = await request(fresh).post("/api/auth/login").send({ email: "admin@fitops.lk", password: "admin123" });
    expect(res.status).toBe(200);
  });

  it("requires auth on every mutating route", async () => {
    const app = createApp();

    const mutations: [method: "post" | "patch", path: string][] = [
      ["post", "/api/members"],
      ["patch", "/api/members/000000000000000000000000/payments/2026-09"],
      ["post", "/api/classes"],
      ["patch", "/api/classes/sessions/000000000000000000000000/complete"],
      ["post", "/api/equipment"],
      ["patch", "/api/equipment/000000000000000000000000/status"],
      ["post", "/api/equipment/000000000000000000000000/maintenance"],
      ["post", "/api/inventory"],
      ["post", "/api/inventory/000000000000000000000000/stock"],
      ["post", "/api/attendance/check-in"],
      ["patch", "/api/attendance/000000000000000000000000/check-out"],
      ["patch", "/api/settings/gym"],
      ["patch", "/api/settings/account"],
      ["patch", "/api/settings/account/password"],
    ];

    for (const [method, path] of mutations) {
      const res = await request(app)[method](path).send({});
      expect(`${method.toUpperCase()} ${path} -> ${res.status}`).toBe(`${method.toUpperCase()} ${path} -> 401`);
    }
  });

  it("requires auth on every read route except health", async () => {
    const app = createApp();

    const reads = [
      "/api/members",
      "/api/members/plan-fees",
      "/api/classes",
      "/api/classes/sessions",
      "/api/equipment",
      "/api/inventory",
      "/api/attendance/today",
      "/api/attendance/heatmap",
      "/api/reports/summary",
      "/api/reports/export/members.csv",
      "/api/settings/gym",
      "/api/activity",
    ];

    for (const path of reads) {
      const res = await request(app).get(path);
      expect(`GET ${path} -> ${res.status}`).toBe(`GET ${path} -> 401`);
    }

    expect((await request(app).get("/api/health")).status).toBe(200);
  });

  it("rejects an oversized JSON body rather than buffering it", async () => {
    const res = await request(createApp())
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ email: "a@b.c", password: "x".repeat(200_000) }));

    expect(res.status).toBe(413);
    expect(res.body.error).toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
  });

  it("reports malformed JSON as a client error, not a server error", async () => {
    const res = await request(createApp())
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email": "a@b.c", ');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: "INVALID_JSON" });
  });
});
