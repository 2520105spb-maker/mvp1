export type MediaKind =
  | "photo"
  | "document"
  | "pdf"
  | "report"
  | "schematic"
  | "certificate"
  | "manual";
export type PhotoType =
  | "before"
  | "after"
  | "replacement"
  | "removed_part"
  | "node"
  | "emergency"
  | "serial_plate"
  | "document_scan";
export type UploadStatus =
  | "local_cached"
  | "queued"
  | "uploading"
  | "synced"
  | "failed"
  | "conflict";
export type AiValidationStatus =
  | "pending"
  | "passed"
  | "warning"
  | "failed"
  | "manual_review";
export type AttachmentEntity =
  | "work_order"
  | "elevator"
  | "node"
  | "material"
  | "emergency_event"
  | "inspection"
  | "object";
export type StorageTier = "hot" | "warm" | "archive";
export type ProcessingStage =
  | "received"
  | "compressed"
  | "thumbnail_ready"
  | "exif_extracted"
  | "ocr_complete"
  | "ai_validated"
  | "watermarked"
  | "published";

export type MediaFile = {
  id: string;
  kind: MediaKind;
  photoType?: PhotoType;
  title: string;
  objectId: string;
  objectAddress: string;
  elevatorId?: string;
  elevatorFactoryNumber?: string;
  nodeId?: string;
  nodeName?: string;
  workOrderId?: string;
  mechanicId?: string;
  mechanicName?: string;
  emergencyEventId?: string;
  attachmentEntity: AttachmentEntity;
  uploadStatus: UploadStatus;
  aiStatus: AiValidationStatus;
  createdAt: string;
  capturedAt: string;
  sizeMb: number;
  mimeType: string;
  checksum: string;
  storageKey: string;
  thumbnailKey: string;
  storageTier: StorageTier;
  offlineCached: boolean;
  tags: string[];
  processing: ProcessingStage[];
};

export type PhotoSession = {
  id: string;
  workOrderId: string;
  mechanicId: string;
  objectAddress: string;
  elevatorFactoryNumber: string;
  scenario:
    | "work_fixation"
    | "before_after"
    | "emergency"
    | "inspection"
    | "node_diagnostics";
  requiredPhotoTypes: PhotoType[];
  capturedPhotoIds: string[];
  missingPhotoTypes: PhotoType[];
  completion: number;
  offline: boolean;
  startedAt: string;
  lastActivityAt: string;
};

export type UploadQueueItem = {
  id: string;
  mediaFileId: string;
  localIndexedDbKey: string;
  status: UploadStatus;
  progress: number;
  retryCount: number;
  nextRetryAt?: string;
  chunkCount: number;
  uploadedChunks: number;
  priority: "low" | "normal" | "high" | "emergency";
  network: "wifi" | "cellular" | "offline";
  error?: string;
};

export type DocumentRecord = {
  id: string;
  title: string;
  kind:
    | "passport"
    | "manual"
    | "schematic"
    | "act"
    | "certificate"
    | "invoice"
    | "service_report"
    | "audit_report";
  objectId: string;
  elevatorId?: string;
  mediaFileId: string;
  version: number;
  permission: "mechanic" | "supervisor" | "director" | "restricted";
  ocrStatus: "not_required" | "queued" | "complete" | "failed";
  signedUrlTtlMinutes: number;
};

export type PdfReport = {
  id: string;
  reportType: "work_order" | "service" | "audit" | "inspection" | "emergency";
  sourceEntityId: string;
  status: "draft" | "generating" | "ready" | "exported" | "failed";
  pageCount: number;
  mediaFileIds: string[];
  generatedAt?: string;
  exportedTo?: "customer_email" | "edo" | "archive" | "api";
};

export type MediaAnnotation = {
  id: string;
  mediaFileId: string;
  author: string;
  type: "arrow" | "box" | "text" | "measurement" | "defect_marker";
  label: string;
  severity?: "info" | "warning" | "critical";
  createdAt: string;
};

export type AiValidationResult = {
  id: string;
  mediaFileId: string;
  status: AiValidationStatus;
  confidence: number;
  checks: Array<{
    code:
      | "blur"
      | "dark"
      | "duplicate"
      | "wrong_object"
      | "unreadable_document"
      | "missing_required"
      | "serial_mismatch";
    passed: boolean;
    message: string;
  }>;
  recommendation: string;
  createdAt: string;
};

export type OfflineMediaCache = {
  id: string;
  deviceId: string;
  mechanicId: string;
  mediaFileIds: string[];
  indexedDbUsedMb: number;
  maxMb: number;
  pendingUploads: number;
  lastBackgroundSyncAt: string;
  serviceWorkerState: "ready" | "syncing" | "blocked" | "unsupported";
};

export type MediaVersion = {
  id: string;
  mediaFileId: string;
  version: number;
  reason:
    | "original"
    | "compressed"
    | "watermarked"
    | "annotated"
    | "ocr_layer"
    | "redacted";
  storageKey: string;
  createdAt: string;
};

export type RequirementTemplate = {
  id: string;
  workType: string;
  requiredPhotoTypes: PhotoType[];
  minPhotos: number;
  aiChecks: string[];
};

export type MediaAlert = {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  type:
    | "failed_upload"
    | "missing_photo"
    | "ai_validation"
    | "pending_sync"
    | "storage"
    | "security";
};

export type MediaRecommendation = {
  id: string;
  title: string;
  description: string;
  confidence: number;
  category:
    | "defect_detection"
    | "auto_classification"
    | "ocr"
    | "report_generation"
    | "storage_optimization";
};

export type MediaGridRow = {
  media: MediaFile;
  session?: PhotoSession;
  ai?: AiValidationResult;
  queue?: UploadQueueItem;
};
