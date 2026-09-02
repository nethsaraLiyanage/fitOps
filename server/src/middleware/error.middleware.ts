import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { message: err.message, code: err.code, details: err.details } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: "Internal server error", code: "INTERNAL_ERROR" } });
}
