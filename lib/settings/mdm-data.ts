import type {
  ApprovalChain,
  BusinessRule,
  ConfigAuditLog,
  ConfigurationGridRow,
  EnterpriseRole,
  ImpactAnalysis,
  ImportExportJob,
  LocalizationTerm,
  MasterDataRecord,
  SLAProfile,
  SystemSetting,
  TemplateConfiguration,
  ValidationWarning,
  WorkType,
  WorkflowRule,
} from "./types";

export const SYSTEM_SETTINGS: SystemSetting[] = [
  {
    id: "set-sync",
    key: "sync.background.retry",
    name: "Повтор фоновой синхронизации",
    value: "экспоненциально до 15 минут",
    group: "синхронизация",
    status: "active",
    updatedAt: "2026-05-12T08:40:00.000Z",
    updatedBy: "Администратор",
    version: 7,
  },
  {
    id: "set-doc",
    key: "reports.signed-url-ttl",
    name: "Срок подписанной ссылки PDF",
    value: "60 минут",
    group: "документы",
    status: "active",
    updatedAt: "2026-05-12T07:50:00.000Z",
    updatedBy: "Ольга Руководитель",
    version: 3,
  },
  {
    id: "set-sec",
    key: "security.critical-confirmation",
    name: "Подтверждение критических действий",
    value: "включено",
    group: "безопасность",
    status: "active",
    updatedAt: "2026-05-11T16:20:00.000Z",
    updatedBy: "Администратор",
    version: 5,
  },
];

export const MASTER_DATA: MasterDataRecord[] = [
  {
    id: "md-elevator-1",
    domain: "elevator",
    code: "OT-GEN2",
    name: "Otis Gen2",
    status: "active",
    owner: "Инженерный отдел",
    updatedAt: "2026-05-10T10:00:00.000Z",
    updatedBy: "Иван Инженер",
    version: 12,
    validationStatus: "valid",
  },
  {
    id: "md-material-1",
    domain: "material",
    code: "DR-44",
    name: "Ролик дверной D44",
    status: "active",
    owner: "Склад",
    updatedAt: "2026-05-12T08:30:00.000Z",
    updatedBy: "Олег Романов",
    version: 9,
    validationStatus: "warning",
  },
  {
    id: "md-failure-1",
    domain: "failure_classification",
    code: "DOOR-JAM",
    name: "Заклинивание дверей",
    status: "active",
    owner: "Диспетчерская",
    updatedAt: "2026-05-11T12:15:00.000Z",
    updatedBy: "Мария Диспетчер",
    version: 4,
    validationStatus: "valid",
  },
  {
    id: "md-region-1",
    domain: "region",
    code: "MSK-SOUTH",
    name: "Москва Юг",
    status: "requires_review",
    owner: "Операции",
    updatedAt: "2026-05-12T09:00:00.000Z",
    updatedBy: "Ольга Руководитель",
    version: 2,
    validationStatus: "pending",
  },
];

export const WORK_TYPES: WorkType[] = [
  {
    id: "wt-door-repair",
    name: "Аварийный ремонт дверей",
    code: "EM-DOOR",
    requiredPhotos: ["до", "после", "узел", "шильдик"],
    requiredMaterials: ["DR-44"],
    requiredSignatures: ["механик", "заказчик"],
    slaProfileId: "sla-emergency",
    approvalChainId: "chain-high-risk",
    reportTemplateId: "tpl-work-order-v5",
    status: "active",
  },
  {
    id: "wt-button-replace",
    name: "Замена кнопки вызова",
    code: "BTN-REPLACE",
    requiredPhotos: ["до", "после", "демонтированная деталь"],
    requiredMaterials: ["KV-12-24V"],
    requiredSignatures: ["механик"],
    slaProfileId: "sla-standard",
    reportTemplateId: "tpl-work-order-v5",
    status: "active",
  },
  {
    id: "wt-motor-writeoff",
    name: "Замена двигателя",
    code: "MOTOR-CHANGE",
    requiredPhotos: ["до", "после", "серийный номер", "демонтаж"],
    requiredMaterials: ["MOTOR-DRIVE"],
    requiredSignatures: ["механик", "руководитель"],
    slaProfileId: "sla-high-cost",
    approvalChainId: "chain-high-cost",
    reportTemplateId: "tpl-writeoff-v2",
    status: "requires_review",
  },
];

export const SLA_PROFILES: SLAProfile[] = [
  {
    id: "sla-emergency",
    name: "Аварийный SLA",
    responseMinutes: 5,
    resolutionMinutes: 45,
    criticality: "аварийная",
    escalationChain: ["механик", "диспетчер", "руководитель", "директор"],
    holidayCalendar: "24/7",
    priorityLogic: "пассажир/остановка/повторная авария",
    status: "active",
  },
  {
    id: "sla-standard",
    name: "Плановый SLA",
    responseMinutes: 60,
    resolutionMinutes: 480,
    criticality: "средняя",
    escalationChain: ["механик", "диспетчер"],
    holidayCalendar: "рабочий календарь",
    priorityLogic: "договорной приоритет",
    status: "active",
  },
  {
    id: "sla-high-cost",
    name: "Высокая стоимость",
    responseMinutes: 30,
    resolutionMinutes: 240,
    criticality: "высокая",
    escalationChain: ["руководитель", "директор"],
    holidayCalendar: "рабочий + дежурный",
    priorityLogic: "стоимость/риск простоя",
    status: "requires_review",
  },
];

export const ENTERPRISE_ROLES: EnterpriseRole[] = [
  {
    id: "role-mech",
    role: "mechanic",
    name: "Механик",
    permissions: [
      "work_orders:read",
      "work_orders:close",
      "media:write",
      "sync:read",
      "reports:read",
    ],
    objectScope: "назначенные объекты",
    regionScope: "свои маршруты",
    approvalRights: ["низкорисковые работы"],
    restrictions: ["нет доступа к ролям", "нет удаления документов"],
    status: "active",
  },
  {
    id: "role-senior",
    role: "senior_mechanic",
    name: "Старший механик",
    permissions: [
      "work_orders:read",
      "work_orders:approve",
      "media:read",
      "reports:read",
    ],
    objectScope: "бригада",
    regionScope: "участок",
    approvalRights: ["повторные ремонты", "фото без заказчика"],
    restrictions: ["нет системных настроек"],
    status: "draft",
  },
  {
    id: "role-admin",
    role: "administrator",
    name: "Администратор",
    permissions: [
      "settings:write",
      "roles:manage",
      "system:manage",
      "audit:read",
    ],
    objectScope: "организация",
    regionScope: "все регионы",
    approvalRights: ["критические изменения конфигурации"],
    restrictions: ["требуется подтверждение критических действий"],
    status: "active",
  },
];

export const WORKFLOW_RULES: WorkflowRule[] = [
  {
    id: "wf-photo-required",
    name: "Запрет закрытия без обязательных фото",
    trigger: "закрытие заказ-наряда",
    condition: "нет фото до/после/узла",
    action: "заблокировать закрытие и создать уведомление",
    status: "active",
    validationStatus: "valid",
  },
  {
    id: "wf-high-cost",
    name: "Согласование дорогих материалов",
    trigger: "списание материала",
    condition: "стоимость > 100000",
    action: "запустить цепочку high-cost approval",
    status: "active",
    validationStatus: "warning",
  },
  {
    id: "wf-sla-escalation",
    name: "Эскалация нарушения SLA",
    trigger: "таймер SLA",
    condition: "осталось < 15 минут",
    action: "уведомить диспетчера и руководителя",
    status: "active",
    validationStatus: "valid",
  },
];

export const APPROVAL_CHAINS: ApprovalChain[] = [
  {
    id: "chain-high-cost",
    name: "Дорогие материалы",
    levels: [
      { role: "руководитель", condition: "до 150000", timeoutMinutes: 60 },
      {
        role: "директор",
        condition: "свыше 150000 или просрочка",
        timeoutMinutes: 120,
      },
    ],
    escalationTarget: "директор",
    status: "active",
  },
  {
    id: "chain-high-risk",
    name: "Риск безопасности",
    levels: [
      {
        role: "старший механик",
        condition: "повторная авария",
        timeoutMinutes: 20,
      },
      {
        role: "руководитель",
        condition: "пассажирская жалоба",
        timeoutMinutes: 40,
      },
    ],
    escalationTarget: "служба качества",
    status: "active",
  },
];

export const BUSINESS_RULES: BusinessRule[] = [
  {
    id: "br-duplicate-material",
    name: "Запрет дублей материалов",
    expression: "material.sku unique within manufacturer",
    prevents: "дубли",
    severity: "high",
    status: "active",
  },
  {
    id: "br-orphan-worktype",
    name: "Тип работ обязан иметь SLA",
    expression: "workType.slaProfileId exists",
    prevents: "orphan reference",
    severity: "critical",
    status: "active",
  },
  {
    id: "br-invalid-sla",
    name: "SLA реакции меньше решения",
    expression: "responseMinutes < resolutionMinutes",
    prevents: "некорректный SLA",
    severity: "critical",
    status: "active",
  },
];

export const LOCALIZATION_TERMS: LocalizationTerm[] = [
  {
    id: "term-1",
    source: "Work Order",
    ru: "Заказ-наряд",
    domain: "операции",
    approved: true,
    updatedAt: "2026-05-12T08:00:00.000Z",
  },
  {
    id: "term-2",
    source: "Sync Failed",
    ru: "Ошибка синхронизации",
    domain: "синхронизация",
    approved: true,
    updatedAt: "2026-05-12T08:00:00.000Z",
  },
  {
    id: "term-3",
    source: "Inventory",
    ru: "Склад",
    domain: "склад",
    approved: true,
    updatedAt: "2026-05-12T08:00:00.000Z",
  },
  {
    id: "term-4",
    source: "Escalation",
    ru: "Эскалация",
    domain: "уведомления",
    approved: true,
    updatedAt: "2026-05-12T08:00:00.000Z",
  },
];

export const TEMPLATE_CONFIGURATIONS: TemplateConfiguration[] = [
  {
    id: "tmpl-pdf-wo",
    type: "PDF",
    name: "Шаблон заказ-наряда",
    linkedEntities: ["тип работ", "фото", "подписи"],
    version: 5,
    status: "active",
  },
  {
    id: "tmpl-qr-elevator",
    type: "QR",
    name: "QR лифта",
    linkedEntities: ["лифт", "объект", "документ"],
    version: 3,
    status: "active",
  },
  {
    id: "tmpl-notify-sla",
    type: "уведомление",
    name: "SLA предупреждение",
    linkedEntities: ["SLA", "эскалация"],
    version: 2,
    status: "active",
  },
  {
    id: "tmpl-report-act",
    type: "отчет",
    name: "Акт выполненных работ",
    linkedEntities: ["заказчик", "период", "заказ-наряды"],
    version: 3,
    status: "active",
  },
];

export const VALIDATION_WARNINGS: ValidationWarning[] = [
  {
    id: "val-1",
    entityId: "wt-motor-writeoff",
    severity: "критично",
    message:
      "Тип работ требует материал MOTOR-DRIVE, но категория материала не опубликована",
    recommendation: "Опубликовать категорию или заменить required material",
  },
  {
    id: "val-2",
    entityId: "md-region-1",
    severity: "предупреждение",
    message: "Регион Москва Юг не привязан к праздничному календарю",
    recommendation: "Назначить календарь для SLA",
  },
  {
    id: "val-3",
    entityId: "wf-high-cost",
    severity: "предупреждение",
    message: "Правило запускает approval без SMS-резерва",
    recommendation: "Добавить резервный канал для руководителя",
  },
];

export const IMPACT_ANALYSIS: ImpactAnalysis[] = [
  {
    id: "impact-1",
    entityId: "sla-emergency",
    impact: "critical",
    affectedObjects: 128,
    affectedWorkflows: 6,
    affectedRoles: 4,
    summary:
      "Изменение аварийного SLA повлияет на диспетчеризацию, уведомления и отчеты SLA",
  },
  {
    id: "impact-2",
    entityId: "wt-motor-writeoff",
    impact: "high",
    affectedObjects: 24,
    affectedWorkflows: 3,
    affectedRoles: 3,
    summary: "Тип работ влияет на approvals, склад и PDF акт списания",
  },
  {
    id: "impact-3",
    entityId: "role-senior",
    impact: "medium",
    affectedObjects: 0,
    affectedWorkflows: 4,
    affectedRoles: 2,
    summary: "Новая роль добавит права согласования для бригад",
  },
];

export const IMPORT_EXPORT_JOBS: ImportExportJob[] = [
  {
    id: "job-1",
    type: "Excel import",
    status: "completed",
    progress: 100,
    records: 240,
    createdAt: "2026-05-12T07:30:00.000Z",
  },
  {
    id: "job-2",
    type: "bulk update",
    status: "running",
    progress: 63,
    records: 82,
    createdAt: "2026-05-12T09:05:00.000Z",
  },
  {
    id: "job-3",
    type: "configuration export",
    status: "queued",
    progress: 0,
    records: 18,
    createdAt: "2026-05-12T09:12:00.000Z",
  },
];

export const CONFIG_AUDIT_LOGS: ConfigAuditLog[] = [
  {
    id: "audit-1",
    entityId: "wt-door-repair",
    entityType: "work_type",
    action: "изменение",
    actor: "Администратор",
    createdAt: "2026-05-12T08:45:00.000Z",
    immutableHash: "hash-mdm-001",
    details: "Добавлено обязательное фото шильдика",
  },
  {
    id: "audit-2",
    entityId: "sla-emergency",
    entityType: "sla_profile",
    action: "публикация",
    actor: "Ольга Руководитель",
    createdAt: "2026-05-12T08:50:00.000Z",
    immutableHash: "hash-mdm-002",
    details: "Опубликован SLA 5/45 для аварий",
  },
  {
    id: "audit-3",
    entityId: "role-senior",
    entityType: "role",
    action: "создание",
    actor: "Администратор",
    createdAt: "2026-05-12T09:01:00.000Z",
    immutableHash: "hash-mdm-003",
    details: "Создана роль Старший механик",
  },
];

export function buildConfigurationGridRows(): ConfigurationGridRow[] {
  return [
    ...WORK_TYPES.map((item) => ({
      id: item.id,
      entity: item.name,
      entityType: "work_type" as const,
      status: item.status,
      updatedAt: "2026-05-12T08:45:00.000Z",
      updatedBy: "Администратор",
      version: 4,
      validationStatus:
        item.id === "wt-motor-writeoff"
          ? ("error" as const)
          : ("valid" as const),
      dependencies: [
        item.slaProfileId,
        item.reportTemplateId,
        item.approvalChainId ?? "без approval",
      ],
    })),
    ...SLA_PROFILES.map((item) => ({
      id: item.id,
      entity: item.name,
      entityType: "sla_profile" as const,
      status: item.status,
      updatedAt: "2026-05-12T08:50:00.000Z",
      updatedBy: "Ольга Руководитель",
      version: 3,
      validationStatus:
        item.status === "requires_review"
          ? ("warning" as const)
          : ("valid" as const),
      dependencies: item.escalationChain,
    })),
    ...ENTERPRISE_ROLES.map((item) => ({
      id: item.id,
      entity: item.name,
      entityType: "role" as const,
      status: item.status,
      updatedAt: "2026-05-12T09:01:00.000Z",
      updatedBy: "Администратор",
      version: 2,
      validationStatus:
        item.status === "draft" ? ("pending" as const) : ("valid" as const),
      dependencies: item.approvalRights,
    })),
    ...MASTER_DATA.map((item) => ({
      id: item.id,
      entity: item.name,
      entityType: "master_data" as const,
      status: item.status,
      updatedAt: item.updatedAt,
      updatedBy: item.updatedBy,
      version: item.version,
      validationStatus: item.validationStatus,
      dependencies: [item.domain, item.owner],
    })),
  ];
}
