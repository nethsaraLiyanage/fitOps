import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as settingsService from "../services/settings.service.js";
import { UpdateAccountInput, UpdateGymProfileInput, UpdatePasswordInput } from "../schemas/settings.schema.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const getGymProfileHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await settingsService.getGymProfile());
});

export const updateGymProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json(await settingsService.updateGymProfile(req.body as UpdateGymProfileInput));
});

export const updateAccountHandler = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  res.json(await settingsService.updateAccount(userId, req.body as UpdateAccountInput));
});

export const updatePasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  await settingsService.updatePassword(userId, req.body as UpdatePasswordInput);
  res.status(204).send();
});
