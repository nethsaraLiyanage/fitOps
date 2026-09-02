import { Request, Response } from "express";

export function notFoundMiddleware(_req: Request, res: Response) {
  res.status(404).json({ error: { message: "Route not found", code: "NOT_FOUND" } });
}
