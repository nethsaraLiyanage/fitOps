import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { actorId } from "../utils/actor.js";
import * as attendanceService from "../services/attendance.service.js";
import { CheckInInput, heatmapQuerySchema } from "../schemas/attendance.schema.js";
import { ApiError } from "../utils/ApiError.js";

export const listTodayHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await attendanceService.listToday());
});

export const checkInHandler = asyncHandler(async (req: Request, res: Response) => {
  const record = await attendanceService.checkIn(req.body as CheckInInput, actorId(req));
  res.status(201).json(record);
});

export const checkOutHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json(await attendanceService.checkOut(req.params.id));
});

export const heatmapHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = heatmapQuerySchema.safeParse(req.query);
  if (!parsed.success) throw ApiError.badRequest("Invalid query parameters", parsed.error.flatten());

  res.json(await attendanceService.heatmap(parsed.data.days));
});
