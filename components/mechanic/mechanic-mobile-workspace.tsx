"use client";

import { ReactNode, useMemo } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import {
  BadgeCheck,
  Barcode,
  BellRing,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CloudOff,
  FileText,
  Fingerprint,
  Gauge,
  HardHat,
  ImagePlus,
  Navigation,
  PackageSearch,
  PenLine,
  QrCode,
  RefreshCw,
  Route,
  ShieldCheck,
  Siren,
  TimerReset,
  UploadCloud,
  Vibrate,
  Warehouse,
  Wrench,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ELEVATOR_MOBILE_CARD,
  EMERGENCY_CALLS,
  MATERIAL_USAGE,
  MOBILE_WORK_ORDERS,
  OFFLINE_CACHE_POLICY,
  OFFLINE_DRAFTS,
  PHOTO_SESSIONS,
  ROUTE_STOPS,
  SIGNATURES,
  SYNC_EVENTS,
  UPLOAD_QUEUE,
} from "@/lib/mechanic/mechanic-mobile-data";
import type { MobileWorkOrder, PhotoKind } from "@/lib/mechanic/types";

type MobileTab = "home" | "work" | "photos" | "materials" | "elevator" | "history" | "documents";

type MechanicMobileState = {
  activeTab: MobileTab;
  selectedWorkOrderId: string;
  emergencyFullscreen: boolean;
  networkMode: "online" | "degraded" | "offline";
  setActiveTab: (tab: MobileTab) => void;
  selectWorkOrder: (workOrderId: string) => void;
  acceptEmergency: () => void;
  toggleNetworkMode: () => void;
};

const mobileTabs: Array<{ id: MobileTab; label: string; icon: ReactNode }> = [
  { id: "home", label: "Домой", icon: <HardHat className="h-5 w-5" /> },
  { id: "work", label: "Работы", icon: <Wrench className="h-5 w-5" /> },
  { id: "photos", label: "Фото", icon: <Camera className="h-5 w-5" /> },
  { id: "materials", label: "Материалы", icon: <Warehouse className="h-5 w-5" /> },
  { id: "elevator", label: "Лифт", icon: <Gauge className="h-5 w-5" /> },
  { id: "history", label: "История", icon: <ClipboardList className="h-5 w-5" /> },
  { id: "documents", label: "Документы", icon: <FileText className="h-5 w-5" /> },
];

const queryClient = new QueryClient();

const useMechanicMobileStore = create<MechanicMobileState>((set) => ({
  activeTab: "home",
  selectedWorkOrderId: MOBILE_WORK_ORDERS[0].id,
  emergencyFullscreen: true,
  networkMode: "degraded",
  setActiveTab: (activeTab) => set({ activeTab }),
  selectWorkOrder: (selectedWorkOrderId) => set({ selectedWorkOrderId, activeTab: "work" }),
  acceptEmergency: () => set({ emergencyFullscreen: false, activeTab: "work", selectedWorkOrderId: MOBILE_WORK_ORDERS[0].id }),
  toggleNetworkMode: () => set((state) => ({ networkMode: state.networkMode === "offline" ? "degraded" : "offline" })),
}));

export function MechanicMobileWorkspace() {
  return (
    <QueryClientProvider client={queryClient}>
      <MechanicMobileWorkspaceInner />
    </QueryClientProvider>
  );
}

function MechanicMobileWorkspaceInner() {
  const activeTab = useMechanicMobileStore((state) => state.activeTab);
  const setActiveTab = useMechanicMobileStore((state) => state.setActiveTab);
  const selectedWorkOrderId = useMechanicMobileStore((state) => state.selectedWorkOrderId);
  const emergencyFullscreen = useMechanicMobileStore((state) => state.emergencyFullscreen);
  const acceptEmergency = useMechanicMobileStore((state) => state.acceptEmergency);
  const networkMode = useMechanicMobileStore((state) => state.networkMode);
  const toggleNetworkMode = useMechanicMobileStore((state) => state.toggleNetworkMode);
  const { data: workOrders = [] } = useQuery({ queryKey: ["mechanic-mobile-work-orders"], queryFn: async () => MOBILE_WORK_ORDERS });
  const selectedWorkOrder = workOrders.find((workOrder) => workOrder.id === selectedWorkOrderId) ?? workOrders[0] ?? MOBILE_WORK_ORDERS[0];

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="mx-auto min-h-screen max-w-md border-x border-slate-800 bg-slate-950 shadow-2xl shadow-black/50 lg:max-w-6xl">
        {emergencyFullscreen && <EmergencyOverlay onAccept={acceptEmergency} />}
        <MobileTopBar networkMode={networkMode} onNetworkToggle={toggleNetworkMode} />
        <div className="space-y-4 px-4 pb-28 pt-4 lg:grid lg:grid-cols-[360px_minmax(0,1fr)_340px] lg:gap-5 lg:space-y-0 lg:px-6">
          <section className="space-y-4">
            <ShiftStartPanel workOrders={workOrders} />
            <RouteCard />
            <OfflineStatusCard />
          </section>
          <section className="min-w-0 space-y-4">
            <TabStrip activeTab={activeTab} onSelect={setActiveTab} />
            {activeTab === "home" && <HomeScreen workOrders={workOrders} />}
            {activeTab === "work" && <WorkOrderScreen workOrder={selectedWorkOrder} />}
            {activeTab === "photos" && <PhotoSystem workOrder={selectedWorkOrder} />}
            {activeTab === "materials" && <MaterialWriteOffFlow workOrder={selectedWorkOrder} />}
            {activeTab === "elevator" && <ElevatorMobileCard />}
            {activeTab === "history" && <HistoryAndSync workOrder={selectedWorkOrder} />}
            {activeTab === "documents" && <DocumentsAndSignature workOrder={selectedWorkOrder} />}
          </section>
          <section className="space-y-4">
            <SyncEnginePanel />
            <NotificationPanel />
            <SecurityPwaPanel />
          </section>
        </div>
        <BottomNav activeTab={activeTab} onSelect={setActiveTab} />
      </div>
    </main>
  );
}

function MobileTopBar({ networkMode, onNetworkToggle }: { networkMode: "online" | "degraded" | "offline"; onNetworkToggle: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-400/40 bg-orange-500/15 text-orange-300"><HardHat className="h-6 w-6" /></div>
        <div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-[0.22em] text-slate-500">mechanic mobile ERP</p><h1 className="truncate text-lg font-black text-white">Алексей Климов · смена</h1></div>
        <button onClick={onNetworkToggle} className={cn("rounded-xl border px-3 py-2 text-xs font-bold", networkMode === "offline" ? "border-red-400/40 bg-red-500/15 text-red-100" : "border-orange-400/40 bg-orange-500/10 text-orange-100")}>{networkMode}</button>
      </div>
    </header>
  );
}

function EmergencyOverlay({ onAccept }: { onAccept: () => void }) {
  const call = EMERGENCY_CALLS[0];
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-red-950/85 p-4 backdrop-blur sm:items-center sm:justify-center">
      <div className="w-full max-w-md rounded-3xl border border-red-300/40 bg-slate-950 p-5 shadow-2xl shadow-red-950">
        <div className="mb-4 flex items-center justify-between"><Badge className="bg-red-500/20 text-red-100"><Siren className="h-3 w-3" /> emergency</Badge><Badge><Vibrate className="h-3 w-3" /> {call.vibrationPattern}</Badge></div>
        <h2 className="text-3xl font-black text-white">{call.title}</h2>
        <p className="mt-2 text-red-100">{call.address}</p>
        <p className="mt-1 text-sm text-slate-400">ETA {call.etaMinutes} мин · fullscreen alert · priority UI · navigation shortcut</p>
        <div className="mt-5 grid grid-cols-2 gap-3"><Button className="bg-red-500 text-white hover:bg-red-400" onClick={onAccept}><Zap className="h-4 w-4" /> Принять</Button><Button variant="secondary"><Navigation className="h-4 w-4" /> Маршрут</Button></div>
      </div>
    </div>
  );
}

function ShiftStartPanel({ workOrders }: { workOrders: MobileWorkOrder[] }) {
  const selectWorkOrder = useMechanicMobileStore((state) => state.selectWorkOrder);
  return (
    <Card className="border-slate-800 bg-slate-900/80">
      <CardHeader><CardTitle className="flex items-center gap-2"><TimerReset className="h-5 w-5 text-orange-300" /> Начало смены</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {workOrders.map((workOrder) => <button key={workOrder.id} onClick={() => selectWorkOrder(workOrder.id)} className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-left"><div className="flex items-start justify-between gap-2"><p className="font-semibold text-white">{workOrder.number}</p><PriorityBadge priority={workOrder.priority} /></div><p className="mt-1 text-sm text-slate-400">{workOrder.title}</p><p className="mt-1 text-xs text-slate-500">{workOrder.objectAddress} · SLA {new Date(workOrder.slaDueAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</p></button>)}
      </CardContent>
    </Card>
  );
}

function HomeScreen({ workOrders }: { workOrders: MobileWorkOrder[] }) {
  const emergencyCount = workOrders.filter((workOrder) => workOrder.priority === "emergency").length;
  const pendingUploads = UPLOAD_QUEUE.filter((item) => item.status !== "synced").length;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Сегодня" value={`${workOrders.length}`} icon={<ClipboardList className="h-5 w-5" />} />
        <Metric label="Аварии" value={`${emergencyCount}`} icon={<Siren className="h-5 w-5" />} danger />
        <Metric label="Upload queue" value={`${pendingUploads}`} icon={<UploadCloud className="h-5 w-5" />} />
        <Metric label="Pending sync" value={`${SYNC_EVENTS.length}`} icon={<RefreshCw className="h-5 w-5" />} />
      </div>
      <Card className="border-orange-400/30 bg-orange-500/10"><CardContent className="p-4"><div className="flex items-center gap-3"><Navigation className="h-6 w-6 text-orange-300" /><div><p className="font-bold text-white">Next destination</p><p className="text-sm text-orange-100">{ROUTE_STOPS[0].address} · ETA {ROUTE_STOPS[0].etaMinutes} мин · traffic {ROUTE_STOPS[0].traffic}</p></div></div></CardContent></Card>
    </div>
  );
}

function WorkOrderScreen({ workOrder }: { workOrder: MobileWorkOrder }) {
  return (
    <Card className="border-slate-800 bg-slate-900/80">
      <CardHeader><CardTitle>{workOrder.number} · {workOrder.title}</CardTitle><p className="text-sm text-slate-500">{workOrder.objectAddress} · {workOrder.elevatorFactoryNumber}</p></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><InfoTile label="Status" value={workOrder.status} /><InfoTile label="SLA" value={new Date(workOrder.slaDueAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} /><InfoTile label="ETA work" value={`${workOrder.estimatedMinutes} мин`} /><InfoTile label="Offline" value={workOrder.offlineReady ? "ready" : "not ready"} /></div>
        <div className="grid gap-3 sm:grid-cols-2"><LargeAction icon={<Camera className="h-5 w-5" />} title="Сделать фото" text="Camera API · watermark · compression" /><LargeAction icon={<Warehouse className="h-5 w-5" />} title="Списать материалы" text="QR scan · local stock · reserve" /><LargeAction icon={<PenLine className="h-5 w-5" />} title="Подпись клиента" text="Touch signature · offline vector" /><LargeAction icon={<CheckCircle2 className="h-5 w-5" />} title="Отправить отчет" text="Background Sync when online" /></div>
      </CardContent>
    </Card>
  );
}

function PhotoSystem({ workOrder }: { workOrder: MobileWorkOrder }) {
  const sessions = PHOTO_SESSIONS.filter((photo) => photo.workOrderId === workOrder.id);
  const missingRequired = workOrder.requiredPhotos.filter((kind) => !sessions.some((photo) => photo.kind === kind));
  return (
    <div className="space-y-4">
      <Card className="border-slate-800 bg-slate-900/80"><CardHeader><CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5 text-orange-300" /> Production photo workflow</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-3"><LargeAction icon={<ImagePlus className="h-5 w-5" />} title="Instant capture" text="batch capture, annotation" /><LargeAction icon={<UploadCloud className="h-5 w-5" />} title="Upload retry" text="queue, compression, WebP" /></div>{missingRequired.length > 0 && <StatusBanner tone="warning" text={`Missing required photos: ${missingRequired.join(", ")}`} />}</CardContent></Card>
      <div className="grid gap-3 sm:grid-cols-2">{sessions.map((photo) => <PhotoCard key={photo.id} photo={photo} />)}</div>
    </div>
  );
}

function MaterialWriteOffFlow({ workOrder }: { workOrder: MobileWorkOrder }) {
  const materials = MATERIAL_USAGE.filter((material) => material.workOrderId === workOrder.id);
  return (
    <Card className="border-slate-800 bg-slate-900/80">
      <CardHeader><CardTitle className="flex items-center gap-2"><PackageSearch className="h-5 w-5 text-orange-300" /> Material write-off</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3"><LargeAction icon={<QrCode className="h-5 w-5" />} title="Scan QR" text="elevator/material/work order" /><LargeAction icon={<Barcode className="h-5 w-5" />} title="Search SKU" text="offline stock index" /></div>
        {materials.map((material) => <div key={material.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-center justify-between"><p className="font-semibold text-white">{material.name}</p><Badge>{material.sku}</Badge></div><p className="mt-1 text-sm text-slate-400">{material.quantity} {material.unit} · local stock {material.localStock} · {material.reserved ? "reserved" : "not reserved"}</p></div>)}
      </CardContent>
    </Card>
  );
}

function ElevatorMobileCard() {
  const card = ELEVATOR_MOBILE_CARD;
  return (
    <Card className="border-slate-800 bg-slate-900/80">
      <CardHeader><CardTitle className="flex items-center gap-2"><Gauge className="h-5 w-5 text-orange-300" /> Elevator card mobile</CardTitle><p className="text-sm text-slate-500">{card.address}</p></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><InfoTile label="Factory" value={card.factoryNumber} /><InfoTile label="Registry" value={card.registrationNumber} /><InfoTile label="Model" value={card.model} /><InfoTile label="AI health" value={`${card.healthScore}%`} /></div>
        <PanelBlock title="Узлы" icon={<Gauge className="h-4 w-4" />}>{card.nodes.map((node) => <div key={node.name} className="mb-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-center justify-between"><p className="font-semibold text-white">{node.name}</p><Badge>{node.health}%</Badge></div>{node.lastIssue && <p className="mt-1 text-sm text-orange-200">{node.lastIssue}</p>}<Progress value={node.health} className="mt-2" /></div>)}</PanelBlock>
        <PanelBlock title="Последние ремонты" icon={<ClipboardList className="h-4 w-4" />}>{card.lastRepairs.map((repair) => <p key={repair} className="mb-2 rounded-xl bg-slate-950/70 p-3 text-sm text-slate-300">{repair}</p>)}</PanelBlock>
      </CardContent>
    </Card>
  );
}

function HistoryAndSync({ workOrder }: { workOrder: MobileWorkOrder }) {
  return (
    <div className="space-y-4">
      <PanelCard title="Sync engine" icon={<RefreshCw className="h-5 w-5 text-orange-300" />}>{SYNC_EVENTS.map((event) => <SyncEventRow key={event.id} title={event.title} status={event.status} message={event.message} />)}</PanelCard>
      <PanelCard title="Offline drafts" icon={<CloudOff className="h-5 w-5 text-orange-300" />}>{OFFLINE_DRAFTS.filter((draft) => draft.workOrderId === workOrder.id).map((draft) => <div key={draft.id} className="mb-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-sm"><p className="font-semibold text-white">{draft.entity}</p><p className="text-slate-500">{draft.sizeKb} KB · encrypted {String(draft.encrypted)} · conflict {draft.conflictRisk}</p></div>)}</PanelCard>
    </div>
  );
}

function DocumentsAndSignature({ workOrder }: { workOrder: MobileWorkOrder }) {
  const signature = SIGNATURES.find((candidate) => candidate.workOrderId === workOrder.id) ?? SIGNATURES[0];
  return (
    <div className="space-y-4">
      <PanelCard title="Document access" icon={<FileText className="h-5 w-5 text-orange-300" />}>{ELEVATOR_MOBILE_CARD.documents.map((document) => <div key={document.title} className="mb-2 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-sm"><div><p className="font-semibold text-white">{document.title}</p><p className="text-slate-500">{document.type}</p></div><Badge>{document.offlineReady ? "offline" : "online"}</Badge></div>)}</PanelCard>
      <PanelCard title="Signature workflow" icon={<PenLine className="h-5 w-5 text-orange-300" />}><div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/70 p-5 text-center"><Fingerprint className="mx-auto mb-3 h-8 w-8 text-orange-300" /><p className="font-semibold text-white">{signature.signer}</p><p className="mt-1 text-sm text-slate-500">{signature.validation} · touch vector stored offline</p><Button className="mt-4 w-full"><PenLine className="h-4 w-4" /> Подписать</Button></div></PanelCard>
    </div>
  );
}

function RouteCard() {
  return <PanelCard title="Маршрут" icon={<Route className="h-5 w-5 text-orange-300" />}>{ROUTE_STOPS.map((stop) => <div key={stop.id} className={cn("mb-2 rounded-2xl border p-3 text-sm", stop.current ? "border-orange-400/40 bg-orange-500/10" : "border-slate-800 bg-slate-950/70")}><div className="flex items-center justify-between"><p className="font-semibold text-white">{stop.address}</p><Badge>{stop.etaMinutes}м</Badge></div><p className="text-slate-500">{stop.distanceKm} км · traffic {stop.traffic}</p></div>)}</PanelCard>;
}

function OfflineStatusCard() {
  return <PanelCard title="Offline-first architecture" icon={<CloudOff className="h-5 w-5 text-orange-300" />}><div className="space-y-2 text-sm text-slate-400"><p>IndexedDB: {OFFLINE_CACHE_POLICY.indexedDbName}</p><p>Stores: {OFFLINE_CACHE_POLICY.stores.length}</p><p>Encryption: {OFFLINE_CACHE_POLICY.encryption}</p><p>TTL: {OFFLINE_CACHE_POLICY.ttlHours}h</p><StatusBanner tone="info" text={OFFLINE_CACHE_POLICY.conflictResolution} /></div></PanelCard>;
}

function SyncEnginePanel() {
  return <PanelCard title="Upload queue" icon={<UploadCloud className="h-5 w-5 text-orange-300" />}>{UPLOAD_QUEUE.map((item) => <div key={item.id} className="mb-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-white">{item.fileName}</p><Badge>{item.status}</Badge></div><Progress value={item.progress} className="mt-2" /><p className="mt-1 text-xs text-slate-500">retry {item.retryCount} · compressed {String(item.compressed)}</p></div>)}</PanelCard>;
}

function NotificationPanel() {
  return <PanelCard title="Notifications" icon={<BellRing className="h-5 w-5 text-orange-300" />}><div className="space-y-2"><StatusBanner tone="danger" text="Emergency push: passenger trapped" /><StatusBanner tone="warning" text="SLA warning: WO-2944 18 min" /><StatusBanner tone="info" text="Warehouse alert: FILTER-10 reserved" /><StatusBanner tone="warning" text="Sync alert: 3 uploads pending" /></div></PanelCard>;
}

function SecurityPwaPanel() {
  return <PanelCard title="PWA & security" icon={<ShieldCheck className="h-5 w-5 text-orange-300" />}><div className="space-y-2 text-sm text-slate-400"><p>Install prompt after trusted device auth.</p><p>Service Worker caches shell, route, elevator cards and documents.</p><p>Background Sync retries uploads and signatures.</p><p>Secure offline storage uses device-bound encryption and session expiry.</p></div></PanelCard>;
}

function TabStrip({ activeTab, onSelect }: { activeTab: MobileTab; onSelect: (tab: MobileTab) => void }) {
  return <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap">{mobileTabs.map((tab) => <button key={tab.id} onClick={() => onSelect(tab.id)} className={cn("flex min-h-12 shrink-0 items-center gap-2 rounded-2xl border px-4 text-sm font-bold", activeTab === tab.id ? "border-orange-400 bg-orange-500/15 text-orange-100" : "border-slate-800 bg-slate-900 text-slate-400")}>{tab.icon}{tab.label}</button>)}</div>;
}

function BottomNav({ activeTab, onSelect }: { activeTab: MobileTab; onSelect: (tab: MobileTab) => void }) {
  return <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 p-2 safe-bottom lg:hidden"><div className="mx-auto grid max-w-md grid-cols-5 gap-1">{mobileTabs.slice(0, 5).map((tab) => <button key={tab.id} onClick={() => onSelect(tab.id)} className={cn("rounded-2xl p-2 text-center text-[11px]", activeTab === tab.id ? "bg-orange-500/15 text-orange-100" : "text-slate-500")}><span className="mb-1 flex justify-center">{tab.icon}</span>{tab.label}</button>)}</div></nav>;
}

function PanelCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <Card className="border-slate-800 bg-slate-900/80"><CardHeader><CardTitle className="flex items-center gap-2 text-base">{icon}{title}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>;
}

function PanelBlock({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <section><h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">{icon}{title}</h3>{children}</section>;
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-white">{value}</p></div>;
}

function LargeAction({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <button className="min-h-24 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left transition hover:border-orange-400/50"><span className="text-orange-300">{icon}</span><p className="mt-3 font-semibold text-white">{title}</p><p className="mt-1 text-xs text-slate-500">{text}</p></button>;
}

function Metric({ label, value, icon, danger }: { label: string; value: string; icon: ReactNode; danger?: boolean }) {
  return <div className={cn("rounded-2xl border p-4", danger ? "border-red-400/30 bg-red-500/10" : "border-slate-800 bg-slate-900/80")}><div className="flex items-center justify-between"><span className="text-orange-300">{icon}</span><span className="text-2xl font-black text-white">{value}</span></div><p className="mt-2 text-xs font-semibold text-slate-400">{label}</p></div>;
}

function PhotoCard({ photo }: { photo: (typeof PHOTO_SESSIONS)[number] }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><div className="mb-10 flex items-center justify-between"><Camera className="h-5 w-5 text-orange-300" /><PhotoValidationBadge status={photo.validation} /></div><p className="font-semibold text-white">{photo.title}</p><p className="mt-1 text-xs text-slate-500">{photo.kind} · {photo.watermark}</p>{photo.annotated && <Badge className="mt-3 bg-blue-500/15 text-blue-200"><BadgeCheck className="h-3 w-3" /> annotated</Badge>}</div>;
}

function SyncEventRow({ title, status, message }: { title: string; status: string; message: string }) {
  return <div className="mb-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-sm"><div className="flex items-center justify-between"><p className="font-semibold text-white">{title}</p><Badge>{status}</Badge></div><p className="mt-1 text-slate-500">{message}</p></div>;
}

function StatusBanner({ text, tone }: { text: string; tone: "info" | "warning" | "danger" }) {
  const cls = tone === "danger" ? "border-red-400/30 bg-red-500/10 text-red-100" : tone === "warning" ? "border-orange-400/30 bg-orange-500/10 text-orange-100" : "border-blue-400/30 bg-blue-500/10 text-blue-100";
  return <div className={cn("rounded-2xl border p-3 text-sm", cls)}>{text}</div>;
}

function PriorityBadge({ priority }: { priority: MobileWorkOrder["priority"] }) {
  const cls = priority === "emergency" ? "bg-red-500/15 text-red-200" : priority === "high" ? "bg-orange-500/15 text-orange-200" : "bg-emerald-500/15 text-emerald-200";
  return <Badge className={cls}>{priority}</Badge>;
}

function PhotoValidationBadge({ status }: { status: PhotoKind | string }) {
  const cls = status === "valid" ? "bg-emerald-500/15 text-emerald-200" : status === "pending_ai" ? "bg-blue-500/15 text-blue-200" : "bg-orange-500/15 text-orange-200";
  return <Badge className={cls}>{status}</Badge>;
}
