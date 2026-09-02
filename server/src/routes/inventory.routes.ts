import { Router } from "express";
import { adjustStockHandler, createInventoryItemHandler, listInventoryHandler } from "../controllers/inventory.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createInventoryItemSchema, stockAdjustmentSchema } from "../schemas/inventory.schema.js";

export const inventoryRouter = Router();

inventoryRouter.use(requireAuth);

inventoryRouter.get("/", listInventoryHandler);
inventoryRouter.post("/", validateBody(createInventoryItemSchema), createInventoryItemHandler);
inventoryRouter.post("/:id/stock", validateBody(stockAdjustmentSchema), adjustStockHandler);
