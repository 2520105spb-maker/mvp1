export type ImportEntityType = "elevators" | "objects" | "warehouse" | "customers" | "users" | "contracts" | "mdm";
export type ImportFileType = "xlsx" | "csv" | "zip" | "multi_sheet_xlsx";
export type ImportStage = "upload" | "mapping" | "validation" | "preview" | "import" | "report";
export type ImportJobStatus = "draft" | "analyzing" | "mapping" | "validating" | "ready" | "queued" | "running" | "completed" | "completed_with_warnings" | "failed" | "rolled_back";
export type ValidationSeverity = "blocking" | "warning" | "info";
export type DuplicateConfidence = "low" | "medium" | "high" | "critical";
export type RecordAction = "create" | "update" | "reject" | "review";

export type FileUpload = {
  id: string;
  name: string;
  fileType: ImportFileType;
  sizeMb: number;
  sheets: string[];
  checksum: string;
  uploadedBy: string;
  uploadedAt: string;
  virusScan: "pending" | "clean" | "infected";
  chunkCount: number;
};

export type DataSource = {
  id: string;
  name: string;
  entityType: ImportEntityType;
  origin: "excel" | "csv" | "zip" | "api" | "legacy_erp";
  reliabilityScore: number;
};

export type ImportTemplate = {
  id: string;
  name: string;
  entityType: ImportEntityType;
  fileType: ImportFileType;
  version: string;
  requiredFields: string[];
  optionalFields: string[];
  owner: string;
  lastUsedAt: string;
};

export type ImportMapping = {
  id: string;
  sourceColumn: string;
  targetField: string;
  confidence: number;
  transform: "none" | "trim" | "uppercase" | "normalize_address" | "normalize_phone" | "sku_lookup" | "dictionary_lookup";
  required: boolean;
  status: "auto" | "confirmed" | "needs_review";
};

export type ValidationError = {
  id: string;
  row: number;
  field: string;
  message: string;
  severity: ValidationSeverity;
  rule: string;
  suggestion: string;
};

export type DuplicateCandidate = {
  id: string;
  row: number;
  entityType: ImportEntityType;
  importedValue: string;
  existingValue: string;
  confidence: DuplicateConfidence;
  reason: string;
  resolution: "merge" | "skip" | "create_new" | "manual_review";
};

export type ImportPreviewRecord = {
  id: string;
  row: number;
  entity: string;
  action: RecordAction;
  confidence: number;
  affectedObject: string;
  warnings: number;
};

export type RollbackSnapshot = {
  id: string;
  jobId: string;
  createdAt: string;
  protectedUntil: string;
  recordsCaptured: number;
  status: "available" | "locked" | "restored" | "expired";
};

export type ImportJob = {
  id: string;
  number: string;
  name: string;
  entityType: ImportEntityType;
  status: ImportJobStatus;
  stage: ImportStage;
  progress: number;
  file: FileUpload;
  dataSource: DataSource;
  template: ImportTemplate;
  mappings: ImportMapping[];
  validationErrors: ValidationError[];
  duplicates: DuplicateCandidate[];
  preview: ImportPreviewRecord[];
  rollbackSnapshot?: RollbackSnapshot;
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  stats: {
    totalRows: number;
    creates: number;
    updates: number;
    rejected: number;
    reviewRequired: number;
    affectedRecords: number;
  };
};

export type QueueWorker = {
  id: string;
  name: string;
  queue: "parse" | "validate" | "deduplicate" | "normalize" | "transactional_import" | "rollback";
  status: "idle" | "busy" | "failed";
  throughputPerMinute: number;
  retryCount: number;
};

export type MasterDataReference = {
  id: string;
  name: string;
  domain: "elevator_types" | "manufacturers" | "work_types" | "materials" | "nodes" | "emergency_categories" | "sla_categories" | "object_types";
  records: number;
  version: string;
  dependencies: string[];
  usage: number;
  warnings: string[];
};
