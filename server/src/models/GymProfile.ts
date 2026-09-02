import { InferSchemaType, Schema, model } from "mongoose";

/** Singleton document — always looked up/created with _id "singleton". */
const gymProfileSchema = new Schema(
  {
    _id: { type: String, default: "singleton" },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    hours: { type: String, required: true },
    maxCapacity: { type: Number, required: true },
  },
  { timestamps: true },
);

export type GymProfileDoc = InferSchemaType<typeof gymProfileSchema>;
export const GymProfile = model("GymProfile", gymProfileSchema);
