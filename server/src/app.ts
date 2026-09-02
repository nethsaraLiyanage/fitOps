import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/notFound.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { classesRouter } from "./routes/classes.routes.js";
import { equipmentRouter } from "./routes/equipment.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { inventoryRouter } from "./routes/inventory.routes.js";
import { membersRouter } from "./routes/members.routes.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/members", membersRouter);
  app.use("/api/classes", classesRouter);
  app.use("/api/equipment", equipmentRouter);
  app.use("/api/inventory", inventoryRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
