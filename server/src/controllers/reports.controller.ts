import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as reportsService from "../services/reports.service.js";
import { toDayKey } from "../utils/time.js";

export const summaryHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await reportsService.summary());
});

/** Sends a CSV as a download rather than letting the browser render it inline. */
function sendCsv(res: Response, basename: string, csv: string) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${basename}-${toDayKey(new Date())}.csv"`);
  res.send(csv);
}

export const membersCsvHandler = asyncHandler(async (_req: Request, res: Response) => {
  sendCsv(res, "fitops-members", await reportsService.membersCsv());
});

export const attendanceCsvHandler = asyncHandler(async (_req: Request, res: Response) => {
  sendCsv(res, "fitops-attendance", await reportsService.attendanceCsv());
});

export const equipmentCsvHandler = asyncHandler(async (_req: Request, res: Response) => {
  sendCsv(res, "fitops-equipment", await reportsService.equipmentCsv());
});
