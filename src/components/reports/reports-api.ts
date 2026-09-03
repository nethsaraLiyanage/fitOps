import { apiFetch, downloadFile } from "@/lib/api-client";
import { ExportKind, ReportsSummary, exportFilename } from "./reports-data";

export function fetchReportsSummary() {
  return apiFetch<ReportsSummary>("/reports/summary");
}

export function downloadReport(kind: ExportKind) {
  return downloadFile(`/reports/export/${kind}.csv`, exportFilename(kind));
}
