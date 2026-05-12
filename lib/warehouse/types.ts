export type WarehouseType = "main" | "regional" | "mobile" | "object" | "quarantine";
export type MovementType = "receipt" | "reservation" | "write_off" | "transfer" | "return" | "adjustment" | "audit_correction";
export type MovementStatus = "draft" | "pending" | "approved" | "rejected" | "posted" | "conflict";
export type StockRisk = "normal" | "low" | "critical" | "over_reserved" | "dead_stock";
export type WriteOffRisk = "normal" | "suspicious" | "blocking";
export type AuditStatus = "scheduled" | "scanning" | "recount" | "approval" | "closed";

export type Warehouse = {
  id: string;
  name: string;
  type: WarehouseType;
  region: string;
  address: string;
  manager: string;
  online: boolean;
};

export type WarehouseZone = {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  temperatureControl: boolean;
  qrPrefix: string;
};

export type MaterialCategory = {
  id: string;
  name: string;
  criticalForSla: boolean;
  approvalRequired: boolean;
};

export type Supplier = {
  id: string;
  name: string;
  leadTimeDays: number;
  reliability: number;
  priceIndex: number;
  contacts: string;
};

export type Material = {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  categoryId: string;
  unit: string;
  manufacturer: string;
  compatibleElevators: string[];
  defaultSupplierId: string;
  highCost: boolean;
  emergencyPart: boolean;
};

export type StockLevel = {
  id: string;
  materialId: string;
  warehouseId: string;
  zoneId: string;
  onHand: number;
  reserved: number;
  min: number;
  max: number;
  lastMovementAt: string;
  risk: StockRisk;
};

export type Reservation = {
  id: string;
  materialId: string;
  warehouseId: string;
  workOrderId: string;
  mechanicId: string;
  quantity: number;
  status: "pending" | "confirmed" | "issued" | "expired" | "cancelled";
  slaCritical: boolean;
  expiresAt: string;
};

export type MaterialMovement = {
  id: string;
  materialId: string;
  warehouseId: string;
  type: MovementType;
  status: MovementStatus;
  quantity: number;
  actor: string;
  workOrderId?: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  photoRequired: boolean;
  photoAttached: boolean;
  createdAt: string;
  reason: string;
};

export type WriteOff = {
  id: string;
  materialId: string;
  workOrderId: string;
  mechanicId: string;
  quantity: number;
  risk: WriteOffRisk;
  validationMessages: string[];
  photoAttached: boolean;
  approvedBy?: string;
};

export type Transfer = {
  id: string;
  materialId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  eta: string;
  status: MovementStatus;
};

export type PurchaseRequest = {
  id: string;
  materialId: string;
  supplierId: string;
  quantity: number;
  status: "suggested" | "approval" | "ordered" | "in_transit" | "received";
  expectedAt: string;
  reason: string;
};

export type InventoryAudit = {
  id: string;
  warehouseId: string;
  status: AuditStatus;
  scheduledAt: string;
  scanned: number;
  expected: number;
  discrepancies: number;
  approvalRequired: boolean;
};

export type QRLabel = {
  id: string;
  materialId: string;
  payload: string;
  labelType: "material" | "bin" | "work_order" | "elevator_linked";
  lastScannedAt: string;
};

export type MaterialUsageHistory = {
  id: string;
  materialId: string;
  objectAddress: string;
  elevatorFactoryNumber: string;
  workOrderId: string;
  usedAt: string;
  failurePattern?: string;
};

export type WarehouseAlert = {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  type: "low_stock" | "reservation" | "audit" | "suspicious_usage" | "delivery" | "conflict";
};

export type WarehouseAiInsight = {
  id: string;
  title: string;
  description: string;
  confidence: number;
  category: "forecast_shortage" | "suspicious_writeoff" | "dead_stock" | "procurement_optimization" | "unusual_usage";
};

export type InventoryRow = {
  material: Material;
  category: MaterialCategory;
  stock: StockLevel;
  warehouse: Warehouse;
  available: number;
  latestMovement?: MaterialMovement;
};
