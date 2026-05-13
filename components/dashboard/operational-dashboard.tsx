"use client";

import { ReactNode, useEffect } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { create } from "zustand";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BellRing,
  Bot,
  Boxes,
  Building2,
  CheckCircle2,
  CloudOff,
  Gauge,
  Grip,
  HardHat,
  LayoutDashboard,
  Map,
  Navigation,
  Pin,
  RadioTower,
  Route,
  Save,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Smartphone,
  TimerReset,
  TrendingUp,
  UserCog,
  Users,
  Warehouse,
  Wifi,
  Wrench,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth/types";
import {
  AI_INSIGHTS,
  DASHBOARD_ALERTS,
  DASHBOARD_WIDGETS,
  KPI_METRICS,
  LAYOUT_PROFILES,
  MAP_POINTS,
  OFFLINE_STATE,
  OPERATIONAL_EVENTS,
  QUICK_ACTIONS,
  ROLE_DASHBOARD_LABELS,
  TREND_POINTS,
  forRole,
} from "@/lib/dashboard/dashboard-data";
import type {
  DashboardAlert,
  KpiMetric,
  OperationalEvent,
} from "@/lib/dashboard/types";

type DashboardState = {
  role: UserRole;
  selectedStream: "all" | "critical" | "unread";
  notificationsOpen: boolean;
  setRole: (role: UserRole) => void;
  setSelectedStream: (stream: "all" | "critical" | "unread") => void;
  toggleNotifications: () => void;
};

const roles: UserRole[] = [
  "mechanic",
  "seniorMechanic",
  "dispatcher",
  "emergencyCoordinator",
  "warehouse",
  "supervisor",
  "director",
  "administrator",
];

const roleIcons: Record<UserRole, ReactNode> = {
  mechanic: <HardHat className="h-4 w-4" />,
  seniorMechanic: <ShieldCheck className="h-4 w-4" />,
  dispatcher: <RadioTower className="h-4 w-4" />,
  emergencyCoordinator: <ShieldAlert className="h-4 w-4" />,
  warehouse: <Warehouse className="h-4 w-4" />,
  supervisor: <Users className="h-4 w-4" />,
  director: <TrendingUp className="h-4 w-4" />,
  administrator: <UserCog className="h-4 w-4" />,
};

const eventIcons: Record<OperationalEvent["type"], ReactNode> = {
  new_work_order: <Wrench className="h-4 w-4" />,
  emergency_call: <Siren className="h-4 w-4" />,
  work_order_approved: <CheckCircle2 className="h-4 w-4" />,
  mechanic_online: <HardHat className="h-4 w-4" />,
  overdue_sla: <TimerReset className="h-4 w-4" />,
  low_stock: <Boxes className="h-4 w-4" />,
  failed_upload: <CloudOff className="h-4 w-4" />,
  route_delay: <Route className="h-4 w-4" />,
};

const quickActionIcons: Record<string, ReactNode> = {
  "create-wo": <Wrench className="h-4 w-4" />,
  "assign-mechanic": <Navigation className="h-4 w-4" />,
  "open-object": <Building2 className="h-4 w-4" />,
  "approve-work": <CheckCircle2 className="h-4 w-4" />,
  "view-emergencies": <Siren className="h-4 w-4" />,
  "open-warehouse": <Warehouse className="h-4 w-4" />,
};

const useDashboardStore = create<DashboardState>((set) => ({
  role: "dispatcher",
  selectedStream: "all",
  notificationsOpen: false,
  setRole: (role) => set({ role }),
  setSelectedStream: (selectedStream) => set({ selectedStream }),
  toggleNotifications: () =>
    set((state) => ({ notificationsOpen: !state.notificationsOpen })),
}));

const queryClient = new QueryClient();

export function OperationalDashboard({
  initialRole = "dispatcher",
}: {
  initialRole?: UserRole;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <OperationalDashboardInner initialRole={initialRole} />
    </QueryClientProvider>
  );
}

function OperationalDashboardInner({ initialRole }: { initialRole: UserRole }) {
  const role = useDashboardStore((state) => state.role);
  const setRole = useDashboardStore((state) => state.setRole);
  const toggleNotifications = useDashboardStore(
    (state) => state.toggleNotifications,
  );
  const notificationsOpen = useDashboardStore(
    (state) => state.notificationsOpen,
  );
  const { data: events = [] } = useQuery({
    queryKey: ["dashboard-events"],
    queryFn: async () => OPERATIONAL_EVENTS,
    refetchInterval: 5000,
  });

  useEffect(() => setRole(initialRole), [initialRole, setRole]);

  const roleAlerts = forRole(DASHBOARD_ALERTS, role);
  const unreadCount = events.filter(
    (event) => event.unread && event.roles.includes(role),
  ).length;

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/85 px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-400/40 bg-orange-500/15 text-orange-300">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  realtime ERP command center
                </p>
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Dashboard & Operational Control Center
                </h1>
              </div>
            </div>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
              Главная точка входа для полевых операций: role-based KPI, realtime
              stream, аварии, SLA, механики, склад, offline sync, AI insights и
              быстрые действия.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {roles.map((candidate) => (
              <button
                key={candidate}
                onClick={() => setRole(candidate)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
                  role === candidate
                    ? "border-orange-400 bg-orange-500/15 text-orange-100"
                    : "border-slate-800 bg-slate-900/70 text-slate-400 hover:text-white",
                )}
              >
                {roleIcons[candidate]} {candidate}
              </button>
            ))}
            <Button variant="secondary" onClick={toggleNotifications}>
              <BellRing className="h-4 w-4" /> {unreadCount}
            </Button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <StatusPill
            icon={<Wifi className="h-4 w-4" />}
            label="WebSocket"
            value="batched / 5s"
          />
          <StatusPill
            icon={<CloudOff className="h-4 w-4" />}
            label="Offline cache"
            value={`${OFFLINE_STATE.pendingSync} pending sync`}
          />
          <StatusPill
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Realtime RBAC"
            value="role-filtered widgets"
          />
        </div>
      </header>

      {notificationsOpen && (
        <NotificationCenter role={role} events={events} alerts={roleAlerts} />
      )}

      <div className="grid min-h-[calc(100vh-190px)] grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)_400px]">
        <LeftAlertCenter role={role} alerts={roleAlerts} />
        <section className="min-w-0 border-slate-800 p-4 lg:border-l lg:p-6">
          <CentralWorkspace role={role} events={events} />
        </section>
        <RightKpiInsights role={role} />
      </div>
    </main>
  );
}

function LeftAlertCenter({
  role,
  alerts,
}: {
  role: UserRole;
  alerts: DashboardAlert[];
}) {
  const profile =
    LAYOUT_PROFILES.find((layout) => layout.role === role) ??
    LAYOUT_PROFILES[0];
  const criticalAlerts = alerts.filter(
    (alert) => alert.severity === "critical",
  );
  const warningAlerts = alerts.filter((alert) => alert.severity === "warning");

  return (
    <aside className="space-y-4 border-b border-slate-800 bg-slate-950/45 p-4 lg:border-b-0">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-orange-500/15 p-2 text-orange-300">
            {roleIcons[role]}
          </div>
          <div>
            <p className="font-bold text-white">
              {ROLE_DASHBOARD_LABELS[role]}
            </p>
            <p className="text-xs text-slate-500">layout {profile.layoutId}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
          <Badge>
            <Pin className="h-3 w-3" /> {profile.pinnedModules.length} pinned
          </Badge>
          <Badge>
            <Grip className="h-3 w-3" /> {profile.density}
          </Badge>
        </div>
      </div>

      <PanelBlock title="Critical alerts" icon={<Siren className="h-4 w-4" />}>
        <div className="space-y-2">
          {criticalAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </PanelBlock>
      <PanelBlock
        title="SLA / overdue / approvals"
        icon={<TimerReset className="h-4 w-4" />}
      >
        <div className="space-y-2">
          {warningAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </PanelBlock>
      <OfflinePanel />
    </aside>
  );
}

function CentralWorkspace({
  role,
  events,
}: {
  role: UserRole;
  events: OperationalEvent[];
}) {
  const selectedStream = useDashboardStore((state) => state.selectedStream);
  const setSelectedStream = useDashboardStore(
    (state) => state.setSelectedStream,
  );
  const roleEvents = forRole(events, role).filter((event) => {
    if (selectedStream === "critical") return event.severity === "critical";
    if (selectedStream === "unread") return event.unread;
    return true;
  });

  return (
    <div className="space-y-5">
      <RoleSummary role={role} />
      <QuickActions role={role} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="border-slate-800 bg-slate-950/70">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-300" /> Live operational
                stream
              </CardTitle>
              <div className="flex gap-2">
                {(["all", "critical", "unread"] as const).map((stream) => (
                  <button
                    key={stream}
                    onClick={() => setSelectedStream(stream)}
                    className={cn(
                      "rounded-xl border px-3 py-1.5 text-xs font-semibold",
                      selectedStream === stream
                        ? "border-orange-400 bg-orange-500/10 text-orange-100"
                        : "border-slate-800 bg-slate-900 text-slate-400",
                    )}
                  >
                    {stream}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {roleEvents.map((event) => (
              <EventStreamItem key={event.id} event={event} />
            ))}
          </CardContent>
        </Card>
        <OperationsMapWidget role={role} />
      </div>
      <WidgetSystem role={role} />
    </div>
  );
}

function RoleSummary({ role }: { role: UserRole }) {
  const summaryByRole: Record<UserRole, string[]> = {
    mechanic: [
      "8 сегодняшних заявок",
      "Маршрут: Юг-2 / 6 остановок",
      "7 pending uploads",
      "SLA WO-2944: 18м",
    ],
    seniorMechanic: [
      "3 бригады на линии",
      "5 возвратов на контроль",
      "2 approvals по материалам",
      "SLA brigade risk: 1",
    ],
    dispatcher: [
      "42 active calls",
      "5 emergency queue",
      "6 delayed mechanics",
      "Realtime operations map active",
    ],
    emergencyCoordinator: [
      "2 critical incidents",
      "1 escalation active",
      "Avg response 11м",
      "Emergency override ready",
    ],
    warehouse: [
      "12 low stock",
      "31 reservations",
      "4 suspicious write-offs",
      "9 incoming deliveries",
    ],
    supervisor: [
      "SLA 93.4%",
      "27 overdue jobs",
      "37 active mechanics",
      "14 problem objects",
    ],
    director: [
      "SLA 93.4%",
      "11 аварий за день",
      "Profitability future-ready",
      "184 open work orders",
    ],
    administrator: [
      "88 active sessions",
      "7 sync warnings",
      "2 failed uploads",
      "RBAC stream healthy",
    ],
  };
  const summary = summaryByRole[role];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {summary.map((item) => (
        <Card key={item} className="border-slate-800 bg-slate-950/70">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-white">{item}</p>
            <p className="mt-2 text-xs text-slate-500">role workspace signal</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QuickActions({ role }: { role: UserRole }) {
  const actions = forRole(QUICK_ACTIONS, role);
  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <a
            key={action.id}
            href={action.href}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-orange-400/50"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-orange-300">
                {quickActionIcons[action.id]}
              </span>
              {action.hotkey && <Badge>{action.hotkey}</Badge>}
            </div>
            <p className="font-semibold text-white">{action.label}</p>
            <p className="mt-1 text-sm text-slate-500">{action.description}</p>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}

function OperationsMapWidget({ role }: { role: UserRole }) {
  const visible = ["dispatcher", "supervisor", "director"].includes(role);
  if (!visible) {
    return (
      <Card className="border-slate-800 bg-slate-950/70">
        <CardHeader>
          <CardTitle>Route & mobile focus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <Smartphone className="mb-3 h-6 w-6 text-orange-300" />
            <p className="font-semibold text-white">
              Touch-friendly field dashboard
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Механик видит маршрут, SLA timer, материалы, фото/подписи и
              offline sync вместо перегруженной карты.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-slate-800 bg-slate-950/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5 text-orange-300" /> Operations map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative min-h-[420px] overflow-hidden rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_25%_20%,rgba(255,122,26,0.18),transparent_15rem),radial-gradient(circle_at_75%_70%,rgba(59,130,246,0.16),transparent_18rem),#0f172a]">
          {MAP_POINTS.map((point, index) => (
            <MapPoint key={point.id} point={point} index={index} />
          ))}
          <div className="absolute bottom-4 left-4 rounded-2xl border border-slate-800 bg-slate-950/90 p-3 text-xs text-slate-400">
            <Route className="mb-2 h-4 w-4 text-orange-300" /> Mechanics,
            objects, emergencies, routes and SLA risks are permission-filtered
            realtime layers.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RightKpiInsights({ role }: { role: UserRole }) {
  const metrics = forRole(KPI_METRICS, role);
  const insights = forRole(AI_INSIGHTS, role);

  return (
    <aside className="space-y-4 border-t border-slate-800 bg-slate-950/55 p-4 2xl:border-l 2xl:border-t-0">
      <PanelBlock title="KPI engine" icon={<Gauge className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-2">
          {metrics.slice(0, 8).map((metric) => (
            <KpiCard key={metric.id} metric={metric} />
          ))}
        </div>
      </PanelBlock>
      <TrendPanel role={role} />
      <PanelBlock title="AI insights" icon={<Bot className="h-4 w-4" />}>
        <div className="space-y-2">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-blue-100">{insight.title}</p>
                <Badge>{insight.confidence}%</Badge>
              </div>
              <p className="mt-2 text-slate-400">{insight.description}</p>
              <p className="mt-2 text-xs text-slate-500">{insight.category}</p>
            </div>
          ))}
        </div>
      </PanelBlock>
    </aside>
  );
}

function TrendPanel({ role }: { role: UserRole }) {
  const showArea = role === "director" || role === "supervisor";
  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <CardTitle className="text-sm uppercase tracking-wide text-slate-400">
          Trends
        </CardTitle>
      </CardHeader>
      <CardContent className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          {showArea ? (
            <AreaChart data={TREND_POINTS} margin={{ left: -24, right: 8 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  color: "#e2e8f0",
                }}
              />
              <Area
                type="monotone"
                dataKey="sla"
                stroke="#22c55e"
                fill="#22c55e33"
              />
              <Area
                type="monotone"
                dataKey="load"
                stroke="#ff7a1a"
                fill="#ff7a1a22"
              />
            </AreaChart>
          ) : (
            <LineChart data={TREND_POINTS} margin={{ left: -24, right: 8 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  color: "#e2e8f0",
                }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="emergencies"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function WidgetSystem({ role }: { role: UserRole }) {
  const widgets = forRole(DASHBOARD_WIDGETS, role);
  const profile =
    LAYOUT_PROFILES.find((layout) => layout.role === role) ??
    LAYOUT_PROFILES[0];
  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Personalized widget system</CardTitle>
          <Button variant="secondary" size="sm">
            <Save className="h-4 w-4" /> Save layout
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {widgets.map((widget) => (
          <div
            key={widget.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{widget.title}</p>
              {widget.pinned && <Pin className="h-4 w-4 text-orange-300" />}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {widget.kind} · refresh {widget.refreshSeconds}s ·{" "}
              {widget.lazy ? "lazy" : "live"}
            </p>
            <Progress
              value={profile.pinnedModules.includes(widget.id) ? 100 : 45}
              className="mt-3"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function NotificationCenter({
  role,
  events,
  alerts,
}: {
  role: UserRole;
  events: OperationalEvent[];
  alerts: DashboardAlert[];
}) {
  const roleEvents = forRole(events, role).filter((event) => event.unread);
  return (
    <div className="border-b border-orange-400/20 bg-orange-500/10 px-4 py-3 lg:px-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <p className="font-semibold text-orange-100">
          <BellRing className="mr-2 inline h-4 w-4" /> Notification center:{" "}
          {roleEvents.length} unread events · {alerts.length} active alerts ·
          push sync ready
        </p>
        <p className="text-sm text-orange-200/80">
          Escalation alerts and mobile push are permission-filtered per role.
        </p>
      </div>
    </div>
  );
}

function OfflinePanel() {
  return (
    <PanelBlock
      title="Offline dashboard"
      icon={<CloudOff className="h-4 w-4" />}
    >
      <div className="rounded-2xl border border-orange-400/30 bg-orange-500/10 p-4 text-sm text-orange-100">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{OFFLINE_STATE.mode}</span>
          <Badge>{OFFLINE_STATE.staleMinutes}m stale</Badge>
        </div>
        <p className="mt-2 text-orange-100/80">
          Cached at{" "}
          {new Date(OFFLINE_STATE.cachedAt).toLocaleTimeString("ru-RU")} ·{" "}
          {OFFLINE_STATE.pendingSync} pending sync.
        </p>
        <p className="mt-2 text-xs text-orange-100/70">
          {OFFLINE_STATE.reconnectPolicy}
        </p>
      </div>
    </PanelBlock>
  );
}

function StatusPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-sm">
      <span className="text-orange-300">{icon}</span>
      <div>
        <p className="font-semibold text-white">{label}</p>
        <p className="text-xs text-slate-500">{value}</p>
      </div>
    </div>
  );
}

function KpiCard({ metric }: { metric: KpiMetric }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3",
        metric.severity === "critical"
          ? "border-red-400/30 bg-red-500/10"
          : metric.severity === "warning"
            ? "border-orange-400/30 bg-orange-500/10"
            : "border-slate-800 bg-slate-900/60",
      )}
    >
      <p className="text-xs text-slate-500">{metric.label}</p>
      <p className="mt-1 text-2xl font-black text-white">
        {metric.value}
        {metric.unit}
      </p>
      <p className="mt-1 text-xs text-slate-400">{metric.delta}</p>
    </div>
  );
}

function EventStreamItem({ event }: { event: OperationalEvent }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        event.severity === "critical"
          ? "border-red-400/30 bg-red-500/10"
          : event.severity === "warning"
            ? "border-orange-400/30 bg-orange-500/10"
            : "border-slate-800 bg-slate-900/60",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-slate-950/70 p-2 text-orange-300">
          {eventIcons[event.type]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-white">{event.title}</p>
            {event.unread && (
              <Badge className="bg-orange-500/20 text-orange-100">unread</Badge>
            )}
            <Badge>{event.type}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">{event.description}</p>
          <p className="mt-2 text-xs text-slate-500">
            {new Date(event.happenedAt).toLocaleString("ru-RU")} · {event.actor}{" "}
            · {event.target}
          </p>
        </div>
      </div>
    </div>
  );
}

function AlertCard({ alert }: { alert: DashboardAlert }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3 text-sm",
        alert.severity === "critical"
          ? "border-red-400/30 bg-red-500/10"
          : "border-orange-400/30 bg-orange-500/10",
      )}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold text-white">{alert.title}</p>
        <Badge>L{alert.escalationLevel}</Badge>
      </div>
      <p className="mt-1 text-slate-400">{alert.description}</p>
      {alert.slaMinutesRemaining && (
        <p className="mt-2 text-xs text-orange-200">
          SLA remaining: {alert.slaMinutesRemaining}m
        </p>
      )}
    </div>
  );
}

function MapPoint({
  point,
  index,
}: {
  point: (typeof MAP_POINTS)[number];
  index: number;
}) {
  const positions = [
    { left: "30%", top: "30%" },
    { left: "62%", top: "44%" },
    { left: "44%", top: "68%" },
    { left: "76%", top: "22%" },
  ];
  const position = positions[index % positions.length];
  return (
    <div className="absolute" style={position}>
      <div
        className={cn(
          "h-5 w-5 rounded-full border-2",
          point.status === "critical"
            ? "border-red-200 bg-red-500 shadow-lg shadow-red-950"
            : point.status === "watch"
              ? "border-orange-200 bg-orange-500"
              : "border-emerald-200 bg-emerald-500",
        )}
      />
      <div className="mt-2 w-48 rounded-2xl border border-slate-800 bg-slate-950/90 p-3 text-xs">
        <p className="font-semibold text-white">{point.label}</p>
        <p className="mt-1 text-slate-500">
          {point.type}
          {point.routeEtaMinutes ? ` · ETA ${point.routeEtaMinutes}m` : ""}
        </p>
      </div>
    </div>
  );
}

function PanelBlock({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}
