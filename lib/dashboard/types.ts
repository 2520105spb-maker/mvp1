import type { UserRole } from "@/lib/auth/types";

export type DashboardWidgetKind = "kpi" | "stream" | "map" | "alerts" | "quick_actions" | "trend" | "ai" | "offline";
export type OperationalEventType = "new_work_order" | "emergency_call" | "work_order_approved" | "mechanic_online" | "overdue_sla" | "low_stock" | "failed_upload" | "route_delay";
export type AlertType = "emergency" | "sla_violation" | "overdue_maintenance" | "upload_failure" | "warehouse_risk" | "missing_photos" | "ai_anomaly";
export type AlertSeverity = "info" | "warning" | "critical";
export type WidgetDensity = "compact" | "comfortable" | "command";

export type DashboardWidget = {
  id: string;
  title: string;
  kind: DashboardWidgetKind;
  roles: UserRole[];
  permission: string;
  pinned: boolean;
  lazy: boolean;
  density: WidgetDensity;
  refreshSeconds: number;
};

export type KpiMetric = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  delta: string;
  trend: "up" | "down" | "flat";
  severity: AlertSeverity;
  roles: UserRole[];
};

export type OperationalEvent = {
  id: string;
  type: OperationalEventType;
  title: string;
  description: string;
  happenedAt: string;
  actor: string;
  target: string;
  severity: AlertSeverity;
  roles: UserRole[];
  unread: boolean;
};

export type DashboardAlert = {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  severity: AlertSeverity;
  slaMinutesRemaining?: number;
  objectId?: string;
  workOrderId?: string;
  roles: UserRole[];
  escalationLevel: 1 | 2 | 3;
};

export type QuickAction = {
  id: string;
  label: string;
  description: string;
  href: string;
  roles: UserRole[];
  permission: string;
  hotkey?: string;
};

export type OperationsMapPoint = {
  id: string;
  type: "mechanic" | "object" | "emergency" | "route" | "sla_risk";
  label: string;
  status: "normal" | "watch" | "critical";
  coordinates: { lat: number; lng: number };
  routeEtaMinutes?: number;
};

export type TrendPoint = {
  label: string;
  sla: number;
  emergencies: number;
  completed: number;
  load: number;
};

export type AiInsight = {
  id: string;
  title: string;
  description: string;
  confidence: number;
  category: "risk_objects" | "overloaded_mechanics" | "recurring_failures" | "suspicious_activity" | "predictive_alert";
  roles: UserRole[];
};

export type DashboardLayoutProfile = {
  role: UserRole;
  layoutId: string;
  pinnedModules: string[];
  density: WidgetDensity;
  lastSavedAt: string;
};

export type OfflineDashboardState = {
  mode: "online" | "degraded" | "offline";
  cachedAt: string;
  staleMinutes: number;
  pendingSync: number;
  reconnectPolicy: string;
};
