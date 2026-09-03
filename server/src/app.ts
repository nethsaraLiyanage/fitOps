import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/notFound.middleware.js";
import { activityRouter } from "./routes/activity.routes.js";
import { attendanceRouter } from "./routes/attendance.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { classesRouter } from "./routes/classes.routes.js";
import { equipmentRouter } from "./routes/equipment.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { inventoryRouter } from "./routes/inventory.routes.js";
import { membersRouter } from "./routes/members.routes.js";
import { reportsRouter } from "./routes/reports.routes.js";
import { settingsRouter } from "./routes/settings.routes.js";

/**
 * Brute-force guard on login, the only unauthenticated endpoint. Built per app so
 * each instance (and so each test file) starts with a clean counter.
 */
function loginRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.LOGIN_RATE_LIMIT,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: { message: "Too many login attempts. Please try again in a few minutes.", code: "RATE_LIMITED" },
      });
    },
  });
}

export function createApp() {
  const app = express();

  // Only behind a real proxy: trusting X-Forwarded-For otherwise lets a client spoof its IP.
  if (env.NODE_ENV === "production") app.set("trust proxy", 1);

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: "100kb" }));

  // Tests assert on responses, not logs — logging every supertest request is just noise.
  if (env.NODE_ENV !== "test") {
    app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  }

  app.use("/api/health", healthRouter);
  app.use("/api/auth/login", loginRateLimiter());
  app.use("/api/auth", authRouter);
  app.use("/api/members", membersRouter);
  app.use("/api/classes", classesRouter);
  app.use("/api/equipment", equipmentRouter);
  app.use("/api/inventory", inventoryRouter);
  app.use("/api/attendance", attendanceRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/activity", activityRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
