import type {
  AccessPolicy,
  Certification,
  Employee,
  EmployeeAuditEvent,
  EmployeeDocument,
  MechanicAssignment,
  OnCallSchedule,
  PerformanceMetrics,
  Shift,
  Team,
  Territory,
  WorkforceRow,
  WorkforceUser,
} from "./types";

export const WORKFORCE_USERS: WorkforceUser[] = [
  { id: "usr-014", email: "aklimov@neolift.local", phone: "+7 900 014-22-11", status: "active", lastLoginAt: "2026-05-11T08:40:00.000Z", mfaEnabled: true, sessionRisk: "normal" },
  { id: "usr-022", email: "dmorozov@neolift.local", phone: "+7 900 022-18-44", status: "active", lastLoginAt: "2026-05-11T08:32:00.000Z", mfaEnabled: true, sessionRisk: "normal" },
  { id: "usr-003", email: "msokolova@neolift.local", phone: "+7 900 003-45-80", status: "active", lastLoginAt: "2026-05-11T07:55:00.000Z", mfaEnabled: true, sessionRisk: "elevated" },
  { id: "usr-041", email: "oromanov@neolift.local", phone: "+7 900 041-10-88", status: "active", lastLoginAt: "2026-05-10T18:20:00.000Z", mfaEnabled: false, sessionRisk: "elevated" },
  { id: "usr-001", email: "iorlov@neolift.local", phone: "+7 900 001-00-01", status: "active", lastLoginAt: "2026-05-11T08:05:00.000Z", mfaEnabled: true, sessionRisk: "normal" },
];

export const TERRITORIES: Territory[] = [
  { id: "ter-south-2", region: "Юг", zone: "Юг-2", objectIds: ["bld-104", "bld-124"], dispatcherId: "emp-003" },
  { id: "ter-center-1", region: "Центр", zone: "Центр-1", objectIds: ["bld-124", "bld-201"], dispatcherId: "emp-003" },
  { id: "ter-north", region: "Север", zone: "Север", objectIds: ["bld-118"], dispatcherId: "emp-003" },
];

export const TEAMS: Team[] = [
  { id: "team-south", name: "Аварийная бригада Юг", region: "Юг", leadEmployeeId: "emp-014", memberIds: ["emp-014", "emp-022"], slaRisk: "watch" },
  { id: "team-dispatch", name: "Диспетчерская смена A", region: "Все регионы", leadEmployeeId: "emp-003", memberIds: ["emp-003"], slaRisk: "normal" },
  { id: "team-warehouse", name: "Склад основной", region: "Центр", leadEmployeeId: "emp-041", memberIds: ["emp-041"], slaRisk: "critical" },
  { id: "team-admin", name: "ИТ и безопасность", region: "Все регионы", leadEmployeeId: "emp-001", memberIds: ["emp-001"], slaRisk: "normal" },
];

export const EMPLOYEES: Employee[] = [
  {
    id: "emp-014",
    userId: "usr-014",
    name: "Алексей Климов",
    personnelNumber: "NL-014",
    role: "senior_mechanic",
    department: "Сервис Юг",
    region: "Юг",
    territoryIds: ["ter-south-2"],
    teamId: "team-south",
    status: "active",
    onlineStatus: "on_site",
    skills: [
      { code: "otis", label: "OTIS", level: "expert", verifiedAt: "2026-02-10" },
      { code: "controllers", label: "Контроллеры", level: "expert", verifiedAt: "2026-01-15" },
      { code: "inverters", label: "Частотники", level: "advanced", verifiedAt: "2025-12-01" },
    ],
    assignedObjectIds: ["bld-104", "bld-124"],
    currentShiftId: "shift-014-day",
    activeWorkOrders: 6,
    kpiScore: 88,
    slaPerformance: 94,
  },
  {
    id: "emp-022",
    userId: "usr-022",
    name: "Денис Морозов",
    personnelNumber: "NL-022",
    role: "mechanic",
    department: "Сервис Центр",
    region: "Центр",
    territoryIds: ["ter-center-1"],
    teamId: "team-south",
    status: "active",
    onlineStatus: "en_route",
    skills: [
      { code: "kone", label: "KONE", level: "advanced", verifiedAt: "2026-03-01" },
      { code: "hydraulics", label: "Гидравлика", level: "basic", verifiedAt: "2025-11-12" },
      { code: "doors", label: "Двери", level: "advanced", verifiedAt: "2026-02-18" },
    ],
    assignedObjectIds: ["bld-124"],
    currentShiftId: "shift-022-call",
    activeWorkOrders: 9,
    kpiScore: 73,
    slaPerformance: 82,
  },
  {
    id: "emp-003",
    userId: "usr-003",
    name: "Марина Соколова",
    personnelNumber: "NL-003",
    role: "dispatcher",
    department: "Диспетчерская",
    region: "Все регионы",
    territoryIds: ["ter-south-2", "ter-center-1", "ter-north"],
    teamId: "team-dispatch",
    status: "active",
    onlineStatus: "online",
    skills: [{ code: "emergency_rescue", label: "Аварийная координация", level: "expert", verifiedAt: "2026-01-20" }],
    assignedObjectIds: ["*"],
    currentShiftId: "shift-003-day",
    activeWorkOrders: 24,
    kpiScore: 91,
    slaPerformance: 96,
  },
  {
    id: "emp-041",
    userId: "usr-041",
    name: "Олег Романов",
    personnelNumber: "NL-041",
    role: "warehouse_operator",
    department: "Склад",
    region: "Центр",
    territoryIds: ["ter-center-1"],
    teamId: "team-warehouse",
    status: "active",
    onlineStatus: "online",
    skills: [{ code: "controllers", label: "Склад контроллеров", level: "advanced", verifiedAt: "2025-10-10" }],
    assignedObjectIds: [],
    currentShiftId: "shift-041-day",
    activeWorkOrders: 0,
    kpiScore: 79,
    slaPerformance: 86,
  },
  {
    id: "emp-001",
    userId: "usr-001",
    name: "Илья Орлов",
    personnelNumber: "NL-001",
    role: "administrator",
    department: "ИТ и безопасность",
    region: "Все регионы",
    territoryIds: ["*"],
    teamId: "team-admin",
    status: "active",
    onlineStatus: "online",
    skills: [{ code: "controllers", label: "RBAC и интеграции", level: "expert", verifiedAt: "2026-04-01" }],
    assignedObjectIds: ["*"],
    currentShiftId: "shift-001-day",
    activeWorkOrders: 0,
    kpiScore: 93,
    slaPerformance: 98,
  },
];

export const CERTIFICATIONS: Certification[] = [
  { id: "cert-014-el", employeeId: "emp-014", type: "electrical_safety", title: "Электробезопасность IV", issuedAt: "2025-06-01", expiresAt: "2026-06-01", status: "expiring", blocksAssignment: false },
  { id: "cert-014-height", employeeId: "emp-014", type: "height_work", title: "Высотные работы", issuedAt: "2025-09-10", expiresAt: "2026-09-10", status: "valid", blocksAssignment: false },
  { id: "cert-022-el", employeeId: "emp-022", type: "electrical_safety", title: "Электробезопасность III", issuedAt: "2024-04-20", expiresAt: "2026-05-05", status: "expired", blocksAssignment: true },
  { id: "cert-022-mgn", employeeId: "emp-022", type: "mgn", title: "Обслуживание МГН", issuedAt: "2025-12-15", expiresAt: "2026-12-15", status: "valid", blocksAssignment: false },
  { id: "cert-041-med", employeeId: "emp-041", type: "medical_check", title: "Медосмотр склад", issuedAt: "2025-11-01", expiresAt: "2026-05-20", status: "expiring", blocksAssignment: false },
];

export const SHIFTS: Shift[] = [
  { id: "shift-014-day", employeeId: "emp-014", type: "day", startsAt: "2026-05-11T06:00:00.000Z", endsAt: "2026-05-11T18:00:00.000Z", overtimeMinutes: 35 },
  { id: "shift-022-call", employeeId: "emp-022", type: "on_call", startsAt: "2026-05-11T08:00:00.000Z", endsAt: "2026-05-12T08:00:00.000Z", overtimeMinutes: 120 },
  { id: "shift-003-day", employeeId: "emp-003", type: "day", startsAt: "2026-05-11T07:00:00.000Z", endsAt: "2026-05-11T19:00:00.000Z", overtimeMinutes: 0 },
  { id: "shift-041-day", employeeId: "emp-041", type: "day", startsAt: "2026-05-11T06:30:00.000Z", endsAt: "2026-05-11T15:30:00.000Z", overtimeMinutes: 0 },
  { id: "shift-001-day", employeeId: "emp-001", type: "day", startsAt: "2026-05-11T08:00:00.000Z", endsAt: "2026-05-11T17:00:00.000Z", overtimeMinutes: 0 },
];

export const ON_CALL_SCHEDULES: OnCallSchedule[] = [
  { id: "call-022", employeeId: "emp-022", territoryId: "ter-center-1", startsAt: "2026-05-11T08:00:00.000Z", endsAt: "2026-05-12T08:00:00.000Z", emergencyPriority: 1 },
  { id: "call-014", employeeId: "emp-014", territoryId: "ter-south-2", startsAt: "2026-05-11T18:00:00.000Z", endsAt: "2026-05-12T06:00:00.000Z", emergencyPriority: 2 },
];

export const MECHANIC_ASSIGNMENTS: MechanicAssignment[] = [
  { id: "asg-014-104", employeeId: "emp-014", objectId: "bld-104", objectAddress: "Москва, ул. Кирова, 18к2", elevatorTypes: ["OTIS", "ЩЛЗ"], activeWorkOrders: 3, emergencyDuty: true },
  { id: "asg-014-124", employeeId: "emp-014", objectId: "bld-124", objectAddress: "Городская больница №7", elevatorTypes: ["ЩЛЗ", "МГН"], activeWorkOrders: 3, emergencyDuty: true },
  { id: "asg-022-124", employeeId: "emp-022", objectId: "bld-124", objectAddress: "Городская больница №7", elevatorTypes: ["KONE", "гидравлика"], activeWorkOrders: 5, emergencyDuty: true },
];

export const PERFORMANCE_METRICS: PerformanceMetrics[] = [
  { employeeId: "emp-014", workOrders30d: 64, returnRate: 3.8, slaScore: 94, averageRepairMinutes: 74, materialOveruse: 2.1, photoQuality: 96, emergencyResponseMinutes: 18, repeatRepairs: 2, burnoutRisk: "medium" },
  { employeeId: "emp-022", workOrders30d: 71, returnRate: 9.4, slaScore: 82, averageRepairMinutes: 103, materialOveruse: 8.7, photoQuality: 78, emergencyResponseMinutes: 29, repeatRepairs: 7, burnoutRisk: "high" },
  { employeeId: "emp-003", workOrders30d: 312, returnRate: 0, slaScore: 96, averageRepairMinutes: 0, materialOveruse: 0, photoQuality: 92, emergencyResponseMinutes: 12, repeatRepairs: 0, burnoutRisk: "low" },
  { employeeId: "emp-041", workOrders30d: 124, returnRate: 0, slaScore: 86, averageRepairMinutes: 0, materialOveruse: 4.9, photoQuality: 84, emergencyResponseMinutes: 0, repeatRepairs: 0, burnoutRisk: "medium" },
  { employeeId: "emp-001", workOrders30d: 18, returnRate: 0, slaScore: 98, averageRepairMinutes: 0, materialOveruse: 0, photoQuality: 100, emergencyResponseMinutes: 0, repeatRepairs: 0, burnoutRisk: "low" },
];

export const EMPLOYEE_DOCUMENTS: EmployeeDocument[] = [
  { id: "doc-014-id", employeeId: "emp-014", type: "identity", title: "Удостоверение механика", updatedAt: "2026-01-12", secure: true },
  { id: "doc-014-cert", employeeId: "emp-014", type: "certificate", title: "Электробезопасность IV", updatedAt: "2025-06-01", secure: true },
  { id: "doc-022-permit", employeeId: "emp-022", type: "permit", title: "Допуск МГН", updatedAt: "2025-12-15", secure: true },
  { id: "doc-041-med", employeeId: "emp-041", type: "medical", title: "Медосмотр", updatedAt: "2025-11-01", secure: true },
];

export const ACCESS_POLICIES: AccessPolicy[] = [
  { id: "pol-014-region", employeeId: "emp-014", scope: "territory", target: "ter-south-2", permissions: ["objects:read", "work_orders:close", "photos:upload"], inheritedFrom: "senior_mechanic" },
  { id: "pol-022-object", employeeId: "emp-022", scope: "object", target: "bld-124", permissions: ["objects:read", "work_orders:read", "photos:upload"], inheritedFrom: "mechanic" },
  { id: "pol-003-dispatch", employeeId: "emp-003", scope: "module", target: "dispatch", permissions: ["dispatch:manage", "work_orders:assign"], inheritedFrom: "dispatcher" },
  { id: "pol-001-system", employeeId: "emp-001", scope: "action", target: "rbac", permissions: ["roles:manage", "users:write", "audit:read"], inheritedFrom: "administrator" },
];

export const EMPLOYEE_AUDIT_EVENTS: EmployeeAuditEvent[] = [
  { id: "aud-1", employeeId: "emp-022", actor: "Марина Соколова", action: "assignment blocked: expired electrical safety", happenedAt: "2026-05-11T08:05:00.000Z", risk: "critical" },
  { id: "aud-2", employeeId: "emp-014", actor: "Илья Орлов", action: "territory policy updated", happenedAt: "2026-05-10T17:40:00.000Z", risk: "sensitive" },
  { id: "aud-3", employeeId: "emp-003", actor: "system", action: "session risk elevated due concurrent workstation", happenedAt: "2026-05-11T07:58:00.000Z", risk: "sensitive" },
];

export function buildWorkforceRows(): WorkforceRow[] {
  return EMPLOYEES.map((employee) => {
    const user = WORKFORCE_USERS.find((candidate) => candidate.id === employee.userId) ?? WORKFORCE_USERS[0];
    const team = TEAMS.find((candidate) => candidate.id === employee.teamId) ?? TEAMS[0];
    const territories = TERRITORIES.filter((territory) => employee.territoryIds.includes(territory.id) || employee.territoryIds.includes("*"));
    const shift = SHIFTS.find((candidate) => candidate.id === employee.currentShiftId);
    const metrics = PERFORMANCE_METRICS.find((candidate) => candidate.employeeId === employee.id) ?? PERFORMANCE_METRICS[0];
    const expiredCertifications = CERTIFICATIONS.filter((certification) => certification.employeeId === employee.id && (certification.status === "expired" || certification.status === "expiring"));
    return { employee, user, team, territories, shift, metrics, expiredCertifications };
  });
}
