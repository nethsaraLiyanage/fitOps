import { z } from "zod";
import { INVENTORY_CATEGORIES } from "../models/InventoryItem.js";

export const createInventoryItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required").max(100, "Max 100 characters"),
  category: z.enum(INVENTORY_CATEGORIES),
  stock: z.coerce.number().int("Must be a whole number").min(0, "Cannot be negative").max(100000, "Too large"),
  minStock: z.coerce.number().int("Must be a whole number").min(0, "Cannot be negative").max(100000, "Too large"),
  supplier: z.string().trim().min(1, "Supplier is required").max(100, "Max 100 characters"),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;

export const stockAdjustmentSchema = z.object({
  direction: z.enum(["add", "remove"]),
  quantity: z.coerce.number().int("Must be a whole number").min(1, "Must be at least 1"),
  note: z.string().trim().max(200, "Max 200 characters").optional(),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
