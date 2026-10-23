import { InferSchemaType, Schema, model } from "mongoose";

/**
 * A fingerprint terminal (or the bridge agent in front of it) allowed to post
 * punches. It authenticates with an API key rather than a user JWT, since it
 * runs unattended and can't log in. Only the key's SHA-256 is stored; the key
 * itself is shown once, when it is issued.
 */
const deviceSchema = new Schema(
  {
    name: { type: String, required: true },
    serial: { type: String, required: true, unique: true },
    keyHash: { type: String, required: true, unique: true },
    /** The first characters of the key, so staff can tell which key a device holds. */
    keyPrefix: { type: String, required: true },
    active: { type: Boolean, required: true, default: true },
    lastSeenAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type DeviceDoc = InferSchemaType<typeof deviceSchema>;
export const Device = model("Device", deviceSchema);
