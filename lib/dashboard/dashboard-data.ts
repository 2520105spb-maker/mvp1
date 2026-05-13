import type { UserRole } from "@/lib/auth/types";
import type { AiInsight, DashboardAlert, DashboardLayoutProfile, DashboardWidget, KpiMetric, OfflineDashboardState, OperationalEvent, OperationsMapPoint, QuickAction, TrendPoint } from "./types";

export const ROLE_DASHBOARD_LABELS: Record<UserRole, string> = {
  mechanic: "Механик — field home",
  seniorMechanic: "Старший механик — brigade control",
  dispatcher: "Диспетчер — realtime operations",
  emergencyCoordinator: "Координатор аварий — emergency command",
  warehouse: "Склад — material control",
  supervisor: "Руководитель — service performance",
  director: "Директор — business control",
  administrator: "Администратор — system control",
};

export const DASHBOARD_WIDGETS: DashboardWidget[] = [
  { id: "critical-alerts", title: "Critical alerts", kind: "alerts", roles: ["dispatcher", "emergencyCoordinator", "supervisor", "director", "administrator"], permission: "dashboard:view", pinned: true, lazy: false, density: "command", refreshSeconds: 5 },
  { id: "mechanic-today", title: "Сегодняшние заявки", kind: "stream", roles: ["mechanic", "seniorMechanic"], permission: "work_orders:read", pinned: true, lazy: false, density: "compact", refreshSeconds: 20 },
  { id: "ops-stream", title: "Operational stream", kind: "stream", roles: ["dispatcher", "emergencyCoordinator", "warehouse", "supervisor", "director", "administrator"], permission: "dashboard:view", pinned: true, lazy: false, density: "command", refreshSeconds: 3 },
  { id: "ops-map", title: "Operations map", kind: "map", roles: ["dispatcher", "emergencyCoordinator", "supervisor", "director"], permission: "objects:read", pinned: true, lazy: true, density: "comfortable", refreshSeconds: 10 },
  { id: "kpi-engine", title: "KPI engine", kind: "kpi", roles: ["dispatcher", "emergencyCoordinator", "warehouse", "supervisor", "director", "administrator"], permission: "analytics:read", pinned: true, lazy: false, density: "comfortable", refreshSeconds: 30 },
  { id: "ai-insights", title: "AI insights", kind: "ai", roles: ["dispatcher", "emergencyCoordinator", "supervisor", "director", "administrator"], permission: "analytics:read", pinned: false, lazy: true, density: "comfortable", refreshSeconds: 60 },
  { id: "offline-sync", title: "Offline sync", kind: "offline", roles: ["mechanic", "warehouse", "dispatcher", "emergencyCoordinator"], permission: "dashboard:view", pinned: true, lazy: false, density: "compact", refreshSeconds: 15 },
];

const everyone: UserRole[] = ["mechanic", "seniorMechanic", "dispatcher", "emergencyCoordinator", "warehouse", "supervisor", "director", "administrator"];

export const KPI_METRICS: KpiMetric[] = [
  { id: "sla", label: "SLA %", value: "93.4", unit: "%", delta: "+1.8%", trend: "up", severity: "info", roles: ["supervisor", "director"] },
  { id: "daily-emergencies", label: "Аварии за день", value: "11", delta: "+3", trend: "up", severity: "warning", roles: ["dispatcher", "emergencyCoordinator", "supervisor", "director"] },
  { id: "mttr", label: "Среднее время ремонта", value: "1ч 42м", delta: "-12м", trend: "down", severity: "info", roles: ["supervisor", "director"] },
  { id: "open-wo", label: "Open work orders", value: "184", delta: "+19", trend: "up", severity: "warning", roles: ["dispatcher", "emergencyCoordinator", "supervisor", "director", "administrator"] },
  { id: "overdue", label: "Overdue jobs", value: "27", delta: "+5", trend: "up", severity: "critical", roles: ["dispatcher", "emergencyCoordinator", "supervisor", "director"] },
  { id: "profitability", label: "Profitability", value: "18.2", unit: "%", delta: "future-ready", trend: "flat", severity: "info", roles: ["director"] },
  { id: "active-mechanics", label: "Active mechanics", value: "37", delta: "4 on-call", trend: "flat", severity: "info", roles: ["dispatcher", "emergencyCoordinator", "supervisor", "director"] },
  { id: "active-calls", label: "Active calls", value: "42", delta: "+8", trend: "up", severity: "warning", roles: ["dispatcher", "emergencyCoordinator"] },
  { id: "emergency-queue", label: "Emergency queue", value: "5", delta: "2 critical", trend: "up", severity: "critical", roles: ["dispatcher", "emergencyCoordinator"] },
  { id: "delayed-mechanics", label: "Delayed mechanics", value: "6", delta: "traffic", trend: "up", severity: "warning", roles: ["dispatcher", "emergencyCoordinator"] },
  { id: "unresolved-returns", label: "Unresolved returns", value: "8", delta: "3 urgent", trend: "flat", severity: "warning", roles: ["dispatcher", "warehouse"] },
  { id: "low-stock", label: "Low stock", value: "12", delta: "+4", trend: "up", severity: "critical", roles: ["warehouse"] },
  { id: "reservations", label: "Pending reservations", value: "31", delta: "7 today", trend: "flat", severity: "info", roles: ["warehouse"] },
  { id: "writeoffs", label: "Suspicious write-offs", value: "4", delta: "AI flagged", trend: "up", severity: "warning", roles: ["warehouse", "supervisor", "director"] },
  { id: "incoming", label: "Incoming deliveries", value: "9", delta: "2 delayed", trend: "flat", severity: "info", roles: ["warehouse"] },
  { id: "today-jobs", label: "Сегодняшние заявки", value: "8", delta: "2 urgent", trend: "flat", severity: "warning", roles: ["mechanic"] },
  { id: "pending-uploads", label: "Pending uploads", value: "7", delta: "photos/signatures", trend: "flat", severity: "warning", roles: ["mechanic"] },
  { id: "materials", label: "Материалы", value: "5", delta: "reserved", trend: "flat", severity: "info", roles: ["mechanic"] },
  { id: "sla-timer", label: "SLA timer", value: "18м", delta: "WO-2841", trend: "down", severity: "critical", roles: ["mechanic"] },
];

export const OPERATIONAL_EVENTS: OperationalEvent[] = [
  { id: "evt-live-1", type: "emergency_call", title: "Аварийный вызов", description: "БЦ Север: пассажир внутри, лифт SC-88420", happenedAt: "2026-05-11T08:42:10.000Z", actor: "Dispatcher", target: "WO-2944", severity: "critical", roles: ["dispatcher", "supervisor", "director", "mechanic"], unread: true },
  { id: "evt-live-2", type: "new_work_order", title: "Новый заказ-наряд", description: "Просроченное ТО OT-441121 создано автоматически", happenedAt: "2026-05-11T08:39:00.000Z", actor: "Scheduler", target: "WO-2943", severity: "warning", roles: ["dispatcher", "supervisor", "mechanic"], unread: true },
  { id: "evt-live-3", type: "mechanic_online", title: "Механик online", description: "Алексей Климов начал смену и получил маршрут", happenedAt: "2026-05-11T08:34:20.000Z", actor: "PWA", target: "mech-014", severity: "info", roles: ["dispatcher", "supervisor", "mechanic"], unread: false },
  { id: "evt-live-4", type: "low_stock", title: "Low stock", description: "Дверной ролик DR-44 ниже min stock на складе Юг", happenedAt: "2026-05-11T08:30:00.000Z", actor: "Warehouse", target: "SKU-DR-44", severity: "warning", roles: ["warehouse", "dispatcher", "supervisor"], unread: true },
  { id: "evt-live-5", type: "failed_upload", title: "Failed upload", description: "3 фото WO-2931 ожидают повторной синхронизации", happenedAt: "2026-05-11T08:26:00.000Z", actor: "Offline Sync", target: "WO-2931", severity: "warning", roles: ["mechanic", "dispatcher", "administrator"], unread: true },
  { id: "evt-live-6", type: "work_order_approved", title: "Работы подтверждены", description: "Руководитель подтвердил закрытие WO-2922", happenedAt: "2026-05-11T08:21:00.000Z", actor: "Supervisor", target: "WO-2922", severity: "info", roles: ["dispatcher", "supervisor", "director", "mechanic"], unread: false },
];

export const DASHBOARD_ALERTS: DashboardAlert[] = [
  { id: "alert-1", type: "emergency", title: "Авария с пассажиром", description: "БЦ Север, 12 этаж, SLA response < 20 минут", severity: "critical", slaMinutesRemaining: 13, objectId: "bld-118", workOrderId: "WO-2944", roles: ["dispatcher", "supervisor", "director", "mechanic"], escalationLevel: 3 },
  { id: "alert-2", type: "sla_violation", title: "SLA violation risk", description: "6 заказ-нарядов приблизились к порогу реагирования", severity: "critical", slaMinutesRemaining: 18, roles: ["dispatcher", "emergencyCoordinator", "supervisor", "director"], escalationLevel: 2 },
  { id: "alert-3", type: "overdue_maintenance", title: "Overdue ТО", description: "27 плановых ТО просрочены, 9 влияют на SLA", severity: "warning", roles: ["dispatcher", "supervisor", "director", "mechanic"], escalationLevel: 2 },
  { id: "alert-4", type: "warehouse_risk", title: "Warehouse risk", description: "12 critical SKU ниже min stock; 4 списания требуют проверки", severity: "warning", roles: ["warehouse", "supervisor", "director"], escalationLevel: 1 },
  { id: "alert-5", type: "ai_anomaly", title: "AI anomaly", description: "Повторяющиеся отказы дверей SC-88420 выше базовой линии на 240%", severity: "warning", roles: ["dispatcher", "emergencyCoordinator", "supervisor", "director"], escalationLevel: 2 },
  { id: "alert-6", type: "missing_photos", title: "Missing photos", description: "5 закрытых работ ожидают обязательную фотофиксацию", severity: "warning", roles: ["mechanic", "dispatcher", "supervisor"], escalationLevel: 1 },
];

export const QUICK_ACTIONS: QuickAction[] = [
  { id: "create-wo", label: "Создать заказ-наряд", description: "Emergency/repair/planned work order", href: "/work-orders/new", roles: ["dispatcher", "mechanic", "supervisor"], permission: "work_orders:create", hotkey: "N" },
  { id: "assign-mechanic", label: "Назначить механика", description: "Dispatch queue and route", href: "/dispatch", roles: ["dispatcher", "supervisor"], permission: "dispatch:manage", hotkey: "A" },
  { id: "open-object", label: "Открыть объект", description: "Objects registry", href: "/objects", roles: ["mechanic", "dispatcher", "supervisor", "director"], permission: "objects:read" },
  { id: "approve-work", label: "Подтвердить работы", description: "Approvals and audit", href: "/work-orders/approvals", roles: ["supervisor", "director"], permission: "work_orders:approve" },
  { id: "view-emergencies", label: "Посмотреть аварии", description: "Emergency board", href: "/dispatch?queue=emergency", roles: ["dispatcher", "supervisor", "director", "mechanic"], permission: "dispatch:read" },
  { id: "open-warehouse", label: "Открыть склад", description: "Reservations and low stock", href: "/warehouse", roles: ["warehouse", "dispatcher", "supervisor"], permission: "warehouse:read" },
];

export const MAP_POINTS: OperationsMapPoint[] = [
  { id: "map-1", type: "emergency", label: "БЦ Север / WO-2944", status: "critical", coordinates: { lat: 59.8834, lng: 30.4468 }, routeEtaMinutes: 11 },
  { id: "map-2", type: "mechanic", label: "Алексей Климов", status: "normal", coordinates: { lat: 55.6721, lng: 37.6142 }, routeEtaMinutes: 18 },
  { id: "map-3", type: "object", label: "ЖК Маяк", status: "watch", coordinates: { lat: 55.7428, lng: 37.5889 } },
  { id: "map-4", type: "sla_risk", label: "SLA cluster Юг-2", status: "critical", coordinates: { lat: 55.6881, lng: 37.6042 }, routeEtaMinutes: 24 },
];

export const TREND_POINTS: TrendPoint[] = [
  { label: "07:00", sla: 96, emergencies: 2, completed: 18, load: 72 },
  { label: "09:00", sla: 94, emergencies: 5, completed: 31, load: 81 },
  { label: "11:00", sla: 93, emergencies: 8, completed: 49, load: 88 },
  { label: "13:00", sla: 91, emergencies: 11, completed: 63, load: 84 },
  { label: "15:00", sla: 92, emergencies: 9, completed: 82, load: 79 },
];

export const AI_INSIGHTS: AiInsight[] = [
  { id: "ai-1", title: "Risk object", description: "БЦ Север: повторные отказы дверного узла, высокий SLA риск", confidence: 91, category: "risk_objects", roles: ["dispatcher", "emergencyCoordinator", "supervisor", "director"] },
  { id: "ai-2", title: "Overloaded mechanics", description: "3 механика Юг-2 превысят сменную загрузку через 90 минут", confidence: 86, category: "overloaded_mechanics", roles: ["dispatcher", "supervisor"] },
  { id: "ai-3", title: "Recurring failures", description: "SC-88420 имеет 5 событий по дверям за 30 дней", confidence: 94, category: "recurring_failures", roles: ["dispatcher", "supervisor", "director", "mechanic"] },
  { id: "ai-4", title: "Suspicious activity", description: "Списание роликов DR-44 выше сезонной нормы", confidence: 78, category: "suspicious_activity", roles: ["warehouse", "supervisor", "director"] },
  { id: "ai-5", title: "Predictive alert", description: "Вероятность отказа канатов ЩЛЗ-332918 в горизонте 45 дней", confidence: 82, category: "predictive_alert", roles: ["mechanic", "supervisor", "director"] },
];

export const LAYOUT_PROFILES: DashboardLayoutProfile[] = [
  { role: "mechanic", layoutId: "field-compact-v1", pinnedModules: ["mechanic-today", "offline-sync", "quick-actions"], density: "compact", lastSavedAt: "2026-05-11T07:40:00.000Z" },
  { role: "dispatcher", layoutId: "dispatch-command-v4", pinnedModules: ["critical-alerts", "ops-stream", "ops-map", "kpi-engine"], density: "command", lastSavedAt: "2026-05-11T07:30:00.000Z" },
  { role: "warehouse", layoutId: "warehouse-control-v2", pinnedModules: ["ops-stream", "offline-sync", "kpi-engine"], density: "comfortable", lastSavedAt: "2026-05-10T18:15:00.000Z" },
  { role: "supervisor", layoutId: "supervisor-kpi-v3", pinnedModules: ["critical-alerts", "kpi-engine", "ai-insights", "ops-map"], density: "comfortable", lastSavedAt: "2026-05-11T06:50:00.000Z" },
  { role: "director", layoutId: "director-control-v1", pinnedModules: ["kpi-engine", "ai-insights", "critical-alerts"], density: "comfortable", lastSavedAt: "2026-05-11T06:20:00.000Z" },
  { role: "administrator", layoutId: "admin-system-v1", pinnedModules: ["ops-stream", "critical-alerts"], density: "comfortable", lastSavedAt: "2026-05-10T21:10:00.000Z" },
];

export const OFFLINE_STATE: OfflineDashboardState = {
  mode: "degraded",
  cachedAt: "2026-05-11T08:38:00.000Z",
  staleMinutes: 4,
  pendingSync: 7,
  reconnectPolicy: "batch events, refresh KPI snapshots, replay pending uploads, preserve widget layout",
};

export function forRole<T extends { roles: UserRole[] }>(items: T[], role: UserRole) {
  return items.filter((item) => item.roles.includes(role));
}
