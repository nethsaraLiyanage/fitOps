import { apiFetch } from "@/lib/api-client";
import { EquipmentFormValues } from "./AddEquipmentDialog";
import { AssignTechnicianValues } from "./AssignTechnicianDialog";
import { Equipment, EquipmentStatus } from "./equipment-data";

export function fetchEquipment() {
  return apiFetch<Equipment[]>("/equipment");
}

export function createEquipmentRequest(values: EquipmentFormValues) {
  return apiFetch<Equipment>("/equipment", { method: "POST", body: values });
}

export function updateStatusRequest(id: string, status: EquipmentStatus) {
  return apiFetch<Equipment>(`/equipment/${id}/status`, { method: "PATCH", body: { status } });
}

export function addMaintenanceLogRequest(id: string, values: AssignTechnicianValues) {
  return apiFetch<Equipment>(`/equipment/${id}/maintenance`, { method: "POST", body: values });
}
