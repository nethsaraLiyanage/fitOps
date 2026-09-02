import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import * as authService from "../services/auth.service.js";
import { LoginInput } from "../schemas/auth.schema.js";
import { Request } from "express";

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;
  const result = await authService.login(email, password);
  res.json(result);
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const user = await authService.getUserById(userId);
  res.json(user);
});
