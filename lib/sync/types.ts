export type NetworkQuality = "online" | "weak" | "unstable" | "offline";
export type SyncPriority =
  | "emergency"
  | "work_order"
  | "signature"
  | "material"
  | "media"
  | "analytics";
export type OperationStatus =
  | "draft"
  | "queued"
  | "syncing"
  | "synced"
  | "failed"
  | "conflict"
  | "rolled_back";
export type SyncMode =
  | "full"
  | "delta"
  | "background"
  | "priority"
  | "emergency"
  | "media";
export type EntityType =
  | "work_order"
  | "elevator"
  | "object"
  | "material"
  | "photo"
  | "document"
  | "signature"
  | "draft"
  | "inspection";
export type ConflictStatus =
  | "detected"
  | "diff_ready"
  | "mechanic_review"
  | "supervisor_review"
  | "resolved"
  | "rolled_back";
export type RetryStrategy =
  | "exponential_backoff"
  | "network_aware"
  | "priority_boost"
  | "manual_recovery";

export type OfflineQueueItem = {
  id: string;
  operationId: string;
  entityType: EntityType;
  entityId: string;
  priority: SyncPriority;
  status: OperationStatus;
  createdAt: string;
  lastAttemptAt?: string;
  retryCount: number;
  nextRetryAt?: string;
  payloadBytes: number;
  encrypted: boolean;
  idempotencyKey: string;
};

export type SyncEvent = {
  id: string;
  sessionId: string;
  type:
    | "network_changed"
    | "sync_started"
    | "operation_sent"
    | "media_chunk_uploaded"
    | "conflict_detected"
    | "retry_scheduled"
    | "sync_completed"
    | "device_locked";
  message: string;
  severity: "info" | "warning" | "critical";
  createdAt: string;
};

export type PendingOperation = {
  id: string;
  entityType: EntityType;
  action:
    | "create"
    | "update"
    | "delete"
    | "upload"
    | "sign"
    | "write_off"
    | "close";
  entityId: string;
  workOrderId?: string;
  priority: SyncPriority;
  status: OperationStatus;
  baseVersion: number;
  localVersion: number;
  serverVersion?: number;
  createdBy: string;
  createdAt: string;
  localPatchSummary: string;
};

export type FailedUpload = {
  id: string;
  mediaId: string;
  workOrderId: string;
  chunksTotal: number;
  chunksUploaded: number;
  lastError: string;
  retryPolicyId: string;
  resumableToken: string;
  priority: SyncPriority;
};

export type LocalDraft = {
  id: string;
  entityType: EntityType;
  entityId: string;
  title: string;
  completion: number;
  dirtyFields: string[];
  encryptedBlobKey: string;
  updatedAt: string;
  expiresAt: string;
};

export type ConflictRecord = {
  id: string;
  entityType: EntityType;
  entityId: string;
  workOrderId?: string;
  status: ConflictStatus;
  localVersion: number;
  serverVersion: number;
  localChangedBy: string;
  serverChangedBy: string;
  detectedAt: string;
  diff: Array<{
    field: string;
    local: string;
    server: string;
    policy: "server_wins" | "client_wins" | "merge" | "manual";
  }>;
  suggestedResolution: string;
};

export type SyncSession = {
  id: string;
  deviceId: string;
  mechanicId: string;
  mode: SyncMode;
  status: "idle" | "running" | "paused" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  uploaded: number;
  downloaded: number;
  conflicts: number;
  networkQuality: NetworkQuality;
};

export type LocalMediaCache = {
  id: string;
  deviceId: string;
  mediaCount: number;
  usedMb: number;
  maxMb: number;
  compressionQueue: number;
  uploadQueue: number;
  oldestUnsyncedAt: string;
  survivesRestart: boolean;
};

export type RetryPolicy = {
  id: string;
  name: string;
  strategy: RetryStrategy;
  maxRetries: number;
  baseDelaySeconds: number;
  maxDelaySeconds: number;
  requiresWifi: boolean;
  pausesOnWeakNetwork: boolean;
};

export type DeltaUpdate = {
  id: string;
  entityType: EntityType;
  cursor: string;
  serverVersion: number;
  changedAt: string;
  records: number;
  applied: boolean;
};

export type SyncSnapshot = {
  id: string;
  deviceId: string;
  cursor: string;
  capturedAt: string;
  workOrders: number;
  elevators: number;
  objects: number;
  materials: number;
  documents: number;
  checksum: string;
};

export type DeviceState = {
  id: string;
  deviceName: string;
  mechanicId: string;
  authorized: boolean;
  networkQuality: NetworkQuality;
  battery: number;
  storageUsedMb: number;
  storageLimitMb: number;
  lastSeenAt: string;
  websocket: "connected" | "reconnecting" | "disconnected";
  serviceWorker: "active" | "installing" | "stale" | "blocked";
  backgroundSync: "available" | "running" | "denied" | "unsupported";
};

export type OfflineAuditLog = {
  id: string;
  deviceId: string;
  actor: string;
  action: string;
  entityType: EntityType;
  entityId: string;
  timestamp: string;
  hash: string;
  previousHash: string;
};

export type SyncDashboardRow = {
  operation: PendingOperation;
  queue?: OfflineQueueItem;
  conflict?: ConflictRecord;
};
