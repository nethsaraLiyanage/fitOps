import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { actorId } from "../utils/actor.js";
import * as inventoryService from "../services/inventory.service.js";
import { CreateInventoryItemInput, StockAdjustmentInput } from "../schemas/inventory.schema.js";

export const listInventoryHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await inventoryService.listInventory());
});

export const createInventoryItemHandler = asyncHandler(async (req: Request, res: Response) => {
  const created = await inventoryService.createInventoryItem(req.body as CreateInventoryItemInput);
  res.status(201).json(created);
});

export const adjustStockHandler = asyncHandler(async (req: Request, res: Response) => {
  const updated = await inventoryService.adjustStock(req.params.id, req.body as StockAdjustmentInput, actorId(req));
  res.json(updated);
});
