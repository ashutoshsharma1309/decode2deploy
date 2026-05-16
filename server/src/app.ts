import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import repoRoutes from "./routes/repo.routes";
import webhookRoutes from "./routes/webhook.routes";
import healthRoutes from "./routes/health.routes";
import graphRoutes from "./routes/graph.routes";
import { redis } from "./config/redis";
import { contextQueue } from "./jobs/queue";
import { getLLMPoolStats } from "./lib/llm-pool";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(
  "/webhooks",
  express.raw({ type: "application/json" }),
  (req, _res, next) => {
    (req as any).rawBody = req.body;
    if (Buffer.isBuffer(req.body)) {
      req.body = JSON.parse(req.body.toString("utf8"));
    }
    next();
  },
);

app.use(express.json());

app.get("/healthz", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    db: !!process.env.MONGODB_URI,
    redis: !!redis,
    queues: {
      context: !!contextQueue,
    },
    llmPool: getLLMPoolStats(),
  });
});

app.use("/auth", authRoutes);
app.use("/repos", repoRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/api", graphRoutes);
app.use("/health", healthRoutes);

export default app;
