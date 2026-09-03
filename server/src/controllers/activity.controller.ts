import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as activityService from "../services/activity.service.js";
import { ApiError } from "../utils/ApiError.js";

const activityQuerySchema = z.object({
  limit: z.coerce.number().int("Must be a whole number").min(1, "Must be at least 1").max(100, "Max 100").default(10),
});

export const listActivityHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = activityQuerySchema.safeParse(req.query);
  if (!parsed.success) throw ApiError.badRequest("Invalid query parameters", parsed.error.flatten());

  res.json(await activityService.listActivity(parsed.data.limit));
});
