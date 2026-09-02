import { Router } from "express";
import {
  completeSessionHandler,
  createClassHandler,
  listClassesHandler,
  listSessionsHandler,
} from "../controllers/classes.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createClassSchema } from "../schemas/class.schema.js";

export const classesRouter = Router();

classesRouter.use(requireAuth);

classesRouter.get("/", listClassesHandler);
classesRouter.post("/", validateBody(createClassSchema), createClassHandler);
classesRouter.get("/sessions", listSessionsHandler);
classesRouter.patch("/sessions/:id/complete", completeSessionHandler);
