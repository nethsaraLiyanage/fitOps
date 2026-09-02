import { apiFetch } from "@/lib/api-client";
import { ClassFormValues } from "./AddClassDialog";
import { ClassSession, TrainingClass } from "./class-data";

export function fetchClasses() {
  return apiFetch<TrainingClass[]>("/classes");
}

export function fetchSessions() {
  return apiFetch<ClassSession[]>("/classes/sessions");
}

export function createClassRequest(values: ClassFormValues) {
  return apiFetch<TrainingClass>("/classes", { method: "POST", body: values });
}

export function completeSessionRequest(id: string) {
  return apiFetch<ClassSession>(`/classes/sessions/${id}/complete`, { method: "PATCH" });
}
