import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { verifyToken } from "../services/token.service.js";

export type AuthenticatedRequest = Request & { userId: string; userRole: string };

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(ApiError.unauthorized("Missing bearer token"));
    return;
  }

  try {
    const payload = verifyToken(header.slice("Bearer ".length));
    (req as AuthenticatedRequest).userId = payload.sub;
    (req as AuthenticatedRequest).userRole = payload.role;
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired token"));
  }
}

/** Run after requireAuth. Restricts a route to the given user roles. */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!roles.includes((req as AuthenticatedRequest).userRole)) {
      next(ApiError.forbidden("You don't have permission to do this"));
      return;
    }
    next();
  };
}
