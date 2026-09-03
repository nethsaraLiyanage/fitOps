import bcrypt from "bcryptjs";
import { connectDb, disconnectDb } from "../config/db.js";
import { env } from "../config/env.js";
import {
  ActivityLog,
  AttendanceRecord,
  ClassSession,
  Counter,
  Equipment,
  GymProfile,
  InventoryItem,
  Member,
  TrainingClass,
  User,
} from "../models/index.js";
import { buildSeedAttendance } from "./data/attendance.js";
import { seedClasses, seedSessions } from "./data/classes.js";
import { seedEquipment } from "./data/equipment.js";
import { seedGymProfile } from "./data/gymProfile.js";
import { seedInventory } from "./data/inventory.js";
import { seedMembers } from "./data/members.js";
import { seedUsers } from "./data/users.js";

async function seed() {
  const force = process.argv.includes("--force");
  if (env.NODE_ENV === "production" && !force) {
    console.error("Refusing to run the seed script against NODE_ENV=production without --force.");
    process.exit(1);
  }

  await connectDb();
  console.log("Connected to MongoDB, clearing existing collections...");

  await Promise.all([
    User.deleteMany({}),
    Member.deleteMany({}),
    Counter.deleteMany({}),
    TrainingClass.deleteMany({}),
    ClassSession.deleteMany({}),
    Equipment.deleteMany({}),
    InventoryItem.deleteMany({}),
    AttendanceRecord.deleteMany({}),
    GymProfile.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);

  console.log("Seeding users...");
  await User.insertMany(
    await Promise.all(
      seedUsers.map(async (u) => ({
        name: u.name,
        email: u.email,
        passwordHash: await bcrypt.hash(u.password, 10),
        role: u.role,
      })),
    ),
  );

  console.log("Seeding members...");
  const members = await Member.insertMany(seedMembers);
  // Keep the atomic membershipId counter in sync so the next real signup doesn't collide with a seeded GYM-000N.
  await Counter.findByIdAndUpdate("member", { seq: seedMembers.length }, { upsert: true });

  console.log("Seeding training classes and sessions...");
  const classDocs = await TrainingClass.insertMany(
    seedClasses.map(({ key: _key, ...rest }) => rest),
  );
  const classIdByKey = new Map(seedClasses.map((c, i) => [c.key, classDocs[i]._id]));
  await ClassSession.insertMany(
    seedSessions.map(({ classKey, ...rest }) => ({ ...rest, classId: classIdByKey.get(classKey) ?? null })),
  );

  console.log("Seeding equipment...");
  await Equipment.insertMany(seedEquipment);

  console.log("Seeding inventory...");
  await InventoryItem.insertMany(seedInventory);

  console.log("Seeding gym profile...");
  await GymProfile.findByIdAndUpdate("singleton", seedGymProfile, { upsert: true });

  console.log("Seeding attendance + activity log...");
  const attendance = buildSeedAttendance(members.map((member) => member._id));
  await AttendanceRecord.insertMany(attendance);

  // Worded exactly like logActivity() writes them, so the seeded history is
  // indistinguishable from entries the running app produces.
  const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);
  const lowStockItem = seedInventory.find((item) => item.stock < item.minStock) ?? seedInventory[0];

  // Inserted through the driver so the staggered createdAt values survive Mongoose's timestamps.
  await ActivityLog.collection.insertMany(
    [
      { type: "member.joined", text: `${members[members.length - 1].name} joined as a new member`, minutes: 240 },
      { type: "equipment.status_changed", text: `${seedEquipment[0].name} marked maintenance`, minutes: 180 },
      { type: "inventory.restocked", text: `${seedInventory[0].name} restocked (+50 units)`, minutes: 120 },
      { type: "inventory.low_stock", text: `${lowStockItem.name} stock running low (${lowStockItem.stock} left)`, minutes: 60 },
      { type: "attendance.checked_in", text: `${members[0].name} checked in`, minutes: 25 },
    ].map(({ minutes, ...entry }) => ({
      ...entry,
      actorId: null,
      createdAt: minutesAgo(minutes),
      updatedAt: minutesAgo(minutes),
    })),
  );

  console.log("Seed complete.");
  await disconnectDb();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
