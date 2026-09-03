import { apiFetch } from "@/lib/api-client";
import { AttendanceRecord, HeatmapCell } from "./attendance-data";

export function fetchTodayAttendance() {
  return apiFetch<AttendanceRecord[]>("/attendance/today");
}

export function fetchAttendanceHeatmap() {
  return apiFetch<HeatmapCell[]>("/attendance/heatmap");
}

export function checkInRequest(memberId: string) {
  return apiFetch<AttendanceRecord>("/attendance/check-in", { method: "POST", body: { memberId } });
}

export function checkOutRequest(id: string) {
  return apiFetch<AttendanceRecord>(`/attendance/${id}/check-out`, { method: "PATCH" });
}
