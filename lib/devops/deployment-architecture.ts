export type EnvironmentName =
  | "local"
  | "development"
  | "staging"
  | "production";

export type RuntimeTier =
  | "edge"
  | "web"
  | "api"
  | "websocket"
  | "worker"
  | "database"
  | "cache"
  | "storage"
  | "observability"
  | "backup";

export type Criticality = "standard" | "high" | "critical";

export type RuntimeService = {
  name: string;
  tier: RuntimeTier;
  criticality: Criticality;
  responsibility: string;
  scaling: string;
  healthCheck: string;
  gracefulShutdown: string;
  dependencies: string[];
};

export const DEPLOYMENT_ENVIRONMENTS: Record<
  EnvironmentName,
  {
    purpose: string;
    topology: string;
    dataPolicy: string;
    deploymentPolicy: string;
  }
> = {
  local: {
    purpose: "Developer workstation and offline workflow smoke tests.",
    topology:
      "Docker Compose with PostGIS, Redis, MinIO, app runtime and selected workers.",
    dataPolicy: "Synthetic seed data only; no production media or credentials.",
    deploymentPolicy:
      "Manual compose up/down, disposable volumes except explicit debug snapshots.",
  },
  development: {
    purpose:
      "Shared integration environment for feature branches and API contract validation.",
    topology:
      "Single Kubernetes namespace with scaled-down app, worker and observability components.",
    dataPolicy:
      "Masked fixtures and generated media; backups retained for short diagnostics window.",
    deploymentPolicy:
      "Automatic deploy from protected development branch after typecheck/build/tests.",
  },
  staging: {
    purpose:
      "Production-like rehearsal for migrations, queue load, emergency workflows and mobile/PWA releases.",
    topology:
      "Production-shaped Kubernetes topology with smaller node pools and managed PostgreSQL clone.",
    dataPolicy:
      "Masked production snapshots, encrypted storage, restore drills and migration rehearsals.",
    deploymentPolicy:
      "Blue/green or rolling deployment with manual approval and automated rollback gates.",
  },
  production: {
    purpose:
      "24/7 industrial field-service ERP runtime for mechanics, dispatch, warehouse and management.",
    topology:
      "Highly available web/API, dedicated WebSocket gateway, worker pools, managed PostgreSQL, Redis and S3-compatible storage.",
    dataPolicy:
      "Encrypted operational data, PITR backups, immutable audit logs and S3 lifecycle retention.",
    deploymentPolicy:
      "Progressive rollout with health gates, zero-downtime migrations and audited rollback procedure.",
  },
};

export const RUNTIME_SERVICES: RuntimeService[] = [
  {
    name: "next-web-runtime",
    tier: "web",
    criticality: "critical",
    responsibility:
      "Serves Next.js App Router, React Query-compatible API routes, PWA shell and static assets.",
    scaling:
      "Horizontal pod autoscaling on CPU, request latency and active connections.",
    healthCheck:
      "HTTP GET / with readiness gate after config, DB and Redis reachability checks.",
    gracefulShutdown:
      "Stop accepting connections, drain in-flight requests, close DB/Redis clients within termination grace period.",
    dependencies: ["postgresql", "redis", "s3-compatible-storage"],
  },
  {
    name: "websocket-gateway",
    tier: "websocket",
    criticality: "critical",
    responsibility:
      "Maintains realtime channels for dispatch, emergency, SLA, notifications, sync and presence.",
    scaling:
      "Horizontal replicas with Redis pub/sub or streams for fanout and sticky session support at ingress.",
    healthCheck:
      "HTTP readiness plus synthetic subscribe/publish diagnostic channel.",
    gracefulShutdown:
      "Send draining event, reject new sockets, persist last cursor and close connections after reconnect hint.",
    dependencies: ["redis", "event-outbox"],
  },
  {
    name: "critical-worker-pool",
    tier: "worker",
    criticality: "critical",
    responsibility:
      "Processes emergency, SLA, notification and dispatch jobs with highest priority.",
    scaling:
      "Scale by queue lag, oldest job age and emergency incident backlog.",
    healthCheck:
      "Worker heartbeat, Redis queue connectivity and dead-letter threshold checks.",
    gracefulShutdown:
      "Pause queue consumption, finish active jobs or requeue before pod termination.",
    dependencies: ["redis", "postgresql", "push-provider"],
  },
  {
    name: "media-ai-worker-pool",
    tier: "worker",
    criticality: "high",
    responsibility:
      "Runs media processing, thumbnail generation, OCR and AI validation for photo evidence.",
    scaling:
      "Scale by media-processing and OCR queue depth; GPU/CPU node pools can be separated later.",
    healthCheck:
      "Queue heartbeat, S3 read/write probe and OCR/AI adapter status.",
    gracefulShutdown:
      "Checkpoint chunk processing and leave idempotent job state for retry.",
    dependencies: ["redis", "s3-compatible-storage", "postgresql"],
  },
  {
    name: "sync-worker-pool",
    tier: "worker",
    criticality: "high",
    responsibility:
      "Applies offline operation replay, conflict detection, delta snapshot creation and retry recovery.",
    scaling:
      "Scale by sync queue lag, device reconnect bursts and operation replay latency.",
    healthCheck: "Replay canary operation and conflict-store write probe.",
    gracefulShutdown:
      "Complete current idempotent operation and checkpoint replay cursor.",
    dependencies: ["redis", "postgresql"],
  },
  {
    name: "managed-postgresql-postgis",
    tier: "database",
    criticality: "critical",
    responsibility:
      "Stores operational relational data, audit ledgers, sync logs, PostGIS data and outbox events.",
    scaling:
      "Vertical scale primary, read replicas for projections, partitioning for append-heavy tables.",
    healthCheck:
      "Connection, replication lag, lock wait and migration version probes.",
    gracefulShutdown:
      "Managed service failover; application uses connection pool draining and retry policy.",
    dependencies: ["backup-service"],
  },
  {
    name: "redis-runtime",
    tier: "cache",
    criticality: "critical",
    responsibility:
      "Queues, realtime fanout, SLA timers, cache projections, idempotency hints and presence.",
    scaling:
      "Managed Redis HA with persistence enabled for queues and separate logical DBs/key prefixes.",
    healthCheck:
      "PING, memory fragmentation, stream lag and eviction policy diagnostics.",
    gracefulShutdown:
      "Failover via managed Redis; workers pause on queue connectivity loss.",
    dependencies: [],
  },
  {
    name: "s3-media-storage",
    tier: "storage",
    criticality: "critical",
    responsibility:
      "Stores photos, PDFs, OCR snapshots, thumbnails and immutable report packages.",
    scaling:
      "Object storage with lifecycle policies, versioning and CDN-ready read path.",
    healthCheck:
      "Signed PUT/GET canary object and lifecycle/orphan cleanup diagnostics.",
    gracefulShutdown:
      "External managed storage; upload sessions are resumable and idempotent.",
    dependencies: ["cdn"],
  },
  {
    name: "observability-stack",
    tier: "observability",
    criticality: "high",
    responsibility:
      "Metrics, logs, traces, queue diagnostics, SLA monitoring and incident dashboards.",
    scaling:
      "Dedicated retention tiers for hot metrics/logs and archived compliance diagnostics.",
    healthCheck:
      "Metrics scrape freshness, log ingestion lag and trace sampling checks.",
    gracefulShutdown:
      "Buffered log flush and alert handoff before maintenance.",
    dependencies: ["all-runtime-services"],
  },
];

export type QueuePool = {
  name: string;
  queues: string[];
  priority: Criticality;
  autoscalingSignal: string;
  failurePolicy: string;
};

export const QUEUE_POOLS: QueuePool[] = [
  {
    name: "critical-operations",
    queues: ["emergency", "sla", "notifications", "dispatch"],
    priority: "critical",
    autoscalingSignal:
      "oldest job age, emergency backlog and SLA breach prediction lag",
    failurePolicy:
      "dedicated DLQ, pager escalation and no dependency on media/OCR queues",
  },
  {
    name: "field-sync",
    queues: ["sync-operations", "delta-snapshots", "conflict-resolution"],
    priority: "high",
    autoscalingSignal: "device reconnect burst size and replay latency p95",
    failurePolicy: "idempotent replay, conflict records and cursor-based retry",
  },
  {
    name: "media-processing",
    queues: ["media-processing", "ocr", "ai-validation"],
    priority: "high",
    autoscalingSignal: "pending media count, OCR duration and S3 retry rate",
    failurePolicy:
      "chunk-aware retry, quarantine bad files and manual retake workflow",
  },
  {
    name: "reporting-exports",
    queues: ["pdf-generation", "report-generation", "exports"],
    priority: "standard",
    autoscalingSignal: "monthly report backlog and PDF generation p95",
    failurePolicy:
      "resume from generation cursor and keep immutable failed version metadata",
  },
];

export const OBSERVABILITY_SIGNALS = [
  "http_request_duration_seconds by route and tenant",
  "websocket_active_connections by channel and region",
  "queue_oldest_job_age_seconds by queue",
  "sync_replay_latency_seconds and sync_conflict_total",
  "sla_breach_predicted_total and sla_timer_lag_seconds",
  "media_upload_failure_total and media_processing_duration_seconds",
  "postgres_lock_wait_seconds and replication_lag_seconds",
  "redis_stream_lag and queue_dead_letter_total",
  "s3_signed_upload_error_total and orphan_media_total",
  "deployment_error_budget_burn and rollback_count",
] as const;

export const DEPLOYMENT_GATES = [
  "typecheck, lint, unit, integration and workflow tests must pass before image publish",
  "container image is scanned and signed before promotion",
  "Prisma migration is generated, reviewed and rehearsed in staging",
  "zero-downtime migration plan follows expand/backfill/contract",
  "blue/green or canary health gates verify HTTP, WebSocket, queue and sync canaries",
  "rollback keeps previous image, previous config and migration forward-fix runbook",
] as const;

export const DISASTER_RECOVERY_OBJECTIVES = {
  rpo: "15 minutes for PostgreSQL WAL/PITR; zero data-loss target for committed outbox/audit records.",
  rto: "60 minutes for production core workflows; emergency dispatch read-only fallback within 15 minutes.",
  backup:
    "Daily full backup, continuous WAL, S3 versioning, Redis queue recovery from outbox.",
  restoreDrill:
    "Quarterly restore exercise validates login, work order completion, stock ledger, sync replay, media evidence and PDF retrieval.",
} as const;
