# НеоЛифт — production API layer, application services & operational backend implementation

Этот документ описывает backend execution layer для industrial field-service ERP: не CRUD API, а слой команд, транзакций, доменных инвариантов, outbox events, очередей и realtime updates.

## 1. API architecture

API versioning: `/api/v1`. Каждый endpoint принимает typed command/query envelope, `idempotencyKey`, `commandId`, `tenantId`, `actorUserId`, `deviceId`, `baseVersion` для offline conflict detection.

Ключевые REST endpoints:

| Surface     | Endpoint                                  | Command                          | Transaction      | Events                                                        | Jobs                                   |
| ----------- | ----------------------------------------- | -------------------------------- | ---------------- | ------------------------------------------------------------- | -------------------------------------- |
| Work Orders | `POST /api/v1/work-orders`                | `CreateWorkOrderCommand`         | single aggregate | `WorkOrderCreated`                                            | `EvaluateSLAWindow`                    |
| Work Orders | `POST /api/v1/work-orders/{id}/assign`    | `AssignWorkOrderCommand`         | multi aggregate  | `WorkOrderAssigned`, `DispatchAssignmentChanged`              | push, route rebuild                    |
| Work Orders | `POST /api/v1/work-orders/{id}/accept`    | `AcceptWorkOrderCommand`         | single aggregate | `WorkOrderAccepted`                                           | response SLA metric                    |
| Work Orders | `POST /api/v1/work-orders/{id}/start`     | `StartWorkCommand`               | single aggregate | `WorkStarted`                                                 | arrival event                          |
| Work Orders | `POST /api/v1/work-orders/{id}/materials` | `AddMaterialsCommand`            | multi aggregate  | `MaterialUsageAttached`, `StockReserved`                      | suspicious write-off validation        |
| Media       | `POST /api/v1/media/upload-intents`       | `CreateMediaUploadIntentCommand` | single aggregate | `MediaUploadIntentCreated`                                    | none                                   |
| Media       | `POST /api/v1/media/{id}/confirm`         | `ConfirmMediaUploadCommand`      | single aggregate | `PhotoUploaded`                                               | compression, thumbnails, EXIF, AI, OCR |
| Work Orders | `POST /api/v1/work-orders/{id}/complete`  | `CompleteWorkOrderCommand`       | multi aggregate  | `WorkOrderCompleted`, `MaterialWrittenOff`, `SLATimerStopped` | PDF, notifications, delta sync         |
| Work Orders | `POST /api/v1/work-orders/{id}/close`     | `CloseWorkOrderCommand`          | multi aggregate  | `WorkOrderClosed`                                             | service act, CRM export                |
| Sync        | `POST /api/v1/sync/operations:replay`     | `ReplayOfflineOperationsCommand` | async            | `SyncOperationAccepted`, `SyncConflictDetected`               | operation replay, delta build          |

## 2. Application services architecture

Core application services:

- `WorkOrderService`: create, assign, accept, start, attach materials, submit approval, complete, close.
- `DispatchService`: assignment, reassignment, shift validation, workload balancing, emergency dispatch.
- `WarehouseService`: warehouses, zones, inventory audits, movement ledger.
- `InventoryReservationService`: reservations, write-offs, releases, transfers, optimistic locking.
- `MediaService`: signed upload intents, upload confirmation, evidence attachment, media processing jobs.
- `NotificationService`: in-app, push, escalation, delivery attempts, retries.
- `SLAService`: timers, breach prediction, escalation thresholds, emergency overrides.
- `EmergencyService`: critical incident lifecycle, nearest mechanic selection, critical SLA.
- `ApprovalService`: material approvals, manager chain, rejection/return flows.
- `SyncService`: offline operation replay, delta sync, conflicts, snapshots.
- `AuthService`: identity, sessions, device-bound refresh rotation.
- `ReportingService`: PDF/report generation, export packages, immutable versioning.
- `GeoService`: ETA, route estimates, geofencing, location events.
- `AuditService`: immutable operational and security logs.

## 3. Workflow execution architecture

Each workflow is a command handler:

1. Authenticate session.
2. Load RBAC/ABAC scopes.
3. Validate request envelope and idempotency key.
4. Load aggregates with version checks.
5. Execute domain validation.
6. Mutate aggregates in one transaction where consistency is required.
7. Append audit records.
8. Append outbox events.
9. Enqueue background jobs through outbox/queue bridge.
10. Return React Query friendly response with aggregate version and sync cursor.

## 4. Command/query architecture

Commands are write operations with idempotency and audit. Queries are read-optimized projections with cursor pagination, permission filters and stale-data metadata for mobile.

Command envelope fields:

- `commandId`
- `idempotencyKey`
- `tenantId`
- `actorUserId`
- `actorRole`
- `deviceId`
- `baseVersion`
- `issuedAt`
- `payload`

Query responses include:

- `data`
- `pageInfo`
- `serverTime`
- `syncCursor`
- `staleAfterSeconds`
- `permissionScope`

## 5. Transaction architecture

### Complete work order transaction

`CompleteWorkOrderCommand` is atomic for ERP consistency:

1. Validate permission `workOrders:complete`.
2. Load work order `FOR UPDATE`.
3. Reject closed/archived orders.
4. Validate base version for offline conflict control.
5. Validate at least one work item.
6. Validate customer signature.
7. Validate required photo categories and AI validation status.
8. Lock stock rows for all material lines.
9. Reject insufficient stock.
10. Check approval state for high-risk/material-heavy work.
11. Attach material usage.
12. Write off stock and append movement ledger rows.
13. Update work-order status to `COMPLETED`.
14. Mark offline operations as applied.
15. Append audit records.
16. Append outbox events.
17. Enqueue PDF, notifications and sync delta jobs.

External IO is never executed inside the DB transaction. S3, push providers, PDF engines, OCR and AI are triggered after commit through queues.

## 6. Event execution architecture

Domain events are persisted in the transaction. A queue bridge reads the outbox and publishes integration events.

Events:

- `WorkOrderCreated`
- `WorkOrderAssigned`
- `WorkStarted`
- `MaterialReserved`
- `MaterialWrittenOff`
- `PhotoUploaded`
- `SLARiskDetected`
- `SLAExceeded`
- `EmergencyTriggered`
- `ApprovalRequested`
- `SyncConflictDetected`
- `PdfGenerationRequested`

Reliability:

- outbox table with `status`, `attemptCount`, `nextAttemptAt`
- idempotent consumers
- dead-letter queues
- event dedupe keys
- replay tooling

## 7. Queue worker architecture

Queues:

- `pdf-generation`: work-order PDFs, service acts, audit reports.
- `media-processing`: compression, thumbnail, EXIF, watermark.
- `ai-validation`: photo quality, anomaly checks, recommendations.
- `notifications`: push, email, escalation, delivery attempts.
- `sync-operations`: operation replay, conflict resolution, delta build.
- `exports`: ZIP/CSV/Excel packages, CRM exports.
- `ocr`: serial plate, document OCR, invoice OCR.
- `dispatch`: route rebuild, assignment suggestions, workload balancing.
- `sla`: timer evaluation, breach prediction, escalation trigger.

Worker rules:

- one job = one idempotent state transition;
- update job state and audit in one transaction;
- exponential backoff by class of failure;
- DLQ after bounded retries;
- manual replay from operations console.

## 8. Media pipeline architecture

Flow:

1. Client requests upload intent.
2. Backend validates permission and owner scope.
3. Backend creates media row with `PENDING_UPLOAD` and S3 key.
4. Backend returns signed URL.
5. Client uploads directly to S3-compatible storage.
6. Client confirms upload with checksum.
7. Backend queues media processing.
8. Worker compresses image, creates thumbnail, extracts EXIF, applies watermark.
9. AI worker checks blur, darkness, duplicate, wrong object, required-shot compliance.
10. OCR worker extracts serial/document data.
11. Media status becomes `READY` or `NEEDS_RETAKE`.
12. Required photo requirement is fulfilled only after validation.

Offline upload recovery uses persistent upload sessions, chunk manifests, checksum validation and idempotent confirmation.

## 9. Sync execution architecture

Offline replay is not blind patching. Each operation has:

- operation id;
- device id;
- actor id;
- aggregate type/id;
- base version;
- command payload;
- local timestamp;
- idempotency key.

Replay steps:

1. Validate device/session/offline permission.
2. Check idempotency key.
3. Load aggregate current version.
4. If base version matches, execute command handler.
5. If not, create conflict record with server/client diff.
6. Return per-operation status.
7. Build delta updates for device.

Priority sync order: emergency, work orders, signatures, material write-offs, required photo metadata, media binary chunks, analytics.

## 10. WebSocket architecture

Channels:

- `tenant:{tenantId}:operations`
- `region:{regionId}:dispatch`
- `technician:{technicianId}:work-orders`
- `warehouse:{warehouseId}:stock`
- `work-order:{workOrderId}:timeline`
- `user:{userId}:notifications`
- `device:{deviceId}:sync`
- `incident:{incidentId}:emergency`

All messages are derived from committed events only. Reconnect uses cursor-based catch-up: client sends last event sequence, server returns missed events before live subscription.

## 11. Security architecture

- HttpOnly refresh cookies.
- Short-lived access JWT.
- Device-bound refresh token rotation.
- CSRF protection on cookie-auth mutating APIs.
- Permission middleware per route and command.
- Region/object/warehouse scoped authorization.
- Signed upload/download URLs with TTL.
- Rate limiting by user/device/IP and command type.
- Immutable audit logs for stock, SLA, approvals and security.

## 12. Performance architecture

- Cursor pagination for all operational grids.
- Covering indexes for queue, work order status, assigned technician, SLA timers and stock rows.
- Redis caching for permission scopes, dashboard counters and realtime presence.
- Worker horizontal scaling by queue.
- Media direct-to-S3 to avoid API bottlenecks.
- WebSocket batching and per-channel backpressure.
- Read projections for dashboard/dispatch/warehouse screens.

## 13. Observability architecture

Track:

- command latency by command type;
- transaction rollback count;
- idempotency replay count;
- queue depth and DLQ count;
- SLA risk/breach metrics;
- media processing duration;
- sync conflict rate;
- WebSocket reconnect rate;
- notification delivery success;
- PDF generation failures.

Use structured logs with `tenantId`, `actorUserId`, `deviceId`, `commandId`, `correlationId`, `aggregateId`.

## 14. Failure recovery architecture

- Worker crash: job remains pending or returns to queue by visibility timeout.
- Queue outage: outbox accumulates events and catches up.
- Partial transaction: DB rollback prevents half-completed work orders.
- Push provider failure: notification job retries and escalates channel.
- Upload interruption: chunk manifest resumes upload.
- Sync conflict: conflict record blocks unsafe mutation and requests human/system resolution.
- WebSocket disconnect: cursor catch-up restores realtime state.

## 15. Production operational backend implementation architecture

The implementation foundation is in `lib/backend/operational-api-contracts.ts` and `lib/backend/application-services.ts`:

- typed endpoint contracts;
- command envelopes;
- operational API errors;
- application service ports;
- unit-of-work transaction boundary;
- work-order command handlers;
- media upload intent handler;
- domain events;
- queue jobs;
- audit records;
- idempotency integration.

This is designed to be wired to Prisma repositories, Redis/BullMQ workers, S3 signed URL adapters and WebSocket gateways without changing command semantics.
