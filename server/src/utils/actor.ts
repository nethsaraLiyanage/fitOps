import { Request } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

/**
 * The signed-in user id, for attributing activity-log entries. Every mutating
 * route sits behind requireAuth, so this is set — it stays optional so a service
 * can still be called from a script or a test without faking a request.
 */
export function actorId(req: Request): string | undefined {
  return (req as AuthenticatedRequest).userId;
}
