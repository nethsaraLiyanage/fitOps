import { useQuery } from "@tanstack/react-query";
import { fetchActivity } from "./activity-api";

export function useActivityQuery(limit = 10) {
  return useQuery({ queryKey: ["activity", limit], queryFn: () => fetchActivity(limit) });
}
