import { ActivityLog } from "../models/index.js";
import { ACTIVITY_TYPES } from "../models/ActivityLog.js";

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

const toClientEntry = (doc: any) => ({
  id: String(doc._id),
  type: doc.type,
  text: doc.text,
  createdAt: doc.createdAt.toISOString(),
});

/**
 * Appends to the audit trail. Deliberately swallows its own failures: a log write
 * must never turn a successful mutation into a failed request for the user.
 */
export async function logActivity(type: ActivityType, text: string, actorId?: string | null): Promise<void> {
  try {
    await ActivityLog.create({ type, text, actorId: actorId ?? null });
  } catch (error) {
    console.error(`Failed to record activity (${type}):`, error);
  }
}

export async function listActivity(limit: number) {
  const entries = await ActivityLog.find().sort({ createdAt: -1 }).limit(limit);
  return entries.map(toClientEntry);
}
