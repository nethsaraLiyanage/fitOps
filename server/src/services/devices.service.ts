import { createHash, randomBytes } from "node:crypto";
import { isValidObjectId } from "mongoose";
import { Device, DevicePunch, Member } from "../models/index.js";
import { CreateDeviceInput, UpdateDeviceInput } from "../schemas/device.schema.js";
import { ApiError } from "../utils/ApiError.js";

const KEY_PREFIX = "fod_";

/** Keys are 256 random bits, so a fast unsalted hash is enough — there is nothing to brute-force. */
export function hashDeviceKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function issueKey() {
  const key = `${KEY_PREFIX}${randomBytes(32).toString("base64url")}`;
  return { key, keyHash: hashDeviceKey(key), keyPrefix: key.slice(0, KEY_PREFIX.length + 6) };
}

const toClientDevice = (doc: any) => ({
  id: String(doc._id),
  name: doc.name,
  serial: doc.serial,
  keyPrefix: doc.keyPrefix,
  active: doc.active,
  lastSeenAt: doc.lastSeenAt ? doc.lastSeenAt.toISOString() : null,
  createdAt: doc.createdAt.toISOString(),
});

async function findDevice(id: string) {
  const device = isValidObjectId(id) ? await Device.findById(id) : null;
  if (!device) throw ApiError.notFound("Device not found");
  return device;
}

export async function listDevices() {
  const devices = await Device.find().sort({ createdAt: 1 });
  return devices.map(toClientDevice);
}

/** The plaintext key is only ever returned here and from rotateKey — it can't be recovered later. */
export async function createDevice(input: CreateDeviceInput) {
  if (await Device.exists({ serial: input.serial })) {
    throw ApiError.conflict(`A device with serial ${input.serial} is already registered.`);
  }

  const { key, ...stored } = issueKey();
  const device = await Device.create({ ...input, ...stored });
  return { ...toClientDevice(device), apiKey: key };
}

export async function rotateKey(id: string) {
  const device = await findDevice(id);
  const { key, keyHash, keyPrefix } = issueKey();
  device.keyHash = keyHash;
  device.keyPrefix = keyPrefix;
  await device.save();
  return { ...toClientDevice(device), apiKey: key };
}

export async function updateDevice(id: string, patch: UpdateDeviceInput) {
  const device = await findDevice(id);
  if (patch.name !== undefined) device.name = patch.name;
  if (patch.active !== undefined) device.active = patch.active;
  await device.save();
  return toClientDevice(device);
}

/** Punches whose biometric ID matched no member — usually a finger enrolled on the device but not yet linked in FitOps. */
export async function listUnmatchedPunches(limit: number) {
  const punches = await DevicePunch.find({ outcome: "unknown_member" })
    .sort({ punchedAt: -1 })
    .limit(limit)
    .populate("deviceId", "name");

  return punches.map((doc: any) => ({
    id: String(doc._id),
    biometricId: doc.biometricId,
    punchedAt: doc.punchedAt.toISOString(),
    deviceName: doc.deviceId && typeof doc.deviceId === "object" ? doc.deviceId.name : null,
  }));
}

/**
 * Every enrolled member and whether they should be let in. A bridge driving a
 * turnstile syncs this onto the device, so an expired member is refused at the
 * door rather than only flagged afterwards.
 */
export async function roster() {
  const members = await Member.find({ biometricId: { $type: "string" } }).sort({ membershipId: 1 });
  return members.map((m) => ({
    biometricId: m.biometricId as string,
    membershipId: m.membershipId,
    name: m.name,
    allowed: m.status === "active",
  }));
}
