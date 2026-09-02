import { ClassSession, TrainingClass } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { CreateClassInput } from "../schemas/class.schema.js";
import { DAYS } from "../models/TrainingClass.js";

const toClientClass = (doc: any) => ({
  id: String(doc._id),
  title: doc.title,
  discipline: doc.discipline,
  coach: doc.coach,
  day: doc.day,
  startTime: doc.startTime,
  durationMin: doc.durationMin,
  level: doc.level,
  capacity: doc.capacity,
  ring: doc.ring,
  booked: doc.booked,
});

const toClientSession = (doc: any) => ({
  id: String(doc._id),
  classId: doc.classId ? String(doc.classId) : null,
  date: doc.date,
  title: doc.title,
  discipline: doc.discipline,
  coach: doc.coach,
  attended: doc.attended,
  capacity: doc.capacity,
  rounds: doc.rounds,
  status: doc.status,
});

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** DAYS starts on Monday, getDay() starts on Sunday. */
const todayKey = (from = new Date()) => DAYS[(from.getDay() + 6) % 7];

const todayDate = (from = new Date()) =>
  `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`;

export async function listClasses() {
  const classes = await TrainingClass.find().sort({ day: 1, startTime: 1 });
  return classes.map(toClientClass);
}

export async function listSessions() {
  const sessions = await ClassSession.find().sort({ date: -1 });
  return sessions.map(toClientSession);
}

export async function createClass(input: CreateClassInput) {
  const sameDay = await TrainingClass.find({ day: input.day });
  const conflict = sameDay.find(
    (c) =>
      c.ring.toLowerCase() === input.ring.toLowerCase() &&
      toMinutes(input.startTime) < toMinutes(c.startTime) + c.durationMin &&
      toMinutes(c.startTime) < toMinutes(input.startTime) + input.durationMin,
  );
  if (conflict) throw ApiError.conflict("This time slot overlaps an existing class in the same ring.", toClientClass(conflict));

  const created = await TrainingClass.create({ ...input, booked: 0 });

  // Only log today's session if the new class actually recurs today — a class scheduled
  // for a different day of the week shouldn't show up in today's session log.
  if (input.day === todayKey()) {
    await ClassSession.create({
      classId: created._id,
      date: todayDate(),
      title: created.title,
      discipline: created.discipline,
      coach: created.coach,
      attended: 0,
      capacity: created.capacity,
      rounds: 0,
      status: "Scheduled",
    });
  }

  return toClientClass(created);
}

export async function completeSession(id: string) {
  const session = await ClassSession.findById(id);
  if (!session) throw ApiError.notFound("Session not found");

  session.status = "Completed";
  session.attended = session.attended || Math.round(session.capacity * 0.8);
  session.rounds = session.rounds || 10;
  await session.save();

  return toClientSession(session);
}
