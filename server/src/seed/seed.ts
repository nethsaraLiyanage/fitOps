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
  const now = new Date();
  await AttendanceRecord.insertMany(
    members.slice(0, 5).map((member, i) => {
      const checkIn = new Date(now);
      checkIn.setDate(checkIn.getDate() - i);
      checkIn.setHours(7 + i, 0, 0, 0);
      return { memberId: member._id, checkIn, checkOut: null };
    }),
  );

  await ActivityLog.insertMany([
    { type: "member.joined", text: `${members[0].name} joined as a new member` },
    { type: "equipment.maintenance_logged", text: "Treadmill #3 marked for maintenance" },
    { type: "inventory.restocked", text: "Protein powder restocked (+50 units)" },
    { type: "inventory.low_stock", text: "Yoga mats stock critically low" },
    { type: "attendance.checked_in", text: "5 members checked in today" },
  ]);

  console.log("Seed complete.");
  await disconnectDb();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
