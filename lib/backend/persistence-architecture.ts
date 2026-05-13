export type DatabaseModuleName =
  | "operations"
  | "inventory"
  | "audit"
  | "media"
  | "notifications"
  | "auth"
  | "sync"
  | "reporting"
  | "geo";

export type ConsistencyMode =
  | "single-aggregate-transaction"
  | "multi-aggregate-transaction"
  | "append-only-ledger"
  | "eventual-with-outbox"
  | "read-model-projection";

export type RetentionClass =
  | "operational-hot"
  | "compliance-immutable"
  | "media-metadata"
  | "sync-replay"
  | "geo-timeseries"
  | "derived-projection";

export type DatabaseTableDefinition = {
  table: string;
  module: DatabaseModuleName;
  aggregateOwner: string;
  purpose: string;
  consistency: ConsistencyMode;
  retention: RetentionClass;
  softDelete: "required" | "forbidden" | "not-applicable";
  partitioning: "none" | "monthly" | "weekly" | "daily" | "hash-by-tenant";
  criticalIndexes: string[];
};

export const DATABASE_MODULES: Record<
  DatabaseModuleName,
  {
    label: string;
    ownershipBoundary: string;
    writePattern: string;
    readPattern: string;
  }
> = {
  operations: {
    label: "Operations DB",
    ownershipBoundary:
      "Work orders, assignments, SLA references and operational state machines.",
    writePattern:
      "Command handlers mutate aggregates under optimistic version checks and append outbox events.",
    readPattern:
      "Status/technician/object projections for mechanic mobile, dispatcher grids and dashboards.",
  },
  inventory: {
    label: "Inventory DB",
    ownershipBoundary:
      "Stock balances, reservations, write-offs, transfers and immutable stock ledger.",
    writePattern:
      "Stock rows are locked for write-off/reservation and every movement is append-only with idempotency.",
    readPattern:
      "Warehouse stock projections cached by Redis and invalidated by MaterialMovement events.",
  },
  audit: {
    label: "Audit DB",
    ownershipBoundary:
      "Immutable operational/security/audit history for compliance and investigation.",
    writePattern:
      "Append-only hash-chained records; no update/delete in application code.",
    readPattern:
      "Partition-pruned audit search by tenant, entity, action and time range.",
  },
  media: {
    label: "Media Metadata DB",
    ownershipBoundary:
      "S3 object metadata, upload sessions, thumbnails, OCR and AI validation state.",
    writePattern:
      "Metadata is transactional; binary IO is external through signed URLs and background processors.",
    readPattern:
      "Evidence galleries query thumbnails and validation state, not original binaries.",
  },
  notifications: {
    label: "Notification DB",
    ownershipBoundary:
      "Notification fanout, delivery attempts, escalation state and read receipts.",
    writePattern:
      "Outbox-driven queue fanout with per-channel delivery attempt rows.",
    readPattern:
      "Unread counters and alert streams are projection-backed and permission filtered.",
  },
  auth: {
    label: "Auth DB",
    ownershipBoundary:
      "Users, roles, permissions, sessions, devices, refresh tokens and security events.",
    writePattern:
      "Device-bound session/refresh rotation and security-event append in one transaction.",
    readPattern:
      "Permission scopes cached in Redis with short TTL and invalidation on role/permission change.",
  },
  sync: {
    label: "Sync DB",
    ownershipBoundary:
      "Offline operation log, conflicts, checkpoints, device cursors and snapshots.",
    writePattern:
      "Operation replay is idempotent and validates aggregate base version before applying patches.",
    readPattern:
      "Delta queries stream changed aggregates by tenant/device cursor.",
  },
  reporting: {
    label: "Reporting DB",
    ownershipBoundary:
      "Generated documents, report files, scheduled exports and immutable versions.",
    writePattern:
      "Async generation jobs update document state and append immutable report versions.",
    readPattern:
      "Document grids use object/customer/date/type indexes and signed download URLs.",
  },
  geo: {
    label: "Geo DB",
    ownershipBoundary:
      "PostGIS locations, routes, geo events, traffic snapshots and arrival predictions.",
    writePattern:
      "Realtime GPS writes are batched; route decisions append audit and location events.",
    readPattern:
      "Map queries use GiST indexes, clustering keys and region isolation.",
  },
};

export const OPERATIONAL_TABLES: DatabaseTableDefinition[] = [
  {
    table: "WorkOrder",
    module: "operations",
    aggregateOwner: "WorkOrder",
    purpose:
      "Lifecycle, status, priority, technician assignment, object/elevator references and offline versions.",
    consistency: "single-aggregate-transaction",
    retention: "operational-hot",
    softDelete: "required",
    partitioning: "none",
    criticalIndexes: [
      "tenantId,status,priority",
      "tenantId,technicianId,status",
      "tenantId,objectId,createdAt",
      "tenantId,updatedAt",
    ],
  },
  {
    table: "WorkOrderItem",
    module: "operations",
    aggregateOwner: "WorkOrder",
    purpose:
      "Normalized performed work lines with action, equipment node, quantity and template code.",
    consistency: "single-aggregate-transaction",
    retention: "operational-hot",
    softDelete: "forbidden",
    partitioning: "none",
    criticalIndexes: ["workOrderId,sequence", "tenantId,actionCode,createdAt"],
  },
  {
    table: "Assignment",
    module: "operations",
    aggregateOwner: "DispatchAssignment",
    purpose:
      "Technician-to-work-order assignment lifecycle and reassignment history.",
    consistency: "multi-aggregate-transaction",
    retention: "operational-hot",
    softDelete: "forbidden",
    partitioning: "monthly",
    criticalIndexes: [
      "tenantId,technicianId,status",
      "tenantId,workOrderId,createdAt",
    ],
  },
  {
    table: "SLAEvent",
    module: "operations",
    aggregateOwner: "SLAEvent",
    purpose:
      "SLA timer state, due dates, risk, breach and escalation timestamps.",
    consistency: "eventual-with-outbox",
    retention: "operational-hot",
    softDelete: "forbidden",
    partitioning: "monthly",
    criticalIndexes: ["state,dueAt", "tenantId,state,dueAt", "workOrderId"],
  },
  {
    table: "StockLevel",
    module: "inventory",
    aggregateOwner: "Inventory",
    purpose:
      "Current stock per warehouse/material with optimistic version and reconciliation state.",
    consistency: "multi-aggregate-transaction",
    retention: "operational-hot",
    softDelete: "not-applicable",
    partitioning: "none",
    criticalIndexes: [
      "warehouseId,materialId",
      "materialId",
      "tenantId,warehouseId,available",
    ],
  },
  {
    table: "MaterialMovement",
    module: "inventory",
    aggregateOwner: "InventoryLedger",
    purpose:
      "Immutable stock ledger for receipts, reservations, write-offs, returns and audit corrections.",
    consistency: "append-only-ledger",
    retention: "compliance-immutable",
    softDelete: "forbidden",
    partitioning: "monthly",
    criticalIndexes: [
      "warehouseId,createdAt",
      "materialId,createdAt",
      "workOrderId",
      "idempotencyKey",
    ],
  },
  {
    table: "Reservation",
    module: "inventory",
    aggregateOwner: "Reservation",
    purpose:
      "Pending and confirmed material reservations linked to work orders and SLA-critical stock.",
    consistency: "multi-aggregate-transaction",
    retention: "operational-hot",
    softDelete: "forbidden",
    partitioning: "monthly",
    criticalIndexes: [
      "warehouseId,materialId",
      "workOrderId",
      "expiresAt,confirmedAt",
    ],
  },
  {
    table: "MediaFile",
    module: "media",
    aggregateOwner: "MediaFile",
    purpose:
      "S3 key, checksum, validation/OCR metadata and evidence owner references.",
    consistency: "eventual-with-outbox",
    retention: "media-metadata",
    softDelete: "required",
    partitioning: "monthly",
    criticalIndexes: [
      "tenantId,workOrderId",
      "tenantId,status,createdAt",
      "checksum",
      "tenantId,kind,createdAt",
    ],
  },
  {
    table: "UploadSession",
    module: "media",
    aggregateOwner: "UploadSession",
    purpose: "Resumable/chunked upload state for offline media recovery.",
    consistency: "eventual-with-outbox",
    retention: "media-metadata",
    softDelete: "not-applicable",
    partitioning: "monthly",
    criticalIndexes: ["tenantId,deviceId,status", "mediaFileId", "expiresAt"],
  },
  {
    table: "Notification",
    module: "notifications",
    aggregateOwner: "Notification",
    purpose:
      "User-visible alerts, SLA warnings, approvals, emergency notifications and read state.",
    consistency: "eventual-with-outbox",
    retention: "operational-hot",
    softDelete: "forbidden",
    partitioning: "monthly",
    criticalIndexes: ["tenantId,userId,status", "tenantId,priority,createdAt"],
  },
  {
    table: "NotificationDelivery",
    module: "notifications",
    aggregateOwner: "DeliveryAttempt",
    purpose:
      "Per-channel delivery attempts, provider responses, retries and fallback channel diagnostics.",
    consistency: "append-only-ledger",
    retention: "compliance-immutable",
    softDelete: "forbidden",
    partitioning: "monthly",
    criticalIndexes: [
      "notificationId,channel,attemptNo",
      "tenantId,status,nextAttemptAt",
    ],
  },
  {
    table: "SyncOperation",
    module: "sync",
    aggregateOwner: "SyncOperation",
    purpose:
      "Offline command replay, idempotency, base versions, conflicts and device operation state.",
    consistency: "eventual-with-outbox",
    retention: "sync-replay",
    softDelete: "forbidden",
    partitioning: "monthly",
    criticalIndexes: [
      "tenantId,deviceId,status",
      "tenantId,createdAt",
      "idempotencyKey",
    ],
  },
  {
    table: "AuditRecord",
    module: "audit",
    aggregateOwner: "AuditRecord",
    purpose:
      "Hash-chained immutable audit trail for stock, SLA, dispatch, approvals, security and emergency actions.",
    consistency: "append-only-ledger",
    retention: "compliance-immutable",
    softDelete: "forbidden",
    partitioning: "monthly",
    criticalIndexes: [
      "tenantId,entityType,entityId",
      "tenantId,createdAt",
      "tenantId,hash",
    ],
  },
  {
    table: "DomainEvent",
    module: "audit",
    aggregateOwner: "Outbox",
    purpose:
      "Transactional domain event persistence and retry-safe integration publishing.",
    consistency: "eventual-with-outbox",
    retention: "compliance-immutable",
    softDelete: "forbidden",
    partitioning: "monthly",
    criticalIndexes: [
      "status,occurredAt",
      "tenantId,aggregateType,aggregateId",
    ],
  },
  {
    table: "LocationEvent",
    module: "geo",
    aggregateOwner: "LocationEvent",
    purpose:
      "Realtime GPS/ETA/arrival/departure/audit events from mechanic devices and route engine.",
    consistency: "append-only-ledger",
    retention: "geo-timeseries",
    softDelete: "forbidden",
    partitioning: "daily",
    criticalIndexes: [
      "tenantId,eventType,occurredAt",
      "tenantId,technicianId,occurredAt",
      "point GiST",
    ],
  },
  {
    table: "ReportFile",
    module: "reporting",
    aggregateOwner: "GeneratedDocument",
    purpose:
      "Immutable generated PDF/Excel/ZIP metadata, storage keys, versions and signatures.",
    consistency: "eventual-with-outbox",
    retention: "compliance-immutable",
    softDelete: "forbidden",
    partitioning: "monthly",
    criticalIndexes: [
      "tenantId,documentType,createdAt",
      "tenantId,objectId,createdAt",
      "checksum",
    ],
  },
];

export type RelationalConsistencyRule = {
  id: string;
  module: DatabaseModuleName;
  rule: string;
  enforcement: string;
  failureMode: string;
};

export const RELATIONAL_CONSISTENCY_RULES: RelationalConsistencyRule[] = [
  {
    id: "work-order-active-elevator",
    module: "operations",
    rule: "A work order must not be created for a deleted or inactive elevator/object.",
    enforcement:
      "Application command validation + partial active-object indexes + foreign keys without cascade delete.",
    failureMode:
      "Reject command with VALIDATION_FAILED before transaction mutation.",
  },
  {
    id: "stock-movement-immutable",
    module: "inventory",
    rule: "MaterialMovement rows are immutable and never soft-deleted.",
    enforcement:
      "Database trigger blocks UPDATE/DELETE; corrections use AUDIT_CORRECTION movement rows.",
    failureMode: "Raise DB exception and append security/audit alert.",
  },
  {
    id: "stock-no-negative-available",
    module: "inventory",
    rule: "Stock write-off/reservation cannot drive available quantity below zero.",
    enforcement:
      "SELECT FOR UPDATE stock row + check on onHand/reserved + idempotent movement key.",
    failureMode: "Rollback transaction and return STOCK_NOT_AVAILABLE.",
  },
  {
    id: "sla-reconnect-safe",
    module: "operations",
    rule: "SLA timers must survive WebSocket reconnects and worker restarts.",
    enforcement:
      "Persist SLAEvent/SLAIncidentTimer state; workers scan dueAt/remainingMinutes indexes.",
    failureMode: "Timer worker resumes from DB cursor and emits missed events.",
  },
  {
    id: "audit-immutable-hash-chain",
    module: "audit",
    rule: "Audit records cannot be updated or deleted and must be hash-chain verifiable.",
    enforcement:
      "Append-only trigger + unique tenant/hash + previousHash chain per tenant stream.",
    failureMode: "Block mutation and create critical security event.",
  },
  {
    id: "media-no-orphan-binary",
    module: "media",
    rule: "S3 objects must have metadata rows and metadata rows must converge to READY/FAILED/ARCHIVED.",
    enforcement:
      "UploadSession expiration worker, checksum confirmation and orphan cleanup job.",
    failureMode: "Mark upload FAILED and queue cleanup for temporary object.",
  },
  {
    id: "offline-operation-once",
    module: "sync",
    rule: "An offline operation idempotency key can be applied once per tenant/device scope.",
    enforcement:
      "Unique idempotency key + operation replay transaction + baseVersion conflict record.",
    failureMode:
      "Return cached result for replay or CONFLICT_DETECTED for version mismatch.",
  },
];

export type IndexPlan = {
  name: string;
  table: string;
  kind: "btree" | "gin" | "gist" | "brin" | "partial" | "covering";
  columns: string;
  purpose: string;
};

export const PRODUCTION_INDEX_PLAN: IndexPlan[] = [
  {
    name: "idx_work_order_search_trgm",
    table: "WorkOrder",
    kind: "gin",
    columns: "number, title, description gin_trgm_ops",
    purpose: "Fast dispatcher/mechanic work-order search.",
  },
  {
    name: "idx_elevator_factory_search",
    table: "Elevator",
    kind: "gin",
    columns: "factoryNumber, manufacturer, model gin_trgm_ops",
    purpose:
      "Factory number/model/controller search from mobile and registry screens.",
  },
  {
    name: "idx_geo_object_point_gist",
    table: "GeoObject",
    kind: "gist",
    columns: "point",
    purpose: "Nearest object/mechanic/emergency zone queries through PostGIS.",
  },
  {
    name: "idx_location_event_time_brin",
    table: "LocationEvent",
    kind: "brin",
    columns: "occurredAt",
    purpose: "Large append-only geo event scans and partition-local analytics.",
  },
  {
    name: "idx_sla_due_active",
    table: "SLAEvent",
    kind: "partial",
    columns: "dueAt WHERE breachedAt IS NULL",
    purpose: "SLA timer worker scans only active timers.",
  },
  {
    name: "idx_dispatch_queue_ready",
    table: "DispatchQueue",
    kind: "covering",
    columns: "tenantId,status,priority,createdAt INCLUDE workOrderId,regionId",
    purpose: "Operational dispatch queue and realtime dashboards.",
  },
  {
    name: "idx_audit_entity_time",
    table: "AuditRecord",
    kind: "btree",
    columns: "tenantId,entityType,entityId,createdAt DESC",
    purpose: "Audit trail drill-down by entity.",
  },
  {
    name: "idx_outbox_publish_ready",
    table: "OutboxMessage",
    kind: "partial",
    columns: "availableAt WHERE status = 'PENDING' AND lockedAt IS NULL",
    purpose: "Outbox dispatcher lock-free ready event scan.",
  },
];

export type PartitionPlan = {
  table: string;
  strategy: "range-monthly" | "range-weekly" | "range-daily" | "hash-tenant";
  retention: string;
  hotWindow: string;
  archiveAction: string;
};

export const PARTITIONING_PLAN: PartitionPlan[] = [
  {
    table: "AuditRecord",
    strategy: "range-monthly",
    retention: "7 years online metadata, archive after retention policy",
    hotWindow: "13 months",
    archiveAction: "detach old partition to compliance archive schema/storage",
  },
  {
    table: "LocationEvent",
    strategy: "range-daily",
    retention: "90 days hot, aggregate route analytics retained separately",
    hotWindow: "14 days",
    archiveAction: "compress/export to cold telemetry storage",
  },
  {
    table: "Notification",
    strategy: "range-monthly",
    retention: "24 months notification history",
    hotWindow: "3 months",
    archiveAction:
      "detach read/expired partitions after summary projection build",
  },
  {
    table: "SyncOperation",
    strategy: "range-monthly",
    retention: "12 months replay diagnostics, conflicts retained 36 months",
    hotWindow: "2 months",
    archiveAction:
      "archive APPLIED operations, retain conflicts in hot read model",
  },
  {
    table: "DomainEvent",
    strategy: "range-monthly",
    retention: "5 years integration event replay metadata",
    hotWindow: "6 months",
    archiveAction:
      "detach published partitions after replay checkpoint verification",
  },
  {
    table: "MediaFile",
    strategy: "range-monthly",
    retention: "metadata follows document/evidence retention",
    hotWindow: "12 months",
    archiveAction:
      "move original media to archival S3 tier, keep thumbnails hot",
  },
];

export const OFFLINE_SYNC_PERSISTENCE = {
  operationLog:
    "SyncOperation stores device id, aggregate id, baseVersion, idempotencyKey, payload, status, conflict and appliedAt.",
  conflictHistory:
    "Conflicts are retained with server/client diff, resolution actor and final applied command id.",
  checkpoints:
    "Device checkpoints store last acknowledged outbox sequence and projection cursor per aggregate stream.",
  snapshots:
    "OfflineSnapshot captures compact aggregate projections for mechanic route/object/material packs.",
  replay:
    "Replay workers apply operations in priority order: emergency, work orders, signatures, material write-offs, media metadata, media binaries, analytics.",
} as const;

export const MIGRATION_SAFETY_RULES = [
  "Every migration has expand/backfill/contract phases for zero-downtime deploys.",
  "Add nullable columns first; backfill in chunks; enforce NOT NULL after verification.",
  "Create large indexes CONCURRENTLY outside transaction where PostgreSQL requires it.",
  "Never drop columns or enum values in the same release that stops writing them.",
  "Partition creation for time-series tables is scheduled at least 90 days ahead.",
  "Prisma migrations are reviewed with raw SQL hardening scripts for PostGIS, GIN/GiST/BRIN and triggers.",
];

export const BACKUP_AND_RECOVERY_PLAN = {
  pointInTimeRecovery:
    "Continuous WAL archiving with tested PITR restore drills.",
  backupCadence:
    "Daily full backup, 15-minute WAL restore point objective for operational DB.",
  mediaRecovery:
    "S3 versioning + lifecycle policies + metadata reconciliation jobs.",
  disasterRecovery:
    "Warm standby PostgreSQL replica, Redis queue replay from outbox, worker idempotency keys.",
  restoreValidation:
    "Automated restore smoke tests validate WorkOrder, stock ledger, audit hash chain, outbox replay and sync cursors.",
} as const;
