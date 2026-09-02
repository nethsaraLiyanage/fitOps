export type ItemStatus = "active" | "low" | "critical";
export type StockDirection = "add" | "remove";

export type StockMovement = {
  date: string;
  direction: StockDirection;
  quantity: number;
  note: string | null;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  supplier: string;
  status: ItemStatus;
  movements: StockMovement[];
};
