import type { UserRole } from "@/lib/auth/types";

export type GeoRole = Extract<UserRole, "dispatcher" | "mechanic" | "supervisor" | "emergencyCoordinator" | "director">;
export type GeoProvider = "mapbox" | "openstreetmap" | "internal-vector-tiles";
export type GeoObjectKind = "service_object" | "elevator" | "warehouse" | "technician" | "emergency";
export type RouteStatus = "planned" | "active" | "rerouting" | "delayed" | "completed";
export type TrafficLevel = "free" | "moderate" | "heavy" | "blocked";
export type LocationFreshness = "live" | "stale" | "offline" | "spoof_risk";
export type GeoEventType = "location_update" | "arrival_detected" | "departure_detected" | "eta_changed" | "route_changed" | "emergency_reroute" | "gps_stale" | "spoofing_suspected";

export type Coordinates = { lat: number; lng: number };

export type GeoObject = {
  id: string;
  kind: GeoObjectKind;
  label: string;
  address: string;
  zoneId: string;
  coordinates: Coordinates;
  clusterKey: string;
  slaRisk: "normal" | "watch" | "critical";
};

export type ElevatorLocation = {
  elevatorId: string;
  objectId: string;
  factoryNumber: string;
  model: string;
  controller: string;
  coordinates: Coordinates;
  floorCount: number;
  servicePriority: "standard" | "high" | "critical";
};

export type TechnicianLocation = {
  technicianId: string;
  name: string;
  role: "mechanic" | "seniorMechanic";
  coordinates: Coordinates;
  heading: number;
  speedKmh: number;
  freshness: LocationFreshness;
  lastSeenAt: string;
  availability: "available" | "assigned" | "in_route" | "on_site" | "offline";
  skills: string[];
};

export type GeoZone = {
  id: string;
  name: string;
  regionId: string;
  polygonLabel: string;
  restricted: boolean;
  emergency: boolean;
  activeRoutes: number;
  slaRiskCount: number;
};

export type EmergencyZone = {
  id: string;
  zoneId: string;
  incidentId: string;
  center: Coordinates;
  radiusMeters: number;
  passengerRisk: boolean;
  escalationLevel: 1 | 2 | 3;
};

export type TrafficSnapshot = {
  id: string;
  zoneId: string;
  level: TrafficLevel;
  averageSpeedKmh: number;
  delayMinutes: number;
  capturedAt: string;
  confidence: number;
};

export type RouteStop = {
  id: string;
  objectId: string;
  label: string;
  sequence: number;
  coordinates: Coordinates;
  eta: string;
  slaMinutesRemaining: number;
};

export type RoutePlan = {
  id: string;
  technicianId: string;
  status: RouteStatus;
  provider: GeoProvider;
  distanceKm: number;
  durationMinutes: number;
  trafficDelayMinutes: number;
  slaRiskAfterRoute: number;
  polyline: Coordinates[];
  stops: RouteStop[];
};

export type TravelEstimate = {
  id: string;
  from: Coordinates;
  to: Coordinates;
  baseMinutes: number;
  trafficMinutes: number;
  emergencyMinutes: number;
  confidence: number;
};

export type ArrivalPrediction = {
  id: string;
  routePlanId: string;
  stopId: string;
  eta: string;
  etaDeltaMinutes: number;
  slaBreachProbability: number;
  reason: string;
};

export type GeoAssignment = {
  id: string;
  workOrderId: string;
  technicianId: string;
  objectId: string;
  etaMinutes: number;
  distanceKm: number;
  routeImpactMinutes: number;
  recommendationScore: number;
};

export type LocationEvent = {
  id: string;
  type: GeoEventType;
  technicianId?: string;
  routePlanId?: string;
  message: string;
  coordinates?: Coordinates;
  occurredAt: string;
  auditHash: string;
};

export type RouteHistory = {
  id: string;
  routePlanId: string;
  technicianId: string;
  completedAt: string;
  plannedMinutes: number;
  actualMinutes: number;
  deviationMeters: number;
  slaPreserved: boolean;
};

export type GeoAuditLog = {
  id: string;
  action: "route_changed" | "eta_changed" | "geo_override" | "emergency_route_decision" | "arrival_detected";
  actor: string;
  target: string;
  hash: string;
  createdAt: string;
};

export const GEO_ARCHITECTURE = {
  providers: ["Mapbox vector tiles", "OpenStreetMap fallback", "internal cached tiles"],
  storage: "PostgreSQL + PostGIS geometry/geography columns with GiST indexes",
  realtime: ["tenant:{tenantId}:geo", "technician:{technicianId}:location", "route:{routePlanId}:eta", "zone:{zoneId}:traffic"],
  queues: ["location-batching", "eta-recalculation", "route-optimization", "geofence-events", "geo-audit-writer"],
};

export const GEOLOCATION_ENGINE_FACTORS = [
  "current GPS and heading",
  "traffic snapshots and provider confidence",
  "region permissions and restricted zones",
  "emergency priority and passenger risk",
  "route history and mechanic travel speed",
  "mechanic availability and active route plan",
  "elevator specialization and object access scope",
] as const;

export const ROUTING_ENGINE_CAPABILITIES = [
  "multi-stop routes",
  "emergency rerouting",
  "traffic-aware routing",
  "SLA-aware route ordering",
  "dynamic dispatch routing",
  "offline movement replay",
  "provider failover with cached vectors",
] as const;

export const geoZonesSeed: GeoZone[] = [
  { id: "geo-center", name: "Центр", regionId: "central", polygonLabel: "МКАД центр", restricted: false, emergency: false, activeRoutes: 18, slaRiskCount: 4 },
  { id: "geo-south", name: "Юг-2", regionId: "south", polygonLabel: "Южный кластер", restricted: false, emergency: false, activeRoutes: 14, slaRiskCount: 7 },
  { id: "geo-north-emergency", name: "Север аварийный", regionId: "north", polygonLabel: "Северный инцидент", restricted: false, emergency: true, activeRoutes: 6, slaRiskCount: 5 },
];

export const geoObjectsSeed: GeoObject[] = [
  { id: "obj-104", kind: "service_object", label: "БЦ Север", address: "Полярная 18", zoneId: "geo-north-emergency", coordinates: { lat: 55.884, lng: 37.621 }, clusterKey: "north", slaRisk: "critical" },
  { id: "obj-118", kind: "elevator", label: "Лифт Л-0427", address: "ЖК Маяк, Южная 44", zoneId: "geo-south", coordinates: { lat: 55.672, lng: 37.614 }, clusterKey: "south", slaRisk: "watch" },
  { id: "wh-central", kind: "warehouse", label: "Основной склад", address: "Складская 7", zoneId: "geo-center", coordinates: { lat: 55.751, lng: 37.603 }, clusterKey: "center", slaRisk: "normal" },
];

export const elevatorLocationsSeed: ElevatorLocation[] = [
  { elevatorId: "elev-0427", objectId: "obj-118", factoryNumber: "Л-0427", model: "Otis Gen2", controller: "MCS 220", coordinates: { lat: 55.672, lng: 37.614 }, floorCount: 17, servicePriority: "high" },
  { elevatorId: "elev-0911", objectId: "obj-104", factoryNumber: "K-0911", model: "KONE MonoSpace", controller: "KCE", coordinates: { lat: 55.884, lng: 37.621 }, floorCount: 24, servicePriority: "critical" },
];

export const technicianLocationsSeed: TechnicianLocation[] = [
  { technicianId: "tech-021", name: "Дмитрий Назаров", role: "seniorMechanic", coordinates: { lat: 55.879, lng: 37.603 }, heading: 34, speedKmh: 42, freshness: "live", lastSeenAt: "15 sec", availability: "in_route", skills: ["KONE", "KCE", "passenger rescue"] },
  { technicianId: "tech-014", name: "Алексей Климов", role: "mechanic", coordinates: { lat: 55.676, lng: 37.618 }, heading: 181, speedKmh: 0, freshness: "live", lastSeenAt: "28 sec", availability: "available", skills: ["Otis", "door drive"] },
  { technicianId: "tech-033", name: "Роман Ильин", role: "mechanic", coordinates: { lat: 55.744, lng: 37.588 }, heading: 0, speedKmh: 0, freshness: "stale", lastSeenAt: "18 min", availability: "offline", skills: ["ЩЛЗ", "УКЛ"] },
];

export const emergencyZonesSeed: EmergencyZone[] = [
  { id: "emz-1", zoneId: "geo-north-emergency", incidentId: "em-05017", center: { lat: 55.884, lng: 37.621 }, radiusMeters: 1200, passengerRisk: true, escalationLevel: 2 },
];

export const trafficSnapshotsSeed: TrafficSnapshot[] = [
  { id: "tr-1", zoneId: "geo-north-emergency", level: "heavy", averageSpeedKmh: 22, delayMinutes: 14, capturedAt: "10:31", confidence: 86 },
  { id: "tr-2", zoneId: "geo-south", level: "moderate", averageSpeedKmh: 38, delayMinutes: 7, capturedAt: "10:31", confidence: 91 },
  { id: "tr-3", zoneId: "geo-center", level: "free", averageSpeedKmh: 52, delayMinutes: 2, capturedAt: "10:31", confidence: 94 },
];

export const routePlansSeed: RoutePlan[] = [
  {
    id: "geo-route-021",
    technicianId: "tech-021",
    status: "active",
    provider: "mapbox",
    distanceKm: 4.8,
    durationMinutes: 11,
    trafficDelayMinutes: 4,
    slaRiskAfterRoute: 18,
    polyline: [{ lat: 55.879, lng: 37.603 }, { lat: 55.882, lng: 37.612 }, { lat: 55.884, lng: 37.621 }],
    stops: [{ id: "stop-1", objectId: "obj-104", label: "БЦ Север", sequence: 1, coordinates: { lat: 55.884, lng: 37.621 }, eta: "10:42", slaMinutesRemaining: 3 }],
  },
  {
    id: "geo-route-014",
    technicianId: "tech-014",
    status: "planned",
    provider: "openstreetmap",
    distanceKm: 2.1,
    durationMinutes: 8,
    trafficDelayMinutes: 1,
    slaRiskAfterRoute: 9,
    polyline: [{ lat: 55.676, lng: 37.618 }, { lat: 55.672, lng: 37.614 }],
    stops: [{ id: "stop-2", objectId: "obj-118", label: "ЖК Маяк", sequence: 1, coordinates: { lat: 55.672, lng: 37.614 }, eta: "10:48", slaMinutesRemaining: 37 }],
  },
];

export const travelEstimatesSeed: TravelEstimate[] = [
  { id: "eta-1", from: { lat: 55.879, lng: 37.603 }, to: { lat: 55.884, lng: 37.621 }, baseMinutes: 7, trafficMinutes: 11, emergencyMinutes: 8, confidence: 88 },
  { id: "eta-2", from: { lat: 55.676, lng: 37.618 }, to: { lat: 55.672, lng: 37.614 }, baseMinutes: 6, trafficMinutes: 8, emergencyMinutes: 6, confidence: 93 },
];

export const arrivalPredictionsSeed: ArrivalPrediction[] = [
  { id: "ap-1", routePlanId: "geo-route-021", stopId: "stop-1", eta: "10:42", etaDeltaMinutes: -2, slaBreachProbability: 18, reason: "Emergency route uses bus lane segment and senior mechanic is already in zone." },
  { id: "ap-2", routePlanId: "geo-route-014", stopId: "stop-2", eta: "10:48", etaDeltaMinutes: 4, slaBreachProbability: 9, reason: "Moderate traffic, SLA preserved." },
];

export const geoAssignmentsSeed: GeoAssignment[] = [
  { id: "ga-1", workOrderId: "wo-05017", technicianId: "tech-021", objectId: "obj-104", etaMinutes: 11, distanceKm: 4.8, routeImpactMinutes: 14, recommendationScore: 96 },
  { id: "ga-2", workOrderId: "wo-05018", technicianId: "tech-014", objectId: "obj-118", etaMinutes: 8, distanceKm: 2.1, routeImpactMinutes: 5, recommendationScore: 89 },
];

export const locationEventsSeed: LocationEvent[] = [
  { id: "loc-1", type: "location_update", technicianId: "tech-021", routePlanId: "geo-route-021", coordinates: { lat: 55.879, lng: 37.603 }, message: "GPS live point accepted; ETA recalculated.", occurredAt: "10:31:14", auditHash: "geo_hash_001" },
  { id: "loc-2", type: "emergency_reroute", technicianId: "tech-021", routePlanId: "geo-route-021", message: "Emergency route selected for passenger-risk call.", occurredAt: "10:31:30", auditHash: "geo_hash_002" },
  { id: "loc-3", type: "gps_stale", technicianId: "tech-033", message: "Location stale for 18 minutes; dispatcher warning emitted.", occurredAt: "10:32:00", auditHash: "geo_hash_003" },
];

export const routeHistorySeed: RouteHistory[] = [
  { id: "rh-1", routePlanId: "geo-route-prev-01", technicianId: "tech-014", completedAt: "09:44", plannedMinutes: 19, actualMinutes: 21, deviationMeters: 180, slaPreserved: true },
];

export const geoAuditLogsSeed: GeoAuditLog[] = [
  { id: "gal-1", action: "emergency_route_decision", actor: "Марина Соколова", target: "geo-route-021", hash: "geo_audit_001", createdAt: "10:31" },
  { id: "gal-2", action: "eta_changed", actor: "system", target: "stop-1", hash: "geo_audit_002", createdAt: "10:32" },
];

export function predictSlaGeoRisk(route: RoutePlan, prediction: ArrivalPrediction) {
  return Math.min(100, Math.max(0, route.slaRiskAfterRoute + prediction.etaDeltaMinutes * 2 + route.trafficDelayMinutes));
}

export function isLocationUsable(location: TechnicianLocation) {
  return location.freshness === "live" && location.availability !== "offline";
}
