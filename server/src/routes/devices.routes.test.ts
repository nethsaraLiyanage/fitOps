import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { connectDb, disconnectDb } from "../config/db.js";
import { AttendanceRecord, Device, DevicePunch, Member, User } from "../models/index.js";
import { signToken } from "../services/token.service.js";

describe("device routes", () => {
  let mongo: MongoMemoryServer;
  const app = createApp();
  let adminToken: string;
  let staffToken: string;
  let deviceKey: string;
  let deviceId: string;

  const makeMember = async (name: string, membershipId: string, extra: Record<string, unknown> = {}) =>
    Member.create({
      membershipId,
      name,
      nic: "990000000V",
      email: `${membershipId.toLowerCase()}@example.com`,
      phone: "0770000000",
      joined: "2026-01-15",
      plan: "Basic",
      paymentMethod: "Monthly",
      ...extra,
    });

  /** A fixed day in the past, so no punch can land in the future whatever time the suite runs. */
  const dayAt = (hour: number, minute = 0, second = 0, daysBack = 2) => {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    d.setHours(hour, minute, second, 0);
    return d;
  };

  /** The same instant as a device reports it: local wall-clock time, no timezone. */
  const at = (hour: number, minute = 0, second = 0) => {
    const d = dayAt(hour, minute, second);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:${pad(minute)}:${pad(second)}`;
  };

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await connectDb(mongo.getUri());
    await Member.syncIndexes();
  });

  afterAll(async () => {
    await disconnectDb();
    await mongo.stop();
  });

  beforeEach(async () => {
    await Promise.all([
      AttendanceRecord.deleteMany({}),
      Device.deleteMany({}),
      DevicePunch.deleteMany({}),
      Member.deleteMany({}),
      User.deleteMany({}),
    ]);
    const admin = await User.create({ name: "Admin", email: "admin@fitops.lk", passwordHash: "x", role: "Administrator" });
    const staff = await User.create({ name: "Staff", email: "staff@fitops.lk", passwordHash: "x", role: "Staff" });
    adminToken = signToken({ sub: String(admin._id), role: admin.role });
    staffToken = signToken({ sub: String(staff._id), role: staff.role });

    const res = await request(app)
      .post("/api/devices")
      .set({ Authorization: `Bearer ${adminToken}` })
      .send({ name: "Front door", serial: "ZK-001" });
    deviceKey = res.body.apiKey;
    deviceId = res.body.id;
  });

  const admin = () => ({ Authorization: `Bearer ${adminToken}` });
  const device = () => ({ "X-Device-Key": deviceKey });
  const punch = (punches: { biometricId: string; punchedAt: string }[]) =>
    request(app).post("/api/biometric/punches").set(device()).send({ punches });

  describe("device management", () => {
    it("issues a key once and stores only its hash", async () => {
      expect(deviceKey).toMatch(/^fod_/);

      const stored = await Device.findById(deviceId);
      expect(stored?.keyHash).not.toContain(deviceKey);

      const list = await request(app).get("/api/devices").set(admin());
      expect(list.status).toBe(200);
      expect(list.body).toHaveLength(1);
      expect(list.body[0]).toMatchObject({ name: "Front door", serial: "ZK-001", active: true });
      expect(list.body[0].apiKey).toBeUndefined();
      expect(deviceKey.startsWith(list.body[0].keyPrefix)).toBe(true);
    });

    it("rejects a duplicate serial", async () => {
      const res = await request(app).post("/api/devices").set(admin()).send({ name: "Again", serial: "ZK-001" });
      expect(res.status).toBe(409);
    });

    it("is restricted to administrators", async () => {
      const res = await request(app).get("/api/devices").set({ Authorization: `Bearer ${staffToken}` });
      expect(res.status).toBe(403);
    });

    it("rotating the key invalidates the old one", async () => {
      const rotated = await request(app).post(`/api/devices/${deviceId}/rotate-key`).set(admin());
      expect(rotated.status).toBe(200);
      expect(rotated.body.apiKey).not.toBe(deviceKey);

      const old = await request(app).post("/api/biometric/heartbeat").set(device());
      expect(old.status).toBe(401);

      const fresh = await request(app).post("/api/biometric/heartbeat").set({ "X-Device-Key": rotated.body.apiKey });
      expect(fresh.status).toBe(204);
    });

    it("a disabled device is locked out", async () => {
      await request(app).patch(`/api/devices/${deviceId}`).set(admin()).send({ active: false });
      const res = await request(app).post("/api/biometric/heartbeat").set(device());
      expect(res.status).toBe(401);
    });

    it("404s an unknown device id", async () => {
      const res = await request(app).post("/api/devices/nope/rotate-key").set(admin());
      expect(res.status).toBe(404);
    });
  });

  describe("device authentication", () => {
    it("rejects missing and wrong keys", async () => {
      expect((await request(app).post("/api/biometric/heartbeat")).status).toBe(401);
      expect((await request(app).post("/api/biometric/heartbeat").set({ "X-Device-Key": "fod_wrong" })).status).toBe(401);
    });

    it("does not accept a staff JWT in place of a device key", async () => {
      const res = await request(app).get("/api/biometric/roster").set(admin());
      expect(res.status).toBe(401);
    });

    it("records when the device was last seen", async () => {
      await request(app).post("/api/biometric/heartbeat").set(device());
      const stored = await Device.findById(deviceId);
      expect(stored?.lastSeenAt).toBeInstanceOf(Date);
    });
  });

  describe("punches", () => {
    beforeEach(async () => {
      await makeMember("Sarah Connor", "GYM-0001", { biometricId: "17" });
    });

    it("first punch checks in, the next checks out", async () => {
      const res = await punch([
        { biometricId: "17", punchedAt: at(7, 5) },
        { biometricId: "17", punchedAt: at(7, 50) },
      ]);

      expect(res.status).toBe(200);
      expect(res.body.results.map((r: { outcome: string }) => r.outcome)).toEqual(["checked_in", "checked_out"]);
      expect(res.body.results[0]).toMatchObject({ memberName: "Sarah Connor", membershipStatus: "active" });

      const records = await AttendanceRecord.find();
      expect(records).toHaveLength(1);
      expect(records[0].source).toBe("biometric");
      expect(String(records[0].deviceId)).toBe(deviceId);
      // Stored at the device's time, not the time the batch arrived.
      expect(records[0].checkIn.getHours()).toBe(7);
      expect(records[0].checkIn.getMinutes()).toBe(5);
      expect(records[0].checkOut?.getMinutes()).toBe(50);
    });

    it("processes a batch oldest first but answers in the order sent", async () => {
      const res = await punch([
        { biometricId: "17", punchedAt: at(7, 50) },
        { biometricId: "17", punchedAt: at(7, 5) },
      ]);

      expect(res.body.results.map((r: { outcome: string }) => r.outcome)).toEqual(["checked_out", "checked_in"]);
    });

    it("treats a second press within the repeat window as one punch", async () => {
      const res = await punch([
        { biometricId: "17", punchedAt: at(7, 5, 0) },
        { biometricId: "17", punchedAt: at(7, 5, 40) },
      ]);

      expect(res.body.results.map((r: { outcome: string }) => r.outcome)).toEqual(["checked_in", "repeat"]);
      expect((await AttendanceRecord.findOne())?.checkOut).toBeNull();
    });

    it("re-sending the same batch is a no-op", async () => {
      const batch = [{ biometricId: "17", punchedAt: at(7, 5) }];
      await punch(batch);

      const again = await punch(batch);
      expect(again.body.results[0].outcome).toBe("duplicate");
      expect(await AttendanceRecord.countDocuments()).toBe(1);
      expect(await DevicePunch.countDocuments()).toBe(1);
    });

    it("opens a new visit after a completed one", async () => {
      const res = await punch([
        { biometricId: "17", punchedAt: at(7, 5) },
        { biometricId: "17", punchedAt: at(7, 30) },
        { biometricId: "17", punchedAt: at(7, 45) },
      ]);

      expect(res.body.results.map((r: { outcome: string }) => r.outcome)).toEqual(["checked_in", "checked_out", "checked_in"]);
      expect(await AttendanceRecord.countDocuments()).toBe(2);
    });

    it("never closes the previous day's forgotten visit", async () => {
      const member = await Member.findOne({ biometricId: "17" });
      await AttendanceRecord.create({ memberId: member!._id, checkIn: dayAt(18, 0, 0, 3), checkOut: null });

      const res = await punch([{ biometricId: "17", punchedAt: at(7, 5) }]);
      expect(res.body.results[0].outcome).toBe("checked_in");
    });

    it("closes a visit staff opened manually", async () => {
      const member = await Member.findOne({ biometricId: "17" });
      await AttendanceRecord.create({ memberId: member!._id, checkIn: dayAt(7, 5), checkOut: null });

      const res = await punch([{ biometricId: "17", punchedAt: at(7, 40) }]);
      expect(res.body.results[0].outcome).toBe("checked_out");
    });

    it("keeps punches from unknown IDs for review without creating attendance", async () => {
      const res = await punch([{ biometricId: "999", punchedAt: at(7, 5) }]);
      expect(res.body.results[0].outcome).toBe("unknown_member");
      expect(await AttendanceRecord.countDocuments()).toBe(0);

      const unmatched = await request(app).get("/api/devices/unmatched-punches").set(admin());
      expect(unmatched.status).toBe(200);
      expect(unmatched.body).toEqual([expect.objectContaining({ biometricId: "999", deviceName: "Front door" })]);
    });

    it("records an expired member's visit but flags the membership", async () => {
      await makeMember("John Doe", "GYM-0002", { biometricId: "18", status: "expired" });
      const res = await punch([{ biometricId: "18", punchedAt: at(7, 5) }]);
      expect(res.body.results[0]).toMatchObject({ outcome: "checked_in", membershipStatus: "expired" });
    });

    it("rejects punches from a clock set in the future", async () => {
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const res = await punch([{ biometricId: "17", punchedAt: future }]);
      expect(res.body.results[0].outcome).toBe("invalid_time");
      expect(await AttendanceRecord.countDocuments()).toBe(0);
    });

    it("accepts a space-separated timestamp and one with an explicit offset", async () => {
      const res = await punch([
        { biometricId: "17", punchedAt: at(7, 5).replace("T", " ") },
        { biometricId: "17", punchedAt: dayAt(9, 0).toISOString() },
      ]);
      expect(res.status).toBe(200);
    });

    it("validates the batch", async () => {
      expect((await punch([])).status).toBe(400);
      expect((await punch([{ biometricId: "17", punchedAt: "yesterday" }])).status).toBe(400);
      expect((await punch([{ biometricId: "", punchedAt: at(7, 5) }])).status).toBe(400);
    });

    it("shows biometric visits as such in today's list", async () => {
      await punch([{ biometricId: "17", punchedAt: new Date().toISOString() }]);
      const res = await request(app).get("/api/attendance/today").set(admin());
      expect(res.body[0]).toMatchObject({ memberName: "Sarah Connor", source: "biometric" });
    });
  });

  describe("roster", () => {
    it("lists enrolled members and whether they may enter", async () => {
      await makeMember("Sarah Connor", "GYM-0001", { biometricId: "17" });
      await makeMember("John Doe", "GYM-0002", { biometricId: "18", status: "expired" });
      await makeMember("Not Enrolled", "GYM-0003");

      const res = await request(app).get("/api/biometric/roster").set(device());
      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        { biometricId: "17", membershipId: "GYM-0001", name: "Sarah Connor", allowed: true },
        { biometricId: "18", membershipId: "GYM-0002", name: "John Doe", allowed: false },
      ]);
    });
  });

  describe("member enrolment", () => {
    it("links, refuses a taken ID, and unlinks", async () => {
      const sarah = await makeMember("Sarah Connor", "GYM-0001");
      const john = await makeMember("John Doe", "GYM-0002");
      const link = (id: unknown, biometricId: string | null) =>
        request(app).patch(`/api/members/${id}/biometric`).set(admin()).send({ biometricId });

      const linked = await link(sarah._id, "17");
      expect(linked.status).toBe(200);
      expect(linked.body.biometricId).toBe("17");

      const taken = await link(john._id, "17");
      expect(taken.status).toBe(409);
      expect(taken.body.error.message).toContain("Sarah Connor");

      const unlinked = await link(sarah._id, null);
      expect(unlinked.body.biometricId).toBeNull();
      expect((await link(john._id, "17")).status).toBe(200);
    });

    it("lets any number of members stay unenrolled", async () => {
      await makeMember("A", "GYM-0001");
      await makeMember("B", "GYM-0002");
      expect(await Member.countDocuments()).toBe(2);
    });

    it("404s an unknown member and 400s a bad body", async () => {
      const unknown = await request(app)
        .patch("/api/members/000000000000000000000000/biometric")
        .set(admin())
        .send({ biometricId: "17" });
      expect(unknown.status).toBe(404);

      const bad = await request(app).patch("/api/members/000000000000000000000000/biometric").set(admin()).send({});
      expect(bad.status).toBe(400);
    });
  });
});
