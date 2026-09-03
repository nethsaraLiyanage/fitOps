import { Router } from "express";
import { checkInHandler, checkOutHandler, heatmapHandler, listTodayHandler } from "../controllers/attendance.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { checkInSchema } from "../schemas/attendance.schema.js";

export const attendanceRouter = Router();

attendanceRouter.use(requireAuth);

attendanceRouter.get("/today", listTodayHandler);
attendanceRouter.get("/heatmap", heatmapHandler);
attendanceRouter.post("/check-in", validateBody(checkInSchema), checkInHandler);
attendanceRouter.patch("/:id/check-out", checkOutHandler);
