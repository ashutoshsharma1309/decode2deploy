import dotenv from "dotenv";
dotenv.config();

import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.2,
  });
  console.log("[Sentry] Initialized");
}

import http from "http";
import app from "./app";
import { connectDB } from "./config/db";
import { initSocket } from "./config/socket";
import { startContextWorker } from "./jobs/context.job";
import { RepoContext } from "./models/RepoContext";

// Import models to ensure indexes are created
import "./models/FilePushHistory";
import "./models/RepoHealthSnapshot";

const server = http.createServer(app);

initSocket(server);

Sentry.setupExpressErrorHandler(app);

const PORT = process.env.PORT || 3000;

async function cleanupOrphanedStatuses() {
  try {
    const ctxResult = await RepoContext.updateMany(
      { indexStatus: "indexing" },
      { $set: { indexStatus: "failed" } },
    );
    if (ctxResult.modifiedCount > 0) {
      console.log(
        `[PULSE] Startup cleanup: reset ${ctxResult.modifiedCount} stuck repos (indexing → failed)`,
      );
    }
  } catch (err: any) {
    console.error("[PULSE] Startup cleanup error:", err.message);
  }
}

async function start() {
  await connectDB();
  await cleanupOrphanedStatuses();

  const contextWorker = startContextWorker();
  if (contextWorker) {
    console.log("[PULSE] Context worker initialized");
  } else {
    console.warn("[PULSE] Context worker NOT initialized - check REDIS_URL");
  }

  server.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[PULSE] Server running on 0.0.0.0:${PORT}`);
  });

  let shuttingDown = false;

  async function gracefulShutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`[PULSE] ${signal} received — starting graceful shutdown...`);

    server.close(() => {
      console.log("[PULSE] HTTP server closed");
    });

    const closePromises: Promise<void>[] = [];

    if (contextWorker) {
      console.log("[PULSE] Closing context worker...");
      closePromises.push(
        contextWorker
          .close()
          .then(() => console.log("[PULSE] Context worker closed")),
      );
    }

    const hardKillTimer = setTimeout(() => {
      console.error("[PULSE] Graceful shutdown timed out — forcing exit");
      process.exit(1);
    }, 30000);

    try {
      await Promise.all(closePromises);
      console.log("[PULSE] All workers closed — exiting cleanly");
    } catch (err: any) {
      console.error("[PULSE] Error during worker shutdown:", err.message);
    }

    clearTimeout(hardKillTimer);
    process.exit(0);
  }

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

start();

export { app, server };
