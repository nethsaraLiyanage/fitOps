import bcrypt from "bcryptjs";
import { GymProfile, User } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { UpdateAccountInput, UpdateGymProfileInput, UpdatePasswordInput } from "../schemas/settings.schema.js";
import { PublicUser } from "./auth.service.js";

const SINGLETON_ID = "singleton";

/** Used both as the seed fixture and as the fallback for a gym that was never seeded. */
export const DEFAULT_GYM_PROFILE = {
  name: "FitZone Gym",
  phone: "+1 555-0100",
  address: "123 Fitness Avenue, Los Angeles, CA",
  hours: "5:00 AM - 10:00 PM",
  maxCapacity: 150,
};

const toClientProfile = (doc: any) => ({
  name: doc.name,
  phone: doc.phone,
  address: doc.address,
  hours: doc.hours,
  maxCapacity: doc.maxCapacity,
});

/**
 * The profile is a singleton. A gym that was never seeded still needs a settings
 * form to open, so a first read creates the document from the default profile.
 */
export async function getGymProfile() {
  const existing = await GymProfile.findById(SINGLETON_ID);
  if (existing) return toClientProfile(existing);

  const created = await GymProfile.create({ _id: SINGLETON_ID, ...DEFAULT_GYM_PROFILE });
  return toClientProfile(created);
}

export async function updateGymProfile(input: UpdateGymProfileInput) {
  const updated = await GymProfile.findByIdAndUpdate(
    SINGLETON_ID,
    { _id: SINGLETON_ID, ...input },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return toClientProfile(updated);
}

export async function updateAccount(userId: string, input: UpdateAccountInput): Promise<PublicUser> {
  const clash = await User.findOne({ email: input.email, _id: { $ne: userId } });
  if (clash) throw ApiError.conflict("Another account already uses that email address.");

  const user = await User.findByIdAndUpdate(userId, input, { new: true });
  if (!user) throw ApiError.unauthorized("Account no longer exists.");

  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}

export async function updatePassword(userId: string, input: UpdatePasswordInput): Promise<void> {
  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized("Account no longer exists.");

  const matches = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!matches) throw ApiError.badRequest("Your current password is incorrect.");

  if (await bcrypt.compare(input.newPassword, user.passwordHash)) {
    throw ApiError.badRequest("Choose a password you are not already using.");
  }

  user.passwordHash = await bcrypt.hash(input.newPassword, 10);
  await user.save();
}
