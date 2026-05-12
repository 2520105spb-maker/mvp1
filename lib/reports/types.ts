export type DocumentType =
  | "work_order"
  | "service_act"
  | "inspection_report"
  | "audit_report"
  | "emergency_report"
  | "material_writeoff_act"
  | "sla_report"
  | "warehouse_report"
  | "mechanic_performance";
export type GenerationStatus =
  | "draft"
  | "queued"
  | "rendering"
  | "ready"
  | "failed"
  | "archived"
  | "cancelled";
export type SignatureStatus =
  | "not_required"
  | "pending"
  | "mechanic_signed"
  | "customer_signed"
  | "manager_approved"
  | "digitally_signed"
  | "rejected";
export type ExportStatus =
  | "not_exported"
  | "queued"
  | "exporting"
  | "sent"
  | "failed"
  | "downloaded";
export type ExportFormat = "pdf" | "excel" | "csv" | "zip";
export type StorageTier = "hot" | "warm" | "archive";
export type TemplateBlockType =
  | "branding"
  | "dynamic_fields"
  | "table"
  | "photo_evidence"
  | "signature"
  | "qr"
  | "page_break"
  | "compliance_note";
export type PermissionScope =
  | "mechanic"
  | "dispatcher"
  | "warehouse"
  | "supervisor"
  | "director"
  | "customer_portal"
  | "restricted";

export type ReportTemplate = {
  id: string;
  name: string;
  documentType: DocumentType;
  version: number;
  locale: "ru-RU" | "en-US";
  brandProfile: string;
  blocks: TemplateBlockType[];
  supportsPrint: boolean;
  supportsQr: boolean;
  photoRequired: boolean;
  enabled: boolean;
};

export type GeneratedDocument = {
  id: string;
  documentType: DocumentType;
  title: string;
  objectId: string;
  objectAddress: string;
  customerName: string;
  elevatorId?: string;
  elevatorFactoryNumber?: string;
  workOrderId?: string;
  mechanicName?: string;
  createdAt: string;
  generatedAt?: string;
  version: number;
  generationStatus: GenerationStatus;
  signatureStatus: SignatureStatus;
  exportStatus: ExportStatus;
  templateId: string;
  pdfFileId?: string;
  storageTier: StorageTier;
  immutable: boolean;
};

export type WorkOrderReport = {
  id: string;
  documentId: string;
  workOrderId: string;
  workSummary: string;
  materialRows: number;
  photoEvidenceIds: string[];
  signatureBlockIds: string[];
  closeReady: boolean;
};

export type ServiceAct = {
  id: string;
  documentId: string;
  periodStart: string;
  periodEnd: string;
  customerName: string;
  workOrdersIncluded: number;
  totalAmount: string;
  signedByCustomer: boolean;
};

export type AuditReport = {
  id: string;
  documentId: string;
  auditScope: "object" | "warehouse" | "safety" | "sla" | "media";
  findings: number;
  criticalFindings: number;
  correctiveActions: number;
};

export type InspectionReport = {
  id: string;
  documentId: string;
  inspectionId: string;
  checklistItems: number;
  failedItems: number;
  nextInspectionAt: string;
};

export type PdfFile = {
  id: string;
  documentId: string;
  fileName: string;
  pageCount: number;
  sizeMb: number;
  s3Key: string;
  thumbnailKey: string;
  checksum: string;
  signedUrlExpiresAt: string;
  qrVerificationUrl: string;
};

export type PrintJob = {
  id: string;
  documentId: string;
  printerName: string;
  status: "queued" | "printing" | "printed" | "failed";
  copies: number;
  paper: "A4" | "A5";
  grayscale: boolean;
  marginsMm: number;
  createdAt: string;
  diagnostics?: string;
};

export type SignatureBlock = {
  id: string;
  documentId: string;
  signerRole: "mechanic" | "customer" | "manager" | "digital_certificate";
  signerName: string;
  status: SignatureStatus;
  signedAt?: string;
  deviceId?: string;
  certificateThumbprint?: string;
};

export type ReportVersion = {
  id: string;
  documentId: string;
  version: number;
  createdAt: string;
  createdBy: string;
  reason:
    | "initial"
    | "regenerated"
    | "signature_added"
    | "photo_added"
    | "correction"
    | "rollback";
  diffSummary: string;
  pdfFileId: string;
};

export type ExportJob = {
  id: string;
  documentIds: string[];
  format: ExportFormat;
  status: ExportStatus;
  target: "download" | "email" | "customer_portal" | "archive" | "api";
  progress: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
};

export type ScheduledReport = {
  id: string;
  name: string;
  documentType: DocumentType;
  schedule: "daily" | "weekly" | "monthly" | "quarterly";
  customerName?: string;
  nextRunAt: string;
  enabled: boolean;
  lastStatus: GenerationStatus;
};

export type ReportPermission = {
  id: string;
  documentId: string;
  scope: PermissionScope;
  canView: boolean;
  canDownload: boolean;
  canPrint: boolean;
  canSign: boolean;
  redacted: boolean;
};

export type DocumentAiWarning = {
  id: string;
  documentId: string;
  severity: "info" | "warning" | "critical";
  category:
    | "missing_signature"
    | "missing_photo"
    | "sla_mismatch"
    | "material_anomaly"
    | "template_risk"
    | "compliance";
  message: string;
  recommendation: string;
};

export type GenerationLog = {
  id: string;
  documentId: string;
  stage:
    | "template_resolved"
    | "data_collected"
    | "photos_embedded"
    | "pdf_rendered"
    | "signed"
    | "stored"
    | "exported"
    | "failed";
  status: "ok" | "warning" | "error";
  createdAt: string;
  details: string;
};

export type DocumentGridRow = {
  document: GeneratedDocument;
  pdf?: PdfFile;
  signatures: SignatureBlock[];
  latestVersion?: ReportVersion;
  exportJob?: ExportJob;
  warnings: DocumentAiWarning[];
};
