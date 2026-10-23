import { InferSchemaType, Schema, model } from "mongoose";

export const PUNCH_OUTCOMES = ["checked_in", "checked_out", "repeat", "unknown_member", "invalid_time"] as const;

/**
 * Every punch a device reports, whatever became of it. This is the audit trail
 * behind biometric attendance, the queue of punches that matched no member, and
 * the idempotency guard: `eventId` is derived from the punch itself, so a bridge
 * re-sending a batch it never got an answer for can't record a visit twice.
 */
const devicePunchSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true },
    deviceId: { type: Schema.Types.ObjectId, ref: "Device", required: true },
    biometricId: { type: String, required: true },
    punchedAt: { type: Date, required: true },
    outcome: { type: String, enum: PUNCH_OUTCOMES, required: true },
    memberId: { type: Schema.Types.ObjectId, ref: "Member", default: null },
    attendanceRecordId: { type: Schema.Types.ObjectId, ref: "AttendanceRecord", default: null },
  },
  { timestamps: true },
);

devicePunchSchema.index({ outcome: 1, punchedAt: -1 });

export type DevicePunchDoc = InferSchemaType<typeof devicePunchSchema>;
export const DevicePunch = model("DevicePunch", devicePunchSchema);
