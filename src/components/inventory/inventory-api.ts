import { apiFetch } from "@/lib/api-client";
import { InventoryFormValues } from "./AddInventoryDialog";
import { InventoryItem, StockDirection } from "./inventory-data";

export function fetchInventory() {
  return apiFetch<InventoryItem[]>("/inventory");
}

export function createInventoryItemRequest(values: InventoryFormValues) {
  return apiFetch<InventoryItem>("/inventory", { method: "POST", body: values });
}

export function adjustStockRequest(id: string, direction: StockDirection, quantity: number, note: string) {
  return apiFetch<InventoryItem>(`/inventory/${id}/stock`, {
    method: "POST",
    body: { direction, quantity, note: note || undefined },
  });
}
