import { Router } from "express";
import { loginHandler, meHandler } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { loginSchema } from "../schemas/auth.schema.js";

export const authRouter = Router();

authRouter.post("/login", validateBody(loginSchema), loginHandler);
authRouter.get("/me", requireAuth, meHandler);
