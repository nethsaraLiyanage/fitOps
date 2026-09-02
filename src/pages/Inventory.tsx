import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AddInventoryDialog, InventoryFormValues } from "@/components/inventory/AddInventoryDialog";
import { StockAdjustmentDialog, StockAdjustmentValues } from "@/components/inventory/StockAdjustmentDialog";
import { useAddInventoryItem, useAdjustStock, useInventoryQuery } from "@/components/inventory/use-inventory";
import { InventoryItem, StockDirection } from "@/components/inventory/inventory-data";
import { toast } from "@/hooks/use-toast";

const columns: Column<InventoryItem>[] = [
  { key: "name", label: "Item", render: (row) => <span className="font-medium text-foreground">{row.name}</span> },
  { key: "category", label: "Category" },
  {
    key: "stock",
    label: "Stock",
    render: (row) => (
      <div className="flex items-center gap-2">
        <span className="text-foreground">{row.stock}</span>
        <span className="text-xs text-muted-foreground">/ {row.minStock} min</span>
      </div>
    ),
  },
  { key: "supplier", label: "Supplier" },
  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
];

const Inventory = () => {
  const { data: inventory = [] } = useInventoryQuery();
  const addItem = useAddInventoryItem();
  const adjustStock = useAdjustStock();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [adjustDirection, setAdjustDirection] = useState<StockDirection | null>(null);

  // Looked up rather than stored so stock adjustments show up in the open profile.
  const selected = inventory.find((i) => i.id === selectedId) ?? null;

  const handleAdd = (values: InventoryFormValues) => {
    addItem.mutate(values, {
      onSuccess: (created) => {
        setAddOpen(false);
        toast({ title: "Item added", description: `${created.name} · ${created.stock} in stock` });
      },
      onError: () => toast({ title: "Could not add item", description: "Please try again.", variant: "destructive" }),
    });
  };

  const handleAdjustStock = (values: StockAdjustmentValues) => {
    if (!selected || !adjustDirection) return;
    adjustStock.mutate(
      { id: selected.id, direction: adjustDirection, quantity: values.quantity, note: values.note },
      {
        onSuccess: (updated) =>
          toast({
            title: adjustDirection === "add" ? "Stock added" : "Stock removed",
            description: `${updated.name} · now ${updated.stock} in stock`,
          }),
        onError: (err) =>
          toast({
            title: "Could not adjust stock",
            description: err instanceof Error ? err.message : "Please try again.",
            variant: "destructive",
          }),
      },
    );
    setAdjustDirection(null);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Inventory"
        description={`${inventory.filter((i) => i.status === "critical" || i.status === "low").length} items need attention`}
        action={{ label: "Add Item", icon: Plus, onClick: () => setAddOpen(true) }}
      />

      <Dialog open={!!selected} onOpenChange={() => setSelectedId(null)}>
        <DataTable columns={columns} data={inventory} onRowClick={(row) => setSelectedId(row.id)} />
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">{selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card p-3">
                  <p className="text-xs text-muted-foreground">Current Stock</p>
                  <p className="text-xl font-bold text-foreground">{selected.stock}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <StatusBadge status={selected.status} />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Stock Movement</h4>
                {selected.movements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No stock movements logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {[...selected.movements].reverse().map((entry, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                        <div>
                          <p className="text-sm text-foreground">
                            {entry.direction === "add" ? "Restocked" : "Used"} {entry.direction === "add" ? "+" : "-"}
                            {entry.quantity} units
                            {entry.note ? ` · ${entry.note}` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">{entry.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => setAdjustDirection("add")}>Add Stock</Button>
                <Button variant="outline" size="sm" onClick={() => setAdjustDirection("remove")}>Remove Stock</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AddInventoryDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={handleAdd} />
      <StockAdjustmentDialog
        item={selected}
        direction={adjustDirection}
        onOpenChange={(open) => !open && setAdjustDirection(null)}
        onSubmit={handleAdjustStock}
      />
    </DashboardLayout>
  );
};

export default Inventory;
