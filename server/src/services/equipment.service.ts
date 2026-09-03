import { Equipment } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { AddMaintenanceLogInput, CreateEquipmentInput, UpdateEquipmentStatusInput } from "../schemas/equipment.schema.js";
import { logActivity } from "./activity.service.js";

const todayISO = () => new Date().toISOString().slice(0, 10);

const toClientEquipment = (doc: any) => ({
  id: String(doc._id),
  name: doc.name,
  category: doc.category,
  condition: doc.condition,
  lastMaintenance: doc.lastMaintenance,
  status: doc.status,
  technician: doc.technician,
  maintenanceLogs: doc.maintenanceLogs.map((log: any) => ({
    date: log.date,
    action: log.action,
    technician: log.technician,
  })),
});

export async function listEquipment() {
  const equipment = await Equipment.find().sort({ name: 1 });
  return equipment.map(toClientEquipment);
}

export async function createEquipment(input: CreateEquipmentInput) {
  const created = await Equipment.create({ ...input, status: "working", lastMaintenance: todayISO(), maintenanceLogs: [] });
  return toClientEquipment(created);
}

export async function updateStatus(id: string, input: UpdateEquipmentStatusInput, actorId?: string) {
  const equipment = await Equipment.findById(id);
  if (!equipment) throw ApiError.notFound("Equipment not found");

  equipment.status = input.status;
  await equipment.save();
  await logActivity("equipment.status_changed", `${equipment.name} marked ${input.status}`, actorId);

  return toClientEquipment(equipment);
}

export async function addMaintenanceLog(id: string, input: AddMaintenanceLogInput, actorId?: string) {
  const equipment = await Equipment.findById(id);
  if (!equipment) throw ApiError.notFound("Equipment not found");

  const date = todayISO();
  equipment.maintenanceLogs.push({ date, action: input.action, technician: input.technician });
  equipment.technician = input.technician;
  equipment.lastMaintenance = date;
  await equipment.save();
  await logActivity("equipment.maintenance_logged", `${equipment.name} assigned to ${input.technician}`, actorId);

  return toClientEquipment(equipment);
}
