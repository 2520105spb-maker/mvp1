export type WorkforceRole = "mechanic" | "senior_mechanic" | "dispatcher" | "warehouse_operator" | "supervisor" | "regional_manager" | "director" | "administrator";
export type OnlineStatus = "online" | "offline" | "on_site" | "en_route" | "emergency" | "unavailable";
export type EmploymentStatus = "active" | "vacation" | "sick_leave" | "suspended" | "probation";
export type SkillCode = "otis" | "kone" | "shulz" | "inverters" | "controllers" | "hydraulics" | "doors" | "emergency_rescue";
export type CertificationType = "electrical_safety" | "height_work" | "mgn" | "special_systems" | "medical_check" | "industrial_safety";
export type ShiftType = "day" | "night" | "on_call" | "vacation" | "sick_leave" | "training";
export type AccessPolicyScope = "region" | "territory" | "object" | "module" | "action";

export type WorkforceUser = {
  id: string;
  email: string;
  phone: string;
  status: "active" | "locked" | "invited";
  lastLoginAt: string;
  mfaEnabled: boolean;
  sessionRisk: "normal" | "elevated" | "blocked";
};

export type Territory = {
  id: string;
  region: string;
  zone: string;
  objectIds: string[];
  dispatcherId: string;
};

export type Team = {
  id: string;
  name: string;
  region: string;
  leadEmployeeId: string;
  memberIds: string[];
  slaRisk: "normal" | "watch" | "critical";
};

export type Skill = {
  code: SkillCode;
  label: string;
  level: "basic" | "advanced" | "expert";
  verifiedAt: string;
};

export type Certification = {
  id: string;
  employeeId: string;
  type: CertificationType;
  title: string;
  issuedAt: string;
  expiresAt: string;
  status: "valid" | "expiring" | "expired" | "blocked";
  blocksAssignment: boolean;
};

export type Shift = {
  id: string;
  employeeId: string;
  type: ShiftType;
  startsAt: string;
  endsAt: string;
  overtimeMinutes: number;
};

export type OnCallSchedule = {
  id: string;
  employeeId: string;
  territoryId: string;
  startsAt: string;
  endsAt: string;
  emergencyPriority: number;
};

export type MechanicAssignment = {
  id: string;
  employeeId: string;
  objectId: string;
  objectAddress: string;
  elevatorTypes: string[];
  activeWorkOrders: number;
  emergencyDuty: boolean;
};

export type PerformanceMetrics = {
  employeeId: string;
  workOrders30d: number;
  returnRate: number;
  slaScore: number;
  averageRepairMinutes: number;
  materialOveruse: number;
  photoQuality: number;
  emergencyResponseMinutes: number;
  repeatRepairs: number;
  burnoutRisk: "low" | "medium" | "high";
};

export type EmployeeDocument = {
  id: string;
  employeeId: string;
  type: "identity" | "certificate" | "permit" | "medical" | "instruction";
  title: string;
  updatedAt: string;
  secure: boolean;
};

export type AccessPolicy = {
  id: string;
  employeeId: string;
  scope: AccessPolicyScope;
  target: string;
  permissions: string[];
  inheritedFrom?: string;
  expiresAt?: string;
};

export type EmployeeAuditEvent = {
  id: string;
  employeeId: string;
  actor: string;
  action: string;
  happenedAt: string;
  risk: "normal" | "sensitive" | "critical";
};

export type Employee = {
  id: string;
  userId: string;
  name: string;
  personnelNumber: string;
  role: WorkforceRole;
  department: string;
  region: string;
  territoryIds: string[];
  teamId: string;
  status: EmploymentStatus;
  onlineStatus: OnlineStatus;
  skills: Skill[];
  assignedObjectIds: string[];
  currentShiftId: string;
  activeWorkOrders: number;
  kpiScore: number;
  slaPerformance: number;
};

export type WorkforceRow = {
  employee: Employee;
  user: WorkforceUser;
  team: Team;
  territories: Territory[];
  shift?: Shift;
  metrics: PerformanceMetrics;
  expiredCertifications: Certification[];
};
