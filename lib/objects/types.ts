export type ElevatorOperationalStatus = "active" | "maintenance" | "emergency" | "out_of_service" | "modernization" | "inspection_required";
export type BuildingRiskLevel = "normal" | "watch" | "high" | "critical";
export type DocumentType = "passport" | "certificate" | "scheme" | "manual" | "photo_act" | "pdf" | "inspection_act";
export type EventType = "repair" | "node_replacement" | "emergency" | "modernization" | "inspection" | "status_change" | "photo_added";
export type NodeType = "winch" | "doors" | "controller" | "control_station" | "inverter" | "ropes" | "buttons" | "sensors";

export type Customer = {
  id: string;
  name: string;
  inn: string;
  contact: string;
  phone: string;
};

export type ServiceContract = {
  id: string;
  number: string;
  customerId: string;
  slaCategory: "standard" | "business" | "critical" | "government";
  responseMinutes: number;
  maintenanceCycleDays: number;
  validUntil: string;
};

export type Entrance = {
  id: string;
  number: string;
  floors: number;
  elevatorIds: string[];
  accessNotes: string;
};

export type ElevatorModel = {
  id: string;
  manufacturer: string;
  model: string;
  type: "passenger" | "freight" | "hospital" | "panoramic" | "service";
  capacityKg: number;
  speedMs: number;
  doorType: string;
};

export type ElevatorController = {
  id: string;
  vendor: string;
  model: string;
  firmware: string;
  connectivity: "none" | "gsm" | "ethernet" | "iot_gateway";
  lastTelemetryAt?: string;
};

export type EquipmentNode = {
  id: string;
  elevatorId: string;
  type: NodeType;
  name: string;
  serialNumber: string;
  installedAt: string;
  expectedLifeMonths: number;
  health: number;
  lastRepairAt?: string;
  failures: number;
  photoCount: number;
};

export type ElevatorPhoto = {
  id: string;
  elevatorId: string;
  kind: "gallery" | "before" | "after" | "node" | "inspection";
  title: string;
  takenAt: string;
  takenBy: string;
};

export type ElevatorDocument = {
  id: string;
  ownerId: string;
  ownerType: "building" | "elevator";
  type: DocumentType;
  title: string;
  version: string;
  updatedAt: string;
  secure: boolean;
};

export type ElevatorEvent = {
  id: string;
  elevatorId: string;
  type: EventType;
  title: string;
  description: string;
  happenedAt: string;
  workOrderId?: string;
  nodeId?: string;
  severity: "info" | "warning" | "critical";
};

export type MaintenanceSchedule = {
  id: string;
  elevatorId: string;
  type: "monthly_to" | "quarterly_inspection" | "annual_inspection" | "node_replacement";
  plannedAt: string;
  overdueDays: number;
  recurringRule: string;
  slaImpact: "none" | "watch" | "risk";
};

export type Elevator = {
  id: string;
  buildingId: string;
  entranceId: string;
  factoryNumber: string;
  registrationNumber: string;
  modelId: string;
  controllerId: string;
  status: ElevatorOperationalStatus;
  installedAt: string;
  modernizedAt?: string;
  lifetimeUntil: string;
  stops: number;
  healthScore: number;
  emergencyCount30d: number;
  lastRepairAt: string;
  nextMaintenanceAt: string;
};

export type Building = {
  id: string;
  address: string;
  district: string;
  coordinates: { lat: number; lng: number };
  customerId: string;
  contractId: string;
  status: "serviced" | "onboarding" | "suspended" | "contract_risk";
  riskLevel: BuildingRiskLevel;
  mechanicIds: string[];
  entrances: Entrance[];
  elevatorIds: string[];
  slaAlerts: number;
  emergencyElevators: number;
  overdueMaintenance: number;
  lastWorkAt: string;
  photoCount: number;
  documentCount: number;
};

export type RegistryRow = {
  building: Building;
  customer: Customer;
  contract: ServiceContract;
  elevators: Elevator[];
  assignedMechanics: string[];
  healthStatus: BuildingRiskLevel;
};
