import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { checkInRequest, checkOutRequest, fetchAttendanceHeatmap, fetchTodayAttendance } from "./attendance-api";
import { AttendanceRecord } from "./attendance-data";

export function useTodayAttendanceQuery() {
  return useQuery({ queryKey: ["attendance", "today"], queryFn: fetchTodayAttendance });
}

export function useAttendanceHeatmapQuery() {
  return useQuery({ queryKey: ["attendance", "heatmap"], queryFn: fetchAttendanceHeatmap });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkInRequest,
    onSuccess: (record) => {
      // The list is newest-first, so a fresh check-in belongs at the top.
      queryClient.setQueryData<AttendanceRecord[]>(["attendance", "today"], (prev) => (prev ? [record, ...prev] : [record]));
      queryClient.invalidateQueries({ queryKey: ["attendance", "heatmap"] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkOutRequest,
    onSuccess: (record) => {
      queryClient.setQueryData<AttendanceRecord[]>(["attendance", "today"], (prev) =>
        prev?.map((r) => (r.id === record.id ? record : r)),
      );
    },
  });
}
