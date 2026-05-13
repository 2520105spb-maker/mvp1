"use client";

import { ReactNode, useMemo } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { create } from "zustand";
import {
  AlertTriangle,
  BellRing,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  History,
  Mail,
  Megaphone,
  Radio,
  RefreshCcw,
  Route,
  Send,
  ShieldCheck,
  Smartphone,
  Timer,
  Users,
  Vibrate,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  AI_RISK_ASSESSMENTS,
  ALERT_HISTORY,
  ALERT_RULES,
  APPROVAL_REQUESTS,
  DELIVERY_ATTEMPTS,
  EMERGENCY_EVENTS,
  ESCALATION_POLICIES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_QUEUE,
  PUSH_SUBSCRIPTIONS,
  SLA_EVENTS,
  USER_PREFERENCES,
  buildNotificationStreamRows,
} from "@/lib/notifications/notification-center-data";
import type {
  AlertType,
  NotificationPriority,
  NotificationStatus,
  NotificationStreamRow,
} from "@/lib/notifications/types";

type NotificationView =
  | "stream"
  | "escalations"
  | "channels"
  | "sla"
  | "preferences"
  | "history";

type NotificationOpsState = {
  query: string;
  selectedView: NotificationView;
  selectedNotificationId: string;
  setQuery: (query: string) => void;
  setView: (view: NotificationView) => void;
  selectNotification: (notificationId: string) => void;
};

const notificationQueryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 8_000, refetchOnWindowFocus: false },
  },
});

const viewLabels: Record<NotificationView, string> = {
  stream: "Notification stream",
  escalations: "Escalations",
  channels: "Delivery channels",
  sla: "SLA engine",
  preferences: "User preferences",
  history: "History & diagnostics",
};

const useNotificationOpsStore = create<NotificationOpsState>((set) => ({
  query: "",
  selectedView: "stream",
  selectedNotificationId: "notif-1",
  setQuery: (query) => set({ query }),
  setView: (selectedView) => set({ selectedView }),
  selectNotification: (selectedNotificationId) =>
    set({ selectedNotificationId }),
}));

export function NotificationOperationsCenter() {
  return (
    <QueryClientProvider client={notificationQueryClient}>
      <NotificationOperationsCenterInner />
    </QueryClientProvider>
  );
}

function NotificationOperationsCenterInner() {
  const query = useNotificationOpsStore((state) => state.query);
  const setQuery = useNotificationOpsStore((state) => state.setQuery);
  const selectedView = useNotificationOpsStore((state) => state.selectedView);
  const setView = useNotificationOpsStore((state) => state.setView);
  const { data: rows = [] } = useQuery({
    queryKey: ["notification-stream"],
    queryFn: async () => buildNotificationStreamRows(),
    refetchInterval: 4000,
  });
  const filteredRows = rows.filter((row) =>
    [
      row.notification.title,
      row.notification.type,
      row.notification.source,
      row.notification.objectAddress,
      row.notification.elevatorFactoryNumber,
      row.notification.assignedUser,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/90 px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-400/40 bg-red-500/15 text-red-200">
                <BellRing className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  realtime operational escalation platform
                </p>
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Notification Center, Realtime Alerts & Escalations
                </h1>
              </div>
            </div>
            <p className="mt-3 max-w-5xl text-sm leading-6 text-slate-400">
              Enterprise alerting command center for НеоЛифт: emergency alerts,
              SLA countdowns, sync failures, approvals, push notifications,
              realtime WebSocket event streams, escalation policies,
              multi-channel delivery and notification diagnostics.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-red-400/30 bg-red-500/10 text-red-100">
              <Megaphone className="h-3 w-3" /> emergency mode
            </Badge>
            <Badge className="border-emerald-400/30 bg-emerald-500/10 text-emerald-100">
              <Wifi className="h-3 w-3" /> websocket live
            </Badge>
            <Badge className="border-blue-400/30 bg-blue-500/10 text-blue-100">
              <Smartphone className="h-3 w-3" /> Push API
            </Badge>
          </div>
        </div>
        <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по alert, типу, объекту, лифту, source, assigned user..."
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(viewLabels) as NotificationView[]).map((view) => (
              <button
                key={view}
                onClick={() => setView(view)}
                className={cn(
                  "shrink-0 rounded-xl border px-3 py-2 text-xs font-bold",
                  selectedView === view
                    ? "border-red-400 bg-red-500/10 text-red-100"
                    : "border-slate-800 bg-slate-900 text-slate-400",
                )}
              >
                {viewLabels[view]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-154px)] grid-cols-1 xl:grid-cols-[330px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)_390px]">
        <LeftAlertPanel />
        <section className="min-w-0 border-slate-800 p-4 xl:border-l xl:p-6">
          {selectedView === "stream" && (
            <div className="space-y-5">
              <NotificationStream rows={filteredRows} />
              <SelectedNotification rows={rows} />
            </div>
          )}
          {selectedView === "escalations" && <EscalationSystem />}
          {selectedView === "channels" && <DeliveryArchitecture />}
          {selectedView === "sla" && <SlaAlertEngine />}
          {selectedView === "preferences" && <UserPreferenceCenter />}
          {selectedView === "history" && <NotificationHistory />}
        </section>
        <RightAlertIntelligence />
      </div>
    </main>
  );
}

function LeftAlertPanel() {
  const setView = useNotificationOpsStore((state) => state.setView);
  const rows = buildNotificationStreamRows();
  const unread = rows.filter(
    (row) => row.notification.status === "unread",
  ).length;
  const critical = rows.filter(
    (row) => row.notification.priority === "critical",
  ).length;
  const syncFailures = rows.filter(
    (row) => row.notification.type === "sync_failure",
  ).length;
  const approvals = APPROVAL_REQUESTS.filter(
    (request) => request.status === "pending" || request.status === "escalated",
  ).length;
  const emergencyQueue = EMERGENCY_EVENTS.filter(
    (event) => !event.acceptedAt,
  ).length;
  const slaRisks = SLA_EVENTS.filter(
    (sla) => sla.risk === "breach" || sla.risk === "escalated",
  ).length;

  return (
    <aside className="space-y-4 border-b border-slate-800 bg-slate-950/45 p-4 xl:border-b-0">
      <PanelBlock
        title="Alert counters"
        icon={<BellRing className="h-4 w-4" />}
      >
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Unread" value={unread} />
          <Metric label="Critical" value={critical} danger />
          <Metric label="SLA risks" value={slaRisks} danger />
          <Metric label="Sync failures" value={syncFailures} danger />
          <Metric label="Approvals" value={approvals} />
          <Metric label="Emergency" value={emergencyQueue} danger />
        </div>
      </PanelBlock>
      <PanelBlock
        title="Emergency queue"
        icon={<AlertTriangle className="h-4 w-4" />}
      >
        {EMERGENCY_EVENTS.map((event) => (
          <div
            key={event.id}
            className="mb-2 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{event.workOrderId}</p>
              <Badge>
                {event.fullscreenPushSent ? "push sent" : "pending"}
              </Badge>
            </div>
            <p className="mt-1 text-red-100">
              {event.objectAddress} · {event.elevatorFactoryNumber}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              dispatcher {event.dispatcher} · mechanic {event.mechanic}
            </p>
          </div>
        ))}
      </PanelBlock>
      <PanelBlock title="Approval queue" icon={<Users className="h-4 w-4" />}>
        {APPROVAL_REQUESTS.map((request) => (
          <div
            key={request.id}
            className="mb-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{request.type}</p>
              <Badge>{request.status}</Badge>
            </div>
            <p className="mt-1 text-slate-500">
              {request.amount ?? "no amount"} · due{" "}
              {new Date(request.dueAt).toLocaleTimeString("ru-RU")}
            </p>
          </div>
        ))}
      </PanelBlock>
      <Button onClick={() => setView("escalations")} className="w-full">
        <Route className="h-4 w-4" /> Open escalation policies
      </Button>
    </aside>
  );
}

function NotificationStream({ rows }: { rows: NotificationStreamRow[] }) {
  const selectNotification = useNotificationOpsStore(
    (state) => state.selectNotification,
  );
  const columns = useMemo<ColumnDef<NotificationStreamRow>[]>(
    () => [
      {
        header: "Priority",
        cell: ({ row }) => (
          <PriorityBadge priority={row.original.notification.priority} />
        ),
      },
      {
        header: "Type",
        cell: ({ row }) => <TypeBadge type={row.original.notification.type} />,
      },
      { header: "Source", accessorFn: (row) => row.notification.source },
      { header: "Объект", accessorFn: (row) => row.notification.objectAddress },
      {
        header: "Лифт",
        accessorFn: (row) => row.notification.elevatorFactoryNumber ?? "—",
      },
      {
        header: "Assigned user",
        cell: ({ row }) => (
          <button
            onClick={() => selectNotification(row.original.notification.id)}
            className="text-left font-semibold text-white hover:text-red-200"
          >
            {row.original.notification.assignedUser}
          </button>
        ),
      },
      {
        header: "created_at",
        cell: ({ row }) =>
          new Date(row.original.notification.createdAt).toLocaleString("ru-RU"),
      },
      {
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge status={row.original.notification.status} />
        ),
      },
    ],
    [selectNotification],
  );
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <CardTitle>Main notification stream</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase text-slate-500">
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-800">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-slate-300">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function SelectedNotification({ rows }: { rows: NotificationStreamRow[] }) {
  const selectedNotificationId = useNotificationOpsStore(
    (state) => state.selectedNotificationId,
  );
  const row =
    rows.find(
      (candidate) => candidate.notification.id === selectedNotificationId,
    ) ?? rows[0];
  if (!row) return null;

  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>{row.notification.title}</CardTitle>
            <p className="mt-2 text-sm text-slate-500">
              {row.notification.body}
            </p>
          </div>
          <PriorityBadge priority={row.notification.priority} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-3">
        <InfoTile label="Action URL" value={row.notification.actionUrl} />
        <InfoTile
          label="Channels"
          value={row.notification.channels.join(", ")}
        />
        <InfoTile
          label="Sensitive"
          value={String(row.notification.sensitive)}
        />
        <InfoTile
          label="Delivery"
          value={
            row.queueItems
              .map((item) => `${item.channel}:${item.status}`)
              .join(" · ") || "not queued"
          }
        />
        <InfoTile
          label="SLA"
          value={
            row.sla
              ? `${row.sla.remainingMinutes} min · ${row.sla.risk}`
              : "none"
          }
        />
        <InfoTile
          label="AI risk"
          value={row.ai ? `${row.ai.score}% · ${row.ai.category}` : "none"}
        />
      </CardContent>
    </Card>
  );
}

function EscalationSystem() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {ESCALATION_POLICIES.map((policy) => (
        <Card key={policy.id} className="border-slate-800 bg-slate-950/70">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{policy.name}</CardTitle>
              <TypeBadge type={policy.alertType} />
            </div>
          </CardHeader>
          <CardContent>
            {policy.steps.map((step, index) => (
              <div
                key={`${policy.id}-${step.level}`}
                className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-white">
                    {index + 1}. {step.level}
                  </p>
                  <Badge>+{step.afterMinutes}m</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-400">{step.action}</p>
                <p className="mt-1 text-xs text-slate-500">
                  channels: {step.channels.join(", ")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DeliveryArchitecture() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <PanelCard
        title="Multi-channel delivery"
        icon={<Send className="h-5 w-5" />}
      >
        {NOTIFICATION_CHANNELS.map((channel) => (
          <div
            key={channel.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">{channel.name}</p>
              <Badge>{channel.enabled ? "enabled" : "future"}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {channel.type} · SLA {channel.deliverySlaSeconds}s
            </p>
            <p className="mt-1 text-xs text-slate-500">
              retry: {channel.retryPolicy}
            </p>
          </div>
        ))}
      </PanelCard>
      <PanelCard
        title="Push subscriptions"
        icon={<Smartphone className="h-5 w-5" />}
      >
        {PUSH_SUBSCRIPTIONS.map((subscription) => (
          <div
            key={subscription.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">{subscription.userId}</p>
              <Badge>{subscription.pwaInstall ? "PWA" : "web"}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              fullscreen {String(subscription.emergencyFullscreen)} · actions{" "}
              {String(subscription.actionsEnabled)}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-600">
              {subscription.endpointHash}
            </p>
          </div>
        ))}
      </PanelCard>
    </div>
  );
}

function SlaAlertEngine() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <PanelCard title="SLA timers" icon={<Timer className="h-5 w-5" />}>
        {SLA_EVENTS.map((sla) => (
          <div
            key={sla.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">{sla.workOrderId}</p>
              <Badge>{sla.risk}</Badge>
            </div>
            <Progress
              value={Math.max(0, Math.min(100, 100 - sla.remainingMinutes * 3))}
              className="mt-3"
            />
            <p className="mt-2 text-sm text-slate-400">
              {sla.objectAddress} · {sla.elevatorFactoryNumber} ·{" "}
              {sla.remainingMinutes} min remaining
            </p>
            <p className="mt-1 text-xs text-slate-500">
              warn {new Date(sla.warnAt).toLocaleTimeString("ru-RU")} · breach{" "}
              {new Date(sla.breachAt).toLocaleTimeString("ru-RU")}
            </p>
          </div>
        ))}
      </PanelCard>
      <PanelCard title="Alert rules" icon={<Radio className="h-5 w-5" />}>
        {ALERT_RULES.map((rule) => (
          <div
            key={rule.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">{rule.name}</p>
              <PriorityBadge priority={rule.priority} />
            </div>
            <p className="mt-2 text-sm text-slate-400">{rule.condition}</p>
            <p className="mt-1 text-xs text-slate-500">
              dedupe {rule.dedupeWindowMinutes}m · throttle{" "}
              {rule.throttleMinutes}m
            </p>
          </div>
        ))}
      </PanelCard>
    </div>
  );
}

function UserPreferenceCenter() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {USER_PREFERENCES.map((preference) => (
        <Card
          key={preference.userId}
          className="border-slate-800 bg-slate-950/70"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Vibrate className="h-5 w-5 text-red-300" />
              {preference.userId}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <InfoTile
              label="Quiet hours"
              value={
                preference.quietHours.enabled
                  ? `${preference.quietHours.start}-${preference.quietHours.end}`
                  : "disabled"
              }
            />
            <InfoTile label="Channels" value={preference.channels.join(", ")} />
            <InfoTile
              label="Sound/vibration"
              value={`${String(preference.sound)} / ${String(preference.vibration)}`}
            />
            <InfoTile
              label="Emergency override"
              value={String(preference.emergencyOverride)}
            />
            <InfoTile
              label="Escalation"
              value={preference.escalationPreference}
            />
            <InfoTile
              label="Alert types"
              value={preference.enabledAlertTypes.join(", ")}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function NotificationHistory() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <PanelCard title="Alert history" icon={<History className="h-5 w-5" />}>
        {ALERT_HISTORY.map((entry) => (
          <div
            key={entry.id}
            className="mb-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">
                {entry.action} · {entry.alertId}
              </p>
              <span className="text-xs text-slate-500">
                {new Date(entry.createdAt).toLocaleTimeString("ru-RU")}
              </span>
            </div>
            <p className="mt-1 text-slate-400">{entry.details}</p>
          </div>
        ))}
      </PanelCard>
      <PanelCard title="Delivery attempts" icon={<Mail className="h-5 w-5" />}>
        {DELIVERY_ATTEMPTS.map((attempt) => (
          <div
            key={attempt.id}
            className="mb-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">
                {attempt.notificationId} · {attempt.channel}
              </p>
              <Badge>{attempt.status}</Badge>
            </div>
            <p className="mt-1 text-slate-500">
              latency {attempt.latencyMs}ms · {attempt.error ?? "ok"}
            </p>
          </div>
        ))}
      </PanelCard>
    </div>
  );
}

function RightAlertIntelligence() {
  const failedDeliveries = NOTIFICATION_QUEUE.filter(
    (item) => item.status === "failed",
  ).length;
  return (
    <aside className="space-y-4 border-t border-slate-800 bg-slate-950/55 p-4 2xl:border-l 2xl:border-t-0">
      <PanelBlock title="Delivery status" icon={<Send className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Queued" value={NOTIFICATION_QUEUE.length} />
          <Metric label="Failed" value={failedDeliveries} danger />
          <Metric label="Push subs" value={PUSH_SUBSCRIPTIONS.length} />
          <Metric
            label="Channels"
            value={
              NOTIFICATION_CHANNELS.filter((channel) => channel.enabled).length
            }
          />
        </div>
      </PanelBlock>
      <PanelBlock
        title="Escalation timeline"
        icon={<Clock3 className="h-4 w-4" />}
      >
        {ALERT_HISTORY.slice(0, 4).map((entry) => (
          <div
            key={entry.id}
            className="mb-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
          >
            <p className="font-semibold text-white">{entry.action}</p>
            <p className="mt-1 text-slate-500">{entry.details}</p>
          </div>
        ))}
      </PanelBlock>
      <PanelBlock
        title="Retry status"
        icon={<RefreshCcw className="h-4 w-4" />}
      >
        {NOTIFICATION_QUEUE.map((item) => (
          <div
            key={item.id}
            className="mb-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">
                {item.notificationId} · {item.channel}
              </p>
              <Badge>{item.status}</Badge>
            </div>
            <p className="mt-1 text-slate-500">
              attempts {item.attempts} · next{" "}
              {item.nextAttemptAt
                ? new Date(item.nextAttemptAt).toLocaleTimeString("ru-RU")
                : "—"}
            </p>
          </div>
        ))}
      </PanelBlock>
      <PanelBlock
        title="AI risk assessment"
        icon={<BrainCircuit className="h-4 w-4" />}
      >
        {AI_RISK_ASSESSMENTS.map((risk) => (
          <div
            key={risk.id}
            className="mb-2 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-blue-100">{risk.category}</p>
              <Badge>{risk.score}%</Badge>
            </div>
            <p className="mt-1 text-slate-400">{risk.explanation}</p>
            <p className="mt-1 text-xs text-slate-500">{risk.recommendation}</p>
          </div>
        ))}
      </PanelBlock>
    </aside>
  );
}

function PanelCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-red-300">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
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

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-all text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        danger
          ? "border-red-400/30 bg-red-500/10"
          : "border-slate-800 bg-slate-900/60",
      )}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: NotificationPriority }) {
  const cls =
    priority === "critical"
      ? "bg-red-500/15 text-red-200"
      : priority === "high"
        ? "bg-orange-500/15 text-orange-200"
        : priority === "medium"
          ? "bg-blue-500/15 text-blue-200"
          : priority === "silent"
            ? "bg-slate-500/15 text-slate-300"
            : "bg-emerald-500/15 text-emerald-200";
  return <Badge className={cls}>{priority}</Badge>;
}

function StatusBadge({ status }: { status: NotificationStatus }) {
  const cls =
    status === "failed" || status === "escalated"
      ? "bg-red-500/15 text-red-200"
      : status === "unread" || status === "in_progress"
        ? "bg-orange-500/15 text-orange-200"
        : status === "resolved" || status === "acknowledged"
          ? "bg-emerald-500/15 text-emerald-200"
          : "bg-slate-500/15 text-slate-300";
  const Icon =
    status === "resolved" || status === "acknowledged"
      ? CheckCircle2
      : status === "failed" || status === "escalated"
        ? AlertTriangle
        : BellRing;
  return (
    <Badge className={cls}>
      <Icon className="h-3 w-3" /> {status}
    </Badge>
  );
}

function TypeBadge({ type }: { type: AlertType }) {
  const cls =
    type === "emergency" || type === "sla"
      ? "bg-red-500/15 text-red-200"
      : type === "approval_request"
        ? "bg-violet-500/15 text-violet-200"
        : type === "sync_failure"
          ? "bg-orange-500/15 text-orange-200"
          : "bg-slate-500/15 text-slate-200";
  return <Badge className={cls}>{type}</Badge>;
}
