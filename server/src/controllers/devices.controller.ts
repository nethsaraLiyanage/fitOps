import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { DeviceRequest } from "../middleware/deviceAuth.middleware.js";
import * as attendanceService from "../services/attendance.service.js";
import * as devicesService from "../services/devices.service.js";
import {
  CreateDeviceInput,
  PunchBatchInput,
  UpdateDeviceInput,
  unmatchedPunchesQuerySchema,
} from "../schemas/device.schema.js";
import { ApiError } from "../utils/ApiError.js";

// Staff-facing device management (user JWT, administrators only).

export const listDevicesHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await devicesService.listDevices());
});

export const createDeviceHandler = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(await devicesService.createDevice(req.body as CreateDeviceInput));
});

export const updateDeviceHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json(await devicesService.updateDevice(req.params.id, req.body as UpdateDeviceInput));
});

export const rotateKeyHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json(await devicesService.rotateKey(req.params.id));
});

export const unmatchedPunchesHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = unmatchedPunchesQuerySchema.safeParse(req.query);
  if (!parsed.success) throw ApiError.badRequest("Invalid query parameters", parsed.error.flatten());

  res.json(await devicesService.listUnmatchedPunches(parsed.data.limit));
});

// Device-facing endpoints (device API key).

export const recordPunchesHandler = asyncHandler(async (req: Request, res: Response) => {
  const results = await attendanceService.recordPunches(req.body as PunchBatchInput, (req as DeviceRequest).deviceId);
  res.json({ results });
});

/** requireDevice has already stamped lastSeenAt; there is nothing else to do. */
export const heartbeatHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.status(204).end();
});

export const rosterHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await devicesService.roster());
});
