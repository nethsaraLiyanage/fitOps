import { Router } from "express";
import {
  addMaintenanceLogHandler,
  createEquipmentHandler,
  listEquipmentHandler,
  updateStatusHandler,
} from "../controllers/equipment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { addMaintenanceLogSchema, createEquipmentSchema, updateEquipmentStatusSchema } from "../schemas/equipment.schema.js";

export const equipmentRouter = Router();

equipmentRouter.use(requireAuth);

equipmentRouter.get("/", listEquipmentHandler);
equipmentRouter.post("/", validateBody(createEquipmentSchema), createEquipmentHandler);
equipmentRouter.patch("/:id/status", validateBody(updateEquipmentStatusSchema), updateStatusHandler);
equipmentRouter.post("/:id/maintenance", validateBody(addMaintenanceLogSchema), addMaintenanceLogHandler);
