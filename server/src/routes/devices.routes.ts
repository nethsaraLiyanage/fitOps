import { Router } from "express";
import {
  createDeviceHandler,
  heartbeatHandler,
  listDevicesHandler,
  recordPunchesHandler,
  rosterHandler,
  rotateKeyHandler,
  unmatchedPunchesHandler,
  updateDeviceHandler,
} from "../controllers/devices.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { requireDevice } from "../middleware/deviceAuth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createDeviceSchema, punchBatchSchema, updateDeviceSchema } from "../schemas/device.schema.js";

/** Registering devices and issuing their keys — staff, administrators only. Mounted at /api/devices. */
export const devicesRouter = Router();

devicesRouter.use(requireAuth, requireRole("Administrator"));

devicesRouter.get("/", listDevicesHandler);
devicesRouter.get("/unmatched-punches", unmatchedPunchesHandler);
devicesRouter.post("/", validateBody(createDeviceSchema), createDeviceHandler);
devicesRouter.patch("/:id", validateBody(updateDeviceSchema), updateDeviceHandler);
devicesRouter.post("/:id/rotate-key", rotateKeyHandler);

/** What a fingerprint device (or its bridge agent) calls, authenticated by its API key. Mounted at /api/biometric. */
export const biometricRouter = Router();

biometricRouter.use(requireDevice);

biometricRouter.post("/punches", validateBody(punchBatchSchema), recordPunchesHandler);
biometricRouter.post("/heartbeat", heartbeatHandler);
biometricRouter.get("/roster", rosterHandler);
