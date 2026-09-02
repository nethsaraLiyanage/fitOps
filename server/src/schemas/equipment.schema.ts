import { z } from "zod";

export const EQUIPMENT_CONDITIONS = ["Excellent", "Good", "Fair", "Worn", "Poor"] as const;
export const EQUIPMENT_CATEGORY_PRESETS = ["Cardio", "Strength", "Free Weights", "Functional", "Recovery"] as const;

export const createEquipmentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Max 100 characters"),
  category: z.string().trim().min(1, "Category is required").max(40, "Max 40 characters"),
  condition: z.enum(EQUIPMENT_CONDITIONS),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;

export const updateEquipmentStatusSchema = z.object({
  status: z.enum(["working", "maintenance", "broken"]),
});

export type UpdateEquipmentStatusInput = z.infer<typeof updateEquipmentStatusSchema>;

export const addMaintenanceLogSchema = z.object({
  technician: z.string().trim().min(1, "Technician is required").max(80, "Max 80 characters"),
  action: z.string().trim().min(1, "Action is required").max(200, "Max 200 characters"),
});

export type AddMaintenanceLogInput = z.infer<typeof addMaintenanceLogSchema>;
