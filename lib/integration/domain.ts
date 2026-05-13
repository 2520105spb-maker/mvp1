export type Role =
  | "mechanic"
  | "dispatcher"
  | "warehouse"
  | "supervisor"
  | "director"
  | "administrator";

export type Session = {
  id: string;
  userId: string;
  role: Role;
  displayName: string;
  createdAt: string;
  expiresAt: string;
};

export type ElevatorObject = {
  id: string;
  address: string;
  customer: string;
  region: string;
  status: "active" | "sla_risk" | "emergency";
  assignedMechanicId: string;
};

export type Elevator = {
  id: string;
  objectId: string;
  number: string;
  factoryNumber: string;
  model: string;
  controller: string;
  status: "active" | "maintenance" | "emergency";
};

export type WorkOrderStatus =
  | "draft"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "waiting_approval"
  | "completed"
  | "closed";
export type WorkOrderPriority = "low" | "medium" | "high" | "critical";
export type WorkItem = {
  id: string;
  action: string;
  element: string;
  quantity: number;
};
export type MaterialLine = {
  id: string;
  materialId: string;
  name: string;
  warehouseId: string;
  quantity: number;
  reserved: boolean;
  writtenOff: boolean;
};
export type PhotoLine = {
  id: string;
  category: "installed" | "removed" | "document" | "before" | "after";
  url: string;
  status: "queued" | "uploaded" | "validated" | "failed";
};

export type WorkOrder = {
  id: string;
  number: string;
  objectId: string;
  elevatorId: string;
  mechanicId?: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  title: string;
  workItems: WorkItem[];
  materials: MaterialLine[];
  photos: PhotoLine[];
  signature?: { signer: string; dataUrl: string; signedAt: string };
  slaDueAt: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type Material = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  minLevel: number;
};
export type StockBalance = {
  materialId: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
};
export type Movement = {
  id: string;
  materialId: string;
  warehouseId: string;
  workOrderId?: string;
  type: "reservation" | "write_off" | "return";
  quantity: number;
  createdAt: string;
};
export type MediaFile = {
  id: string;
  ownerType: "work_order" | "elevator" | "incident";
  ownerId: string;
  category: string;
  fileName: string;
  status: "pending" | "uploaded" | "validated";
  url: string;
  createdAt: string;
};
export type Notification = {
  id: string;
  userId?: string;
  role?: Role;
  type: "assignment" | "sla" | "emergency" | "sync";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};
export type EmergencyIncident = {
  id: string;
  workOrderId: string;
  priority: "critical" | "high";
  status: "new" | "assigned" | "en_route" | "resolved";
  slaDueAt: string;
  assignedMechanicId?: string;
  createdAt: string;
};
export type SyncOperation = {
  id: string;
  deviceId: string;
  entity: "work_order" | "media" | "material";
  operation: string;
  payload: unknown;
  status: "queued" | "applied" | "conflict";
  createdAt: string;
  baseVersion?: number;
  idempotencyKey?: string;
};
export type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  actorUserId?: string;
  createdAt: string;
  before?: unknown;
  after?: unknown;
};
export type DomainEvent = {
  id: string;
  type: string;
  entityId: string;
  payload: unknown;
  createdAt: string;
  published: boolean;
};

export type OperationalState = {
  sessions: Session[];
  objects: ElevatorObject[];
  elevators: Elevator[];
  workOrders: WorkOrder[];
  materials: Material[];
  stock: StockBalance[];
  movements: Movement[];
  media: MediaFile[];
  notifications: Notification[];
  emergency: EmergencyIncident[];
  syncOperations: SyncOperation[];
  auditLogs: AuditLog[];
  events: DomainEvent[];
};

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_FAILED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "STOCK_ERROR"
  | "REQUIRED_PHOTO_MISSING"
  | "SIGNATURE_REQUIRED"
  | "UPLOAD_ERROR";

export class DomainError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
