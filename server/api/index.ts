import type { IncomingMessage, ServerResponse } from "node:http";
import mongoose from "mongoose";

/**
 * Serverless entry point for Vercel.
 *
 * `src/server.ts` stays the entry for local dev and the Docker image: it owns
 * the process, connects once at boot, and listens on a port. Neither holds in a
 * serverless runtime, so this wrapper connects lazily and lets the platform own
 * the listener.
 */

type NodeHandler = (req: IncomingMessage, res: ServerResponse) => void;

const REQUIRED_ENV = ["MONGODB_URI", "JWT_SECRET"] as const;

function envProblems(): string[] {
  const problems = REQUIRED_ENV.filter((key) => !process.env[key]?.trim()).map((key) => `${key} is missing`);

  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim().length < 16) {
    problems.push("JWT_SECRET must be at least 16 characters");
  }

  return problems;
}

// Built once per warm container, not per request. Caching the *promise* means
// concurrent cold requests share a single connection attempt rather than each
// opening their own — which matters on an Atlas M0, where the connection cap is
// low.
let bootstrap: Promise<NodeHandler> | null = null;

function getApp(): Promise<NodeHandler> {
  if (!bootstrap) {
    bootstrap = (async () => {
      // Imported lazily and only after envProblems() has passed, because
      // src/config/env.ts validates at import time and calls process.exit(1) on
      // failure. In a serverless runtime that kills the invocation before any
      // response exists, surfacing as an opaque FUNCTION_INVOCATION_FAILED.
      const { createApp } = await import("../src/app.js");

      mongoose.set("strictQuery", true);
      await mongoose.connect(process.env.MONGODB_URI!, {
        // Without this, commands queue against a dead connection and fail as a
        // timeout rather than a clear error.
        bufferCommands: false,
        serverSelectionTimeoutMS: 10_000,
      });

      return createApp() as unknown as NodeHandler;
    })();

    // A failed attempt must not stay cached, or the container is permanently
    // broken until it is recycled.
    bootstrap.catch(() => {
      bootstrap = null;
    });
  }

  return bootstrap;
}

function fail(res: ServerResponse, status: number, code: string, message: string, details?: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ error: { code, message, ...(details ? { details } : {}) } }));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const problems = envProblems();
  if (problems.length > 0) {
    // Names the missing variables so a misconfigured deploy is diagnosable from
    // the response alone, without digging through function logs.
    return fail(res, 500, "CONFIG_INVALID", "Server environment is not configured", problems);
  }

  let app: NodeHandler;
  try {
    app = await getApp();
  } catch (err) {
    return fail(res, 503, "DB_UNAVAILABLE", err instanceof Error ? err.message : "Database connection failed");
  }

  return app(req, res);
}
