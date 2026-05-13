import type { UserRole } from "@/lib/auth/types";

export type DispatchRole = Extract<UserRole, "dispatcher" | "supervisor" | "mechanic" | "emergencyCoordinator" | "director">;
export type DispatchPriority = "routine" | "planned" | "urgent" | "emergency";
export type DispatchQueueState = "new" | "triaged" | "suggested" | "assigned" | "accepted" | "in_route" | "on_site" | "delayed" | "breach_risk" | "completed";
export type TechnicianAvailability = "available" | "assigned" | "in_route" | "on_site" | "break" | "off_shift" | "sick";
export type ShiftKind = "day" | "night" | "on_call" | "overtime";
export type ScheduleConflictType = "skill_gap" | "sla_risk" | "route_overlap" | "overtime" | "region_scope" | "emergency_override";
export type DispatchEventType = "job_received" | "priority_escalated" | "assignment_suggested" | "assignment_confirmed" | "mechanic_accepted" | "mechanic_delayed" | "reassignment_requested" | "schedule_rebuilt" | "sla_breach" | "emergency_escalated";

export type GeoZone = {
  id: string;
  name: string;
  regionId: string;
  polygonLabel: string;
  activeJobs: number;
  availableMechanics: number;
  averageEtaMinutes: number;
  slaRiskCount: number;
};

export type SLAWindow = {
  responseDueAt: string;
  completionDueAt: string;
  minutesRemaining: number;
  breachProbability: number;
  escalationLevel: 0 | 1 | 2 | 3;
};

export type DispatchQueueItem = {
  id: string;
  workOrderNumber: string;
  priority: DispatchPriority;
  state: DispatchQueueState;
  address: string;
  geoZoneId: string;
  elevatorModel: string;
  controller: string;
  requiredSkills: string[];
  sla: SLAWindow;
  receivedAt: string;
  customer: string;
  passengerRisk: boolean;
};

export type SkillMatrix = {
  technicianId: string;
  elevatorTypes: string[];
  brands: string[];
  controllers: string[];
  certifications: string[];
  emergencyAuthorized: boolean;
  scoreBySkill: Record<string, number>;
};

export type Shift = {
  id: string;
  technicianId: string;
  kind: ShiftKind;
  startsAt: string;
  endsAt: string;
  zoneIds: string[];
  overtimeMinutes: number;
  onCall: boolean;
};

export type TechnicianSchedule = {
  technicianId: string;
  name: string;
  role: "mechanic" | "seniorMechanic";
  availability: TechnicianAvailability;
  currentZoneId: string;
  currentAddress: string;
  loadPercent: number;
  activeAssignments: number;
  shift: Shift;
  skills: SkillMatrix;
};

export type TravelEstimate = {
  fromZoneId: string;
  toZoneId: string;
  minutes: number;
  traffic: "normal" | "heavy" | "blocked";
  confidence: number;
};

export type RouteStop = {
  id: string;
  queueItemId: string;
  sequence: number;
  eta: string;
  travelMinutes: number;
  slaImpactMinutes: number;
};

export type RoutePlan = {
  id: string;
  technicianId: string;
  stops: RouteStop[];
  totalTravelMinutes: number;
  totalWorkMinutes: number;
  routeRisk: "low" | "medium" | "high";
};

export type Assignment = {
  id: string;
  queueItemId: string;
  technicianId: string;
  confidence: number;
  score: number;
  rationale: string[];
  routeImpactMinutes: number;
  workloadAfterPercent: number;
  emergencyOverride: boolean;
};

export type ScheduleConflict = {
  id: string;
  type: ScheduleConflictType;
  severity: "info" | "warning" | "critical";
  queueItemId: string;
  technicianId?: string;
  message: string;
  resolution: string;
};

export type Reassignment = {
  id: string;
  reason: "sick_leave" | "delay" | "emergency_override" | "skill_gap" | "manual_dispatch";
  affectedJobs: string[];
  fromTechnicianId: string;
  suggestedTechnicianId: string;
  slaPreserved: boolean;
  dispatcherApprovalRequired: boolean;
};

export type EmergencyDispatch = {
  id: string;
  queueItemId: string;
  escalationLevel: 1 | 2 | 3;
  passengerRisk: boolean;
  nearestTechnicianId: string;
  scheduleRebuildRequired: boolean;
  slaTimerStartedAt: string;
};

export type DispatchEvent = {
  id: string;
  type: DispatchEventType;
  queueItemId?: string;
  technicianId?: string;
  message: string;
  occurredAt: string;
  auditHash: string;
};

export type DispatchRecommendation = {
  id: string;
  queueItemId: string;
  preferredTechnicianId: string;
  confidence: number;
  reasons: string[];
  risks: string[];
  projectedSlaMinutesRemaining: number;
};

export const DISPATCH_ENGINE_FACTORS = [
  "SLA priority and breach probability",
  "distance and travel time",
  "mechanic skills, certifications and elevator specialization",
  "current workload and active route plan",
  "shift status, overtime and on-call eligibility",
  "dispatcher region permissions and object scope",
  "emergency priority and passenger risk",
  "traffic-aware travel estimates and route confidence",
] as const;

export const SCHEDULING_ENGINE_CAPABILITIES = [
  "daily schedules",
  "weekly schedules",
  "shift planning",
  "overtime detection",
  "emergency override",
  "conflict detection",
  "automatic reassignment",
  "manual dispatcher approval",
] as const;

export const REALTIME_DISPATCH_STREAMS = [
  "tenant:{tenantId}:dispatch:queue",
  "region:{regionId}:dispatch:timeline",
  "technician:{technicianId}:assignment",
  "zone:{geoZoneId}:sla-risk",
  "emergency:{queueItemId}:command",
  "dispatcher:{userId}:presence",
] as const;

export const QUEUE_ARCHITECTURE = [
  { name: "dispatch-triage", jobs: ["ClassifyPriority", "BuildSLAWindow", "DetectEmergency"], retry: "fast retry + dead-letter with supervisor alert" },
  { name: "assignment-suggestions", jobs: ["ScoreTechnicians", "ValidateSkills", "CheckRegionScope"], retry: "idempotent by queue item and version" },
  { name: "route-optimization", jobs: ["EstimateTravel", "BuildMultiStopRoute", "EmergencyReroute"], retry: "traffic-provider failover" },
  { name: "schedule-rebuild", jobs: ["RebalanceWorkload", "ResolveConflicts", "PreserveSLA"], retry: "versioned schedule snapshots" },
  { name: "dispatch-notifications", jobs: ["PushAssignment", "EscalateSLA", "NotifyDelay"], retry: "dedupe by assignment id" },
] as const;

export const geoZonesSeed: GeoZone[] = [
  { id: "zone-center", name: "Центр", regionId: "central", polygonLabel: "МКАД центр", activeJobs: 38, availableMechanics: 9, averageEtaMinutes: 18, slaRiskCount: 4 },
  { id: "zone-south", name: "Юг-2", regionId: "south", polygonLabel: "Южный кластер", activeJobs: 27, availableMechanics: 6, averageEtaMinutes: 23, slaRiskCount: 6 },
  { id: "zone-north", name: "Север-1", regionId: "north", polygonLabel: "Северный кластер", activeJobs: 19, availableMechanics: 4, averageEtaMinutes: 29, slaRiskCount: 3 },
];

export const dispatchQueueSeed: DispatchQueueItem[] = [
  {
    id: "dq-1001",
    workOrderNumber: "НЛ-2026-05017",
    priority: "emergency",
    state: "breach_risk",
    address: "БЦ Север, Полярная 18",
    geoZoneId: "zone-north",
    elevatorModel: "KONE MonoSpace",
    controller: "KCE",
    requiredSkills: ["passenger_rescue", "kone", "kce_controller", "emergency_authorized"],
    sla: { responseDueAt: "10:55", completionDueAt: "12:20", minutesRemaining: 14, breachProbability: 82, escalationLevel: 2 },
    receivedAt: "10:21",
    customer: "БЦ Север",
    passengerRisk: true,
  },
  {
    id: "dq-1002",
    workOrderNumber: "НЛ-2026-05018",
    priority: "urgent",
    state: "suggested",
    address: "ЖК Маяк, Южная 44",
    geoZoneId: "zone-south",
    elevatorModel: "Otis Gen2",
    controller: "MCS 220",
    requiredSkills: ["otis", "door_drive", "mcs_controller"],
    sla: { responseDueAt: "11:30", completionDueAt: "15:00", minutesRemaining: 49, breachProbability: 38, escalationLevel: 1 },
    receivedAt: "10:06",
    customer: "УК Маяк",
    passengerRisk: false,
  },
  {
    id: "dq-1003",
    workOrderNumber: "НЛ-2026-05019",
    priority: "planned",
    state: "triaged",
    address: "ТЦ Орбита, Центральная 9",
    geoZoneId: "zone-center",
    elevatorModel: "ЩЛЗ",
    controller: "УКЛ",
    requiredSkills: ["domestic_lift", "ukl_controller", "ppr"],
    sla: { responseDueAt: "14:00", completionDueAt: "18:00", minutesRemaining: 198, breachProbability: 12, escalationLevel: 0 },
    receivedAt: "09:42",
    customer: "ТЦ Орбита",
    passengerRisk: false,
  },
];

export const technicianSchedulesSeed: TechnicianSchedule[] = [
  {
    technicianId: "tech-014",
    name: "Алексей Климов",
    role: "mechanic",
    availability: "available",
    currentZoneId: "zone-south",
    currentAddress: "ЖК Маяк",
    loadPercent: 68,
    activeAssignments: 5,
    shift: { id: "shift-014", technicianId: "tech-014", kind: "day", startsAt: "08:00", endsAt: "20:00", zoneIds: ["zone-south"], overtimeMinutes: 0, onCall: false },
    skills: { technicianId: "tech-014", elevatorTypes: ["passenger", "freight"], brands: ["Otis", "ЩЛЗ"], controllers: ["MCS 220", "УКЛ"], certifications: ["electrical_III", "confined_space"], emergencyAuthorized: true, scoreBySkill: { otis: 95, door_drive: 90, emergency_authorized: 88 } },
  },
  {
    technicianId: "tech-021",
    name: "Дмитрий Назаров",
    role: "seniorMechanic",
    availability: "in_route",
    currentZoneId: "zone-north",
    currentAddress: "Северный проспект",
    loadPercent: 74,
    activeAssignments: 4,
    shift: { id: "shift-021", technicianId: "tech-021", kind: "on_call", startsAt: "08:00", endsAt: "08:00+1", zoneIds: ["zone-north", "zone-center"], overtimeMinutes: 35, onCall: true },
    skills: { technicianId: "tech-021", elevatorTypes: ["passenger", "hospital"], brands: ["KONE", "Otis"], controllers: ["KCE", "MCS 220"], certifications: ["electrical_IV", "rescue_lead", "high_rise"], emergencyAuthorized: true, scoreBySkill: { kone: 98, kce_controller: 96, passenger_rescue: 99 } },
  },
  {
    technicianId: "tech-033",
    name: "Роман Ильин",
    role: "mechanic",
    availability: "sick",
    currentZoneId: "zone-center",
    currentAddress: "не на смене",
    loadPercent: 0,
    activeAssignments: 6,
    shift: { id: "shift-033", technicianId: "tech-033", kind: "day", startsAt: "08:00", endsAt: "20:00", zoneIds: ["zone-center"], overtimeMinutes: 0, onCall: false },
    skills: { technicianId: "tech-033", elevatorTypes: ["passenger"], brands: ["KONE", "ЩЛЗ"], controllers: ["KCE", "УКЛ"], certifications: ["electrical_III"], emergencyAuthorized: false, scoreBySkill: { domestic_lift: 86, ukl_controller: 82 } },
  },
];

export const travelEstimatesSeed: TravelEstimate[] = [
  { fromZoneId: "zone-north", toZoneId: "zone-north", minutes: 11, traffic: "normal", confidence: 92 },
  { fromZoneId: "zone-south", toZoneId: "zone-north", minutes: 51, traffic: "heavy", confidence: 74 },
  { fromZoneId: "zone-center", toZoneId: "zone-south", minutes: 24, traffic: "normal", confidence: 88 },
];

export const routePlansSeed: RoutePlan[] = [
  { id: "route-021", technicianId: "tech-021", totalTravelMinutes: 43, totalWorkMinutes: 190, routeRisk: "high", stops: [
    { id: "stop-1", queueItemId: "dq-1001", sequence: 1, eta: "10:42", travelMinutes: 11, slaImpactMinutes: -3 },
    { id: "stop-2", queueItemId: "dq-1003", sequence: 2, eta: "13:35", travelMinutes: 32, slaImpactMinutes: 25 },
  ] },
];

export const assignmentSuggestionsSeed: Assignment[] = [
  { id: "as-1", queueItemId: "dq-1001", technicianId: "tech-021", confidence: 94, score: 97, rationale: ["11 min ETA", "KONE/KCE certification", "emergency rescue lead", "on-call shift"], routeImpactMinutes: 18, workloadAfterPercent: 86, emergencyOverride: true },
  { id: "as-2", queueItemId: "dq-1002", technicianId: "tech-014", confidence: 88, score: 91, rationale: ["same geo zone", "Otis Gen2 skill", "door-drive specialization"], routeImpactMinutes: 12, workloadAfterPercent: 79, emergencyOverride: false },
];

export const scheduleConflictsSeed: ScheduleConflict[] = [
  { id: "conf-1", type: "emergency_override", severity: "critical", queueItemId: "dq-1001", technicianId: "tech-021", message: "Emergency override will delay planned ТЦ Орбита stop by 25 minutes.", resolution: "Move planned stop to tech-014 after urgent job or approve overtime." },
  { id: "conf-2", type: "overtime", severity: "warning", queueItemId: "dq-1003", technicianId: "tech-021", message: "Projected overtime for senior mechanic exceeds 60 minutes.", resolution: "Use supervisor approval or rebalance to next shift." },
  { id: "conf-3", type: "skill_gap", severity: "critical", queueItemId: "dq-1001", technicianId: "tech-033", message: "Sick mechanic has queued KONE emergency without rescue authorization.", resolution: "Unassign and confirm emergency reassignment." },
];

export const reassignmentsSeed: Reassignment[] = [
  { id: "reas-1", reason: "sick_leave", affectedJobs: ["dq-1003", "dq-1002"], fromTechnicianId: "tech-033", suggestedTechnicianId: "tech-014", slaPreserved: true, dispatcherApprovalRequired: true },
];

export const emergencyDispatchSeed: EmergencyDispatch[] = [
  { id: "em-1", queueItemId: "dq-1001", escalationLevel: 2, passengerRisk: true, nearestTechnicianId: "tech-021", scheduleRebuildRequired: true, slaTimerStartedAt: "10:21" },
];

export const dispatchEventsSeed: DispatchEvent[] = [
  { id: "evt-1", type: "job_received", queueItemId: "dq-1001", message: "Emergency request received from БЦ Север; passenger risk flagged.", occurredAt: "10:21", auditHash: "dispatch_hash_001" },
  { id: "evt-2", type: "assignment_suggested", queueItemId: "dq-1001", technicianId: "tech-021", message: "Engine suggested Дмитрий Назаров with 94% confidence.", occurredAt: "10:22", auditHash: "dispatch_hash_002" },
  { id: "evt-3", type: "reassignment_requested", queueItemId: "dq-1003", technicianId: "tech-033", message: "Sick mechanic triggered reassignment queue for six jobs.", occurredAt: "10:24", auditHash: "dispatch_hash_003" },
];

export const aiDispatchRecommendationsSeed: DispatchRecommendation[] = [
  { id: "rec-1", queueItemId: "dq-1001", preferredTechnicianId: "tech-021", confidence: 94, projectedSlaMinutesRemaining: 3, reasons: ["nearest emergency-authorized mechanic", "KCE controller score 96", "on-call route can absorb override"], risks: ["planned job delay", "overtime approval likely"] },
  { id: "rec-2", queueItemId: "dq-1002", preferredTechnicianId: "tech-014", confidence: 88, projectedSlaMinutesRemaining: 37, reasons: ["same zone", "Otis certification", "load remains below 80%"], risks: ["traffic trend rising after 11:00"] },
];

export function scoreAssignment(job: DispatchQueueItem, technician: TechnicianSchedule) {
  const skillScore = job.requiredSkills.reduce((sum, skill) => sum + (technician.skills.scoreBySkill[skill] ?? 35), 0) / job.requiredSkills.length;
  const workloadScore = Math.max(0, 100 - technician.loadPercent);
  const shiftScore = technician.availability === "available" || technician.availability === "in_route" ? 90 : technician.availability === "sick" || technician.availability === "off_shift" ? 0 : 55;
  const emergencyScore = job.priority === "emergency" ? (technician.skills.emergencyAuthorized ? 100 : 0) : 75;
  return Math.round(skillScore * 0.35 + workloadScore * 0.2 + shiftScore * 0.2 + emergencyScore * 0.25);
}

export function detectScheduleConflicts(job: DispatchQueueItem, technician: TechnicianSchedule) {
  return scheduleConflictsSeed.filter((conflict) => conflict.queueItemId === job.id && (!conflict.technicianId || conflict.technicianId === technician.technicianId));
}
