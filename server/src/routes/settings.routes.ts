import { Router } from "express";
import {
  getGymProfileHandler,
  updateAccountHandler,
  updateGymProfileHandler,
  updatePasswordHandler,
} from "../controllers/settings.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { updateAccountSchema, updateGymProfileSchema, updatePasswordSchema } from "../schemas/settings.schema.js";

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

settingsRouter.get("/gym", getGymProfileHandler);
settingsRouter.patch("/gym", validateBody(updateGymProfileSchema), updateGymProfileHandler);
settingsRouter.patch("/account", validateBody(updateAccountSchema), updateAccountHandler);
settingsRouter.patch("/account/password", validateBody(updatePasswordSchema), updatePasswordHandler);
