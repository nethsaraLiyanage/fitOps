import { InferSchemaType, Schema, model } from "mongoose";

export const ACTIVITY_TYPES = [
  "member.joined",
  "payment.updated",
  "equipment.status_changed",
  "equipment.maintenance_logged",
  "inventory.restocked",
  "inventory.low_stock",
  "classes.class_scheduled",
  "classes.session_completed",
  "attendance.checked_in",
] as const;

const activityLogSchema = new Schema(
  {
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    text: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

activityLogSchema.index({ createdAt: -1 });

export type ActivityLogDoc = InferSchemaType<typeof activityLogSchema>;
export const ActivityLog = model("ActivityLog", activityLogSchema);
