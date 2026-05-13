export type BackendModule =
  | "operations"
  | "inventory"
  | "media"
  | "notifications"
  | "sla"
  | "identity"
  | "audit"
  | "sync"
  | "reporting"
  | "configuration";

export type AggregateDefinition = {
  name: string;
  module: BackendModule;
  responsibility: string;
  invariants: string[];
  commands: string[];
  events: string[];
};

export const CORE_AGGREGATES: AggregateDefinition[] = [
  {
    name: "WorkOrder",
    module: "operations",
    responsibility:
      "Управляет жизненным циклом заказ-наряда, назначением, SLA, материалами, фото, подписями и offline sync версией.",
    invariants: [
      "Нельзя закрыть без обязательных фото",
      "Нельзя редактировать CLOSED/ARCHIVED",
      "Нельзя завершить SLA без обязательной подписи",
      "Нельзя списать материалы без резерва или approval",
    ],
    commands: [
      "CreateWorkOrder",
      "AssignTechnician",
      "AcceptWork",
      "StartWork",
      "RequestMaterials",
      "CompleteWork",
      "CloseWorkOrder",
    ],
    events: [
      "WorkOrderCreated",
      "WorkOrderAssigned",
      "WorkStarted",
      "MaterialReserved",
      "PhotoUploaded",
      "ApprovalRequested",
      "WorkOrderClosed",
    ],
  },
  {
    name: "Inventory",
    module: "inventory",
    responsibility:
      "Контролирует склады, остатки, резервы и движения материалов с idempotency и транзакционными ограничениями stock.",
    invariants: [
      "Нельзя зарезервировать больше available stock",
      "Каждое движение имеет idempotency key",
      "Коррекция склада порождает audit record",
    ],
    commands: [
      "ReserveMaterial",
      "WriteOffMaterial",
      "TransferStock",
      "AdjustStock",
    ],
    events: [
      "MaterialReserved",
      "MaterialWrittenOff",
      "StockAdjusted",
      "LowStockDetected",
    ],
  },
  {
    name: "MediaFile",
    module: "media",
    responsibility:
      "Управляет signed upload, обработкой фото, OCR, AI validation и привязкой evidence к заказ-нарядам/лифтам.",
    invariants: [
      "Checksum обязателен перед READY",
      "Required photo закрывает requirement только после AI/quality validation",
      "Удаление заменяется soft archive",
    ],
    commands: [
      "CreateUploadIntent",
      "ConfirmUpload",
      "ProcessMedia",
      "AttachToWorkOrder",
    ],
    events: [
      "PhotoUploaded",
      "MediaProcessed",
      "AIValidationCompleted",
      "OCRCompleted",
    ],
  },
  {
    name: "SyncOperation",
    module: "sync",
    responsibility:
      "Принимает offline операции устройств, применяет idempotency, delta cursors, conflict tracking и snapshots.",
    invariants: [
      "Одна idempotency key применяется один раз",
      "Conflict не применяет patch без resolution",
      "Base version проверяется перед write",
    ],
    commands: [
      "SubmitOfflineOperation",
      "ApplyDelta",
      "ResolveConflict",
      "CreateSnapshot",
    ],
    events: [
      "SyncOperationQueued",
      "SyncApplied",
      "SyncConflictDetected",
      "SyncFailed",
    ],
  },
  {
    name: "Approval",
    module: "configuration",
    responsibility:
      "Оркестрирует approvals для дорогих материалов, рискованных закрытий, overtime и критических изменений.",
    invariants: [
      "Requester не может approve собственный high-risk запрос",
      "Просроченный approval эскалируется",
      "Rejected approval блокирует dependent command",
    ],
    commands: ["RequestApproval", "Approve", "Reject", "EscalateApproval"],
    events: [
      "ApprovalRequested",
      "ApprovalGranted",
      "ApprovalRejected",
      "ApprovalEscalated",
    ],
  },
];

export const WORK_ORDER_STATE_MACHINE = [
  "DRAFT",
  "ASSIGNED",
  "ACCEPTED",
  "IN_PROGRESS",
  "WAITING_MATERIALS",
  "WAITING_APPROVAL",
  "COMPLETED",
  "REJECTED",
  "CLOSED",
  "ARCHIVED",
] as const;

export const DOMAIN_EVENTS = [
  "WorkOrderCreated",
  "WorkStarted",
  "MaterialReserved",
  "MaterialWrittenOff",
  "PhotoUploaded",
  "SLAExceeded",
  "EmergencyTriggered",
  "SyncFailed",
  "ApprovalRequested",
  "NotificationQueued",
  "PdfGenerationRequested",
] as const;
