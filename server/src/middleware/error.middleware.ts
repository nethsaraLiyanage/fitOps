import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";

/** Express middleware (body-parser especially) throws errors carrying an HTTP status. */
type StatusCarryingError = { status?: number; statusCode?: number; type?: string };

function describeClientError(err: StatusCarryingError, status: number) {
  if (err.type === "entity.too.large") return { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large." };
  if (err.type === "entity.parse.failed") return { code: "INVALID_JSON", message: "Request body is not valid JSON." };
  return { code: status === 413 ? "PAYLOAD_TOO_LARGE" : "BAD_REQUEST", message: "The request could not be processed." };
}

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { message: err.message, code: err.code, details: err.details } });
    return;
  }

  // Keep framework-level client errors in the same shape rather than masking them as 500s.
  const candidate = (err ?? {}) as StatusCarryingError;
  const status = candidate.status ?? candidate.statusCode;

  if (typeof status === "number" && status >= 400 && status < 500) {
    res.status(status).json({ error: describeClientError(candidate, status) });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: "Internal server error", code: "INTERNAL_ERROR" } });
}
