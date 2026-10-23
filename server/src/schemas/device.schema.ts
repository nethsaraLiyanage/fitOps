import { z } from "zod";

export const createDeviceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Max 100 characters"),
  serial: z.string().trim().min(1, "Serial number is required").max(64, "Max 64 characters"),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;

export const updateDeviceSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100, "Max 100 characters").optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;

export const biometricIdSchema = z.string().trim().min(1, "Biometric ID is required").max(32, "Max 32 characters");

/**
 * Devices keep wall-clock time with no timezone, so a timestamp without an offset
 * is read as the gym's local time (the server runs in the gym's timezone — see
 * utils/time.ts). One with an offset or a trailing Z is taken as given.
 */
const punchTimeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:?\d{2})?$/,
    "Use an ISO timestamp, e.g. 2026-10-22T07:45:00",
  )
  .transform((value) => new Date(value.replace(" ", "T")))
  .refine((date) => !Number.isNaN(date.getTime()), "Not a valid date");

/** Capped so a bridge flushing a long outage still fits the 100kb body limit; it sends the rest in the next batch. */
export const MAX_PUNCHES_PER_BATCH = 500;

export const punchBatchSchema = z.object({
  punches: z
    .array(z.object({ biometricId: biometricIdSchema, punchedAt: punchTimeSchema }))
    .min(1, "At least one punch is required")
    .max(MAX_PUNCHES_PER_BATCH, `Max ${MAX_PUNCHES_PER_BATCH} punches per batch`),
});

export type PunchBatchInput = z.infer<typeof punchBatchSchema>;

export const unmatchedPunchesQuerySchema = z.object({
  limit: z.coerce.number().int("Must be a whole number").min(1, "Must be at least 1").max(200, "Max 200").default(50),
});
