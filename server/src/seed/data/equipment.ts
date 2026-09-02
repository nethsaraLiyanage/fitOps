/**
 * Ported from the frontend's Equipment.tsx. The original UI showed one
 * global `maintenanceHistory` array for whichever equipment row was
 * selected (a bug — see plan Phase 5 fix); here each item gets its own
 * plausible log entry derived from that same shared list plus its
 * `lastMaintenance` date, so real per-equipment history exists from day one.
 */
export const seedEquipment = [
  { name: "Treadmill Pro X1", category: "Cardio", condition: "Good", lastMaintenance: "2024-03-15", status: "working" as const, maintenanceLogs: [{ date: "2024-03-15", action: "Routine inspection", technician: "Mike T." }] },
  { name: "Bench Press Station", category: "Strength", condition: "Excellent", lastMaintenance: "2024-02-20", status: "working" as const, maintenanceLogs: [{ date: "2024-02-01", action: "Belt replacement", technician: "John S." }] },
  { name: "Treadmill #3", category: "Cardio", condition: "Worn", lastMaintenance: "2024-01-10", status: "maintenance" as const, maintenanceLogs: [{ date: "2024-01-10", action: "Lubrication", technician: "Mike T." }] },
  { name: "Cable Machine", category: "Strength", condition: "Good", lastMaintenance: "2024-03-01", status: "working" as const, maintenanceLogs: [] as { date: string; action: string; technician: string }[] },
  { name: "Rowing Machine", category: "Cardio", condition: "Fair", lastMaintenance: "2024-02-15", status: "working" as const, maintenanceLogs: [] as { date: string; action: string; technician: string }[] },
  { name: "Leg Press", category: "Strength", condition: "Poor", lastMaintenance: "2023-12-20", status: "broken" as const, maintenanceLogs: [{ date: "2023-11-20", action: "Motor check", technician: "John S." }] },
  { name: "Elliptical #2", category: "Cardio", condition: "Good", lastMaintenance: "2024-03-10", status: "working" as const, maintenanceLogs: [] as { date: string; action: string; technician: string }[] },
  { name: "Smith Machine", category: "Strength", condition: "Worn", lastMaintenance: "2024-01-25", status: "maintenance" as const, maintenanceLogs: [] as { date: string; action: string; technician: string }[] },
];
