import { Queue, type ConnectionOptions } from "bullmq";

const redisUrl = process.env.REDIS_URL;

export function getRedisConnection(): ConnectionOptions | null {
  if (!redisUrl) return null;
  return {
    url: redisUrl,
    maxRetriesPerRequest: null,
  };
}

const connection = getRedisConnection();

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 2000 },
  removeOnComplete: 100,
  removeOnFail: 200,
};

function createQueue(name: string): Queue | null {
  if (!connection) return null;

  const queue = new Queue(name, {
    connection,
    defaultJobOptions,
  });

  queue.on("error", (err) => {
    console.error(`[Queue:${name}] Redis error:`, err.message);
  });

  return queue;
}

export const contextQueue: Queue | null = createQueue("context");

export function getQueueOrThrow(name: "context"): Queue {
  const queue = contextQueue;
  if (!queue) {
    const err = new Error(
      `${name} queue not available (Redis not connected)`,
    ) as any;
    err.statusCode = 503;
    throw err;
  }
  return queue;
}
