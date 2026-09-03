import { createApp } from "./app.js";
import { connectDb, disconnectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { GYM_TIMEZONE } from "./utils/time.js";

async function main() {
  await connectDb();
  console.log("Connected to MongoDB");

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`FitOps API listening on http://localhost:${env.PORT}`);
    // Attendance "today" and every date-bucketed report derive from this — if it is
    // not the gym's own zone (a container without TZ set), those views shift by a day.
    console.log(`Gym timezone: ${GYM_TIMEZONE}`);
  });

  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`${signal} received, shutting down...`);

    // Stop accepting connections and let in-flight requests finish before closing the DB.
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectDb();

    console.log("Shutdown complete.");
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
