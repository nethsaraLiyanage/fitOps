import { Schema, model } from "mongoose";

/** Backs atomic sequence generation, e.g. membership IDs (GYM-0001, GYM-0002, ...). */
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

export const Counter = model("Counter", counterSchema);

export async function nextSequence(key: string): Promise<number> {
  const doc = await Counter.findByIdAndUpdate(key, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return doc.seq;
}
