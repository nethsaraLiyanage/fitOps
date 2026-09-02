import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMaintenanceLogRequest,
  createEquipmentRequest,
  fetchEquipment,
  updateStatusRequest,
} from "./equipment-api";
import { AssignTechnicianValues } from "./AssignTechnicianDialog";
import { Equipment } from "./equipment-data";

export function useEquipmentQuery() {
  return useQuery({ queryKey: ["equipment"], queryFn: fetchEquipment });
}

function useReplaceEquipmentInCache() {
  const queryClient = useQueryClient();
  return (updated: Equipment) => {
    queryClient.setQueryData<Equipment[]>(["equipment"], (prev) => prev?.map((e) => (e.id === updated.id ? updated : e)));
  };
}

export function useAddEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEquipmentRequest,
    onSuccess: (created) => {
      queryClient.setQueryData<Equipment[]>(["equipment"], (prev) => (prev ? [created, ...prev] : [created]));
    },
  });
}

export function useUpdateEquipmentStatus() {
  const replace = useReplaceEquipmentInCache();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Equipment["status"] }) => updateStatusRequest(id, status),
    onSuccess: replace,
  });
}

export function useAddMaintenanceLog() {
  const replace = useReplaceEquipmentInCache();
  return useMutation({
    mutationFn: ({ id, ...values }: { id: string } & AssignTechnicianValues) => addMaintenanceLogRequest(id, values),
    onSuccess: replace,
  });
}
