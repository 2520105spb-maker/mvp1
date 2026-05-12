export type ApplicationLayerComponent = {
  layer:
    | "api"
    | "application"
    | "domain"
    | "infrastructure"
    | "worker"
    | "realtime";
  name: string;
  responsibility: string;
  transactionBoundary: string;
};

export const APPLICATION_LAYER: ApplicationLayerComponent[] = [
  {
    layer: "api",
    name: "Versioned REST Controllers",
    responsibility:
      "Typed mobile/offline-friendly endpoints under /api/v1 with command/query separation.",
    transactionBoundary:
      "Validate auth, create command envelope, delegate to application service.",
  },
  {
    layer: "application",
    name: "Command Handlers",
    responsibility:
      "Execute use cases such as close work order, reserve material, approve write-off and create upload intent.",
    transactionBoundary:
      "One aggregate mutation + outbox append in a single PostgreSQL transaction.",
  },
  {
    layer: "application",
    name: "Query Handlers",
    responsibility:
      "Paginated projections for mobile lists, desktop grids, search and sync deltas.",
    transactionBoundary:
      "Read-only transaction or replica-safe query with permission scopes.",
  },
  {
    layer: "domain",
    name: "Domain Services",
    responsibility:
      "Enforce invariants across aggregates: SLA completion, stock availability, required photos, approvals.",
    transactionBoundary:
      "Called inside command transaction; never performs external IO.",
  },
  {
    layer: "infrastructure",
    name: "Repositories",
    responsibility:
      "Prisma-backed repositories for aggregates, optimistic version checks and soft-delete filters.",
    transactionBoundary: "Receive Prisma transaction client from unit of work.",
  },
  {
    layer: "worker",
    name: "Background Workers",
    responsibility:
      "BullMQ/Redis workers for PDF generation, media processing, AI validation, OCR, notifications, exports and sync retries.",
    transactionBoundary:
      "Consume outbox/queue job idempotently; write status + audit record transactionally.",
  },
  {
    layer: "realtime",
    name: "WebSocket Gateway",
    responsibility:
      "Publishes work-order, SLA, sync, notification and presence streams by tenant/region/user scope.",
    transactionBoundary:
      "Receives committed domain events from event bus only.",
  },
];

export const QUEUES = [
  {
    name: "pdf-generation",
    jobs: ["GenerateWorkOrderPdf", "GenerateServiceAct", "GenerateAuditReport"],
    retry: "exponential backoff + dead-letter queue",
  },
  {
    name: "media-processing",
    jobs: ["CompressImage", "GenerateThumbnail", "ExtractExif", "Watermark"],
    retry: "chunk-aware retry",
  },
  {
    name: "ai-validation",
    jobs: ["ValidatePhotoQuality", "DetectAnomaly", "RecommendSLA"],
    retry: "bounded retry, manual review fallback",
  },
  {
    name: "notifications",
    jobs: ["SendPush", "SendEmail", "EscalateAlert"],
    retry: "provider failover + dedupe key",
  },
  {
    name: "sync-operations",
    jobs: ["ApplyOfflineOperation", "BuildDelta", "ResolveConflict"],
    retry: "idempotent replay",
  },
  {
    name: "exports",
    jobs: ["BuildZip", "StreamCsv", "CustomerPortalDelivery"],
    retry: "resume from export cursor",
  },
  {
    name: "ocr",
    jobs: ["RecognizeSerialPlate", "ParseInvoice", "IndexDocumentText"],
    retry: "AI/OCR fallback model",
  },
] as const;

export const REALTIME_CHANNELS = [
  "tenant:{tenantId}:operations",
  "region:{regionId}:dispatch",
  "technician:{technicianId}:work-orders",
  "warehouse:{warehouseId}:stock",
  "work-order:{workOrderId}:timeline",
  "user:{userId}:notifications",
  "device:{deviceId}:sync",
] as const;
