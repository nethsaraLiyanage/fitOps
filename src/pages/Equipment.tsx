import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AddEquipmentDialog, EquipmentFormValues } from "@/components/equipment/AddEquipmentDialog";
import { UpdateStatusDialog } from "@/components/equipment/UpdateStatusDialog";
import { AssignTechnicianDialog, AssignTechnicianValues } from "@/components/equipment/AssignTechnicianDialog";
import { useAddEquipment, useAddMaintenanceLog, useEquipmentQuery, useUpdateEquipmentStatus } from "@/components/equipment/use-equipment";
import { Equipment as EquipmentType, EquipmentStatus } from "@/components/equipment/equipment-data";
import { toast } from "@/hooks/use-toast";

const columns: Column<EquipmentType>[] = [
  { key: "name", label: "Equipment", render: (row) => <span className="font-medium text-foreground">{row.name}</span> },
  { key: "category", label: "Category" },
  { key: "condition", label: "Condition" },
  { key: "lastMaintenance", label: "Last Maintenance" },
  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
];

const Equipment = () => {
  const { data: equipment = [] } = useEquipmentQuery();
  const addEquipment = useAddEquipment();
  const updateStatus = useUpdateEquipmentStatus();
  const addMaintenanceLog = useAddMaintenanceLog();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<EquipmentType | null>(null);
  const [technicianTarget, setTechnicianTarget] = useState<EquipmentType | null>(null);

  // Looked up rather than stored so status/maintenance edits show up in the open profile.
  const selected = equipment.find((e) => e.id === selectedId) ?? null;

  const handleAdd = (values: EquipmentFormValues) => {
    addEquipment.mutate(values, {
      onSuccess: (created) => toast({ title: "Equipment added", description: created.name }),
      onError: () => toast({ title: "Could not add equipment", description: "Please try again.", variant: "destructive" }),
    });
  };

  const handleUpdateStatus = (status: EquipmentStatus) => {
    if (!statusTarget) return;
    updateStatus.mutate(
      { id: statusTarget.id, status },
      {
        onSuccess: () => toast({ title: "Status updated", description: `${statusTarget.name} is now ${status}` }),
        onError: () => toast({ title: "Could not update status", description: "Please try again.", variant: "destructive" }),
      },
    );
    setStatusTarget(null);
  };

  const handleAssignTechnician = (values: AssignTechnicianValues) => {
    if (!technicianTarget) return;
    addMaintenanceLog.mutate(
      { id: technicianTarget.id, ...values },
      {
        onSuccess: () => toast({ title: "Technician assigned", description: `${values.technician} · ${technicianTarget.name}` }),
        onError: () => toast({ title: "Could not assign technician", description: "Please try again.", variant: "destructive" }),
      },
    );
    setTechnicianTarget(null);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Equipment"
        description={`${equipment.length} items tracked`}
        action={{ label: "Add Equipment", icon: Plus, onClick: () => setAddOpen(true) }}
      />

      <Dialog open={!!selected} onOpenChange={() => setSelectedId(null)}>
        <DataTable columns={columns} data={equipment} onRowClick={(row) => setSelectedId(row.id)} />
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">{selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card p-3">
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-sm font-medium text-foreground">{selected.category}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-xs text-muted-foreground">Condition</p>
                  <p className="text-sm font-medium text-foreground">{selected.condition}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="glass-card p-3">
                  <p className="text-xs text-muted-foreground">Last Maintenance</p>
                  <p className="text-sm font-medium text-foreground">{selected.lastMaintenance}</p>
                </div>
                {selected.technician && (
                  <div className="glass-card p-3 col-span-2">
                    <p className="text-xs text-muted-foreground">Assigned Technician</p>
                    <p className="text-sm font-medium text-foreground">{selected.technician}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Maintenance History</h4>
                {selected.maintenanceLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No maintenance logged yet.</p>
                ) : (
                  <div className="space-y-3">
                    {[...selected.maintenanceLogs].reverse().map((entry, i) => (
                      <div key={i} className="flex gap-3 relative">
                        <div className="flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                          {i < selected.maintenanceLogs.length - 1 && <div className="w-px flex-1 bg-border" />}
                        </div>
                        <div className="pb-3">
                          <p className="text-sm text-foreground">{entry.action}</p>
                          <p className="text-xs text-muted-foreground">{entry.date} · {entry.technician}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setStatusTarget(selected)}>Update Status</Button>
                <Button variant="outline" size="sm" onClick={() => setTechnicianTarget(selected)}>Assign Technician</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AddEquipmentDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={handleAdd} />
      <UpdateStatusDialog equipment={statusTarget} onOpenChange={(open) => !open && setStatusTarget(null)} onSubmit={handleUpdateStatus} />
      <AssignTechnicianDialog equipment={technicianTarget} onOpenChange={(open) => !open && setTechnicianTarget(null)} onSubmit={handleAssignTechnician} />
    </DashboardLayout>
  );
};

export default Equipment;
