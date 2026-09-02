import { InferSchemaType, Schema, model } from "mongoose";

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const LEVELS = ["Beginner", "Intermediate", "Advanced", "Sparring"] as const;

/** Curated presets shown in the UI dropdown — the field itself is a free string, so a gym can type anything. */
export const DISCIPLINE_PRESETS = [
  "Muay Thai",
  "Kickboxing",
  "Boxing",
  "Karate",
  "Taekwondo",
  "Kung Fu",
  "Judo",
  "Brazilian Jiu-Jitsu",
  "Krav Maga",
  "MMA",
] as const;

const trainingClassSchema = new Schema(
  {
    title: { type: String, required: true },
    discipline: { type: String, required: true },
    coach: { type: String, required: true },
    day: { type: String, enum: DAYS, required: true },
    startTime: { type: String, required: true },
    durationMin: { type: Number, required: true },
    level: { type: String, enum: LEVELS, required: true },
    capacity: { type: Number, required: true },
    ring: { type: String, required: true },
    booked: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export type TrainingClassDoc = InferSchemaType<typeof trainingClassSchema>;
export const TrainingClass = model("TrainingClass", trainingClassSchema);
