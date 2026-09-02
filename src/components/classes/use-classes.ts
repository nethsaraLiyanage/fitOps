import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { completeSessionRequest, createClassRequest, fetchClasses, fetchSessions } from "./classes-api";
import { ClassSession } from "./class-data";

export function useClassesQuery() {
  return useQuery({ queryKey: ["classes"], queryFn: fetchClasses });
}

export function useSessionsQuery() {
  return useQuery({ queryKey: ["classes", "sessions"], queryFn: fetchSessions });
}

export function useAddClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClassRequest,
    onSuccess: () => {
      // A matching-day class creation also logs today's session server-side, so refetch both.
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useCompleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeSessionRequest,
    onSuccess: (session) => {
      queryClient.setQueryData<ClassSession[]>(["classes", "sessions"], (prev) =>
        prev?.map((s) => (s.id === session.id ? session : s)),
      );
    },
  });
}
