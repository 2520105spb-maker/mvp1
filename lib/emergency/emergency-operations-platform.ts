export type IncidentPriority = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "new" | "triaged" | "dispatching" | "accepted" | "en_route" | "on_site" | "stabilized" | "resolved" | "communication_risk" | "sla_risk" | "escalated";
export type EscalationLevel = "dispatcher" | "supervisor" | "director" | "emergency_override";
export type CommunicationChannel = "push" | "websocket" | "sms" | "telegram" | "voice_call";

export type EmergencyIncident = {
  id: string;
  tenantId: string;
  number: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  scenario: "passenger_trapped" | "sla_risk" | "lost_contact" | "equipment_fire" | "critical_shutdown";
  title: string;
  objectName: string;
  elevatorLabel: string;
  address: string;
  humanSafety: boolean;
  passengerCount: number;
  createdAt: string;
  slaDueAt: string;
  etaMinutes: number;
  responseTargetMinutes: number;
  breachProbability: number;
  escalationLevel: EscalationLevel;
  assignedMechanicId?: string;
  zoneId: string;
};

export type EmergencyQueue = {
  id: string;
  name: string;
  priority: IncidentPriority;
  status: "open" | "saturated" | "degraded" | "closed";
  incidentIds: string[];
  concurrencyLimit: number;
  redisStream: string;
};

export type EmergencyAssignment = {
  id: string;
  incidentId: string;
  mechanicId: string;
  mechanicName: string;
  status: "suggested" | "push_sent" | "accepted" | "en_route" | "arrived" | "reassigned" | "failed";
  proximityMinutes: number;
  certificationMatch: number;
  readinessScore: number;
  shiftState: "on_shift" | "on_call" | "overtime" | "offline";
  geoAvailability: "fresh" | "stale" | "unknown";
  fastestRouteKm: number;
  acceptedAt?: string;
};

export type EmergencyDispatch = {
  id: string;
  incidentId: string;
  dispatcherId: string;
  assignmentId: string;
  routeOptimization: "running" | "complete" | "rerouting" | "failed";
  overrideReason?: string;
  websocketTopic: string;
  createdAt: string;
};

export type SLAIncidentTimer = {
  id: string;
  incidentId: string;
  targetMinutes: number;
  elapsedMinutes: number;
  remainingMinutes: number;
  breachPredictionMinutes: number;
  thresholds: { warning: number; supervisor: number; director: number; override: number };
  state: "healthy" | "warning" | "breach_predicted" | "breached" | "override_active";
};

export type EscalationChain = {
  id: string;
  incidentId: string;
  currentLevel: EscalationLevel;
  autoEscalation: boolean;
  steps: Array<{ level: EscalationLevel; role: "Dispatcher" | "Supervisor" | "Director" | "EmergencyCoordinator"; dueInMinutes: number; status: "pending" | "notified" | "acknowledged" | "overridden" }>;
};

export type EmergencyResponse = {
  id: string;
  incidentId: string;
  phase: "intake" | "dispatch" | "travel" | "rescue" | "stabilization" | "post_incident";
  commandOwner: string;
  activePlaybook: string;
  nextAction: string;
  safetyChecklist: string[];
};

export type CriticalAlert = {
  id: string;
  incidentId: string;
  severity: IncidentPriority;
  channel: CommunicationChannel;
  recipientRole: "Dispatcher" | "EmergencyCoordinator" | "Mechanic" | "Supervisor" | "Director";
  delivery: "queued" | "delivered" | "acknowledged" | "failed" | "fallback_sent";
  message: string;
  createdAt: string;
};

export type IncidentTimeline = {
  id: string;
  incidentId: string;
  type: "dispatch" | "arrival" | "communication" | "escalation" | "status" | "geo" | "sla";
  label: string;
  actor: string;
  occurredAt: string;
  critical: boolean;
};

export type EmergencyGeoZone = {
  id: string;
  name: string;
  risk: "normal" | "dense_city" | "traffic_blocked" | "limited_coverage";
  activeIncidents: number;
  nearestMechanics: number;
  avgEtaMinutes: number;
};

export type IncidentCommunication = {
  id: string;
  incidentId: string;
  mechanicId: string;
  lastContactAt: string;
  status: "online" | "delayed" | "lost_contact" | "fallback_voice";
  failedPushCount: number;
  fallbackChannels: CommunicationChannel[];
};

export type IncidentAuditLog = {
  id: string;
  incidentId: string;
  action: "created" | "sla_timer_started" | "assignment_decision" | "escalation" | "override" | "communication_failure" | "resolved";
  actor: string;
  hash: string;
  previousHash?: string;
  occurredAt: string;
};

export const EMERGENCY_ARCHITECTURE = {
  commandCenter: "Centralized industrial emergency workspace with left operational queues, realtime command board, and right incident intelligence rail.",
  orchestrationEngine: "Scores SLA severity, human safety, proximity, certifications, readiness, geo freshness, shift state, and escalation level before dispatch decisions.",
  realtime: "WebSocket topics are backed by Redis Streams for incident updates, mechanic movement, ETA drift, push delivery state, and escalation acknowledgements.",
  storage: "PostgreSQL is the system of record for incidents, assignments, timelines, SLA timers, communications, and tamper-evident audit logs.",
  recovery: "Reconnect replay uses stream offsets, push failures fall back to SMS/Telegram/voice adapters, stale GPS marks dispatch candidates as degraded.",
} as const;

export const CRITICAL_SLA_ENGINE = [
  "Start countdown at call intake before assignment confirmation.",
  "Predict breach from live ETA, traffic, mechanic acknowledgement latency, and route rerouting events.",
  "Escalate to supervisor and director through threshold policies, not manual reminders.",
  "Allow emergency override with mandatory reason, audit hash, and post-incident review flag.",
];

export const EMERGENCY_ORCHESTRATION_FACTORS = [
  "SLA severity and remaining response time",
  "Human safety / trapped passenger priority",
  "Mechanic proximity and live route ETA",
  "Elevator controller certifications and rescue authorization",
  "Emergency readiness score and safety equipment availability",
  "Geo availability, GPS freshness, and incident zone risk",
  "Shift state, on-call status, overtime exposure, and fatigue policy",
  "Current escalation level and command override policy",
];

export const REALTIME_EMERGENCY_STREAMS = [
  "emergency.incident.created",
  "emergency.sla.timer.tick",
  "emergency.dispatch.assignment",
  "emergency.mechanic.location",
  "emergency.communication.delivery",
  "emergency.escalation.step",
  "emergency.audit.appended",
];

export const emergencyIncidentsSeed: EmergencyIncident[] = [
  {
    id: "inc-critical-001",
    tenantId: "neo",
    number: "EM-2026-0513-001",
    priority: "critical",
    status: "dispatching",
    scenario: "passenger_trapped",
    title: "Застрял человек в кабине",
    objectName: "БЦ Северная Башня",
    elevatorLabel: "Лифт 3 · OTIS Gen2",
    address: "Москва, Ленинградский пр-т, 39",
    humanSafety: true,
    passengerCount: 1,
    createdAt: "2026-05-13T08:42:00Z",
    slaDueAt: "2026-05-13T09:02:00Z",
    etaMinutes: 11,
    responseTargetMinutes: 20,
    breachProbability: 18,
    escalationLevel: "dispatcher",
    assignedMechanicId: "mech-11",
    zoneId: "zone-core",
  },
  {
    id: "inc-high-002",
    tenantId: "neo",
    number: "EM-2026-0513-002",
    priority: "high",
    status: "sla_risk",
    scenario: "sla_risk",
    title: "ETA превышает SLA аварийного выезда",
    objectName: "ЖК Нева",
    elevatorLabel: "Лифт 1 · ЩЛЗ",
    address: "Санкт-Петербург, Пискарёвский пр-т, 25",
    humanSafety: false,
    passengerCount: 0,
    createdAt: "2026-05-13T08:28:00Z",
    slaDueAt: "2026-05-13T09:13:00Z",
    etaMinutes: 51,
    responseTargetMinutes: 45,
    breachProbability: 73,
    escalationLevel: "supervisor",
    assignedMechanicId: "mech-17",
    zoneId: "zone-north",
  },
  {
    id: "inc-critical-003",
    tenantId: "neo",
    number: "EM-2026-0513-003",
    priority: "critical",
    status: "communication_risk",
    scenario: "lost_contact",
    title: "Потерян контакт с механиком на аварии",
    objectName: "ТЦ Горизонт",
    elevatorLabel: "Эскалатор E2 · KONE",
    address: "Екатеринбург, ул. Малышева, 5",
    humanSafety: true,
    passengerCount: 0,
    createdAt: "2026-05-13T08:13:00Z",
    slaDueAt: "2026-05-13T08:43:00Z",
    etaMinutes: 0,
    responseTargetMinutes: 30,
    breachProbability: 91,
    escalationLevel: "emergency_override",
    assignedMechanicId: "mech-21",
    zoneId: "zone-ural",
  },
];

export const emergencyAssignmentsSeed: EmergencyAssignment[] = [
  { id: "asg-1", incidentId: "inc-critical-001", mechanicId: "mech-11", mechanicName: "Илья Орлов", status: "accepted", proximityMinutes: 7, certificationMatch: 98, readinessScore: 95, shiftState: "on_shift", geoAvailability: "fresh", fastestRouteKm: 4.2, acceptedAt: "2026-05-13T08:44:12Z" },
  { id: "asg-2", incidentId: "inc-high-002", mechanicId: "mech-17", mechanicName: "Мария Волкова", status: "en_route", proximityMinutes: 33, certificationMatch: 91, readinessScore: 83, shiftState: "on_call", geoAvailability: "fresh", fastestRouteKm: 18.6 },
  { id: "asg-3", incidentId: "inc-critical-003", mechanicId: "mech-21", mechanicName: "Олег Сафин", status: "failed", proximityMinutes: 0, certificationMatch: 94, readinessScore: 70, shiftState: "on_shift", geoAvailability: "stale", fastestRouteKm: 0 },
];

export const slaTimersSeed: SLAIncidentTimer[] = [
  { id: "sla-1", incidentId: "inc-critical-001", targetMinutes: 20, elapsedMinutes: 8, remainingMinutes: 12, breachPredictionMinutes: 23, thresholds: { warning: 12, supervisor: 7, director: 3, override: 0 }, state: "healthy" },
  { id: "sla-2", incidentId: "inc-high-002", targetMinutes: 45, elapsedMinutes: 37, remainingMinutes: 8, breachPredictionMinutes: -6, thresholds: { warning: 15, supervisor: 10, director: 5, override: 0 }, state: "breach_predicted" },
  { id: "sla-3", incidentId: "inc-critical-003", targetMinutes: 30, elapsedMinutes: 34, remainingMinutes: -4, breachPredictionMinutes: -4, thresholds: { warning: 10, supervisor: 6, director: 2, override: 0 }, state: "breached" },
];

export const escalationChainsSeed: EscalationChain[] = [
  { id: "esc-1", incidentId: "inc-critical-001", currentLevel: "dispatcher", autoEscalation: true, steps: [
    { level: "dispatcher", role: "Dispatcher", dueInMinutes: 0, status: "acknowledged" },
    { level: "supervisor", role: "Supervisor", dueInMinutes: 7, status: "pending" },
    { level: "director", role: "Director", dueInMinutes: 12, status: "pending" },
  ] },
  { id: "esc-2", incidentId: "inc-high-002", currentLevel: "supervisor", autoEscalation: true, steps: [
    { level: "dispatcher", role: "Dispatcher", dueInMinutes: 0, status: "acknowledged" },
    { level: "supervisor", role: "Supervisor", dueInMinutes: 0, status: "notified" },
    { level: "director", role: "Director", dueInMinutes: 5, status: "pending" },
  ] },
  { id: "esc-3", incidentId: "inc-critical-003", currentLevel: "emergency_override", autoEscalation: true, steps: [
    { level: "dispatcher", role: "Dispatcher", dueInMinutes: 0, status: "acknowledged" },
    { level: "supervisor", role: "Supervisor", dueInMinutes: 0, status: "acknowledged" },
    { level: "director", role: "Director", dueInMinutes: 0, status: "notified" },
    { level: "emergency_override", role: "EmergencyCoordinator", dueInMinutes: 0, status: "notified" },
  ] },
];

export const emergencyResponsesSeed: EmergencyResponse[] = [
  { id: "rsp-1", incidentId: "inc-critical-001", phase: "dispatch", commandOwner: "Диспетчер Петрова", activePlaybook: "Trapped passenger rescue", nextAction: "Подтвердить подъезд и подготовить голосовую связь с пассажиром", safetyChecklist: ["Не отключать связь", "Проверить машинное помещение", "Подготовить эвакуационный ключ"] },
  { id: "rsp-2", incidentId: "inc-high-002", phase: "travel", commandOwner: "Супервайзер Иванов", activePlaybook: "SLA risk reassignment", nextAction: "Сравнить второго механика в зоне 4", safetyChecklist: ["Сохранить исходного механика", "Проверить сертификат ЩЛЗ", "Не допустить двойного назначения"] },
  { id: "rsp-3", incidentId: "inc-critical-003", phase: "rescue", commandOwner: "Emergency Coordinator Смирнова", activePlaybook: "Lost contact", nextAction: "Запустить голосовой fallback и направить резерв", safetyChecklist: ["Проверить GPS stale", "Позвонить механику", "Назначить резервную бригаду"] },
];

export const emergencyQueuesSeed: EmergencyQueue[] = [
  { id: "q-critical", name: "Critical human safety", priority: "critical", status: "saturated", incidentIds: ["inc-critical-001", "inc-critical-003"], concurrencyLimit: 12, redisStream: "emergency:critical" },
  { id: "q-sla", name: "SLA risk", priority: "high", status: "degraded", incidentIds: ["inc-high-002"], concurrencyLimit: 24, redisStream: "emergency:sla-risk" },
];

export const incidentTimelineSeed: IncidentTimeline[] = [
  { id: "tl-1", incidentId: "inc-critical-001", type: "dispatch", label: "Critical incident created from emergency call", actor: "Call intake", occurredAt: "08:42", critical: true },
  { id: "tl-2", incidentId: "inc-critical-001", type: "sla", label: "20 minute SLA countdown started", actor: "SLA engine", occurredAt: "08:42", critical: true },
  { id: "tl-3", incidentId: "inc-critical-001", type: "communication", label: "Push acknowledged by mechanic", actor: "Илья Орлов", occurredAt: "08:44", critical: false },
  { id: "tl-4", incidentId: "inc-high-002", type: "escalation", label: "Supervisor escalation due to ETA drift", actor: "Auto-escalation", occurredAt: "08:59", critical: true },
  { id: "tl-5", incidentId: "inc-critical-003", type: "communication", label: "Lost contact detected after missed heartbeat", actor: "Realtime monitor", occurredAt: "08:47", critical: true },
];

export const criticalAlertsSeed: CriticalAlert[] = [
  { id: "al-1", incidentId: "inc-critical-001", severity: "critical", channel: "push", recipientRole: "Mechanic", delivery: "acknowledged", message: "Critical trapped passenger. Accept emergency route immediately.", createdAt: "08:43" },
  { id: "al-2", incidentId: "inc-high-002", severity: "high", channel: "websocket", recipientRole: "Supervisor", delivery: "delivered", message: "SLA breach predicted. Review reassignment.", createdAt: "08:59" },
  { id: "al-3", incidentId: "inc-critical-003", severity: "critical", channel: "voice_call", recipientRole: "EmergencyCoordinator", delivery: "fallback_sent", message: "Lost contact. Emergency override required.", createdAt: "08:48" },
];

export const emergencyGeoZonesSeed: EmergencyGeoZone[] = [
  { id: "zone-core", name: "Москва · Центр", risk: "dense_city", activeIncidents: 3, nearestMechanics: 9, avgEtaMinutes: 12 },
  { id: "zone-north", name: "Санкт-Петербург · Север", risk: "traffic_blocked", activeIncidents: 2, nearestMechanics: 4, avgEtaMinutes: 31 },
  { id: "zone-ural", name: "Екатеринбург · Урал", risk: "limited_coverage", activeIncidents: 1, nearestMechanics: 2, avgEtaMinutes: 22 },
];

export const incidentCommunicationsSeed: IncidentCommunication[] = [
  { id: "com-1", incidentId: "inc-critical-001", mechanicId: "mech-11", lastContactAt: "08:49", status: "online", failedPushCount: 0, fallbackChannels: ["sms", "voice_call"] },
  { id: "com-2", incidentId: "inc-high-002", mechanicId: "mech-17", lastContactAt: "08:57", status: "delayed", failedPushCount: 1, fallbackChannels: ["telegram", "sms"] },
  { id: "com-3", incidentId: "inc-critical-003", mechanicId: "mech-21", lastContactAt: "08:38", status: "lost_contact", failedPushCount: 3, fallbackChannels: ["voice_call", "sms", "telegram"] },
];

export const incidentAuditLogsSeed: IncidentAuditLog[] = [
  { id: "aud-1", incidentId: "inc-critical-001", action: "created", actor: "call-intake", hash: "sha256:11a", occurredAt: "08:42" },
  { id: "aud-2", incidentId: "inc-critical-001", action: "assignment_decision", actor: "orchestration-engine", hash: "sha256:22b", previousHash: "sha256:11a", occurredAt: "08:43" },
  { id: "aud-3", incidentId: "inc-critical-003", action: "communication_failure", actor: "realtime-monitor", hash: "sha256:33c", occurredAt: "08:47" },
];

export function scoreEmergencyAssignment(input: Pick<EmergencyAssignment, "proximityMinutes" | "certificationMatch" | "readinessScore" | "geoAvailability" | "shiftState"> & { humanSafety: boolean; escalationLevel: EscalationLevel }) {
  const proximity = Math.max(0, 100 - input.proximityMinutes * 3);
  const geoPenalty = input.geoAvailability === "fresh" ? 0 : input.geoAvailability === "stale" ? 20 : 35;
  const shiftPenalty = input.shiftState === "offline" ? 80 : input.shiftState === "overtime" ? 15 : 0;
  const safetyBoost = input.humanSafety ? 20 : 0;
  const escalationBoost = input.escalationLevel === "emergency_override" ? 15 : input.escalationLevel === "director" ? 10 : 0;
  return Math.max(0, Math.min(100, Math.round((proximity + input.certificationMatch + input.readinessScore) / 3 + safetyBoost + escalationBoost - geoPenalty - shiftPenalty)));
}

export function predictIncidentRisk(incident: EmergencyIncident, timer: SLAIncidentTimer) {
  if (incident.status === "communication_risk" || timer.state === "breached") return "critical intervention required";
  if (incident.breachProbability >= 70 || timer.remainingMinutes <= timer.thresholds.supervisor) return "reassignment recommended";
  if (incident.humanSafety && timer.remainingMinutes <= timer.thresholds.warning) return "watch commander review";
  return "within emergency controls";
}
