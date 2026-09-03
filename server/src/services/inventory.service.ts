import { InventoryItem } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { CreateInventoryItemInput, StockAdjustmentInput } from "../schemas/inventory.schema.js";
import { logActivity } from "./activity.service.js";

const todayISO = () => new Date().toISOString().slice(0, 10);

type ItemStatus = "active" | "low" | "critical";

const deriveStatus = (stock: number, minStock: number): ItemStatus => {
  if (stock <= minStock * 0.25) return "critical";
  if (stock < minStock) return "low";
  return "active";
};

const toClientItem = (doc: any) => ({
  id: String(doc._id),
  name: doc.name,
  category: doc.category,
  stock: doc.stock,
  minStock: doc.minStock,
  supplier: doc.supplier,
  status: deriveStatus(doc.stock, doc.minStock),
  movements: doc.movements.map((m: any) => ({ date: m.date, direction: m.direction, quantity: m.quantity, note: m.note })),
});

export async function listInventory() {
  const items = await InventoryItem.find().sort({ name: 1 });
  return items.map(toClientItem);
}

export async function createInventoryItem(input: CreateInventoryItemInput) {
  const created = await InventoryItem.create({ ...input, movements: [] });
  return toClientItem(created);
}

export async function adjustStock(id: string, input: StockAdjustmentInput, actorId?: string) {
  const item = await InventoryItem.findById(id);
  if (!item) throw ApiError.notFound("Inventory item not found");

  if (input.direction === "remove" && input.quantity > item.stock) {
    throw ApiError.badRequest(`Cannot remove ${input.quantity} units — only ${item.stock} in stock.`);
  }

  item.stock += input.direction === "add" ? input.quantity : -input.quantity;
  item.movements.push({ date: todayISO(), direction: input.direction, quantity: input.quantity, note: input.note ?? null });
  await item.save();

  const updated = toClientItem(item);

  if (input.direction === "add") {
    await logActivity("inventory.restocked", `${item.name} restocked (+${input.quantity} units)`, actorId);
  }

  // A removal that pushes an item under its threshold is the entry worth surfacing.
  if (updated.status !== "active") {
    await logActivity(
      "inventory.low_stock",
      `${item.name} stock ${updated.status === "critical" ? "critically low" : "running low"} (${item.stock} left)`,
      actorId,
    );
  }

  return updated;
}
