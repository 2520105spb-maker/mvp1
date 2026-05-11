import type {
  Building,
  Customer,
  Elevator,
  ElevatorController,
  ElevatorDocument,
  ElevatorEvent,
  ElevatorModel,
  ElevatorPhoto,
  EquipmentNode,
  MaintenanceSchedule,
  RegistryRow,
  ServiceContract,
} from "./types";

export const MECHANICS = [
  { id: "mech-014", name: "Алексей Климов", phone: "+7 900 014-22-11", region: "Юг-2", status: "online" },
  { id: "mech-022", name: "Денис Морозов", phone: "+7 900 022-18-44", region: "Центр-1", status: "on_call" },
  { id: "mech-031", name: "Роман Кац", phone: "+7 900 031-51-02", region: "Север", status: "offline" },
];

export const CUSTOMERS: Customer[] = [
  { id: "cust-1", name: "УК Вертикаль", inn: "7708123490", contact: "Наталья Иванова", phone: "+7 495 100-22-10" },
  { id: "cust-2", name: "БЦ Север Девелопмент", inn: "7810443201", contact: "Олег Миронов", phone: "+7 812 240-19-80" },
  { id: "cust-3", name: "Городская больница №7", inn: "7707001122", contact: "Сергей Беляев", phone: "+7 495 700-07-77" },
];

export const SERVICE_CONTRACTS: ServiceContract[] = [
  { id: "ctr-1", number: "NL-2026-044", customerId: "cust-1", slaCategory: "business", responseMinutes: 60, maintenanceCycleDays: 30, validUntil: "2027-02-01" },
  { id: "ctr-2", number: "NL-2025-912", customerId: "cust-2", slaCategory: "critical", responseMinutes: 30, maintenanceCycleDays: 21, validUntil: "2026-12-31" },
  { id: "ctr-3", number: "NL-2026-117", customerId: "cust-3", slaCategory: "government", responseMinutes: 20, maintenanceCycleDays: 14, validUntil: "2028-01-15" },
];

export const ELEVATOR_MODELS: ElevatorModel[] = [
  { id: "mdl-otis-gen2", manufacturer: "Otis", model: "Gen2 Comfort", type: "passenger", capacityKg: 1000, speedMs: 1.6, doorType: "central automatic" },
  { id: "mdl-schindler-3300", manufacturer: "Schindler", model: "3300", type: "passenger", capacityKg: 630, speedMs: 1.0, doorType: "telescopic automatic" },
  { id: "mdl-shlz-mlp", manufacturer: "ЩЛЗ", model: "МЛП-1000", type: "hospital", capacityKg: 1000, speedMs: 1.0, doorType: "wide automatic" },
];

export const ELEVATOR_CONTROLLERS: ElevatorController[] = [
  { id: "ctl-arcode-1", vendor: "Arkel", model: "ARCODE", firmware: "5.18.3", connectivity: "iot_gateway", lastTelemetryAt: "2026-05-09T12:42:00.000Z" },
  { id: "ctl-kone-lce", vendor: "Kone", model: "LCECPU", firmware: "3.9.1", connectivity: "gsm", lastTelemetryAt: "2026-05-09T12:10:00.000Z" },
  { id: "ctl-ul-mpk", vendor: "УЛ", model: "МПУ-6", firmware: "2.4.0", connectivity: "none" },
];

export const BUILDINGS: Building[] = [
  {
    id: "bld-104",
    address: "Москва, ул. Кирова, 18к2",
    district: "Юг-2",
    coordinates: { lat: 55.6721, lng: 37.6142 },
    customerId: "cust-1",
    contractId: "ctr-1",
    status: "serviced",
    riskLevel: "watch",
    mechanicIds: ["mech-014"],
    entrances: [
      { id: "ent-104-1", number: "1", floors: 17, elevatorIds: ["elv-441120", "elv-441121"], accessNotes: "Ключ у консьержа" },
      { id: "ent-104-2", number: "2", floors: 17, elevatorIds: ["elv-441122"], accessNotes: "Домофон 184" },
    ],
    elevatorIds: ["elv-441120", "elv-441121", "elv-441122"],
    slaAlerts: 1,
    emergencyElevators: 0,
    overdueMaintenance: 1,
    lastWorkAt: "2026-05-08T15:40:00.000Z",
    photoCount: 84,
    documentCount: 23,
  },
  {
    id: "bld-118",
    address: "Санкт-Петербург, БЦ Север, пр. Обуховской Обороны, 70",
    district: "Север",
    coordinates: { lat: 59.8834, lng: 30.4468 },
    customerId: "cust-2",
    contractId: "ctr-2",
    status: "contract_risk",
    riskLevel: "critical",
    mechanicIds: ["mech-031", "mech-022"],
    entrances: [{ id: "ent-118-a", number: "A", floors: 24, elevatorIds: ["elv-88420", "elv-88421", "elv-88422", "elv-88423"], accessNotes: "BMS пропуск обязателен" }],
    elevatorIds: ["elv-88420", "elv-88421", "elv-88422", "elv-88423"],
    slaAlerts: 3,
    emergencyElevators: 1,
    overdueMaintenance: 2,
    lastWorkAt: "2026-05-09T10:12:00.000Z",
    photoCount: 132,
    documentCount: 41,
  },
  {
    id: "bld-124",
    address: "Москва, Городская больница №7, корпус 3",
    district: "Центр-1",
    coordinates: { lat: 55.7428, lng: 37.5889 },
    customerId: "cust-3",
    contractId: "ctr-3",
    status: "serviced",
    riskLevel: "high",
    mechanicIds: ["mech-022", "mech-014"],
    entrances: [{ id: "ent-124-3", number: "3", floors: 9, elevatorIds: ["elv-332918", "elv-332919"], accessNotes: "Медицинская зона, санитарный доступ" }],
    elevatorIds: ["elv-332918", "elv-332919"],
    slaAlerts: 2,
    emergencyElevators: 1,
    overdueMaintenance: 0,
    lastWorkAt: "2026-05-09T07:50:00.000Z",
    photoCount: 56,
    documentCount: 18,
  },
];

export const ELEVATORS: Elevator[] = [
  { id: "elv-441120", buildingId: "bld-104", entranceId: "ent-104-1", factoryNumber: "OT-441120", registrationNumber: "77-ЛФ-001420", modelId: "mdl-otis-gen2", controllerId: "ctl-arcode-1", status: "active", installedAt: "2019-04-12", lifetimeUntil: "2044-04-12", stops: 17, healthScore: 87, emergencyCount30d: 1, lastRepairAt: "2026-05-08T15:40:00.000Z", nextMaintenanceAt: "2026-05-22T09:00:00.000Z" },
  { id: "elv-441121", buildingId: "bld-104", entranceId: "ent-104-1", factoryNumber: "OT-441121", registrationNumber: "77-ЛФ-001421", modelId: "mdl-otis-gen2", controllerId: "ctl-arcode-1", status: "inspection_required", installedAt: "2019-04-12", lifetimeUntil: "2044-04-12", stops: 17, healthScore: 72, emergencyCount30d: 2, lastRepairAt: "2026-05-03T11:10:00.000Z", nextMaintenanceAt: "2026-05-07T09:00:00.000Z" },
  { id: "elv-88420", buildingId: "bld-118", entranceId: "ent-118-a", factoryNumber: "SC-88420", registrationNumber: "78-ЛФ-008420", modelId: "mdl-schindler-3300", controllerId: "ctl-kone-lce", status: "emergency", installedAt: "2017-09-20", modernizedAt: "2025-10-01", lifetimeUntil: "2042-09-20", stops: 24, healthScore: 41, emergencyCount30d: 7, lastRepairAt: "2026-05-09T10:12:00.000Z", nextMaintenanceAt: "2026-05-10T08:00:00.000Z" },
  { id: "elv-332918", buildingId: "bld-124", entranceId: "ent-124-3", factoryNumber: "ЩЛЗ-332918", registrationNumber: "77-ЛФ-003918", modelId: "mdl-shlz-mlp", controllerId: "ctl-ul-mpk", status: "maintenance", installedAt: "2012-03-04", lifetimeUntil: "2037-03-04", stops: 9, healthScore: 58, emergencyCount30d: 4, lastRepairAt: "2026-05-09T07:50:00.000Z", nextMaintenanceAt: "2026-05-18T10:00:00.000Z" },
];

export const EQUIPMENT_NODES: EquipmentNode[] = [
  { id: "node-1", elevatorId: "elv-88420", type: "doors", name: "Дверной привод", serialNumber: "D-88331", installedAt: "2025-10-01", expectedLifeMonths: 72, health: 39, lastRepairAt: "2026-05-09T10:12:00.000Z", failures: 5, photoCount: 18 },
  { id: "node-2", elevatorId: "elv-88420", type: "controller", name: "Контроллер LCECPU", serialNumber: "LCE-4410", installedAt: "2025-10-01", expectedLifeMonths: 120, health: 64, failures: 1, photoCount: 7 },
  { id: "node-3", elevatorId: "elv-332918", type: "ropes", name: "Канаты тяговые", serialNumber: "R-3329", installedAt: "2023-06-12", expectedLifeMonths: 48, health: 55, lastRepairAt: "2026-04-22T13:00:00.000Z", failures: 2, photoCount: 11 },
];

export const ELEVATOR_EVENTS: ElevatorEvent[] = [
  { id: "evt-1", elevatorId: "elv-88420", type: "emergency", title: "Застревание пассажира", description: "Открытие дверей не завершено на 12 этаже", happenedAt: "2026-05-09T10:04:00.000Z", workOrderId: "WO-2841", nodeId: "node-1", severity: "critical" },
  { id: "evt-2", elevatorId: "elv-441121", type: "inspection", title: "Просрочено ТО", description: "Плановое ТО просрочено на 2 дня", happenedAt: "2026-05-09T08:00:00.000Z", severity: "warning" },
  { id: "evt-3", elevatorId: "elv-332918", type: "node_replacement", title: "Замена ролика двери", description: "Фотофиксация до/после приложена", happenedAt: "2026-05-08T16:20:00.000Z", workOrderId: "WO-2829", severity: "info" },
];

export const MAINTENANCE_SCHEDULES: MaintenanceSchedule[] = [
  { id: "sch-1", elevatorId: "elv-441121", type: "monthly_to", plannedAt: "2026-05-07T09:00:00.000Z", overdueDays: 2, recurringRule: "FREQ=MONTHLY", slaImpact: "risk" },
  { id: "sch-2", elevatorId: "elv-88420", type: "quarterly_inspection", plannedAt: "2026-05-10T08:00:00.000Z", overdueDays: 0, recurringRule: "FREQ=MONTHLY;INTERVAL=3", slaImpact: "watch" },
  { id: "sch-3", elevatorId: "elv-332918", type: "annual_inspection", plannedAt: "2026-05-18T10:00:00.000Z", overdueDays: 0, recurringRule: "FREQ=YEARLY", slaImpact: "none" },
];

export const ELEVATOR_PHOTOS: ElevatorPhoto[] = [
  { id: "ph-1", elevatorId: "elv-88420", kind: "before", title: "Дверной привод до ремонта", takenAt: "2026-05-09T10:08:00.000Z", takenBy: "Роман Кац" },
  { id: "ph-2", elevatorId: "elv-88420", kind: "after", title: "Регулировка створок", takenAt: "2026-05-09T10:44:00.000Z", takenBy: "Роман Кац" },
  { id: "ph-3", elevatorId: "elv-332918", kind: "inspection", title: "Машинное помещение", takenAt: "2026-05-08T15:00:00.000Z", takenBy: "Алексей Климов" },
];

export const ELEVATOR_DOCUMENTS: ElevatorDocument[] = [
  { id: "doc-1", ownerId: "elv-88420", ownerType: "elevator", type: "passport", title: "Паспорт лифта SC-88420", version: "v4", updatedAt: "2025-10-02", secure: true },
  { id: "doc-2", ownerId: "elv-88420", ownerType: "elevator", type: "scheme", title: "Электрическая схема контроллера", version: "v2", updatedAt: "2025-10-02", secure: true },
  { id: "doc-3", ownerId: "bld-118", ownerType: "building", type: "inspection_act", title: "Акт обследования БЦ Север", version: "v7", updatedAt: "2026-04-28", secure: true },
];

export function buildRegistryRows(): RegistryRow[] {
  return BUILDINGS.map((building) => {
    const customer = CUSTOMERS.find((candidate) => candidate.id === building.customerId) ?? CUSTOMERS[0];
    const contract = SERVICE_CONTRACTS.find((candidate) => candidate.id === building.contractId) ?? SERVICE_CONTRACTS[0];
    const elevators = ELEVATORS.filter((elevator) => building.elevatorIds.includes(elevator.id));
    const assignedMechanics = building.mechanicIds.map((mechanicId) => MECHANICS.find((mechanic) => mechanic.id === mechanicId)?.name ?? mechanicId);
    return { building, customer, contract, elevators, assignedMechanics, healthStatus: building.riskLevel };
  });
}

export const MAP_LAYERS = [
  { id: "objects", label: "Объекты", enabled: true },
  { id: "emergency", label: "Аварийные объекты", enabled: true },
  { id: "risk_zones", label: "Проблемные зоны", enabled: true },
  { id: "mechanic_routes", label: "Маршруты механиков", enabled: true },
  { id: "sla_risks", label: "SLA risks", enabled: true },
];
