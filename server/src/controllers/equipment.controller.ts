import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { actorId } from "../utils/actor.js";
import * as equipmentService from "../services/equipment.service.js";
import { AddMaintenanceLogInput, CreateEquipmentInput, UpdateEquipmentStatusInput } from "../schemas/equipment.schema.js";

export const listEquipmentHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await equipmentService.listEquipment());
});

export const createEquipmentHandler = asyncHandler(async (req: Request, res: Response) => {
  const created = await equipmentService.createEquipment(req.body as CreateEquipmentInput);
  res.status(201).json(created);
});

export const updateStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const updated = await equipmentService.updateStatus(req.params.id, req.body as UpdateEquipmentStatusInput, actorId(req));
  res.json(updated);
});

export const addMaintenanceLogHandler = asyncHandler(async (req: Request, res: Response) => {
  const updated = await equipmentService.addMaintenanceLog(req.params.id, req.body as AddMaintenanceLogInput, actorId(req));
  res.json(updated);
});
