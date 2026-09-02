import { InferSchemaType, Schema, model } from "mongoose";

const attendanceRecordSchema = new Schema(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, default: null },
  },
  { timestamps: true },
);

attendanceRecordSchema.index({ checkIn: 1 });
attendanceRecordSchema.index({ memberId: 1, checkIn: -1 });

export type AttendanceRecordDoc = InferSchemaType<typeof attendanceRecordSchema>;
export const AttendanceRecord = model("AttendanceRecord", attendanceRecordSchema);
