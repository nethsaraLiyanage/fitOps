import { InferSchemaType, Schema, model } from "mongoose";

const paymentSchema = new Schema(
  {
    /** "2026-07" for monthly plans, "2026" for annual ones. */
    period: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["paid", "pending", "overdue"], required: true, default: "pending" },
    verified: { type: Boolean, required: true, default: false },
    paidOn: { type: String, default: null },
  },
  { _id: false },
);

const memberSchema = new Schema(
  {
    membershipId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    nic: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    status: { type: String, enum: ["active", "expired"], required: true, default: "active" },
    joined: { type: String, required: true },
    plan: { type: String, required: true },
    paymentMethod: { type: String, enum: ["Monthly", "Annual"], required: true },
    payments: { type: [paymentSchema], default: [] },
    /**
     * The user number this member is enrolled under on the fingerprint device.
     * Fingerprint templates themselves stay on the device and are never stored here.
     */
    biometricId: { type: String },
  },
  { timestamps: true },
);

// Partial rather than sparse: a sparse index still indexes explicit nulls, so two
// unenrolled members would collide.
memberSchema.index({ biometricId: 1 }, { unique: true, partialFilterExpression: { biometricId: { $type: "string" } } });

export type MemberDoc = InferSchemaType<typeof memberSchema>;
export const Member = model("Member", memberSchema);
