# НеоЛифт — production deployment, DevOps, cloud infrastructure & operational runtime architecture

Это production runtime architecture для industrial field-service ERP, а не Docker/Vercel tutorial. Цель — стабильный runtime для realtime dispatch, offline sync, media-heavy workflows, аварийных SLA, очередей, WebSockets, auditability и disaster recovery.

## 1. Production infrastructure architecture

Production topology:

- Next.js web/API runtime behind managed ingress/load balancer.
- Dedicated WebSocket gateway layer for dispatch, emergency, SLA, notifications, sync and presence channels.
- Worker pools split by criticality: emergency/SLA/dispatch, sync replay, media/OCR/AI, reporting/export.
- Managed PostgreSQL + PostGIS with PITR, read replicas and migration runtime.
- Redis HA for queues, realtime fanout, SLA timers, cache projections and presence.
- S3-compatible object storage for photos, PDFs, thumbnails, OCR snapshots and immutable reports.
- Observability stack for logs, metrics, tracing, queue diagnostics and incident dashboards.
- Backup services for PostgreSQL WAL, S3 versioning and restore validation.

Infrastructure descriptors are codified in `lib/devops/deployment-architecture.ts`.

## 2. Container architecture

Container rules:

- One immutable image for web/API runtime built by `Dockerfile` using Next.js standalone output.
- Environment-specific config injected through Kubernetes ConfigMaps/Secrets or compose env.
- No credentials baked into images.
- Health checks required for web, PostgreSQL, Redis and storage.
- Graceful shutdown drains HTTP/WebSocket connections and pauses worker consumption.
- Workers scale independently from web runtime.
- Media/OCR/AI workers can move to dedicated CPU/GPU node pools without changing API contracts.

Local/prod-like orchestration is defined in `docker-compose.yml`; Kubernetes-ready baseline is in `infra/kubernetes/neolift-runtime.yaml`.

## 3. Deployment topology

Runtime layers:

| Layer              | Production responsibility                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| Edge/Ingress       | TLS termination, WAF/rate limits, sticky WebSocket routing, request size limits for upload intent APIs |
| Web/API            | Next.js App Router, API routes, auth/session checks, React Query-compatible responses                  |
| WebSocket          | Presence, realtime operational streams, cursor catch-up after reconnect                                |
| Workers            | Queue jobs for emergency, SLA, dispatch, sync, media, OCR, AI, PDF, exports                            |
| PostgreSQL/PostGIS | Relational operational source of truth, outbox, audit, sync, geo                                       |
| Redis              | BullMQ/queues, realtime fanout, cache projections, timers                                              |
| S3 storage         | Direct signed upload/download path for media and reports                                               |
| Observability      | Metrics, structured logs, distributed traces, alert rules                                              |

## 4. File storage architecture

S3-compatible storage buckets:

- `neolift-media-{env}`: photos, thumbnails, OCR snapshots, validation artifacts.
- `neolift-reports-{env}`: generated PDFs, ZIP export packages, service acts.
- `neolift-temp-{env}`: temporary upload chunks and quarantine area.

Storage rules:

- Uploads use signed URLs and never stream large photos through the app runtime.
- Metadata is stored in PostgreSQL; binaries are stored in S3.
- Lifecycle policies move originals to archival tier while keeping thumbnails hot.
- Versioning is enabled for compliance documents and reports.
- Orphan cleanup scans expired upload sessions and deletes temporary objects.
- CDN-ready path may serve read-only thumbnails/reports through signed cookies or signed URLs.

## 5. PostgreSQL infrastructure

Production PostgreSQL requirements:

- Managed PostgreSQL 16+ with PostGIS.
- PITR with continuous WAL archiving.
- Read replica for heavy dashboards/reporting if needed.
- Connection pooling for web/API and separate worker pools.
- Migration runner isolated from web pods.
- Slow query, lock wait, deadlock and replication lag alerts.
- Partition maintenance for audit, sync, notification, event and geo tables.
- Database hardening SQL in `prisma/database-hardening.sql` for extensions, indexes, triggers and partition templates.

## 6. Redis infrastructure

Redis responsibilities:

- Queue persistence and worker coordination.
- WebSocket pub/sub or streams for multi-replica fanout.
- SLA timer coordination and escalation scans.
- Realtime presence and online mechanic state.
- Permission/dashboard projection cache.

Production Redis must run HA with persistence suitable for queue recovery. Critical queues must be recoverable from PostgreSQL outbox if Redis loses transient state.

## 7. WebSocket infrastructure

Realtime channels:

- `tenant:{tenantId}:operations`
- `region:{regionId}:dispatch`
- `technician:{technicianId}:work-orders`
- `warehouse:{warehouseId}:stock`
- `user:{userId}:notifications`
- `device:{deviceId}:sync`
- `incident:{incidentId}:emergency`

Scaling strategy:

- Sticky ingress for long-lived sockets where required.
- Redis fanout between gateway replicas.
- Cursor-based reconnect: client sends last event cursor and receives missed committed events.
- Emergency/dispatch channels get higher priority and shorter heartbeat thresholds.
- Backpressure drops non-critical analytics updates before operational/emergency messages.

## 8. Queue worker infrastructure

Worker pools:

- Critical operations: emergency, SLA, notifications, dispatch.
- Field sync: offline operation replay, delta snapshots, conflict resolution.
- Media processing: compression, thumbnails, OCR, AI validation.
- Reporting/export: PDF generation, scheduled reports, ZIP packages, CRM export.

Queue rules:

- Idempotent jobs with dedupe keys.
- DLQ per queue family.
- Autoscaling by oldest job age, backlog and p95 duration.
- Graceful shutdown pauses queues and finishes/requeues active jobs.
- Critical queues are isolated from slow OCR/report generation.

## 9. CI/CD architecture

Pipeline stages:

1. Install dependencies from locked artifact/registry mirror.
2. Typecheck.
3. Lint.
4. Unit tests for domain/application services.
5. Integration tests with PostgreSQL/Redis/S3 test services.
6. Workflow tests for work-order completion, stock write-off, sync replay and media upload intent.
7. Build standalone Next.js image.
8. Scan and sign image.
9. Generate/review Prisma migration.
10. Deploy to staging and run smoke tests.
11. Promote to production with blue/green or canary health gates.
12. Keep previous image/config for rollback.

Deployment gates are exported from `DEPLOYMENT_GATES` in `lib/devops/deployment-architecture.ts`.

## 10. Observability stack

Required signals:

- structured JSON logs with tenant/user/device/command/correlation IDs;
- HTTP latency and error rates;
- WebSocket active connections, reconnects and dropped messages;
- queue backlog, oldest job age, DLQ totals;
- SLA timer lag, predicted breaches and actual breaches;
- sync replay latency and conflict rate;
- media upload failures and processing duration;
- PostgreSQL locks, slow queries, replication lag;
- Redis memory, stream lag, queue persistence;
- S3 signed upload errors and orphan cleanup lag.

Prometheus alert examples are in `infra/monitoring/prometheus-rules.yml`.

## 11. Monitoring dashboards

Dashboards:

- Operational health: web/API latency, error rates, current deployment version.
- Worker health: queue depth, oldest job age, worker restarts, DLQ.
- SLA analytics: timer lag, risk count, breach count, escalation latency.
- WebSocket health: active sockets, reconnects, cursor catch-up latency.
- DB metrics: locks, slow queries, replication lag, connection pool saturation.
- Sync monitoring: reconnect bursts, replay success, conflicts, failed operations.
- Media operations: upload failures, OCR/AI queue lag, thumbnail generation p95.

## 12. Disaster recovery architecture

Objectives:

- RPO: 15 minutes for PostgreSQL WAL/PITR; zero-loss target for committed audit/outbox rows.
- RTO: 60 minutes for core production; emergency dispatch read-only fallback within 15 minutes.
- PostgreSQL: daily full backups, continuous WAL and quarterly restore drill.
- S3: versioning, lifecycle retention, cross-zone replication where available.
- Redis: queue recovery through outbox replay and worker idempotency.
- Deployment: previous image/config retained; rollback runbook tied to release.

Restore validation must check login, work-order completion, stock ledger, audit hash chain, sync replay, media evidence and PDF retrieval.

## 13. Security architecture

- Secrets stored in Kubernetes Secrets or a managed secret manager, never in images.
- Environment isolation between local/dev/staging/prod.
- Internal APIs protected by service identity and network policy.
- Signed upload/download URLs with TTL and content-type/size restrictions.
- Audit-safe infrastructure: admin actions, deployments and emergency overrides are logged.
- Image scanning and signature verification before production rollout.
- TLS everywhere outside local compose.
- Least-privilege DB users for app, workers, migrations and read replicas.

## 14. Scaling architecture

Scaling levers:

- Web/API horizontal replicas for request load.
- WebSocket replicas with Redis fanout and sticky ingress.
- Worker pools independently scaled by queue family.
- Media/OCR/AI workers separated from critical emergency/SLA workers.
- Redis HA and memory/stream monitoring.
- PostgreSQL read replicas and partition pruning for heavy reads.
- CDN-ready static assets and media thumbnails.
- Cache projections for dashboard counters and dispatch queues.

## 15. Production operational cloud platform architecture

The production platform is designed to keep field operations alive during bad LTE, reconnect storms, emergency incidents, queue spikes, large photo uploads and partial service failures:

- PWA service workers cache the shell and preserve offline work.
- Sync workers replay device operations after reconnect.
- Outbox preserves committed events even if Redis or workers fail.
- Critical queue pools prioritize emergency/SLA/dispatch above media/report workloads.
- Signed S3 uploads keep large photos away from web/API bottlenecks.
- Observability and DR procedures are first-class runtime components, not afterthoughts.

This foundation is Kubernetes-ready, Docker-runnable for local/prod-like validation, and prepared for future AI processing clusters, predictive analytics, OCR scaling, realtime analytics and multi-region expansion.
