import { Router } from "express";
import {
  createMemberHandler,
  listMembersHandler,
  planFeesHandler,
  updateBiometricIdHandler,
  updatePaymentHandler,
} from "../controllers/members.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createMemberSchema, updateBiometricIdSchema, updatePaymentSchema } from "../schemas/member.schema.js";

export const membersRouter = Router();

membersRouter.use(requireAuth);

membersRouter.get("/plan-fees", planFeesHandler);
membersRouter.get("/", listMembersHandler);
membersRouter.post("/", validateBody(createMemberSchema), createMemberHandler);
membersRouter.patch("/:id/payments/:period", validateBody(updatePaymentSchema), updatePaymentHandler);
membersRouter.patch("/:id/biometric", validateBody(updateBiometricIdSchema), updateBiometricIdHandler);
