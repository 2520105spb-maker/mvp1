import type { Permission, UserRole } from "@/lib/auth/types";

export type ConfigEntityType =
  | "system_setting"
  | "master_data"
  | "work_type"
  | "elevator_type"
  | "manufacturer"
  | "controller"
  | "material_category"
  | "sla_profile"
  | "role"
  | "permission"
  | "workflow_rule"
  | "approval_chain"
  | "notification_rule"
  | "qr_template"
  | "report_template"
  | "business_rule"
  | "localization";
export type ConfigStatus =
  | "draft"
  | "active"
  | "deprecated"
  | "requires_review"
  | "blocked";
export type ValidationStatus = "valid" | "warning" | "error" | "pending";
export type ImpactLevel = "low" | "medium" | "high" | "critical";
export type MasterDataDomain =
  | "elevator"
  | "material"
  | "work_classification"
  | "failure_classification"
  | "customer"
  | "region"
  | "technician"
  | "supplier";

export type SystemSetting = {
  id: string;
  key: string;
  name: string;
  value: string;
  group:
    | "безопасность"
    | "синхронизация"
    | "уведомления"
    | "документы"
    | "склад";
  status: ConfigStatus;
  updatedAt: string;
  updatedBy: string;
  version: number;
};

export type MasterDataRecord = {
  id: string;
  domain: MasterDataDomain;
  code: string;
  name: string;
  status: ConfigStatus;
  owner: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
  validationStatus: ValidationStatus;
};

export type WorkType = {
  id: string;
  name: string;
  code: string;
  requiredPhotos: string[];
  requiredMaterials: string[];
  requiredSignatures: string[];
  slaProfileId: string;
  approvalChainId?: string;
  reportTemplateId: string;
  status: ConfigStatus;
};

export type SLAProfile = {
  id: string;
  name: string;
  responseMinutes: number;
  resolutionMinutes: number;
  criticality: "низкая" | "средняя" | "высокая" | "аварийная";
  escalationChain: string[];
  holidayCalendar: string;
  priorityLogic: string;
  status: ConfigStatus;
};

export type EnterpriseRole = {
  id: string;
  role: UserRole | "senior_mechanic";
  name: string;
  permissions: Permission[];
  objectScope: string;
  regionScope: string;
  approvalRights: string[];
  restrictions: string[];
  status: ConfigStatus;
};

export type WorkflowRule = {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  status: ConfigStatus;
  validationStatus: ValidationStatus;
};

export type ApprovalChain = {
  id: string;
  name: string;
  levels: Array<{ role: string; condition: string; timeoutMinutes: number }>;
  escalationTarget: string;
  status: ConfigStatus;
};

export type BusinessRule = {
  id: string;
  name: string;
  expression: string;
  prevents:
    | "дубли"
    | "сломанный workflow"
    | "некорректный SLA"
    | "orphan reference";
  severity: ImpactLevel;
  status: ConfigStatus;
};

export type LocalizationTerm = {
  id: string;
  source: string;
  ru: string;
  domain: string;
  approved: boolean;
  updatedAt: string;
};

export type TemplateConfiguration = {
  id: string;
  type: "PDF" | "QR" | "уведомление" | "отчет";
  name: string;
  linkedEntities: string[];
  version: number;
  status: ConfigStatus;
};

export type ConfigAuditLog = {
  id: string;
  entityId: string;
  entityType: ConfigEntityType;
  action:
    | "создание"
    | "изменение"
    | "валидация"
    | "публикация"
    | "откат"
    | "импорт"
    | "экспорт";
  actor: string;
  createdAt: string;
  immutableHash: string;
  details: string;
};

export type ValidationWarning = {
  id: string;
  entityId: string;
  severity: "предупреждение" | "ошибка" | "критично";
  message: string;
  recommendation: string;
};

export type ImpactAnalysis = {
  id: string;
  entityId: string;
  impact: ImpactLevel;
  affectedObjects: number;
  affectedWorkflows: number;
  affectedRoles: number;
  summary: string;
};

export type ImportExportJob = {
  id: string;
  type:
    | "Excel import"
    | "bulk update"
    | "template import"
    | "configuration export";
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  records: number;
  createdAt: string;
  error?: string;
};

export type ConfigurationGridRow = {
  id: string;
  entity: string;
  entityType: ConfigEntityType;
  status: ConfigStatus;
  updatedAt: string;
  updatedBy: string;
  version: number;
  validationStatus: ValidationStatus;
  dependencies: string[];
};
