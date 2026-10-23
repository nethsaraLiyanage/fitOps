import { NextFunction, Request, Response } from "express";
import { Device } from "../models/index.js";
import { hashDeviceKey } from "../services/devices.service.js";
import { ApiError } from "../utils/ApiError.js";

export type DeviceRequest = Request & { deviceId: string };

export const DEVICE_KEY_HEADER = "x-device-key";

/**
 * Authenticates a fingerprint device by its API key. Any authenticated request
 * counts as a sign of life, so this also stamps `lastSeenAt` — the heartbeat
 * route only exists for a device that has had nothing to send for a while.
 */
export async function requireDevice(req: Request, _res: Response, next: NextFunction) {
  const key = req.header(DEVICE_KEY_HEADER);
  if (!key) {
    next(ApiError.unauthorized("Missing device key"));
    return;
  }

  try {
    const device = await Device.findOneAndUpdate(
      { keyHash: hashDeviceKey(key), active: true },
      { lastSeenAt: new Date() },
      { new: true },
    );
    if (!device) {
      next(ApiError.unauthorized("Invalid or disabled device key"));
      return;
    }

    (req as DeviceRequest).deviceId = String(device._id);
    next();
  } catch (error) {
    next(error);
  }
}
