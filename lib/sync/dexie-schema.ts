export const NEOLIFT_DEXIE_DB_NAME = "neolift-field-sync";
export const NEOLIFT_DEXIE_DB_VERSION = 4;

export const DEXIE_SCHEMA = {
  workOrders:
    "id, status, priority, updatedAt, serverVersion, localVersion, territoryId",
  elevators: "id, objectId, factoryNumber, updatedAt, serverVersion",
  objects: "id, regionId, territoryId, address, updatedAt, serverVersion",
  materials: "id, warehouseId, sku, updatedAt, serverVersion",
  photos: "id, workOrderId, mediaId, uploadStatus, createdAt, checksum",
  documents: "id, objectId, elevatorId, kind, updatedAt, serverVersion",
  drafts: "id, entityType, entityId, updatedAt, expiresAt",
  signatures: "id, workOrderId, signerId, uploadStatus, createdAt",
  pendingOperations:
    "id, entityType, entityId, priority, status, createdAt, idempotencyKey",
  offlineQueue: "id, operationId, priority, status, nextRetryAt, createdAt",
  conflictRecords: "id, entityType, entityId, status, detectedAt",
  syncEvents: "id, sessionId, type, severity, createdAt",
  auditLogs: "id, deviceId, entityType, entityId, timestamp, hash",
} as const;
