import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "neolift-queue-worker" },
});

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379/0", {
  maxRetriesPerRequest: null,
});

const queues = (
  process.env.WORKER_QUEUES ??
  "emergency,sla,notifications,dispatch,sync-operations,media-processing"
)
  .split(",")
  .map((queue) => queue.trim())
  .filter(Boolean);
const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 3);

const processors = {
  emergency: async (job) => ({ routed: true, incidentId: job.data.incidentId }),
  sla: async (job) => ({ evaluated: true, workOrderId: job.data.workOrderId }),
  notifications: async (job) => ({
    delivered: true,
    notificationId: job.data.notificationId,
  }),
  dispatch: async (job) => ({ assigned: true, workOrderId: job.data.workOrderId }),
  "sync-operations": async (job) => ({ replayed: true, deviceId: job.data.deviceId }),
  "media-processing": async (job) => ({ processed: true, mediaId: job.data.mediaId }),
};

const workers = queues.map((queueName) => {
  const queue = new Queue(queueName, { connection });
  const worker = new Worker(
    queueName,
    async (job) => {
      const handler = processors[queueName] ?? (async () => ({ skipped: true }));
      logger.info(
        { queueName, jobId: job.id, operationType: "queue.job_started" },
        "job started",
      );
      return handler(job);
    },
    { connection, concurrency },
  );

  worker.on("completed", (job, result) => {
    logger.info(
      { queueName, jobId: job.id, result, operationType: "queue.job_completed" },
      "job completed",
    );
  });
  worker.on("failed", (job, error) => {
    logger.error(
      { queueName, jobId: job?.id, err: error, operationType: "queue.job_failed" },
      "job failed",
    );
  });

  return { queue, worker };
});

logger.info(
  { queues, concurrency, operationType: "queue.worker_started" },
  "НеоЛифт worker started",
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    logger.info(
      { signal, operationType: "queue.worker_shutdown" },
      "worker shutting down",
    );
    await Promise.all(
      workers.flatMap(({ queue, worker }) => [queue.close(), worker.close()]),
    );
    await connection.quit();
    process.exit(0);
  });
}
