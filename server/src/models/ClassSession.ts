import { InferSchemaType, Schema, model } from "mongoose";

const classSessionSchema = new Schema(
  {
    /** Null for ad-hoc sessions not tied to any recurring class. */
    classId: { type: Schema.Types.ObjectId, ref: "TrainingClass", default: null },
    date: { type: String, required: true },
    title: { type: String, required: true },
    discipline: { type: String, required: true },
    coach: { type: String, required: true },
    attended: { type: Number, required: true, default: 0 },
    capacity: { type: Number, required: true },
    rounds: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ["Completed", "Scheduled", "Cancelled"], required: true, default: "Scheduled" },
  },
  { timestamps: true },
);

export type ClassSessionDoc = InferSchemaType<typeof classSessionSchema>;
export const ClassSession = model("ClassSession", classSessionSchema);
