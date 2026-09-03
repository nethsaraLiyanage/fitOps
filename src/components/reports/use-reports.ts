import { useMutation, useQuery } from "@tanstack/react-query";
import { downloadReport, fetchReportsSummary } from "./reports-api";

export function useReportsSummaryQuery() {
  return useQuery({ queryKey: ["reports", "summary"], queryFn: fetchReportsSummary });
}

export function useExportReport() {
  return useMutation({ mutationFn: downloadReport });
}
