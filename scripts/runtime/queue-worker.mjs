#!/usr/bin/env node
import { Worker } from "bullmq";
import IORedis from "ioredis";

const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, value = ""] = arg.slice(2).split("=");
      return [key, value];
    }),
);

const queues = (args.get("queues") ?? process.env.WORKER_QUEUES ?? "")
  .split(",")
  .map((queue) => queue.trim())
  .filter(Boolean);

if (queues.length === 0) {
  throw new Error("Queue worker requires --queues or WORKER_QUEUES");
}

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("Queue worker requires REDIS_URL");
}

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  connectionName: `neolift-worker:${queues.join("+")}`,
});

const knownQueues = new Set([
  "emergency",
  "sla",
  "notifications",
  "dispatch",
  "sync-operations",
  "delta-snapshots",
  "conflict-resolution",
  "media-processing",
  "ocr",
  "ai-validation",
  "pdf-generation",
  "report-generation",
  "exports",
]);

const unknownQueues = queues.filter((queue) => !knownQueues.has(queue));
if (unknownQueues.length > 0) {
  throw new Error(`Unknown operational queues: ${unknownQueues.join(", ")}`);
}

const processOperationalJob = async (job) => {
  const startedAt = Date.now();
  const payload = job.data ?? {};

  if (!payload.idempotencyKey && !payload.dedupeKey) {
    throw new Error(
      `Job ${job.name} in ${job.queueName} is missing idempotency metadata`,
    );
  }

  // This runtime deliberately does not contain business logic. Domain work is
  // executed by application services/API adapters; workers provide durable queue
  // consumption, idempotency enforcement hooks and operational telemetry.
  return {
    queue: job.queueName,
    jobName: job.name,
    jobId: job.id,
    idempotencyKey: payload.idempotencyKey ?? payload.dedupeKey,
    processedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
  };
};

const workers = queues.map(
  (queueName) =>
    new Worker(queueName, processOperationalJob, {
      connection,
      concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
      removeOnComplete: { age: 86_400, count: 10_000 },
      removeOnFail: { age: 604_800, count: 50_000 },
    }),
);

for (const worker of workers) {
  worker.on("completed", (job) => {
    console.info(
      JSON.stringify({
        level: "info",
        event: "queue_job_completed",
        queue: job.queueName,
        jobName: job.name,
        jobId: job.id,
      }),
    );
  });

  worker.on("failed", (job, error) => {
    console.error(
      JSON.stringify({
        level: "error",
        event: "queue_job_failed",
        queue: job?.queueName,
        jobName: job?.name,
        jobId: job?.id,
        error: error.message,
      }),
    );
  });
}

console.info(
  JSON.stringify({
    level: "info",
    event: "neolift_worker_started",
    queues,
    concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
  }),
);

const shutdown = async (signal) => {
  console.info(
    JSON.stringify({ level: "info", event: "neolift_worker_shutdown", signal }),
  );
  await Promise.all(workers.map((worker) => worker.close()));
  await connection.quit();
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
