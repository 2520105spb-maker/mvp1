# НеоЛифт — production database stabilization, relational data architecture & operational persistence layer

Документ фиксирует persistence foundation для industrial field-service ERP: PostgreSQL + Prisma + PostGIS + Redis/outbox/queues, рассчитанные на заказ-наряды, склад, аварии, offline sync, media-heavy evidence, realtime dispatch и compliance audit.

## 1. Full PostgreSQL architecture

База проектируется как модульный operational data platform, а не набор CRUD-таблиц.

| DB module         | Ownership boundary                                         | Write pattern                                    | Read pattern                                     |
| ----------------- | ---------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| Operations DB     | Work orders, assignments, SLA state, operational lifecycle | Command handlers + optimistic versions + outbox  | Mechanic mobile, dispatch grids, dashboards      |
| Inventory DB      | Stock balances, reservations, write-offs, stock ledger     | `SELECT FOR UPDATE`, idempotent ledger movements | Warehouse projections, low-stock dashboards      |
| Audit DB          | Immutable operational/security/compliance trail            | Append-only hash chain                           | Entity/time/action drill-down                    |
| Media Metadata DB | S3 metadata, upload sessions, OCR/AI validation            | Metadata transaction + external S3 IO            | Galleries, required evidence checks              |
| Notification DB   | Alerts, deliveries, escalations, read receipts             | Outbox fanout + delivery attempts                | Alert center, unread counters                    |
| Auth DB           | Users, devices, sessions, roles, permissions               | Device-bound token/session transactions          | Permission scopes cached in Redis                |
| Sync DB           | Offline operations, conflicts, checkpoints, snapshots      | Idempotent replay + base-version checks          | Delta sync streams                               |
| Reporting DB      | Documents, report files, scheduled exports                 | Async generation and immutable versions          | Reporting grids and signed downloads             |
| Geo DB            | PostGIS objects, GPS events, routes, ETA                   | Batched realtime writes                          | Map clustering, ETA and nearest mechanic queries |

Canonical architecture descriptors live in `lib/backend/persistence-architecture.ts`. SQL hardening snippets live in `prisma/database-hardening.sql`.

## 2. Prisma schema architecture

Prisma remains the normalized domain model layer, while raw SQL hardening handles PostgreSQL-native capabilities Prisma does not fully express:

- PostGIS GiST indexes for `geometry(Point,4326)` / `LineString` fields.
- GIN trigram indexes for operational search.
- BRIN indexes for append-heavy time-series tables.
- Append-only triggers for audit/ledger/event tables.
- Partition templates for high-volume append-only workloads.
- Partial indexes for active SLA/outbox worker scans.

Prisma model rules:

- Every tenant-owned operational table carries `tenantId`.
- Mutable operational aggregates use `updatedAt`, server/offline version fields or status fields.
- Deletable master/operational records use `deletedAt`; ledgers and audit tables do not.
- Foreign keys never cascade-delete compliance or operational history.
- Raw SQL migrations add advanced indexes/triggers after Prisma migrations create base tables.

## 3. Relational consistency architecture

Critical consistency rules:

1. Work orders cannot be created for deleted/inactive elevators or objects.
2. Closed/archived work orders are immutable from application services.
3. Stock movements are append-only; corrections are new `AUDIT_CORRECTION` movements.
4. Stock reservations/write-offs cannot drive available quantity below zero.
5. SLA timers are persisted and restart-safe; workers resume from due indexes.
6. Media binaries cannot be orphaned from metadata/upload sessions.
7. Offline operations are applied once by idempotency key and base version.
8. Audit logs are hash-chained and immutable.
9. Permission changes create security/audit records before cache invalidation.
10. Event outbox rows are committed atomically with domain mutations.

Enforcement is split between command handlers, FK constraints, unique constraints, check constraints, append-only triggers and worker reconciliation.

## 4. Indexing strategy

Production index classes:

- Work order search: btree status/technician/object indexes + GIN trigram over number/title/description.
- Elevator search: unique tenant/factory number + GIN trigram for factory/manufacturer/model.
- Full-text/fuzzy search: `pg_trgm` for addresses, materials, document identifiers.
- Geo queries: GiST indexes on object/elevator/technician/event points.
- SLA queries: partial indexes on active timers and breach-risk states.
- Dispatch queues: covering indexes by tenant/status/priority/createdAt.
- Realtime dashboards: projection-friendly indexes by tenant/status/time.
- Audit analytics: tenant/entity/time btree + BRIN time index for large partitions.
- Outbox publishing: partial index for `PENDING` and unlocked events.

SQL examples are provided in `prisma/database-hardening.sql`.

## 5. Partitioning strategy

Partition high-volume append-only tables, not small master data:

| Table                  | Strategy      | Hot window | Retention/archive                                |
| ---------------------- | ------------- | ---------- | ------------------------------------------------ |
| `AuditRecord`          | monthly range | 13 months  | compliance archive after policy window           |
| `LocationEvent`        | daily range   | 14 days    | aggregate then cold telemetry storage            |
| `Notification`         | monthly range | 3 months   | archive read/expired alerts                      |
| `SyncOperation`        | monthly range | 2 months   | keep conflicts longer than applied ops           |
| `DomainEvent` / outbox | monthly range | 6 months   | archive after replay checkpoint verification     |
| `MediaFile` metadata   | monthly range | 12 months  | keep thumbnails hot, original in S3 archive tier |

Partition creation is scheduled ahead of time. Large table conversion uses expand/copy/swap, not direct blocking conversion.

## 6. Event outbox architecture

Outbox pattern:

1. Command handler mutates aggregate in PostgreSQL transaction.
2. Same transaction appends `DomainEvent` and `OutboxMessage` rows.
3. Outbox dispatcher selects `PENDING` rows by `availableAt`, locks a batch, publishes to Redis/Kafka/RabbitMQ/BullMQ.
4. Consumers are idempotent by event id/dedupe key.
5. Failed rows retry with backoff and move to dead-letter state after bounded attempts.
6. Replays use `tenantId`, aggregate stream and event sequence/checkpoint.

Exactly-once external effects are not assumed; instead, the foundation provides exactly-once state change and at-least-once delivery with idempotent consumers.

## 7. Offline sync persistence architecture

Sync tables must support unstable devices and long offline sessions:

- `SyncOperation`: device operation log, aggregate id, base version, idempotency key, payload, status, conflict, applied timestamp.
- `OfflineSnapshot`: route/object/elevator/material packs for field devices.
- Device checkpoints: last acknowledged event sequence and delta cursor.
- Conflict records: server/client diff, resolution policy, actor, final command id.
- Retry diagnostics: attempt count, next retry, error class.

Replay priority: emergency, work orders, signatures, material write-offs, required photo metadata, media binary chunks, analytics.

## 8. Audit persistence architecture

Audit tables are immutable, partitioned, searchable and compliance-ready.

Audit scope:

- stock changes;
- SLA changes;
- dispatch assignments/reassignments;
- approvals/rejections;
- permission changes;
- emergency actions;
- media evidence changes;
- sync conflict decisions;
- security events.

Audit hardening:

- append-only triggers;
- tenant/hash uniqueness;
- previous-hash chaining;
- no application-level delete;
- partition-pruned search;
- backup retention longer than operational data.

## 9. Media metadata architecture

Media is metadata-first and S3-binary-light on the database:

- `MediaFile`: owner references, status, checksum, S3 key, metadata, processed timestamp.
- `UploadSession`: resumable/chunked upload state, device id, expiresAt, checksum manifest.
- Thumbnail metadata: dimensions, storage key, generatedAt.
- OCR metadata: recognized fields, confidence, text search payload.
- AI validation status: blur/dark/duplicate/wrong-object/required-shot outcome.
- Orphan cleanup: temporary upload sessions expire and queue S3 cleanup.

Required photo completion reads validated metadata, not raw image bytes.

## 10. Search architecture

Search layers:

- PostgreSQL btree for exact IDs, tenant scopes and operational filters.
- `pg_trgm` GIN for fuzzy address/material/elevator/work-order search.
- GIN JSONB expression indexes for selected metadata fields where justified.
- Read models for dashboard/dispatch/warehouse counters.
- Future dedicated search engine can be fed from outbox events without changing write paths.

## 11. Performance architecture

- Use cursor pagination for all operational grids.
- Keep hot dashboard counters in Redis projections.
- Batch GPS/location writes and use BRIN/GiST indexes.
- Direct media uploads to S3; store only metadata in PostgreSQL.
- Use `SELECT FOR UPDATE` only for stock balance rows and short transactions.
- Precompute dispatch/warehouse/dashboard read models from events.
- Avoid synchronous PDF/OCR/AI in API transactions.
- Use partition pruning for audit, sync, notification, event and geo histories.

## 12. Migration architecture

Zero-downtime migration policy:

1. Expand: add nullable column/table/index.
2. Deploy code that writes both old and new paths if needed.
3. Backfill in chunks with lock monitoring.
4. Validate counts/checksums/business invariants.
5. Contract: enforce `NOT NULL`, drop old writes later, remove old columns in a future release.

Rules:

- Large indexes use `CREATE INDEX CONCURRENTLY`.
- Enum changes are additive first.
- Partition creation is automated ahead of current month/day.
- Raw SQL hardening migrations are reviewed separately from Prisma-generated migrations.
- Rollback is forward-fix unless data loss is impossible and verified.

## 13. Backup & recovery architecture

- Continuous WAL archiving for point-in-time recovery.
- Daily full backups with restore drills.
- 15-minute restore point objective for operational data.
- S3 versioning/lifecycle for media binaries.
- Warm standby replica for critical operations.
- Outbox replay after restore to rebuild Redis projections and downstream systems.
- Restore validation checks work orders, stock ledger, audit hash chain, sync cursors and event outbox.

## 14. Observability architecture

Monitor:

- slow queries by module and route;
- lock wait time and deadlocks;
- connection pool saturation;
- replication lag;
- WAL generation rate;
- outbox pending/dead-letter counts;
- partition growth and missing future partitions;
- stock write-off transaction latency;
- sync conflict rates;
- media metadata/orphan cleanup lag;
- audit hash-chain verification failures.

## 15. Production ERP persistence layer architecture

The persistence layer is intentionally hybrid:

- Prisma for normalized relational access and migrations.
- PostgreSQL/PostGIS for strong consistency, relational integrity and geo queries.
- Raw SQL hardening for advanced indexes, triggers, partitioning and extensions.
- Redis for ephemeral projections, queues, locks and realtime presence.
- Outbox for reliable event propagation.
- S3 for binaries, while PostgreSQL stores evidence metadata and validation state.

This foundation supports thousands of work orders, high-concurrency mechanics, realtime dispatch, media-heavy workflows, offline replay, emergency SLA orchestration and future AI/BI analytics without turning the ERP database into a generic CRUD store.
