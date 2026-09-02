import { z } from "zod";
import { DAYS, LEVELS } from "../models/TrainingClass.js";

export const createClassSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(60, "Max 60 characters"),
  discipline: z.string().trim().min(1, "Discipline is required").max(60, "Max 60 characters"),
  coach: z.string().trim().min(1, "Coach is required").max(60, "Max 60 characters"),
  day: z.enum(DAYS),
  startTime: z.string().min(1, "Start time is required"),
  durationMin: z.coerce.number().int().min(15, "Min 15 minutes").max(240, "Max 240 minutes"),
  level: z.enum(LEVELS),
  capacity: z.coerce.number().int().min(1, "Min 1").max(60, "Max 60"),
  ring: z.string().trim().min(1, "Ring/area is required").max(30, "Max 30 characters"),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
