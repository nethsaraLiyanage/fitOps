export type EquipmentStatus = "working" | "maintenance" | "broken";

export type MaintenanceLog = {
  date: string;
  action: string;
  technician: string;
};

export type Equipment = {
  id: string;
  name: string;
  category: string;
  condition: string;
  lastMaintenance: string;
  status: EquipmentStatus;
  technician: string | null;
  maintenanceLogs: MaintenanceLog[];
};

export const EQUIPMENT_CONDITIONS = ["Excellent", "Good", "Fair", "Worn", "Poor"] as const;

/** Curated presets for the category dropdown — the field itself accepts any string via "Other". */
export const EQUIPMENT_CATEGORY_PRESETS = ["Cardio", "Strength", "Free Weights", "Functional", "Recovery"] as const;
