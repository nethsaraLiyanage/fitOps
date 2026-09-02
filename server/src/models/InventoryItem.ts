import { InferSchemaType, Schema, model } from "mongoose";

export const INVENTORY_CATEGORIES = ["Supplements", "Accessories", "Amenities", "Retail", "Equipment"] as const;

const stockMovementSchema = new Schema(
  {
    date: { type: String, required: true },
    direction: { type: String, enum: ["add", "remove"], required: true },
    quantity: { type: Number, required: true },
    note: { type: String, default: null },
  },
  { _id: false, timestamps: false },
);

const inventoryItemSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, enum: INVENTORY_CATEGORIES, required: true },
    stock: { type: Number, required: true, default: 0 },
    minStock: { type: Number, required: true, default: 0 },
    supplier: { type: String, required: true },
    movements: { type: [stockMovementSchema], default: [] },
  },
  { timestamps: true },
);

export type InventoryItemDoc = InferSchemaType<typeof inventoryItemSchema>;
export const InventoryItem = model("InventoryItem", inventoryItemSchema);
