# НеоЛифт ERP/PWA — Core Backend, Domain Model & Database Foundation

This document defines the production backend foundation for the НеоЛифт industrial field-service ERP. It is not a CRUD backend or frontend plan; it is the core operational platform for work orders, elevators, inventory, media, SLA, approvals, sync, notifications, audit and reporting.

## 1. Full domain model

Core aggregates are `WorkOrder`, `Elevator`, `ServiceObject`, `Customer`, `Material`, `Warehouse`, `Reservation`, `MaterialMovement`, `Technician`, `SLAEvent`, `Notification`, `MediaFile`, `SyncOperation`, `Approval`, `AuditRecord` and `EmergencyEvent`. `WorkOrder` is the central operational aggregate and owns lifecycle state, required photos, signatures, material demands, approvals, SLA state and offline version metadata.

## 2. PostgreSQL architecture

PostgreSQL is split into operational modules: Operations, Inventory, Media, Notifications, SLA, Identity, Audit, Sync, Reporting and Configuration. High-volume tables such as audit records, domain events, notifications and material movements are candidates for date/tenant partitioning. Business aggregates use tenant-aware indexes, soft-delete columns and optimistic version columns.

## 3. Prisma schema architecture

The Prisma schema uses normalized relations with tenant scoping, unique business keys, relation indexes, JSON payload columns for event/metadata envelopes and Decimal stock quantities. Soft delete is represented by `deletedAt`, while immutable audit and outbox records are append-only.

## 4. Application layer architecture

The application layer is command/query oriented: REST controllers validate auth and shape command envelopes, command handlers mutate aggregates, query handlers serve paginated projections, repositories encapsulate Prisma access and domain services enforce cross-aggregate invariants inside transactions.

## 5. Event-driven architecture

Domain events such as `WorkOrderCreated`, `WorkStarted`, `MaterialReserved`, `MaterialWrittenOff`, `PhotoUploaded`, `SLAExceeded`, `EmergencyTriggered`, `SyncFailed` and `ApprovalRequested` are written to the outbox in the same transaction as aggregate changes. Event publishers deliver to Redis/BullMQ, WebSocket streams and background workers with retries and dead-letter queues.

## 6. Queue architecture

Queues are required for PDF generation, media processing, AI validation, notifications, sync operations, exports and OCR. Every job carries idempotency keys, retry policy, tenant scope, trace id and dead-letter metadata.

## 7. Realtime architecture

WebSocket channels are scoped by tenant, region, technician, warehouse, work order, user and device. Realtime streams publish committed domain events only, support reconnect replay cursors and expose presence for dispatchers and field devices.

## 8. Offline sync backend architecture

Offline sync is based on operation logs, idempotency keys, sync snapshots, delta cursors, optimistic versions and conflict records. Devices submit operations with base/local versions; the backend either applies them transactionally, rejects them or stores conflict metadata for resolution.

## 9. Audit architecture

Critical changes, stock movements, SLA changes, approvals, security events and configuration updates are written as immutable audit records with before/after payloads, hash chaining and tenant-scoped indexes. Audit writes happen in the same transaction as the business command when possible.

## 10. Security architecture

Security uses JWT/session strategy, permission middleware, tenant/region/object scopes, signed upload URLs, idempotency enforcement, rate limiting, secure service-to-service APIs and audit protection. Push/media/report URLs expose signed access rather than raw storage keys.

## 11. API architecture

APIs are versioned under `/api/v1`, typed, mobile-friendly and offline-aware. REST handles commands/queries, background APIs handle signed uploads and jobs, WebSockets handle realtime updates and internal service APIs process outbox events and worker callbacks.

## 12. Performance architecture

The platform is designed for thousands of work orders, concurrent mechanics and media-heavy workflows through indexes, pagination, query projections, Redis caching, outbox batching, background processing and search indexes for work orders, elevators, materials and media.

## 13. Observability architecture

Structured logs, metrics, traces, queue monitoring, sync diagnostics, WebSocket connection metrics, audit verification and dead-letter dashboards provide production observability. Every command carries correlation id, tenant id, actor id and idempotency key.

## 14. Deployment architecture

Deployment targets Dockerized Next.js backend/API, PostgreSQL, Redis, workers and WebSocket gateway across dev/stage/prod environments. CI/CD runs migrations, schema checks, tests, smoke commands and backup verification before promotion.

## 15. Production ERP backend foundation architecture

The foundation is ready to expand into ServiceTitan/SAP Field Service-grade operations: robust aggregate boundaries, transactional invariants, event-driven workflows, offline synchronization, signed media uploads, AI/OCR workers, reporting queues, security scopes, observability and disaster recovery.
