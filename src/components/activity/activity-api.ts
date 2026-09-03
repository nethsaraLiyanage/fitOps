import { apiFetch } from "@/lib/api-client";
import { ActivityEntry } from "./activity-data";

export function fetchActivity(limit = 10) {
  return apiFetch<ActivityEntry[]>(`/activity?limit=${limit}`);
}
