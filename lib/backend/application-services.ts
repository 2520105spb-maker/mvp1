import type {
  CommandEnvelope,
  CompleteWorkOrderPayload,
  CreateWorkOrderPayload,
  UploadIntentPayload,
  WorkOrderMaterialInput,
} from "./operational-api-contracts";
import { OperationalApiError as ApiError } from "./operational-api-contracts";

export type DomainEventEnvelope = {
  eventId: string;
  tenantId: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  occurredAt: string;
  payload: Record<string, unknown>;
};

export type QueueJobEnvelope = {
  queue: string;
  jobName: string;
  dedupeKey: string;
  priority: "critical" | "high" | "normal" | "low";
  payload: Record<string, unknown>;
};

export type AuditRecordInput = {
  tenantId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type WorkOrderSnapshot = {
  id: string;
  tenantId: string;
  status:
    | "DRAFT"
    | "ASSIGNED"
    | "ACCEPTED"
    | "IN_PROGRESS"
    | "WAITING_MATERIALS"
    | "WAITING_APPROVAL"
    | "COMPLETED"
    | "REJECTED"
    | "CLOSED"
    | "ARCHIVED";
  version: number;
  assignedTechnicianId?: string;
  requiredPhotoCategories: string[];
  attachedPhotoCategories: string[];
  signatureId?: string;
  approvalRequired: boolean;
  approvalGranted: boolean;
  slaState: "not_started" | "running" | "risk" | "breached" | "stopped";
  closedAt?: string;
};

export type StockAvailability = {
  materialId: string;
  warehouseId: string;
  available: number;
  reserved: number;
  version: number;
};

export type TransactionClient = {
  workOrders: WorkOrderRepository;
  inventory: InventoryRepository;
  media: MediaRepository;
  approvals: ApprovalRepository;
  sync: SyncRepository;
  outbox: OutboxRepository;
  audit: AuditRepository;
  jobs: JobRepository;
};

export type UnitOfWork = {
  transaction<TResult>(
    scope: (tx: TransactionClient) => Promise<TResult>,
  ): Promise<TResult>;
};

export type WorkOrderRepository = {
  createDraft(
    input: CreateWorkOrderPayload & { tenantId: string; createdBy: string },
  ): Promise<WorkOrderSnapshot>;
  findForUpdate(
    workOrderId: string,
    tenantId: string,
  ): Promise<WorkOrderSnapshot | null>;
  setAssigned(
    workOrderId: string,
    technicianId: string,
    expectedVersion: number,
  ): Promise<WorkOrderSnapshot>;
  setAccepted(
    workOrderId: string,
    expectedVersion: number,
  ): Promise<WorkOrderSnapshot>;
  setStarted(
    workOrderId: string,
    expectedVersion: number,
  ): Promise<WorkOrderSnapshot>;
  setCompleted(
    workOrderId: string,
    signatureId: string,
    expectedVersion: number,
  ): Promise<WorkOrderSnapshot>;
  setClosed(
    workOrderId: string,
    expectedVersion: number,
  ): Promise<WorkOrderSnapshot>;
  attachMaterialUsage(
    workOrderId: string,
    materials: WorkOrderMaterialInput[],
  ): Promise<void>;
};

export type InventoryRepository = {
  getAvailabilityForUpdate(
    materialId: string,
    warehouseId: string,
  ): Promise<StockAvailability | null>;
  reserve(
    input: WorkOrderMaterialInput & {
      tenantId: string;
      workOrderId: string;
      idempotencyKey: string;
    },
  ): Promise<void>;
  writeOff(
    input: WorkOrderMaterialInput & {
      tenantId: string;
      workOrderId: string;
      idempotencyKey: string;
    },
  ): Promise<void>;
};

export type MediaRepository = {
  createUploadIntent(
    input: UploadIntentPayload & {
      tenantId: string;
      actorUserId: string;
      storageKey: string;
    },
  ): Promise<{ mediaId: string; signedUploadUrl: string; storageKey: string }>;
  assertRequiredPhotos(
    workOrderId: string,
    requiredPhotoIds: string[],
  ): Promise<{ missingCategories: string[]; failedValidationIds: string[] }>;
};

export type ApprovalRepository = {
  request(input: {
    tenantId: string;
    workOrderId: string;
    actorUserId: string;
    reason: string;
  }): Promise<{ approvalId: string }>;
  assertApproved(workOrderId: string): Promise<boolean>;
};

export type SyncRepository = {
  markOperationsApplied(
    operationIds: string[] | undefined,
    appliedByCommandId: string,
  ): Promise<void>;
};

export type OutboxRepository = {
  append(events: DomainEventEnvelope[]): Promise<void>;
};

export type AuditRepository = {
  append(records: AuditRecordInput[]): Promise<void>;
};

export type JobRepository = {
  enqueue(jobs: QueueJobEnvelope[]): Promise<void>;
};

export type PermissionEvaluator = {
  assert(
    actorUserId: string,
    tenantId: string,
    permission: string,
    scope?: Record<string, string>,
  ): Promise<void>;
};

export type IdempotencyStore = {
  start<TResult>(
    key: string,
    commandName: string,
    execute: () => Promise<TResult>,
  ): Promise<TResult>;
};

const nowIso = () => new Date().toISOString();

const event = (
  tenantId: string,
  aggregateType: string,
  aggregateId: string,
  eventType: string,
  payload: Record<string, unknown>,
): DomainEventEnvelope => ({
  eventId: `${eventType}:${aggregateId}:${Date.now()}`,
  tenantId,
  aggregateType,
  aggregateId,
  eventType,
  occurredAt: nowIso(),
  payload,
});

export class WorkOrderApplicationService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly permissions: PermissionEvaluator,
    private readonly idempotency: IdempotencyStore,
  ) {}

  async createWorkOrder(command: CommandEnvelope<CreateWorkOrderPayload>) {
    await this.permissions.assert(
      command.actorUserId,
      command.tenantId,
      "workOrders:create",
      {
        elevatorId: command.payload.elevatorId,
        buildingId: command.payload.buildingId,
      },
    );

    return this.idempotency.start(
      command.idempotencyKey,
      "CreateWorkOrder",
      () =>
        this.uow.transaction(async (tx) => {
          const created = await tx.workOrders.createDraft({
            ...command.payload,
            tenantId: command.tenantId,
            createdBy: command.actorUserId,
          });

          await tx.outbox.append([
            event(
              command.tenantId,
              "WorkOrder",
              created.id,
              "WorkOrderCreated",
              {
                priority: command.payload.priority,
                elevatorId: command.payload.elevatorId,
              },
            ),
          ]);
          await tx.audit.append([
            {
              tenantId: command.tenantId,
              actorUserId: command.actorUserId,
              action: "work_order.created",
              entityType: "WorkOrder",
              entityId: created.id,
              after: { status: created.status, version: created.version },
            },
          ]);
          await tx.jobs.enqueue([
            {
              queue: "sla",
              jobName: "EvaluateSLAWindow",
              dedupeKey: `sla:${created.id}:initial`,
              priority:
                command.payload.priority === "critical" ? "critical" : "normal",
              payload: { workOrderId: created.id, tenantId: command.tenantId },
            },
          ]);
          return created;
        }),
    );
  }

  async assignWorkOrder(
    command: CommandEnvelope<{
      workOrderId: string;
      technicianId: string;
      routePlanId?: string;
    }>,
  ) {
    await this.permissions.assert(
      command.actorUserId,
      command.tenantId,
      "workOrders:assign",
      {
        technicianId: command.payload.technicianId,
      },
    );

    return this.idempotency.start(
      command.idempotencyKey,
      "AssignWorkOrder",
      () =>
        this.uow.transaction(async (tx) => {
          const current = await requireWorkOrder(
            tx,
            command.payload.workOrderId,
            command.tenantId,
          );
          assertEditable(current);
          const assigned = await tx.workOrders.setAssigned(
            current.id,
            command.payload.technicianId,
            expectedVersion(command, current),
          );
          await tx.outbox.append([
            event(
              command.tenantId,
              "WorkOrder",
              current.id,
              "WorkOrderAssigned",
              {
                technicianId: command.payload.technicianId,
                routePlanId: command.payload.routePlanId,
              },
            ),
          ]);
          await tx.jobs.enqueue([
            {
              queue: "notifications",
              jobName: "SendAssignmentPush",
              dedupeKey: `assignment:${current.id}:${command.payload.technicianId}`,
              priority: "high",
              payload: {
                workOrderId: current.id,
                technicianId: command.payload.technicianId,
              },
            },
            {
              queue: "dispatch",
              jobName: "RebuildTechnicianRoute",
              dedupeKey: `route:${command.payload.technicianId}:${current.id}`,
              priority: "normal",
              payload: {
                technicianId: command.payload.technicianId,
                workOrderId: current.id,
              },
            },
          ]);
          return assigned;
        }),
    );
  }

  async acceptWorkOrder(command: CommandEnvelope<{ workOrderId: string }>) {
    await this.permissions.assert(
      command.actorUserId,
      command.tenantId,
      "workOrders:updateAssigned",
      {
        workOrderId: command.payload.workOrderId,
      },
    );

    return this.idempotency.start(
      command.idempotencyKey,
      "AcceptWorkOrder",
      () =>
        this.uow.transaction(async (tx) => {
          const current = await requireWorkOrder(
            tx,
            command.payload.workOrderId,
            command.tenantId,
          );
          if (current.status !== "ASSIGNED") {
            throw new ApiError(
              "VALIDATION_FAILED",
              "Only assigned work orders can be accepted",
              {
                status: current.status,
              },
            );
          }
          const accepted = await tx.workOrders.setAccepted(
            current.id,
            expectedVersion(command, current),
          );
          await tx.outbox.append([
            event(
              command.tenantId,
              "WorkOrder",
              current.id,
              "WorkOrderAccepted",
              {},
            ),
          ]);
          return accepted;
        }),
    );
  }

  async startWork(
    command: CommandEnvelope<{
      workOrderId: string;
      arrivedAt: string;
      locationEventId?: string;
    }>,
  ) {
    await this.permissions.assert(
      command.actorUserId,
      command.tenantId,
      "workOrders:updateAssigned",
      {
        workOrderId: command.payload.workOrderId,
      },
    );

    return this.idempotency.start(command.idempotencyKey, "StartWork", () =>
      this.uow.transaction(async (tx) => {
        const current = await requireWorkOrder(
          tx,
          command.payload.workOrderId,
          command.tenantId,
        );
        if (current.status !== "ACCEPTED" && current.status !== "ASSIGNED") {
          throw new ApiError(
            "VALIDATION_FAILED",
            "Work can only start from assigned or accepted state",
            {
              status: current.status,
            },
          );
        }
        const started = await tx.workOrders.setStarted(
          current.id,
          expectedVersion(command, current),
        );
        await tx.outbox.append([
          event(command.tenantId, "WorkOrder", current.id, "WorkStarted", {
            arrivedAt: command.payload.arrivedAt,
            locationEventId: command.payload.locationEventId,
          }),
        ]);
        return started;
      }),
    );
  }

  async completeWorkOrder(command: CommandEnvelope<CompleteWorkOrderPayload>) {
    await this.permissions.assert(
      command.actorUserId,
      command.tenantId,
      "workOrders:complete",
      {
        workOrderId: command.payload.workOrderId,
      },
    );

    return this.idempotency.start(
      command.idempotencyKey,
      "CompleteWorkOrder",
      () =>
        this.uow.transaction(async (tx) => {
          const current = await requireWorkOrder(
            tx,
            command.payload.workOrderId,
            command.tenantId,
          );
          assertEditable(current);
          assertCanComplete(current, command.payload);

          const photoValidation = await tx.media.assertRequiredPhotos(
            current.id,
            command.payload.requiredPhotoIds,
          );
          if (photoValidation.missingCategories.length > 0) {
            throw new ApiError(
              "REQUIRED_PHOTO_MISSING",
              "Required photo evidence is missing",
              photoValidation,
            );
          }
          if (photoValidation.failedValidationIds.length > 0) {
            throw new ApiError(
              "VALIDATION_FAILED",
              "Photo validation failed",
              photoValidation,
            );
          }

          for (const material of command.payload.materials) {
            await assertStockAvailable(tx, material);
          }

          if (current.approvalRequired && !current.approvalGranted) {
            const approved = await tx.approvals.assertApproved(current.id);
            if (!approved) {
              throw new ApiError(
                "APPROVAL_REQUIRED",
                "Approval is required before completion",
                {
                  workOrderId: current.id,
                },
              );
            }
          }

          await tx.workOrders.attachMaterialUsage(
            current.id,
            command.payload.materials,
          );
          for (const material of command.payload.materials) {
            await tx.inventory.writeOff({
              ...material,
              tenantId: command.tenantId,
              workOrderId: current.id,
              idempotencyKey: `${command.idempotencyKey}:writeoff:${material.materialId}:${material.warehouseId}`,
            });
          }

          const completed = await tx.workOrders.setCompleted(
            current.id,
            command.payload.signatureId,
            expectedVersion(command, current),
          );
          await tx.sync.markOperationsApplied(
            command.payload.offlineOperationIds,
            command.commandId,
          );

          await tx.audit.append([
            {
              tenantId: command.tenantId,
              actorUserId: command.actorUserId,
              action: "work_order.completed",
              entityType: "WorkOrder",
              entityId: current.id,
              before: { status: current.status, version: current.version },
              after: {
                status: completed.status,
                version: completed.version,
                completedAt: command.payload.completedAt,
              },
              metadata: {
                materialLines: command.payload.materials.length,
                photoCount: command.payload.requiredPhotoIds.length,
              },
            },
          ]);

          await tx.outbox.append([
            event(
              command.tenantId,
              "WorkOrder",
              current.id,
              "WorkOrderCompleted",
              {
                completedAt: command.payload.completedAt,
                actorUserId: command.actorUserId,
              },
            ),
            event(
              command.tenantId,
              "WorkOrder",
              current.id,
              "MaterialWrittenOff",
              {
                materials: command.payload.materials,
              },
            ),
            event(
              command.tenantId,
              "WorkOrder",
              current.id,
              "SLATimerStopped",
              {
                previousState: current.slaState,
              },
            ),
          ]);

          await tx.jobs.enqueue([
            {
              queue: "pdf-generation",
              jobName: "GenerateWorkOrderPdf",
              dedupeKey: `pdf:work-order:${current.id}:v${completed.version}`,
              priority: "high",
              payload: {
                workOrderId: current.id,
                tenantId: command.tenantId,
                version: completed.version,
              },
            },
            {
              queue: "notifications",
              jobName: "SendCompletionNotifications",
              dedupeKey: `notify:complete:${current.id}:v${completed.version}`,
              priority: "normal",
              payload: { workOrderId: current.id, tenantId: command.tenantId },
            },
            {
              queue: "sync-operations",
              jobName: "BuildDelta",
              dedupeKey: `delta:work-order:${current.id}:v${completed.version}`,
              priority: "normal",
              payload: {
                aggregateType: "WorkOrder",
                aggregateId: current.id,
                version: completed.version,
              },
            },
          ]);

          return completed;
        }),
    );
  }
}

export class MediaApplicationService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly permissions: PermissionEvaluator,
    private readonly idempotency: IdempotencyStore,
  ) {}

  async createUploadIntent(command: CommandEnvelope<UploadIntentPayload>) {
    await this.permissions.assert(
      command.actorUserId,
      command.tenantId,
      "media:write",
      {
        ownerType: command.payload.ownerType,
        ownerId: command.payload.ownerId,
      },
    );

    return this.idempotency.start(
      command.idempotencyKey,
      "CreateMediaUploadIntent",
      () =>
        this.uow.transaction(async (tx) => {
          const storageKey = buildStorageKey(command.tenantId, command.payload);
          const intent = await tx.media.createUploadIntent({
            ...command.payload,
            tenantId: command.tenantId,
            actorUserId: command.actorUserId,
            storageKey,
          });
          await tx.outbox.append([
            event(
              command.tenantId,
              "MediaFile",
              intent.mediaId,
              "MediaUploadIntentCreated",
              {
                ownerType: command.payload.ownerType,
                ownerId: command.payload.ownerId,
                category: command.payload.category,
              },
            ),
          ]);
          return intent;
        }),
    );
  }
}

export const BACKGROUND_WORKERS: QueueJobEnvelope[] = [
  {
    queue: "media-processing",
    jobName: "CompressImage",
    dedupeKey: "media:{mediaId}:compress:v1",
    priority: "normal",
    payload: { retry: "chunk-aware", output: "webp + original archive" },
  },
  {
    queue: "ai-validation",
    jobName: "ValidatePhotoQuality",
    dedupeKey: "media:{mediaId}:ai-quality:v1",
    priority: "normal",
    payload: {
      checks: [
        "blur",
        "darkness",
        "duplicate",
        "wrong-object",
        "required-shot",
      ],
    },
  },
  {
    queue: "ocr",
    jobName: "RunDocumentOCR",
    dedupeKey: "media:{mediaId}:ocr:v1",
    priority: "low",
    payload: {
      targets: ["serial-number", "work-order-number", "elevator-plate"],
    },
  },
  {
    queue: "notifications",
    jobName: "EscalateSLAAlert",
    dedupeKey: "sla:{slaEventId}:escalation:{level}",
    priority: "critical",
    payload: { channels: ["in-app", "push", "email", "telegram-ready"] },
  },
  {
    queue: "sync-operations",
    jobName: "ApplyOfflineOperation",
    dedupeKey: "sync:{deviceId}:{operationId}",
    priority: "high",
    payload: { conflictPolicy: "base-version + merge-rule + human-resolution" },
  },
];

async function requireWorkOrder(
  tx: TransactionClient,
  workOrderId: string,
  tenantId: string,
) {
  const workOrder = await tx.workOrders.findForUpdate(workOrderId, tenantId);
  if (!workOrder) {
    throw new ApiError("VALIDATION_FAILED", "Work order not found", {
      workOrderId,
    });
  }
  return workOrder;
}

function assertEditable(workOrder: WorkOrderSnapshot) {
  if (workOrder.status === "CLOSED" || workOrder.status === "ARCHIVED") {
    throw new ApiError(
      "VALIDATION_FAILED",
      "Closed or archived work orders are immutable",
      {
        status: workOrder.status,
      },
    );
  }
}

function assertCanComplete(
  workOrder: WorkOrderSnapshot,
  payload: CompleteWorkOrderPayload,
) {
  if (payload.workItems.length === 0) {
    throw new ApiError(
      "VALIDATION_FAILED",
      "At least one work item is required",
    );
  }
  if (!payload.signatureId) {
    throw new ApiError("SIGNATURE_REQUIRED", "Customer signature is required");
  }
  const missingCategories = workOrder.requiredPhotoCategories.filter(
    (category) => !workOrder.attachedPhotoCategories.includes(category),
  );
  if (missingCategories.length > 0) {
    throw new ApiError(
      "REQUIRED_PHOTO_MISSING",
      "Required photo categories are missing",
      { missingCategories },
    );
  }
}

async function assertStockAvailable(
  tx: TransactionClient,
  material: WorkOrderMaterialInput,
) {
  const stock = await tx.inventory.getAvailabilityForUpdate(
    material.materialId,
    material.warehouseId,
  );
  if (!stock || stock.available < material.quantity) {
    throw new ApiError(
      "STOCK_NOT_AVAILABLE",
      "Material stock is not available for write-off",
      {
        materialId: material.materialId,
        warehouseId: material.warehouseId,
        requested: material.quantity,
        available: stock?.available ?? 0,
      },
    );
  }
}

function expectedVersion<TPayload>(
  command: CommandEnvelope<TPayload>,
  current: WorkOrderSnapshot,
) {
  if (
    command.baseVersion !== undefined &&
    command.baseVersion !== current.version
  ) {
    throw new ApiError(
      "CONFLICT_DETECTED",
      "Command base version does not match aggregate version",
      {
        baseVersion: command.baseVersion,
        currentVersion: current.version,
      },
    );
  }
  return current.version;
}

function buildStorageKey(tenantId: string, payload: UploadIntentPayload) {
  const safeName = payload.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const date = payload.capturedAt.slice(0, 10);
  return `tenants/${tenantId}/media/${payload.ownerType}/${payload.ownerId}/${date}/${payload.checksumSha256}-${safeName}`;
}

export type ApplicationServiceRegistry = {
  workOrders: WorkOrderApplicationService;
  media: MediaApplicationService;
};

export type OperationalServiceName =
  | "WorkOrderService"
  | "DispatchService"
  | "WarehouseService"
  | "InventoryReservationService"
  | "MediaService"
  | "NotificationService"
  | "SLAService"
  | "EmergencyService"
  | "ApprovalService"
  | "SyncService"
  | "AuthService"
  | "ReportingService"
  | "GeoService"
  | "AuditService";

export type ServiceResponsibility = {
  service: OperationalServiceName;
  owns: string[];
  transactionBoundary: string;
  publishes: string[];
};

export const OPERATIONAL_SERVICES: ServiceResponsibility[] = [
  {
    service: "WorkOrderService",
    owns: [
      "create",
      "assign",
      "accept",
      "start",
      "add materials",
      "complete",
      "close",
    ],
    transactionBoundary:
      "WorkOrder mutation, material usage, SLA state, audit and outbox in one unit of work.",
    publishes: [
      "WorkOrderCreated",
      "WorkOrderAssigned",
      "WorkOrderCompleted",
      "WorkOrderClosed",
    ],
  },
  {
    service: "InventoryReservationService",
    owns: [
      "reserve",
      "write-off",
      "release",
      "transfer",
      "optimistic stock version checks",
    ],
    transactionBoundary:
      "Stock row SELECT FOR UPDATE + movement ledger + idempotency key.",
    publishes: ["MaterialReserved", "MaterialWrittenOff", "LowStockDetected"],
  },
  {
    service: "MediaService",
    owns: [
      "signed upload intents",
      "confirm upload",
      "attach evidence",
      "processing jobs",
    ],
    transactionBoundary:
      "Media metadata and outbox only; S3 upload is outside DB transaction via signed URL.",
    publishes: [
      "MediaUploadIntentCreated",
      "PhotoUploaded",
      "MediaProcessingRequested",
    ],
  },
  {
    service: "SLAService",
    owns: ["timers", "breach prediction", "escalations", "emergency overrides"],
    transactionBoundary: "SLA event + notification outbox + escalation audit.",
    publishes: ["SLARiskDetected", "SLAExceeded", "EscalationTriggered"],
  },
  {
    service: "SyncService",
    owns: ["operation replay", "delta sync", "conflicts", "device snapshots"],
    transactionBoundary:
      "One offline operation replay with base-version check and conflict record.",
    publishes: ["SyncApplied", "SyncConflictDetected", "SyncFailed"],
  },
  {
    service: "DispatchService",
    owns: [
      "assignment",
      "reassignment",
      "shift validation",
      "workload balancing",
    ],
    transactionBoundary:
      "Assignment + schedule slot + dispatch event + notification job.",
    publishes: [
      "DispatchSuggested",
      "AssignmentConfirmed",
      "ReassignmentRequested",
    ],
  },
];
