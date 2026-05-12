"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { create } from "zustand";
import {
  AlertTriangle,
  Bot,
  Building2,
  CalendarClock,
  Camera,
  Cpu,
  FileText,
  Gauge,
  Map,
  MapPin,
  Route,
  Search,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  BUILDINGS,
  CUSTOMERS,
  ELEVATOR_CONTROLLERS,
  ELEVATOR_DOCUMENTS,
  ELEVATOR_EVENTS,
  ELEVATOR_MODELS,
  ELEVATOR_PHOTOS,
  ELEVATORS,
  EQUIPMENT_NODES,
  MAINTENANCE_SCHEDULES,
  MAP_LAYERS,
  SERVICE_CONTRACTS,
  buildRegistryRows,
} from "@/lib/objects/registry-data";
import type { Building, Elevator, EquipmentNode, RegistryRow } from "@/lib/objects/types";

type RegistryMode = "objects" | "elevators" | "map";
type DetailTab = "overview" | "entrances" | "elevators" | "history" | "emergencies" | "photos" | "documents" | "sla" | "analytics";
type ElevatorTab = "passport" | "tech" | "controller" | "nodes" | "repairs" | "emergencies" | "work_orders" | "photos" | "documents" | "events" | "analytics";

type RegistryState = {
  query: string;
  selectedBuildingId: string;
  selectedElevatorId: string;
  mode: RegistryMode;
  buildingTab: DetailTab;
  elevatorTab: ElevatorTab;
  setQuery: (query: string) => void;
  selectBuilding: (buildingId: string) => void;
  selectElevator: (elevatorId: string) => void;
  setMode: (mode: RegistryMode) => void;
  setBuildingTab: (tab: DetailTab) => void;
  setElevatorTab: (tab: ElevatorTab) => void;
};

const useRegistryStore = create<RegistryState>((set) => ({
  query: "",
  selectedBuildingId: BUILDINGS[1].id,
  selectedElevatorId: "elv-88420",
  mode: "objects",
  buildingTab: "overview",
  elevatorTab: "passport",
  setQuery: (query) => set({ query }),
  selectBuilding: (selectedBuildingId) => {
    const building = BUILDINGS.find((candidate) => candidate.id === selectedBuildingId) ?? BUILDINGS[0];
    set({ selectedBuildingId, selectedElevatorId: building.elevatorIds[0], buildingTab: "overview" });
  },
  selectElevator: (selectedElevatorId) => {
    const elevator = ELEVATORS.find((candidate) => candidate.id === selectedElevatorId);
    set({ selectedElevatorId, selectedBuildingId: elevator?.buildingId ?? BUILDINGS[0].id, elevatorTab: "passport" });
  },
  setMode: (mode) => set({ mode }),
  setBuildingTab: (buildingTab) => set({ buildingTab }),
  setElevatorTab: (elevatorTab) => set({ elevatorTab }),
}));

const queryClient = new QueryClient();

const buildingTabs: DetailTab[] = ["overview", "entrances", "elevators", "history", "emergencies", "photos", "documents", "sla", "analytics"];
const elevatorTabs: ElevatorTab[] = ["passport", "tech", "controller", "nodes", "repairs", "emergencies", "work_orders", "photos", "documents", "events", "analytics"];

const tabLabels: Record<DetailTab, string> = {
  overview: "Общая информация",
  entrances: "Подъезды",
  elevators: "Лифты",
  history: "История работ",
  emergencies: "Аварии",
  photos: "Фото",
  documents: "Документы",
  sla: "SLA",
  analytics: "Аналитика",
};

const elevatorTabLabels: Record<ElevatorTab, string> = {
  passport: "Паспорт",
  tech: "Технические характеристики",
  controller: "Контроллер",
  nodes: "Узлы",
  repairs: "История ремонтов",
  emergencies: "Аварии",
  work_orders: "Заказ-наряды",
  photos: "Фото",
  documents: "Документы",
  events: "Журнал событий",
  analytics: "Аналитика",
};

export function ObjectsRegistryModule({ initialMode = "objects" }: { initialMode?: RegistryMode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ObjectsRegistryInner initialMode={initialMode} />
    </QueryClientProvider>
  );
}

function ObjectsRegistryInner({ initialMode }: { initialMode: RegistryMode }) {
  const mode = useRegistryStore((state) => state.mode);
  const setMode = useRegistryStore((state) => state.setMode);
  const query = useRegistryStore((state) => state.query);
  const setQuery = useRegistryStore((state) => state.setQuery);
  const { data: rows = [] } = useQuery({ queryKey: ["registry-rows"], queryFn: async () => buildRegistryRows() });

  useEffect(() => setMode(initialMode), [initialMode, setMode]);

  const filteredRows = rows.filter((row) => {
    const haystack = [row.building.address, row.customer.name, row.contract.number, ...row.elevators.flatMap((elevator) => [elevator.factoryNumber, elevator.registrationNumber])]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-400/40 bg-orange-500/15 text-orange-300"><Building2 className="h-6 w-6" /></div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">industrial asset registry</p>
                <h1 className="text-2xl font-black tracking-tight text-white">Objects, Buildings & Elevator Registry</h1>
              </div>
            </div>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">Enterprise registry для объектов, зданий, подъездов, лифтов, SLA, паспортов, документов, узлов, аварийности, механиков, истории ремонтов и future-ready AI health score.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ModeButton active={mode === "objects"} onClick={() => setMode("objects")} icon={<Building2 className="h-4 w-4" />} label="Objects" />
            <ModeButton active={mode === "elevators"} onClick={() => setMode("elevators")} icon={<Gauge className="h-4 w-4" />} label="Elevators" />
            <ModeButton active={mode === "map"} onClick={() => setMode("map")} icon={<Map className="h-4 w-4" />} label="Map" />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск адреса, лифта, заводского/регистрационного номера, заказчика, модели..." className="pl-10" />
          </div>
          <Badge className="border-emerald-400/30 bg-emerald-500/10 text-emerald-200"><ShieldCheck className="h-3 w-3" /> regional object permissions</Badge>
          <Badge className="border-orange-400/30 bg-orange-500/10 text-orange-200"><Siren className="h-3 w-3" /> realtime emergency events</Badge>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-150px)] grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)_380px]">
        <LeftRegistryPanel rows={rows} />
        <section className="min-w-0 border-slate-800 p-4 lg:border-l lg:p-6">
          {mode === "objects" && <ObjectsWorkspace rows={filteredRows} />}
          {mode === "elevators" && <ElevatorCard />}
          {mode === "map" && <MapOperationsView rows={filteredRows} />}
        </section>
        <RightOperationsPanel />
      </div>
    </main>
  );
}

function LeftRegistryPanel({ rows }: { rows: RegistryRow[] }) {
  const selectBuilding = useRegistryStore((state) => state.selectBuilding);
  const selectedBuildingId = useRegistryStore((state) => state.selectedBuildingId);
  const highRiskElevators = ELEVATORS.filter((elevator) => elevator.healthScore < 65);

  return (
    <aside className="space-y-4 border-b border-slate-800 bg-slate-950/45 p-4 lg:border-b-0">
      <PanelBlock title="Список объектов" icon={<Building2 className="h-4 w-4" />}>
        <div className="space-y-2">
          {rows.map((row) => (
            <button key={row.building.id} onClick={() => selectBuilding(row.building.id)} className={cn("w-full rounded-2xl border p-3 text-left text-sm transition", selectedBuildingId === row.building.id ? "border-orange-400/60 bg-orange-500/10" : "border-slate-800 bg-slate-900/50 hover:border-slate-700")}>
              <div className="flex items-start justify-between gap-2"><p className="font-semibold text-white">{row.building.address}</p><RiskBadge risk={row.healthStatus} /></div>
              <p className="mt-1 text-xs text-slate-500">{row.customer.name} · {row.elevators.length} лифтов · {row.building.district}</p>
            </button>
          ))}
        </div>
      </PanelBlock>

      <PanelBlock title="Районы и SLA" icon={<MapPin className="h-4 w-4" />}>
        <div className="grid gap-2">
          {Array.from(new Set(rows.map((row) => row.building.district))).map((district) => {
            const districtRows = rows.filter((row) => row.building.district === district);
            return <div key={district} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3 text-sm"><p className="font-semibold text-slate-200">{district}</p><p className="mt-1 text-xs text-slate-500">{districtRows.length} objects · {districtRows.reduce((sum, row) => sum + row.building.slaAlerts, 0)} SLA alerts</p></div>;
          })}
        </div>
      </PanelBlock>

      <PanelBlock title="High-risk elevators" icon={<AlertTriangle className="h-4 w-4" />}>
        <div className="space-y-2">
          {highRiskElevators.map((elevator) => <ElevatorMini key={elevator.id} elevator={elevator} />)}
        </div>
      </PanelBlock>
    </aside>
  );
}

function ObjectsWorkspace({ rows }: { rows: RegistryRow[] }) {
  return (
    <div className="space-y-5">
      <RegistryGrid rows={rows} />
      <BuildingCard />
    </div>
  );
}

function RegistryGrid({ rows }: { rows: RegistryRow[] }) {
  const selectBuilding = useRegistryStore((state) => state.selectBuilding);
  const columns = useMemo<ColumnDef<RegistryRow>[]>(() => [
    { header: "Адрес", accessorFn: (row) => row.building.address, cell: ({ row }) => <button onClick={() => selectBuilding(row.original.building.id)} className="text-left font-semibold text-white hover:text-orange-200">{row.original.building.address}</button> },
    { header: "Заказчик", accessorFn: (row) => row.customer.name },
    { header: "Лифты", accessorFn: (row) => row.elevators.length, cell: ({ row }) => <Badge>{row.original.elevators.length}</Badge> },
    { header: "SLA", accessorFn: (row) => row.contract.slaCategory, cell: ({ row }) => <Badge className="bg-blue-500/15 text-blue-200">{row.original.contract.slaCategory}</Badge> },
    { header: "Аварийность", accessorFn: (row) => row.building.emergencyElevators, cell: ({ row }) => <span className={row.original.building.emergencyElevators > 0 ? "text-red-200" : "text-slate-300"}>{row.original.building.emergencyElevators}</span> },
    { header: "Механик", accessorFn: (row) => row.assignedMechanics.join(", ") },
    { header: "Статус", accessorFn: (row) => row.building.status, cell: ({ row }) => <Badge>{row.original.building.status}</Badge> },
    { header: "Последние работы", accessorFn: (row) => new Date(row.building.lastWorkAt).toLocaleDateString("ru-RU") },
    { header: "Overdue ТО", accessorFn: (row) => row.building.overdueMaintenance, cell: ({ row }) => <span className={row.original.building.overdueMaintenance > 0 ? "text-orange-200" : "text-slate-300"}>{row.original.building.overdueMaintenance}</span> },
    { header: "Health", accessorFn: (row) => row.healthStatus, cell: ({ row }) => <RiskBadge risk={row.original.healthStatus} /> },
  ], [selectBuilding]);
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader><CardTitle>Operational registry grid</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-500">
              {table.getHeaderGroups().map((headerGroup) => <tr key={headerGroup.id}>{headerGroup.headers.map((header) => <th key={header.id} className="px-4 py-3">{flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>)}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => <tr key={row.id} className="border-t border-slate-800">{row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3 text-slate-300">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function BuildingCard() {
  const buildingId = useRegistryStore((state) => state.selectedBuildingId);
  const tab = useRegistryStore((state) => state.buildingTab);
  const setTab = useRegistryStore((state) => state.setBuildingTab);
  const selectElevator = useRegistryStore((state) => state.selectElevator);
  const setMode = useRegistryStore((state) => state.setMode);
  const building = BUILDINGS.find((candidate) => candidate.id === buildingId) ?? BUILDINGS[0];
  const customer = CUSTOMERS.find((candidate) => candidate.id === building.customerId) ?? CUSTOMERS[0];
  const contract = SERVICE_CONTRACTS.find((candidate) => candidate.id === building.contractId) ?? SERVICE_CONTRACTS[0];
  const elevators = ELEVATORS.filter((elevator) => building.elevatorIds.includes(elevator.id));

  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div><CardTitle className="text-xl">Building card — {building.address}</CardTitle><p className="mt-2 text-sm text-slate-500">{customer.name} · contract {contract.number} · {building.entrances.length} подъездов · {elevators.length} лифтов</p></div>
          <RiskBadge risk={building.riskLevel} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollableTabs tabs={buildingTabs} active={tab} labels={tabLabels} onSelect={setTab} />
        {tab === "overview" && <InfoGrid items={[ ["Адрес", building.address], ["Район", building.district], ["Статус", building.status], ["Фото", `${building.photoCount}`], ["Документы", `${building.documentCount}`], ["SLA alerts", `${building.slaAlerts}`] ]} />}
        {tab === "entrances" && <div className="grid gap-3 md:grid-cols-2">{building.entrances.map((entrance) => <InfoCard key={entrance.id} title={`Подъезд ${entrance.number}`} lines={[`${entrance.floors} этажей`, `${entrance.elevatorIds.length} лифтов`, entrance.accessNotes]} />)}</div>}
        {tab === "elevators" && <div className="grid gap-3 md:grid-cols-2">{elevators.map((elevator) => <button key={elevator.id} onClick={() => { selectElevator(elevator.id); setMode("elevators"); }} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-left hover:border-orange-400/50"><p className="font-semibold text-white">{elevator.factoryNumber}</p><p className="mt-1 text-sm text-slate-500">{elevator.registrationNumber} · health {elevator.healthScore}</p><ElevatorStatusBadge status={elevator.status} /></button>)}</div>}
        {tab === "history" && <EventList events={ELEVATOR_EVENTS.filter((event) => elevators.some((elevator) => elevator.id === event.elevatorId))} />}
        {tab === "emergencies" && <EventList events={ELEVATOR_EVENTS.filter((event) => event.type === "emergency" && elevators.some((elevator) => elevator.id === event.elevatorId))} />}
        {tab === "photos" && <MediaGallery elevatorIds={elevators.map((elevator) => elevator.id)} />}
        {tab === "documents" && <DocumentCenter ownerIds={[building.id, ...elevators.map((elevator) => elevator.id)]} />}
        {tab === "sla" && <InfoGrid items={[ ["SLA category", contract.slaCategory], ["Response", `${contract.responseMinutes} мин`], ["TO cycle", `${contract.maintenanceCycleDays} дней`], ["Valid until", contract.validUntil] ]} />}
        {tab === "analytics" && <AnalyticsPanel elevators={elevators} />}
      </CardContent>
    </Card>
  );
}

function ElevatorCard() {
  const elevatorId = useRegistryStore((state) => state.selectedElevatorId);
  const tab = useRegistryStore((state) => state.elevatorTab);
  const setTab = useRegistryStore((state) => state.setElevatorTab);
  const elevator = ELEVATORS.find((candidate) => candidate.id === elevatorId) ?? ELEVATORS[0];
  const building = BUILDINGS.find((candidate) => candidate.id === elevator.buildingId) ?? BUILDINGS[0];
  const model = ELEVATOR_MODELS.find((candidate) => candidate.id === elevator.modelId) ?? ELEVATOR_MODELS[0];
  const controller = ELEVATOR_CONTROLLERS.find((candidate) => candidate.id === elevator.controllerId) ?? ELEVATOR_CONTROLLERS[0];
  const nodes = EQUIPMENT_NODES.filter((node) => node.elevatorId === elevator.id);
  const events = ELEVATOR_EVENTS.filter((event) => event.elevatorId === elevator.id);

  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <CardTitle className="text-xl">Elevator card — {elevator.factoryNumber}</CardTitle>
            <p className="mt-2 text-sm text-slate-500">{building.address} · {model.manufacturer} {model.model} · {elevator.registrationNumber}</p>
          </div>
          <div className="flex flex-wrap gap-2"><ElevatorStatusBadge status={elevator.status} /><Badge className="bg-blue-500/15 text-blue-200">AI health {elevator.healthScore}</Badge></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollableTabs tabs={elevatorTabs} active={tab} labels={elevatorTabLabels} onSelect={setTab} />
        {tab === "passport" && <InfoGrid items={[ ["Заводской номер", elevator.factoryNumber], ["Регистрационный номер", elevator.registrationNumber], ["Модель", `${model.manufacturer} ${model.model}`], ["Дата установки", elevator.installedAt], ["Дата модернизации", elevator.modernizedAt ?? "—"], ["Срок службы", elevator.lifetimeUntil] ]} />}
        {tab === "tech" && <InfoGrid items={[ ["Грузоподъемность", `${model.capacityKg} кг`], ["Скорость", `${model.speedMs} м/с`], ["Этажность", `${elevator.stops}`], ["Тип дверей", model.doorType], ["Тип лифта", model.type], ["Следующее ТО", new Date(elevator.nextMaintenanceAt).toLocaleString("ru-RU") ] ]} />}
        {tab === "controller" && <InfoGrid items={[ ["Vendor", controller.vendor], ["Model", controller.model], ["Firmware", controller.firmware], ["Connectivity", controller.connectivity], ["Last telemetry", controller.lastTelemetryAt ?? "offline"] ]} />}
        {tab === "nodes" && <NodeSystem nodes={nodes} />}
        {tab === "repairs" && <EventList events={events.filter((event) => event.type === "repair" || event.type === "node_replacement" || event.type === "modernization")} />}
        {tab === "emergencies" && <EventList events={events.filter((event) => event.type === "emergency")} />}
        {tab === "work_orders" && <InfoGrid items={events.filter((event) => event.workOrderId).map((event) => [event.workOrderId ?? "WO", `${event.title} · ${new Date(event.happenedAt).toLocaleDateString("ru-RU")}`])} />}
        {tab === "photos" && <MediaGallery elevatorIds={[elevator.id]} />}
        {tab === "documents" && <DocumentCenter ownerIds={[elevator.id]} />}
        {tab === "events" && <EventList events={events} />}
        {tab === "analytics" && <AnalyticsPanel elevators={[elevator]} />}
      </CardContent>
    </Card>
  );
}

function MapOperationsView({ rows }: { rows: RegistryRow[] }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
      <Card className="overflow-hidden border-slate-800 bg-slate-950/70">
        <CardHeader><CardTitle className="flex items-center gap-2"><Map className="h-5 w-5 text-orange-300" /> Map-based operations view</CardTitle></CardHeader>
        <CardContent>
          <div className="relative min-h-[520px] overflow-hidden rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_30%_20%,rgba(255,122,26,0.18),transparent_16rem),radial-gradient(circle_at_75%_65%,rgba(59,130,246,0.14),transparent_18rem),#0f172a]">
            {rows.map((row, index) => <MapMarker key={row.building.id} row={row} index={index} />)}
            <div className="absolute bottom-4 left-4 rounded-2xl border border-slate-800 bg-slate-950/90 p-4 text-sm text-slate-400"><Route className="mb-2 h-5 w-5 text-orange-300" /> Routes, SLA risks and emergency heat zones are represented as map layers.</div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-slate-800 bg-slate-950/70">
        <CardHeader><CardTitle>Map layers</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {MAP_LAYERS.map((layer) => <div key={layer.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"><span className="font-semibold text-white">{layer.label}</span><Badge className={layer.enabled ? "bg-emerald-500/15 text-emerald-200" : "bg-slate-800 text-slate-300"}>{layer.enabled ? "enabled" : "off"}</Badge></div>)}
        </CardContent>
      </Card>
    </div>
  );
}

function RightOperationsPanel() {
  const selectedBuildingId = useRegistryStore((state) => state.selectedBuildingId);
  const building = BUILDINGS.find((candidate) => candidate.id === selectedBuildingId) ?? BUILDINGS[0];
  const buildingElevators = ELEVATORS.filter((elevator) => building.elevatorIds.includes(elevator.id));
  const schedules = MAINTENANCE_SCHEDULES.filter((schedule) => buildingElevators.some((elevator) => elevator.id === schedule.elevatorId));
  const events = ELEVATOR_EVENTS.filter((event) => buildingElevators.some((elevator) => elevator.id === event.elevatorId));

  return (
    <aside className="space-y-4 border-t border-slate-800 bg-slate-950/55 p-4 2xl:border-l 2xl:border-t-0">
      <PanelBlock title="Realtime alerts" icon={<Siren className="h-4 w-4" />}>
        <div className="space-y-2">{events.map((event) => <EventAlert key={event.id} event={event} />)}</div>
      </PanelBlock>
      <PanelBlock title="Upcoming maintenance" icon={<CalendarClock className="h-4 w-4" />}>
        <div className="space-y-2">{schedules.map((schedule) => <div key={schedule.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"><p className="font-semibold text-white">{schedule.type}</p><p className="mt-1 text-slate-500">{new Date(schedule.plannedAt).toLocaleString("ru-RU")} · overdue {schedule.overdueDays}d</p></div>)}</div>
      </PanelBlock>
      <PanelBlock title="AI recommendations" icon={<Bot className="h-4 w-4" />}>
        <div className="space-y-2 text-sm text-slate-400">
          <Recommendation text="Повторные отказы дверного привода SC-88420: запланировать замену узла и расширенную диагностику." />
          <Recommendation text="Для БЦ Север включить critical SLA route standby на ближайшие 48 часов." />
          <Recommendation text="Просроченное ТО OT-441121 влияет на SLA: создать recurring job и уведомить механика." />
        </div>
      </PanelBlock>
      <PanelBlock title="Document & media security" icon={<FileText className="h-4 w-4" />}>
        <p className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-400">Documents, schemes and photo archives use regional object permissions, secure media URLs, audit logs and lazy-loaded optimized previews.</p>
      </PanelBlock>
    </aside>
  );
}

function NodeSystem({ nodes }: { nodes: EquipmentNode[] }) {
  const fallbackNodes: EquipmentNode[] = nodes.length > 0 ? nodes : [
    { id: "node-empty-1", elevatorId: "none", type: "winch", name: "Лебедка", serialNumber: "—", installedAt: "—", expectedLifeMonths: 120, health: 86, failures: 0, photoCount: 0 },
    { id: "node-empty-2", elevatorId: "none", type: "buttons", name: "Кнопки", serialNumber: "—", installedAt: "—", expectedLifeMonths: 48, health: 91, failures: 0, photoCount: 0 },
    { id: "node-empty-3", elevatorId: "none", type: "sensors", name: "Датчики", serialNumber: "—", installedAt: "—", expectedLifeMonths: 60, health: 88, failures: 0, photoCount: 0 },
  ];
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{fallbackNodes.map((node) => <Card key={node.id} className="border-slate-800 bg-slate-900/60"><CardContent className="p-4"><Cpu className="mb-3 h-5 w-5 text-orange-300" /><p className="font-semibold text-white">{node.name}</p><p className="mt-1 text-sm text-slate-500">{node.type} · SN {node.serialNumber}</p><div className="mt-3 h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-orange-400" style={{ width: `${node.health}%` }} /></div><p className="mt-2 text-xs text-slate-500">health {node.health}% · failures {node.failures} · photos {node.photoCount}</p></CardContent></Card>)}</div>;
}

function MediaGallery({ elevatorIds }: { elevatorIds: string[] }) {
  const photos = ELEVATOR_PHOTOS.filter((photo) => elevatorIds.includes(photo.elevatorId));
  return <div className="grid gap-3 md:grid-cols-3">{photos.map((photo) => <div key={photo.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"><Camera className="mb-8 h-5 w-5 text-orange-300" /><p className="font-semibold text-white">{photo.title}</p><p className="mt-1 text-sm text-slate-500">{photo.kind} · {new Date(photo.takenAt).toLocaleString("ru-RU")} · {photo.takenBy}</p></div>)}</div>;
}

function DocumentCenter({ ownerIds }: { ownerIds: string[] }) {
  const docs = ELEVATOR_DOCUMENTS.filter((document) => ownerIds.includes(document.ownerId));
  return <div className="grid gap-3 md:grid-cols-2">{docs.map((document) => <div key={document.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"><div className="flex items-center justify-between"><FileText className="h-5 w-5 text-orange-300" /><Badge>{document.type}</Badge></div><p className="mt-4 font-semibold text-white">{document.title}</p><p className="mt-1 text-sm text-slate-500">{document.version} · updated {document.updatedAt} · {document.secure ? "secure" : "public"}</p></div>)}</div>;
}

function AnalyticsPanel({ elevators }: { elevators: Elevator[] }) {
  const avgHealth = Math.round(elevators.reduce((sum, elevator) => sum + elevator.healthScore, 0) / Math.max(elevators.length, 1));
  const emergencyCount = elevators.reduce((sum, elevator) => sum + elevator.emergencyCount30d, 0);
  return <div className="grid gap-3 md:grid-cols-3"><Metric label="AI health" value={`${avgHealth}%`} /><Metric label="Аварии 30d" value={`${emergencyCount}`} /><Metric label="Realtime updates" value="online" /></div>;
}

function EventList({ events }: { events: typeof ELEVATOR_EVENTS }) {
  return <div className="space-y-2">{events.map((event) => <EventAlert key={event.id} event={event} />)}</div>;
}

function EventAlert({ event }: { event: (typeof ELEVATOR_EVENTS)[number] }) {
  return <div className={cn("rounded-2xl border p-3 text-sm", event.severity === "critical" ? "border-red-400/30 bg-red-500/10" : event.severity === "warning" ? "border-orange-400/30 bg-orange-500/10" : "border-slate-800 bg-slate-900/60")}><div className="flex items-center justify-between"><p className="font-semibold text-white">{event.title}</p><Badge>{event.type}</Badge></div><p className="mt-1 text-slate-400">{event.description}</p><p className="mt-2 text-xs text-slate-500">{new Date(event.happenedAt).toLocaleString("ru-RU")} {event.workOrderId ? `· ${event.workOrderId}` : ""}</p></div>;
}

function ElevatorMini({ elevator }: { elevator: Elevator }) {
  const selectElevator = useRegistryStore((state) => state.selectElevator);
  const setMode = useRegistryStore((state) => state.setMode);
  return <button onClick={() => { selectElevator(elevator.id); setMode("elevators"); }} className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-left text-sm hover:border-orange-400/50"><div className="flex items-center justify-between"><p className="font-semibold text-white">{elevator.factoryNumber}</p><ElevatorStatusBadge status={elevator.status} /></div><p className="mt-1 text-xs text-slate-500">health {elevator.healthScore} · emergencies {elevator.emergencyCount30d}</p></button>;
}

function MapMarker({ row, index }: { row: RegistryRow; index: number }) {
  const positions = [{ left: "28%", top: "36%" }, { left: "64%", top: "28%" }, { left: "48%", top: "62%" }, { left: "76%", top: "68%" }];
  const position = positions[index % positions.length];
  return <div className="absolute" style={position}><div className={cn("h-5 w-5 rounded-full border-2 shadow-lg", row.healthStatus === "critical" ? "border-red-200 bg-red-500 shadow-red-950" : row.healthStatus === "high" ? "border-orange-200 bg-orange-500" : "border-emerald-200 bg-emerald-500")} /><div className="mt-2 w-52 rounded-2xl border border-slate-800 bg-slate-950/90 p-3 text-xs"><p className="font-semibold text-white">{row.building.address}</p><p className="mt-1 text-slate-500">{row.elevators.length} elevators · SLA {row.building.slaAlerts}</p></div></div>;
}

function ScrollableTabs<T extends string>({ tabs, active, labels, onSelect }: { tabs: T[]; active: T; labels: Record<T, string>; onSelect: (tab: T) => void }) {
  return <div className="flex gap-2 overflow-x-auto pb-1">{tabs.map((tab) => <button key={tab} onClick={() => onSelect(tab)} className={cn("shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold", active === tab ? "border-orange-400 bg-orange-500/10 text-orange-100" : "border-slate-800 bg-slate-900/60 text-slate-400")}>{labels[tab]}</button>)}</div>;
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map(([label, value]) => <InfoCard key={label} title={label} lines={[value]} />)}</div>;
}

function InfoCard({ title, lines }: { title: string; lines: string[] }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm"><p className="font-semibold text-white">{title}</p>{lines.map((line) => <p key={line} className="mt-1 text-slate-500">{line}</p>)}</div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-white">{value}</p></div>;
}

function PanelBlock({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <section><h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">{icon}{title}</h3>{children}</section>;
}

function ModeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return <Button variant={active ? "primary" : "secondary"} onClick={onClick}>{icon}{label}</Button>;
}

function RiskBadge({ risk }: { risk: Building["riskLevel"] }) {
  const cls = risk === "critical" ? "bg-red-500/15 text-red-200" : risk === "high" ? "bg-orange-500/15 text-orange-200" : risk === "watch" ? "bg-yellow-500/15 text-yellow-200" : "bg-emerald-500/15 text-emerald-200";
  return <Badge className={cls}>{risk}</Badge>;
}

function ElevatorStatusBadge({ status }: { status: Elevator["status"] }) {
  const cls = status === "emergency" || status === "out_of_service" ? "bg-red-500/15 text-red-200" : status === "maintenance" || status === "inspection_required" ? "bg-orange-500/15 text-orange-200" : status === "modernization" ? "bg-blue-500/15 text-blue-200" : "bg-emerald-500/15 text-emerald-200";
  return <Badge className={cls}>{status}</Badge>;
}

function Recommendation({ text }: { text: string }) {
  return <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3"><div className="mb-2 flex items-center gap-2 text-blue-100"><Bot className="h-4 w-4" /><span className="font-semibold">AI recommendation</span></div><p>{text}</p></div>;
}
