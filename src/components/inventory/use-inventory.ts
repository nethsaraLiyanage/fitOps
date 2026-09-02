import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adjustStockRequest, createInventoryItemRequest, fetchInventory } from "./inventory-api";
import { InventoryItem, StockDirection } from "./inventory-data";

export function useInventoryQuery() {
  return useQuery({ queryKey: ["inventory"], queryFn: fetchInventory });
}

export function useAddInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInventoryItemRequest,
    onSuccess: (created) => {
      queryClient.setQueryData<InventoryItem[]>(["inventory"], (prev) => (prev ? [created, ...prev] : [created]));
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, direction, quantity, note }: { id: string; direction: StockDirection; quantity: number; note: string }) =>
      adjustStockRequest(id, direction, quantity, note),
    onSuccess: (updated) => {
      queryClient.setQueryData<InventoryItem[]>(["inventory"], (prev) => prev?.map((i) => (i.id === updated.id ? updated : i)));
    },
  });
}
