import { Router } from "express";
import { listActivityHandler } from "../controllers/activity.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const activityRouter = Router();

activityRouter.use(requireAuth);

activityRouter.get("/", listActivityHandler);
