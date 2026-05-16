import { Request, Response } from "express";
import crypto from "crypto";
import { Repo } from "../models/Repo";
import { contextQueue } from "../jobs/queue";

function verifySignature(
  payload: Buffer,
  signature: string | undefined,
): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  } catch {
    return false;
  }
}

export async function handleGitHubWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  const signature = req.headers["x-hub-signature-256"] as string | undefined;
  const event = req.headers["x-github-event"] as string | undefined;
  const deliveryId = req.headers["x-github-delivery"] as string | undefined;

  const rawBody = (req as any).rawBody as Buffer | undefined;
  if (!rawBody || !verifySignature(rawBody, signature)) {
    console.warn(`[Webhook] Invalid signature for delivery ${deliveryId}`);
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  res.status(200).json({ received: true });

  const body = JSON.parse(rawBody.toString("utf8"));

  console.log(
    `[Webhook] Received event: ${event} (delivery: ${deliveryId}) from ${body.repository?.full_name || "unknown"}`,
  );

  try {
    switch (event) {
      case "push":
        await handlePush(body);
        break;
      case "ping":
        console.log(
          `[Webhook] Ping received for ${body.repository?.full_name}`,
        );
        break;
      default:
        console.log(`[Webhook] Ignoring event: ${event}`);
    }
  } catch (err) {
    console.error(`[Webhook] Error processing ${event}:`, err);
  }
}

async function handlePush(body: any): Promise<void> {
  const repoFullName = body.repository?.full_name;
  const ref = body.ref;
  const defaultBranch = body.repository?.default_branch;

  console.log(`[Webhook] Push event received for ${repoFullName}`);

  if (ref !== `refs/heads/${defaultBranch}`) {
    console.log(`[Webhook] Skipping - not default branch`);
    return;
  }

  const repo = await Repo.findOne({ fullName: repoFullName, isActive: true });
  if (!repo) {
    console.log(`[Webhook] Skipping - repo not found or inactive`);
    return;
  }

  if (!contextQueue) {
    console.warn("[Webhook] Context queue not available — skipping job");
    return;
  }

  const changedFiles = new Set<string>();
  for (const commit of body.commits || []) {
    for (const f of commit.added || []) changedFiles.add(f);
    for (const f of commit.modified || []) changedFiles.add(f);
  }

  try {
    const job = await contextQueue.add(
      "context-index",
      {
        repoId: repo._id.toString(),
        repoFullName,
        branch: defaultBranch,
        headSha: body.after,
        pusher: body.pusher?.name,
        commits: (body.commits || []).length,
        changedFiles: Array.from(changedFiles),
      },
      {
        jobId: `context-${repo._id.toString()}-${body.after}`,
        removeOnComplete: { age: 3600, count: 100 },
        removeOnFail: { age: 86400, count: 200 },
      },
    );
    console.log(`[Webhook] Job enqueued successfully with ID: ${job.id}`);
  } catch (err) {
    console.error(`[Webhook] Failed to enqueue job:`, err);
  }
}
