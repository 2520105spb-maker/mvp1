export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type ApiSurface =
  | "work-orders"
  | "dispatch"
  | "warehouse"
  | "media"
  | "sla"
  | "sync"
  | "approvals"
  | "notifications"
  | "reports"
  | "geo"
  | "emergency";

export type EndpointContract = {
  surface: ApiSurface;
  method: HttpMethod;
  path: string;
  commandOrQuery: string;
  permission: string;
  idempotent: boolean;
  transaction: "read-only" | "single-aggregate" | "multi-aggregate" | "async";
  realtimeEvents: string[];
  backgroundJobs: string[];
};

export const API_VERSION = "v1" as const;

export const API_ENDPOINTS: EndpointContract[] = [
  {
    surface: "work-orders",
    method: "POST",
    path: "/api/v1/work-orders",
    commandOrQuery: "CreateWorkOrderCommand",
    permission: "workOrders:create",
    idempotent: true,
    transaction: "single-aggregate",
    realtimeEvents: ["WorkOrderCreated"],
    backgroundJobs: ["EvaluateSLAWindow"],
  },
  {
    surface: "work-orders",
    method: "POST",
    path: "/api/v1/work-orders/{id}/assign",
    commandOrQuery: "AssignWorkOrderCommand",
    permission: "workOrders:assign",
    idempotent: true,
    transaction: "multi-aggregate",
    realtimeEvents: ["WorkOrderAssigned", "DispatchAssignmentChanged"],
    backgroundJobs: ["SendAssignmentPush", "RebuildTechnicianRoute"],
  },
  {
    surface: "work-orders",
    method: "POST",
    path: "/api/v1/work-orders/{id}/accept",
    commandOrQuery: "AcceptWorkOrderCommand",
    permission: "workOrders:updateAssigned",
    idempotent: true,
    transaction: "single-aggregate",
    realtimeEvents: ["WorkOrderAccepted"],
    backgroundJobs: ["StartSLAResponseMetric"],
  },
  {
    surface: "work-orders",
    method: "POST",
    path: "/api/v1/work-orders/{id}/start",
    commandOrQuery: "StartWorkCommand",
    permission: "workOrders:updateAssigned",
    idempotent: true,
    transaction: "single-aggregate",
    realtimeEvents: ["WorkStarted"],
    backgroundJobs: ["PublishArrivalEvent"],
  },
  {
    surface: "work-orders",
    method: "POST",
    path: "/api/v1/work-orders/{id}/materials",
    commandOrQuery: "AddMaterialsCommand",
    permission: "materials:writeOff",
    idempotent: true,
    transaction: "multi-aggregate",
    realtimeEvents: ["MaterialUsageAttached", "StockReserved"],
    backgroundJobs: ["ValidateSuspiciousWriteOff"],
  },
  {
    surface: "media",
    method: "POST",
    path: "/api/v1/media/upload-intents",
    commandOrQuery: "CreateMediaUploadIntentCommand",
    permission: "media:write",
    idempotent: true,
    transaction: "single-aggregate",
    realtimeEvents: ["MediaUploadIntentCreated"],
    backgroundJobs: [],
  },
  {
    surface: "media",
    method: "POST",
    path: "/api/v1/media/{id}/confirm",
    commandOrQuery: "ConfirmMediaUploadCommand",
    permission: "media:write",
    idempotent: true,
    transaction: "single-aggregate",
    realtimeEvents: ["PhotoUploaded"],
    backgroundJobs: [
      "CompressImage",
      "GenerateThumbnail",
      "ExtractExif",
      "ValidatePhotoQuality",
      "RunOCR",
    ],
  },
  {
    surface: "work-orders",
    method: "POST",
    path: "/api/v1/work-orders/{id}/submit-approval",
    commandOrQuery: "SubmitApprovalCommand",
    permission: "approvals:create",
    idempotent: true,
    transaction: "multi-aggregate",
    realtimeEvents: ["ApprovalRequested"],
    backgroundJobs: ["NotifyApprovalChain"],
  },
  {
    surface: "work-orders",
    method: "POST",
    path: "/api/v1/work-orders/{id}/complete",
    commandOrQuery: "CompleteWorkOrderCommand",
    permission: "workOrders:complete",
    idempotent: true,
    transaction: "multi-aggregate",
    realtimeEvents: [
      "WorkOrderCompleted",
      "MaterialWrittenOff",
      "SLATimerStopped",
    ],
    backgroundJobs: [
      "GenerateWorkOrderPdf",
      "SendCompletionNotifications",
      "SyncDeltaBuild",
    ],
  },
  {
    surface: "work-orders",
    method: "POST",
    path: "/api/v1/work-orders/{id}/close",
    commandOrQuery: "CloseWorkOrderCommand",
    permission: "workOrders:close",
    idempotent: true,
    transaction: "multi-aggregate",
    realtimeEvents: ["WorkOrderClosed"],
    backgroundJobs: ["GenerateServiceAct", "ExportToCRM"],
  },
  {
    surface: "sync",
    method: "POST",
    path: "/api/v1/sync/operations:replay",
    commandOrQuery: "ReplayOfflineOperationsCommand",
    permission: "sync:write",
    idempotent: true,
    transaction: "async",
    realtimeEvents: ["SyncOperationAccepted", "SyncConflictDetected"],
    backgroundJobs: ["ApplyOfflineOperation", "BuildDelta"],
  },
];

export type CommandEnvelope<TPayload> = {
  commandId: string;
  idempotencyKey: string;
  tenantId: string;
  actorUserId: string;
  actorRole: string;
  deviceId?: string;
  baseVersion?: number;
  issuedAt: string;
  payload: TPayload;
};

export type WorkOrderMaterialInput = {
  materialId: string;
  reservationId?: string;
  quantity: number;
  warehouseId: string;
};

export type CreateWorkOrderPayload = {
  buildingId: string;
  elevatorId: string;
  customerId: string;
  type: "planned" | "repair" | "emergency" | "inspection";
  priority: "low" | "medium" | "high" | "critical";
  requestedAt: string;
  description: string;
};

export type CompleteWorkOrderPayload = {
  workOrderId: string;
  completedAt: string;
  workItems: Array<{ action: string; element: string; quantity: number }>;
  materials: WorkOrderMaterialInput[];
  requiredPhotoIds: string[];
  signatureId: string;
  offlineOperationIds?: string[];
};

export type UploadIntentPayload = {
  ownerType: "work_order" | "elevator" | "node" | "emergency" | "document";
  ownerId: string;
  category:
    | "installed_part"
    | "removed_part"
    | "work_order"
    | "before"
    | "after"
    | "document";
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  capturedAt: string;
};

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_FAILED"
  | "CONFLICT_DETECTED"
  | "IDEMPOTENCY_REPLAY"
  | "STOCK_NOT_AVAILABLE"
  | "REQUIRED_PHOTO_MISSING"
  | "SIGNATURE_REQUIRED"
  | "SLA_CONSTRAINT_FAILED"
  | "APPROVAL_REQUIRED"
  | "EXTERNAL_SERVICE_UNAVAILABLE";

export class OperationalApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "OperationalApiError";
  }
}
