import { InferSchemaType, Schema, model } from "mongoose";

const maintenanceLogSchema = new Schema(
  {
    date: { type: String, required: true },
    action: { type: String, required: true },
    technician: { type: String, required: true },
  },
  { _id: false, timestamps: false },
);

const equipmentSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    condition: { type: String, required: true },
    lastMaintenance: { type: String, required: true },
    status: { type: String, enum: ["working", "maintenance", "broken"], required: true, default: "working" },
    technician: { type: String, default: null },
    maintenanceLogs: { type: [maintenanceLogSchema], default: [] },
  },
  { timestamps: true },
);

export type EquipmentDoc = InferSchemaType<typeof equipmentSchema>;
export const Equipment = model("Equipment", equipmentSchema);
