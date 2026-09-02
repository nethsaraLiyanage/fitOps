import bcrypt from "bcryptjs";
import { User } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { signToken } from "./token.service.js";

export type PublicUser = { id: string; name: string; email: string; role: string };

const toPublicUser = (user: { _id: unknown; name: string; email: string; role: string }): PublicUser => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
});

export async function login(email: string, password: string): Promise<{ token: string; user: PublicUser }> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw ApiError.unauthorized("Those credentials do not match any account.");

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw ApiError.unauthorized("Those credentials do not match any account.");

  const token = signToken({ sub: String(user._id), role: user.role });
  return { token, user: toPublicUser(user) };
}

export async function getUserById(id: string): Promise<PublicUser> {
  const user = await User.findById(id);
  if (!user) throw ApiError.unauthorized("Account no longer exists.");
  return toPublicUser(user);
}
