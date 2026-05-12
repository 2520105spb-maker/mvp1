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
  Activity,
  AlertTriangle,
  ArrowDownUp,
  CheckCircle2,
  Clock,
  Database,
  FileWarning,
  HardDrive,
  History,
  KeyRound,
  Layers3,
  Radio,
  RefreshCcw,
  Router,
  ShieldCheck,
  Smartphone,
  UploadCloud,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  CONFLICT_RECORDS,
  DELTA_UPDATES,
  DEVICE_STATE,
  DEXIE_TABLES,
  FAILED_UPLOADS,
  LOCAL_DRAFTS,
  LOCAL_MEDIA_CACHE,
  OFFLINE_AUDIT_LOGS,
  OFFLINE_QUEUE,
  PENDING_OPERATIONS,
  PRIORITY_ORDER,
  RETRY_POLICIES,
  SYNC_EVENTS,
  SYNC_SESSIONS,
  SYNC_SNAPSHOTS,
  buildSyncDashboardRows,
} from "@/lib/sync/sync-engine-data";
import {
  DEXIE_SCHEMA,
  NEOLIFT_DEXIE_DB_NAME,
  NEOLIFT_DEXIE_DB_VERSION,
} from "@/lib/sync/dexie-schema";
import type {
  NetworkQuality,
  OperationStatus,
  SyncDashboardRow,
  SyncPriority,
} from "@/lib/sync/types";

type SyncView =
  | "dashboard"
  | "database"
  | "conflicts"
  | "media"
  | "security"
  | "observability";

type SyncOpsState = {
  query: string;
  selectedView: SyncView;
  selectedOperationId: string;
  setQuery: (query: string) => void;
  setView: (view: SyncView) => void;
  selectOperation: (operationId: string) => void;
};

const syncQueryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, refetchOnWindowFocus: false },
  },
});

const syncViewLabels: Record<SyncView, string> = {
  dashboard: "Sync dashboard",
  database: "IndexedDB / Dexie",
  conflicts: "Conflict resolution",
  media: "Offline media",
  security: "Device & security",
  observability: "Observability",
};

const useSyncOpsStore = create<SyncOpsState>((set) => ({
  query: "",
  selectedView: "dashboard",
  selectedOperationId: "op-4",
  setQuery: (query) => set({ query }),
  setView: (selectedView) => set({ selectedView }),
  selectOperation: (selectedOperationId) => set({ selectedOperationId }),
}));

export function OfflineSyncOperationsCenter() {
  return (
    <QueryClientProvider client={syncQueryClient}>
      <OfflineSyncOperationsCenterInner />
    </QueryClientProvider>
  );
}

function OfflineSyncOperationsCenterInner() {
  const query = useSyncOpsStore((state) => state.query);
  const setQuery = useSyncOpsStore((state) => state.setQuery);
  const selectedView = useSyncOpsStore((state) => state.selectedView);
  const setView = useSyncOpsStore((state) => state.setView);
  const { data: rows = [] } = useQuery({
    queryKey: ["sync-dashboard-rows"],
    queryFn: async () => buildSyncDashboardRows(),
    refetchInterval: 5000,
  });
  const filteredRows = rows.filter((row) =>
    [
      row.operation.entityId,
      row.operation.workOrderId,
      row.operation.entityType,
      row.operation.priority,
      row.operation.localPatchSummary,
      row.operation.createdBy,
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
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/40 bg-violet-500/15 text-violet-200">
                <ArrowDownUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  resilient field synchronization platform
                </p>
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Offline-first Sync Engine & Field Synchronization
                </h1>
              </div>
            </div>
            <p className="mt-3 max-w-5xl text-sm leading-6 text-slate-400">
              Enterprise local-first sync for НеоЛифт field ERP: IndexedDB/Dexie
              database, offline queue, pending operations, background sync,
              conflict resolution, retry policies, encrypted drafts, media
              recovery, websocket reconnect and device observability.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NetworkBadge quality={DEVICE_STATE.networkQuality} />
            <Badge className="border-violet-400/30 bg-violet-500/10 text-violet-100">
              <Database className="h-3 w-3" /> Dexie v{NEOLIFT_DEXIE_DB_VERSION}
            </Badge>
            <Badge className="border-emerald-400/30 bg-emerald-500/10 text-emerald-100">
              <ShieldCheck className="h-3 w-3" /> encrypted local data
            </Badge>
          </div>
        </div>
        <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по операции, заказ-наряду, сущности, приоритету, механику..."
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(syncViewLabels) as SyncView[]).map((view) => (
              <button
                key={view}
                onClick={() => setView(view)}
                className={cn(
                  "shrink-0 rounded-xl border px-3 py-2 text-xs font-bold",
                  selectedView === view
                    ? "border-violet-400 bg-violet-500/10 text-violet-100"
                    : "border-slate-800 bg-slate-900 text-slate-400",
                )}
              >
                {syncViewLabels[view]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-154px)] grid-cols-1 xl:grid-cols-[330px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)_390px]">
        <LeftSyncPanel />
        <section className="min-w-0 border-slate-800 p-4 xl:border-l xl:p-6">
          {selectedView === "dashboard" && (
            <div className="space-y-5">
              <SyncDashboard rows={filteredRows} />
              <SelectedOperation rows={rows} />
            </div>
          )}
          {selectedView === "database" && <IndexedDbArchitecture />}
          {selectedView === "conflicts" && <ConflictResolutionSystem />}
          {selectedView === "media" && <OfflineMediaSystem />}
          {selectedView === "security" && <DeviceSecuritySystem />}
          {selectedView === "observability" && <ObservabilitySystem />}
        </section>
        <RightSyncIntelligence />
      </div>
    </main>
  );
}

function LeftSyncPanel() {
  const setView = useSyncOpsStore((state) => state.setView);
  const failed = OFFLINE_QUEUE.filter(
    (item) => item.status === "failed",
  ).length;
  const conflicts = CONFLICT_RECORDS.filter(
    (conflict) => conflict.status !== "resolved",
  ).length;
  const queued = OFFLINE_QUEUE.filter(
    (item) => item.status === "queued" || item.status === "syncing",
  ).length;
  const emergency = OFFLINE_QUEUE.filter(
    (item) => item.priority === "emergency",
  ).length;

  return (
    <aside className="space-y-4 border-b border-slate-800 bg-slate-950/45 p-4 xl:border-b-0">
      <PanelBlock title="Sync status" icon={<Activity className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Queued" value={queued} />
          <Metric label="Failed" value={failed} danger />
          <Metric label="Conflicts" value={conflicts} danger />
          <Metric label="Emergency" value={emergency} danger />
        </div>
      </PanelBlock>
      <PanelBlock
        title="Device state"
        icon={<Smartphone className="h-4 w-4" />}
      >
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">
              {DEVICE_STATE.deviceName}
            </p>
            <NetworkBadge quality={DEVICE_STATE.networkQuality} />
          </div>
          <p className="mt-2 text-slate-500">
            SW {DEVICE_STATE.serviceWorker} · WS {DEVICE_STATE.websocket}
          </p>
          <Progress
            value={
              (DEVICE_STATE.storageUsedMb / DEVICE_STATE.storageLimitMb) * 100
            }
            className="mt-3"
          />
          <p className="mt-2 text-xs text-slate-500">
            storage {DEVICE_STATE.storageUsedMb}/{DEVICE_STATE.storageLimitMb}{" "}
            MB · battery {DEVICE_STATE.battery}%
          </p>
        </div>
      </PanelBlock>
      <PanelBlock title="Priority order" icon={<Layers3 className="h-4 w-4" />}>
        {PRIORITY_ORDER.map((priority, index) => (
          <div
            key={priority}
            className="mb-2 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
          >
            <Badge>{index + 1}</Badge>
            <span className="font-semibold text-white">{priority}</span>
          </div>
        ))}
      </PanelBlock>
      <Button onClick={() => setView("conflicts")} className="w-full">
        <FileWarning className="h-4 w-4" /> Open conflict diff
      </Button>
    </aside>
  );
}

function SyncDashboard({ rows }: { rows: SyncDashboardRow[] }) {
  const selectOperation = useSyncOpsStore((state) => state.selectOperation);
  const columns = useMemo<ColumnDef<SyncDashboardRow>[]>(
    () => [
      {
        header: "Priority",
        cell: ({ row }) => (
          <PriorityBadge priority={row.original.operation.priority} />
        ),
      },
      {
        header: "Entity",
        cell: ({ row }) => (
          <button
            onClick={() => selectOperation(row.original.operation.id)}
            className="text-left font-semibold text-white hover:text-violet-200"
          >
            {row.original.operation.entityType} ·{" "}
            {row.original.operation.entityId}
          </button>
        ),
      },
      { header: "Action", accessorFn: (row) => row.operation.action },
      {
        header: "Work order",
        accessorFn: (row) => row.operation.workOrderId ?? "—",
      },
      {
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge status={row.original.operation.status} />
        ),
      },
      {
        header: "Version",
        cell: ({ row }) =>
          `base ${row.original.operation.baseVersion} → local ${row.original.operation.localVersion}${row.original.operation.serverVersion ? ` / server ${row.original.operation.serverVersion}` : ""}`,
      },
      {
        header: "Retry",
        cell: ({ row }) =>
          row.original.queue ? `${row.original.queue.retryCount} retries` : "—",
      },
      {
        header: "Created",
        cell: ({ row }) =>
          new Date(row.original.operation.createdAt).toLocaleString("ru-RU"),
      },
    ],
    [selectOperation],
  );
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <CardTitle>Sync monitoring dashboard</CardTitle>
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

function SelectedOperation({ rows }: { rows: SyncDashboardRow[] }) {
  const selectedOperationId = useSyncOpsStore(
    (state) => state.selectedOperationId,
  );
  const row =
    rows.find((candidate) => candidate.operation.id === selectedOperationId) ??
    rows[0];
  if (!row) return null;

  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Operation detail — {row.operation.entityId}</CardTitle>
            <p className="mt-2 text-sm text-slate-500">
              {row.operation.localPatchSummary}
            </p>
          </div>
          <StatusBadge status={row.operation.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-3">
        <InfoTile
          label="Idempotency key"
          value={row.queue?.idempotencyKey ?? "not queued"}
        />
        <InfoTile
          label="Encrypted payload"
          value={String(row.queue?.encrypted ?? true)}
        />
        <InfoTile
          label="Payload"
          value={`${Math.round((row.queue?.payloadBytes ?? 0) / 1024)} KB`}
        />
        <InfoTile
          label="Optimistic version"
          value={`${row.operation.baseVersion} → ${row.operation.localVersion}`}
        />
        <InfoTile
          label="Server version"
          value={String(row.operation.serverVersion ?? "pending")}
        />
        <InfoTile
          label="Conflict"
          value={row.conflict?.suggestedResolution ?? "none"}
        />
      </CardContent>
    </Card>
  );
}

function IndexedDbArchitecture() {
  return (
    <div className="space-y-5">
      <Card className="border-slate-800 bg-slate-950/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-violet-300" /> Local database
            architecture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-400">
            Dexie database{" "}
            <span className="font-mono text-violet-200">
              {NEOLIFT_DEXIE_DB_NAME}
            </span>{" "}
            stores work orders, elevators, objects, materials, photos,
            documents, drafts, signatures, pending actions, offline queues,
            conflicts, sync events and audit logs with indexed queries before
            sync.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {DEXIE_TABLES.map((table) => (
              <InfoTile key={table} label={table} value={DEXIE_SCHEMA[table]} />
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-5 xl:grid-cols-3">
        <FlowCard
          title="Full sync"
          icon={<RefreshCcw className="h-5 w-5" />}
          steps={[
            "Download scoped snapshot",
            "Verify checksum",
            "Replace stale local projections",
            "Persist sync cursor",
          ]}
        />
        <FlowCard
          title="Delta sync"
          icon={<ArrowDownUp className="h-5 w-5" />}
          steps={[
            "Read server cursor",
            "Apply ordered patches",
            "Detect version gaps",
            "Update local indexes",
          ]}
        />
        <FlowCard
          title="Background sync"
          icon={<Radio className="h-5 w-5" />}
          steps={[
            "Service worker wakes",
            "Network quality gate",
            "Priority queue drain",
            "React Query cache refresh",
          ]}
        />
      </div>
    </div>
  );
}

function ConflictResolutionSystem() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {CONFLICT_RECORDS.map((conflict) => (
        <Card key={conflict.id} className="border-slate-800 bg-slate-950/70">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {conflict.entityType} · {conflict.entityId}
              </CardTitle>
              <Badge>{conflict.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">
              {conflict.suggestedResolution}
            </p>
            <div className="mt-4 space-y-2">
              {conflict.diff.map((diff) => (
                <div
                  key={diff.field}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{diff.field}</p>
                    <Badge>{diff.policy}</Badge>
                  </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <p className="rounded-xl bg-violet-500/10 p-2 text-violet-100">
                      local: {diff.local}
                    </p>
                    <p className="rounded-xl bg-orange-500/10 p-2 text-orange-100">
                      server: {diff.server}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function OfflineMediaSystem() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <PanelCard
        title="Local media cache"
        icon={<HardDrive className="h-5 w-5" />}
      >
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <p className="font-bold text-white">Restart-safe photo queue</p>
            <Badge>{LOCAL_MEDIA_CACHE.mediaCount} files</Badge>
          </div>
          <Progress
            value={(LOCAL_MEDIA_CACHE.usedMb / LOCAL_MEDIA_CACHE.maxMb) * 100}
            className="mt-3"
          />
          <p className="mt-2 text-sm text-slate-500">
            {LOCAL_MEDIA_CACHE.usedMb}/{LOCAL_MEDIA_CACHE.maxMb} MB ·
            compression {LOCAL_MEDIA_CACHE.compressionQueue} · upload{" "}
            {LOCAL_MEDIA_CACHE.uploadQueue} · survives restart{" "}
            {String(LOCAL_MEDIA_CACHE.survivesRestart)}
          </p>
        </div>
      </PanelCard>
      <PanelCard
        title="Failed uploads"
        icon={<UploadCloud className="h-5 w-5" />}
      >
        {FAILED_UPLOADS.map((upload) => (
          <div
            key={upload.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">{upload.mediaId}</p>
              <PriorityBadge priority={upload.priority} />
            </div>
            <Progress
              value={(upload.chunksUploaded / upload.chunksTotal) * 100}
              className="mt-3"
            />
            <p className="mt-2 text-sm text-slate-500">
              chunks {upload.chunksUploaded}/{upload.chunksTotal} ·{" "}
              {upload.lastError}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-600">
              {upload.resumableToken}
            </p>
          </div>
        ))}
      </PanelCard>
    </div>
  );
}

function DeviceSecuritySystem() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <PanelCard
        title="Offline security"
        icon={<KeyRound className="h-5 w-5" />}
      >
        <FlowLine
          title="Encrypted local storage"
          text="Work orders, signatures, drafts and media manifests are stored as encrypted IndexedDB records with device-bound keys."
        />
        <FlowLine
          title="Session expiration"
          text="Offline auth has bounded TTL; privileged actions require fresh tokens after reconnect."
        />
        <FlowLine
          title="Device authorization"
          text="Remote logout/lost-device recovery revokes sync cursors and forces local data wipe on next heartbeat."
        />
      </PanelCard>
      <PanelCard
        title="Device management"
        icon={<Smartphone className="h-5 w-5" />}
      >
        <InfoTile label="Device" value={DEVICE_STATE.deviceName} />
        <InfoTile label="Authorized" value={String(DEVICE_STATE.authorized)} />
        <InfoTile
          label="Last seen"
          value={new Date(DEVICE_STATE.lastSeenAt).toLocaleString("ru-RU")}
        />
        <InfoTile label="Background sync" value={DEVICE_STATE.backgroundSync} />
      </PanelCard>
    </div>
  );
}

function ObservabilitySystem() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <PanelCard title="Sync events" icon={<History className="h-5 w-5" />}>
        {SYNC_EVENTS.map((event) => (
          <div
            key={event.id}
            className={cn(
              "mb-2 rounded-2xl border p-3 text-sm",
              event.severity === "critical"
                ? "border-red-400/30 bg-red-500/10"
                : event.severity === "warning"
                  ? "border-orange-400/30 bg-orange-500/10"
                  : "border-slate-800 bg-slate-900/60",
            )}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{event.type}</p>
              <span className="text-xs text-slate-500">
                {new Date(event.createdAt).toLocaleTimeString("ru-RU")}
              </span>
            </div>
            <p className="mt-1 text-slate-400">{event.message}</p>
          </div>
        ))}
      </PanelCard>
      <PanelCard
        title="Offline audit chain"
        icon={<ShieldCheck className="h-5 w-5" />}
      >
        {OFFLINE_AUDIT_LOGS.map((log) => (
          <div
            key={log.id}
            className="mb-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
          >
            <p className="font-semibold text-white">
              {log.action} · {log.entityId}
            </p>
            <p className="mt-1 text-slate-500">
              {log.actor} · {new Date(log.timestamp).toLocaleString("ru-RU")}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-600">
              {log.previousHash} → {log.hash}
            </p>
          </div>
        ))}
      </PanelCard>
    </div>
  );
}

function RightSyncIntelligence() {
  const currentSession = SYNC_SESSIONS[0];
  return (
    <aside className="space-y-4 border-t border-slate-800 bg-slate-950/55 p-4 2xl:border-l 2xl:border-t-0">
      <PanelBlock
        title="Current sync session"
        icon={<RefreshCcw className="h-4 w-4" />}
      >
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">{currentSession.mode}</p>
            <Badge>{currentSession.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            uploaded {currentSession.uploaded} · downloaded{" "}
            {currentSession.downloaded} · conflicts {currentSession.conflicts}
          </p>
        </div>
      </PanelBlock>
      <PanelBlock title="Retry policies" icon={<Clock className="h-4 w-4" />}>
        {RETRY_POLICIES.map((policy) => (
          <div
            key={policy.id}
            className="mb-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{policy.name}</p>
              <Badge>{policy.strategy}</Badge>
            </div>
            <p className="mt-1 text-slate-500">
              max {policy.maxRetries} · {policy.baseDelaySeconds}-
              {policy.maxDelaySeconds}s · wifi {String(policy.requiresWifi)}
            </p>
          </div>
        ))}
      </PanelBlock>
      <PanelBlock
        title="Delta updates"
        icon={<ArrowDownUp className="h-4 w-4" />}
      >
        {DELTA_UPDATES.map((delta) => (
          <div
            key={delta.id}
            className="mb-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{delta.entityType}</p>
              <Badge>{delta.applied ? "applied" : "pending"}</Badge>
            </div>
            <p className="mt-1 text-slate-500">
              v{delta.serverVersion} · {delta.records} records
            </p>
          </div>
        ))}
      </PanelBlock>
      <PanelBlock title="Snapshots" icon={<Database className="h-4 w-4" />}>
        {SYNC_SNAPSHOTS.map((snapshot) => (
          <div
            key={snapshot.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
          >
            <p className="font-semibold text-white">{snapshot.cursor}</p>
            <p className="mt-1 text-slate-500">
              WO {snapshot.workOrders} · elevators {snapshot.elevators} ·
              materials {snapshot.materials}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-600">
              {snapshot.checksum}
            </p>
          </div>
        ))}
      </PanelBlock>
    </aside>
  );
}

function FlowCard({
  title,
  icon,
  steps,
}: {
  title: string;
  icon: ReactNode;
  steps: string[];
}) {
  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-violet-300">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {steps.map((step, index) => (
          <div
            key={step}
            className="mb-2 flex gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
          >
            <Badge>{index + 1}</Badge>
            <span className="text-slate-300">{step}</span>
          </div>
        ))}
      </CardContent>
    </Card>
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
          <span className="text-violet-300">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
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

function FlowLine({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </div>
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

function NetworkBadge({ quality }: { quality: NetworkQuality }) {
  const cls =
    quality === "offline"
      ? "bg-red-500/15 text-red-200"
      : quality === "unstable" || quality === "weak"
        ? "bg-orange-500/15 text-orange-200"
        : "bg-emerald-500/15 text-emerald-200";
  const Icon =
    quality === "offline" ? WifiOff : quality === "online" ? Wifi : Router;
  return (
    <Badge className={cls}>
      <Icon className="h-3 w-3" /> {quality}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: SyncPriority }) {
  const cls =
    priority === "emergency"
      ? "bg-red-500/15 text-red-200"
      : priority === "work_order" || priority === "signature"
        ? "bg-violet-500/15 text-violet-200"
        : priority === "media"
          ? "bg-blue-500/15 text-blue-200"
          : "bg-slate-500/15 text-slate-200";
  return <Badge className={cls}>{priority}</Badge>;
}

function StatusBadge({ status }: { status: OperationStatus }) {
  const cls =
    status === "failed" || status === "conflict"
      ? "bg-red-500/15 text-red-200"
      : status === "syncing" || status === "queued"
        ? "bg-orange-500/15 text-orange-200"
        : status === "synced"
          ? "bg-emerald-500/15 text-emerald-200"
          : "bg-slate-500/15 text-slate-200";
  const Icon =
    status === "synced"
      ? CheckCircle2
      : status === "failed" || status === "conflict"
        ? AlertTriangle
        : RefreshCcw;
  return (
    <Badge className={cls}>
      <Icon className="h-3 w-3" /> {status}
    </Badge>
  );
}
