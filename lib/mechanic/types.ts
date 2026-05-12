export type MobileWorkOrderStatus = "assigned" | "accepted" | "en_route" | "on_site" | "in_progress" | "pending_signature" | "completed_offline" | "syncing" | "submitted";
export type MobileWorkOrderPriority = "normal" | "high" | "emergency";
export type OfflineEntity = "work_order" | "photo" | "signature" | "material_usage" | "elevator_card" | "document";
export type SyncEventStatus = "queued" | "uploading" | "failed" | "synced" | "conflict";
export type PhotoKind = "before" | "after" | "node" | "inspection" | "document";
export type PhotoValidationStatus = "valid" | "blurry" | "dark" | "duplicate" | "missing_required" | "pending_ai";

export type MobileWorkOrder = {
  id: string;
  number: string;
  title: string;
  objectAddress: string;
  elevatorId: string;
  elevatorFactoryNumber: string;
  priority: MobileWorkOrderPriority;
  status: MobileWorkOrderStatus;
  slaDueAt: string;
  plannedStart: string;
  estimatedMinutes: number;
  requiredPhotos: PhotoKind[];
  requiredMaterials: string[];
  offlineReady: boolean;
};

export type OfflineDraft = {
  id: string;
  workOrderId: string;
  entity: OfflineEntity;
  updatedAt: string;
  encrypted: boolean;
  conflictRisk: "none" | "low" | "high";
  sizeKb: number;
};

export type UploadQueueItem = {
  id: string;
  workOrderId: string;
  type: "photo" | "signature" | "pdf" | "voice_note";
  fileName: string;
  progress: number;
  status: SyncEventStatus;
  retryCount: number;
  compressed: boolean;
};

export type PhotoSession = {
  id: string;
  workOrderId: string;
  kind: PhotoKind;
  title: string;
  capturedAt: string;
  localUri: string;
  validation: PhotoValidationStatus;
  annotated: boolean;
  watermark: string;
};

export type MechanicRouteStop = {
  id: string;
  workOrderId: string;
  address: string;
  etaMinutes: number;
  traffic: "normal" | "heavy" | "blocked";
  distanceKm: number;
  current: boolean;
};

export type EmergencyCall = {
  id: string;
  workOrderId: string;
  title: string;
  address: string;
  receivedAt: string;
  vibrationPattern: string;
  accepted: boolean;
  etaMinutes: number;
};

export type MaterialUsage = {
  id: string;
  workOrderId: string;
  sku: string;
  name: string;
  quantity: number;
  unit: string;
  localStock: number;
  reserved: boolean;
  qr: string;
};

export type Signature = {
  id: string;
  workOrderId: string;
  signer: string;
  signedAt?: string;
  localVectorPath: string;
  validation: "missing" | "valid" | "too_small" | "offline_pending";
};

export type SyncEvent = {
  id: string;
  title: string;
  entity: OfflineEntity;
  status: SyncEventStatus;
  lastAttemptAt: string;
  nextRetryAt?: string;
  message: string;
};

export type OfflineCachePolicy = {
  indexedDbName: string;
  stores: string[];
  encryption: "device_bound_key" | "none";
  ttlHours: number;
  staleDataStrategy: string;
  conflictResolution: string;
};

export type ElevatorMobileCard = {
  id: string;
  factoryNumber: string;
  registrationNumber: string;
  model: string;
  controller: string;
  address: string;
  status: "active" | "maintenance" | "emergency" | "inspection_required";
  healthScore: number;
  lastRepairs: string[];
  nodes: Array<{ name: string; health: number; lastIssue?: string }>;
  documents: Array<{ title: string; type: "scheme" | "passport" | "manual" | "act"; offlineReady: boolean }>;
};
