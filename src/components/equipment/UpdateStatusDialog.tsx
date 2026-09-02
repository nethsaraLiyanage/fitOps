import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Equipment, EquipmentStatus } from "./equipment-data";

const STATUS_OPTIONS: { value: EquipmentStatus; label: string }[] = [
  { value: "working", label: "Working" },
  { value: "maintenance", label: "Under maintenance" },
  { value: "broken", label: "Broken" },
];

interface UpdateStatusDialogProps {
  equipment: Equipment | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (status: EquipmentStatus) => void;
}

export function UpdateStatusDialog({ equipment, onOpenChange, onSubmit }: UpdateStatusDialogProps) {
  const [status, setStatus] = useState<EquipmentStatus>("working");

  useEffect(() => {
    if (equipment) setStatus(equipment.status);
  }, [equipment]);

  return (
    <Dialog open={!!equipment} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Status</DialogTitle>
          <DialogDescription>{equipment?.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as EquipmentStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={() => onSubmit(status)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
