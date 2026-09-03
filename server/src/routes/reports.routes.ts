import { Router } from "express";
import {
  attendanceCsvHandler,
  equipmentCsvHandler,
  membersCsvHandler,
  summaryHandler,
} from "../controllers/reports.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

reportsRouter.get("/summary", summaryHandler);
reportsRouter.get("/export/members.csv", membersCsvHandler);
reportsRouter.get("/export/attendance.csv", attendanceCsvHandler);
reportsRouter.get("/export/equipment.csv", equipmentCsvHandler);
