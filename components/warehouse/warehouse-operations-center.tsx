"use client";

import { ReactNode, useMemo } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { create } from "zustand";
import {
  AlertTriangle,
  Bot,
  ClipboardCheck,
  FileText,
  History,
  PackageCheck,
  PackageMinus,
  PackageSearch,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
  Warehouse,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  AI_WAREHOUSE_INSIGHTS,
  INVENTORY_AUDITS,
  MATERIAL_MOVEMENTS,
  MATERIAL_USAGE_HISTORY,
  PURCHASE_REQUESTS,
  QR_LABELS,
  RESERVATIONS,
  STOCK_LEVELS,
  SUPPLIERS,
  TRANSFERS,
  WAREHOUSES,
  WAREHOUSE_ALERTS,
  WRITEOFFS,
  buildInventoryRows,
} from "@/lib/warehouse/warehouse-operations-data";
import type { InventoryRow, MaterialMovement, StockRisk } from "@/lib/warehouse/types";

type MaterialTab = "overview" | "stock" | "movement" | "writeoffs" | "usage" | "photos" | "documents" | "analytics";

type WarehouseOpsState = {
  query: string;
  selectedMaterialId: string;
  selectedWarehouseId: string;
  materialTab: MaterialTab;
  setQuery: (query: string) => void;
  selectMaterial: (materialId: string) => void;
  selectWarehouse: (warehouseId: string) => void;
  setMaterialTab: (tab: MaterialTab) => void;
};

const materialTabs: MaterialTab[] = ["overview", "stock", "movement", "writeoffs", "usage", "photos", "documents", "analytics"];
const tabLabels: Record<MaterialTab, string> = {
  overview: "Общая информация",
  stock: "Остатки",
  movement: "Движение",
  writeoffs: "История списаний",
  usage: "Объекты использования",
  photos: "Фото",
  documents: "Документы",
  analytics: "Аналитика",
};

const useWarehouseOpsStore = create<WarehouseOpsState>((set) => ({
  query: "",
  selectedMaterialId: "mat-dr44",
  selectedWarehouseId: "wh-main",
  materialTab: "overview",
  setQuery: (query) => set({ query }),
  selectMaterial: (selectedMaterialId) => set({ selectedMaterialId, materialTab: "overview" }),
  selectWarehouse: (selectedWarehouseId) => set({ selectedWarehouseId }),
  setMaterialTab: (materialTab) => set({ materialTab }),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: false } } });

export function WarehouseOperationsCenter() {
  return (
    <QueryClientProvider client={queryClient}>
      <WarehouseOperationsCenterInner />
    </QueryClientProvider>
  );
}

function WarehouseOperationsCenterInner() {
  const query = useWarehouseOpsStore((state) => state.query);
  const setQuery = useWarehouseOpsStore((state) => state.setQuery);
  const selectedWarehouseId = useWarehouseOpsStore((state) => state.selectedWarehouseId);
  const { data: rows = [] } = useQuery({ queryKey: ["warehouse-inventory-rows"], queryFn: async () => buildInventoryRows(), refetchInterval: 7000 });
  const filteredRows = rows.filter((row) => {
    const queryMatch = [row.material.name, row.material.sku, row.material.barcode, row.category.name, row.warehouse.name].join(" ").toLowerCase().includes(query.toLowerCase());
    const warehouseMatch = selectedWarehouseId === "all" || row.warehouse.id === selectedWarehouseId;
    return queryMatch && warehouseMatch;
  });

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/85 px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-400/40 bg-orange-500/15 text-orange-300"><Warehouse className="h-6 w-6" /></div>
              <div><p className="text-xs uppercase tracking-[0.28em] text-slate-500">industrial inventory operations</p><h1 className="text-2xl font-black tracking-tight text-white">Warehouse, Inventory & Material Operations</h1></div>
            </div>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">Production field-service warehouse ERP: склады, остатки, резервы, выдачи, списания, перемещения, закупки, возвраты, инвентаризация, механики, QR/штрихкоды и realtime stock.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2"><Badge className="border-emerald-400/30 bg-emerald-500/10 text-emerald-200"><Wifi className="h-3 w-3" /> realtime stock</Badge><Badge className="border-orange-400/30 bg-orange-500/10 text-orange-200"><ShieldCheck className="h-3 w-3" /> write-off approvals</Badge></div>
        </div>
        <div className="mt-4"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск материала, артикула, QR, склада, категории..." /></div>
      </header>

      <div className="grid min-h-[calc(100vh-150px)] grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)_390px]">
        <LeftWarehousePanel />
        <section className="min-w-0 border-slate-800 p-4 lg:border-l lg:p-6">
          <div className="space-y-5"><InventoryGrid rows={filteredRows} /><MaterialCard rows={rows} /><OperationalFlows /></div>
        </section>
        <RightWarehouseIntelligence />
      </div>
    </main>
  );
}

function LeftWarehousePanel() {
  const selectedWarehouseId = useWarehouseOpsStore((state) => state.selectedWarehouseId);
  const selectWarehouse = useWarehouseOpsStore((state) => state.selectWarehouse);
  const lowStock = STOCK_LEVELS.filter((stock) => stock.risk === "low" || stock.risk === "critical" || stock.risk === "over_reserved").length;
  const pendingReservations = RESERVATIONS.filter((reservation) => reservation.status === "pending" || reservation.status === "confirmed").length;
  const suspiciousWriteOffs = WRITEOFFS.filter((writeOff) => writeOff.risk !== "normal").length;

  return (
    <aside className="space-y-4 border-b border-slate-800 bg-slate-950/45 p-4 lg:border-b-0">
      <PanelBlock title="Склады" icon={<Warehouse className="h-4 w-4" />}>
        <div className="space-y-2"><button onClick={() => selectWarehouse("all")} className={warehouseButtonClass(selectedWarehouseId === "all")}>Все склады</button>{WAREHOUSES.map((warehouse) => <button key={warehouse.id} onClick={() => selectWarehouse(warehouse.id)} className={warehouseButtonClass(selectedWarehouseId === warehouse.id)}><span className="block font-semibold">{warehouse.name}</span><span className="block text-xs text-slate-500">{warehouse.region} · {warehouse.type} · {warehouse.online ? "online" : "offline"}</span></button>)}</div>
      </PanelBlock>
      <div className="grid grid-cols-2 gap-3"><Metric label="Low stock" value={lowStock} danger /><Metric label="Reservations" value={pendingReservations} /><Metric label="Incoming" value={PURCHASE_REQUESTS.length} /><Metric label="Suspicious" value={suspiciousWriteOffs} danger /></div>
      <PanelBlock title="Pending reservations" icon={<PackageCheck className="h-4 w-4" />}>{RESERVATIONS.map((reservation) => <div key={reservation.id} className="mb-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"><p className="font-semibold text-white">{reservation.workOrderId}</p><p className="text-slate-500">qty {reservation.quantity} · {reservation.status} · SLA {String(reservation.slaCritical)}</p></div>)}</PanelBlock>
    </aside>
  );
}

function InventoryGrid({ rows }: { rows: InventoryRow[] }) {
  const selectMaterial = useWarehouseOpsStore((state) => state.selectMaterial);
  const columns = useMemo<ColumnDef<InventoryRow>[]>(() => [
    { header: "Материал", cell: ({ row }) => <button onClick={() => selectMaterial(row.original.material.id)} className="text-left font-semibold text-white hover:text-orange-200">{row.original.material.name}</button> },
    { header: "Артикул", accessorFn: (row) => row.material.sku },
    { header: "Категория", accessorFn: (row) => row.category.name },
    { header: "Остаток", accessorFn: (row) => row.stock.onHand },
    { header: "Резерв", accessorFn: (row) => row.stock.reserved },
    { header: "Доступно", accessorFn: (row) => row.available, cell: ({ row }) => <span className={row.original.available <= 0 ? "text-red-200" : "text-slate-200"}>{row.original.available}</span> },
    { header: "Склад", accessorFn: (row) => row.warehouse.name },
    { header: "Последнее движение", cell: ({ row }) => row.original.latestMovement ? <span>{row.original.latestMovement.type} · {new Date(row.original.latestMovement.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span> : "—" },
    { header: "Min/Max", cell: ({ row }) => `${row.original.stock.min}/${row.original.stock.max}` },
    { header: "Risk", cell: ({ row }) => <RiskBadge risk={row.original.stock.risk} /> },
  ], [selectMaterial]);
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader><CardTitle>Inventory grid</CardTitle></CardHeader>
      <CardContent><div className="overflow-x-auto rounded-2xl border border-slate-800"><table className="w-full min-w-[1120px] text-left text-sm"><thead className="bg-slate-900 text-xs uppercase text-slate-500">{table.getHeaderGroups().map((headerGroup) => <tr key={headerGroup.id}>{headerGroup.headers.map((header) => <th key={header.id} className="px-4 py-3">{flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map((row) => <tr key={row.id} className="border-t border-slate-800">{row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3 text-slate-300">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div></CardContent>
    </Card>
  );
}

function MaterialCard({ rows }: { rows: InventoryRow[] }) {
  const selectedMaterialId = useWarehouseOpsStore((state) => state.selectedMaterialId);
  const tab = useWarehouseOpsStore((state) => state.materialTab);
  const setTab = useWarehouseOpsStore((state) => state.setMaterialTab);
  const row = rows.find((candidate) => candidate.material.id === selectedMaterialId) ?? rows[0];

  if (!row) {
    return (
      <Card className="border-slate-800 bg-slate-950/70">
        <CardHeader><CardTitle>Material card</CardTitle></CardHeader>
        <CardContent className="text-sm text-slate-500">Loading warehouse inventory...</CardContent>
      </Card>
    );
  }

  const materialMovements = MATERIAL_MOVEMENTS.filter((movement) => movement.materialId === row.material.id);
  const writeOffs = WRITEOFFS.filter((writeOff) => writeOff.materialId === row.material.id);
  const usage = MATERIAL_USAGE_HISTORY.filter((history) => history.materialId === row.material.id);
  const qrLabels = QR_LABELS.filter((qr) => qr.materialId === row.material.id);

  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader><div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between"><div><CardTitle className="text-xl">Material card — {row.material.name}</CardTitle><p className="mt-2 text-sm text-slate-500">{row.material.sku} · {row.category.name} · {row.warehouse.name}</p></div><RiskBadge risk={row.stock.risk} /></div></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1">{materialTabs.map((candidate) => <button key={candidate} onClick={() => setTab(candidate)} className={cn("shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold", tab === candidate ? "border-orange-400 bg-orange-500/10 text-orange-100" : "border-slate-800 bg-slate-900 text-slate-400")}>{tabLabels[candidate]}</button>)}</div>
        {tab === "overview" && <InfoGrid items={[["Материал", row.material.name], ["Артикул", row.material.sku], ["Barcode", row.material.barcode], ["Производитель", row.material.manufacturer], ["Emergency part", String(row.material.emergencyPart)], ["High cost", String(row.material.highCost)]]} />}
        {tab === "stock" && <InfoGrid items={[["Остаток", `${row.stock.onHand}`], ["Резерв", `${row.stock.reserved}`], ["Доступно", `${row.available}`], ["Min/Max", `${row.stock.min}/${row.stock.max}`], ["Zone", row.stock.zoneId], ["Last realtime update", new Date(row.stock.lastMovementAt).toLocaleString("ru-RU")]]} />}
        {tab === "movement" && <MovementList movements={materialMovements} />}
        {tab === "writeoffs" && <div className="space-y-2">{writeOffs.map((writeOff) => <div key={writeOff.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"><div className="flex justify-between"><p className="font-semibold text-white">{writeOff.workOrderId}</p><Badge>{writeOff.risk}</Badge></div><p className="mt-1 text-slate-500">qty {writeOff.quantity} · photo {String(writeOff.photoAttached)} · {writeOff.validationMessages.join("; ")}</p></div>)}</div>}
        {tab === "usage" && <div className="space-y-2">{usage.map((item) => <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"><p className="font-semibold text-white">{item.objectAddress}</p><p className="text-slate-500">{item.elevatorFactoryNumber} · {item.workOrderId} · {item.failurePattern ?? "standard usage"}</p></div>)}</div>}
        {tab === "photos" && <div className="grid gap-3 md:grid-cols-2"><PlaceholderCard icon={<PackageSearch className="h-5 w-5" />} title="Material photo" text="Оптимизированное фото материала и упаковки" /><PlaceholderCard icon={<ScanLine className="h-5 w-5" />} title="QR scan evidence" text={qrLabels.map((qr) => qr.payload).join(" · ") || "No labels"} /></div>}
        {tab === "documents" && <div className="grid gap-3 md:grid-cols-2"><PlaceholderCard icon={<FileText className="h-5 w-5" />} title="Certificates" text="Сертификаты, паспорта, инструкции, PDF" /><PlaceholderCard icon={<ShieldCheck className="h-5 w-5" />} title="Secure access" text="Документы доступны по складским permissions" /></div>}
        {tab === "analytics" && <MaterialAnalytics row={row} />}
      </CardContent>
    </Card>
  );
}

function OperationalFlows() {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <FlowCard title="Выдача материалов" icon={<PackageCheck className="h-5 w-5" />} steps={["Механик получает заявку", "Резервирует материалы", "Склад подтверждает выдачу", "Остатки обновляются realtime", "Материалы привязаны к заказ-наряду"]} />
      <FlowCard title="Списание на объекте" icon={<PackageMinus className="h-5 w-5" />} steps={["Механик выбирает материалы", "Указывает количество", "Делает фото", "Validation: qty/photo/job match", "Списание уходит в audit log"]} />
      <FlowCard title="Инвентаризация" icon={<ClipboardCheck className="h-5 w-5" />} steps={["Запуск scheduled audit", "Mobile QR scan", "Проверка остатков", "Discrepancy report", "Approval/recount flow"]} />
    </div>
  );
}

function RightWarehouseIntelligence() {
  return (
    <aside className="space-y-4 border-t border-slate-800 bg-slate-950/55 p-4 2xl:border-l 2xl:border-t-0">
      <PanelBlock title="Alerts" icon={<AlertTriangle className="h-4 w-4" />}>{WAREHOUSE_ALERTS.map((alert) => <div key={alert.id} className={cn("mb-2 rounded-2xl border p-3 text-sm", alert.severity === "critical" ? "border-red-400/30 bg-red-500/10" : "border-orange-400/30 bg-orange-500/10")}><div className="flex items-center justify-between"><p className="font-semibold text-white">{alert.title}</p><Badge>{alert.type}</Badge></div><p className="mt-1 text-slate-400">{alert.description}</p></div>)}</PanelBlock>
      <PanelBlock title="AI warehouse analytics" icon={<Bot className="h-4 w-4" />}>{AI_WAREHOUSE_INSIGHTS.map((insight) => <div key={insight.id} className="mb-2 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3 text-sm"><div className="flex items-center justify-between"><p className="font-semibold text-blue-100">{insight.title}</p><Badge>{insight.confidence}%</Badge></div><p className="mt-1 text-slate-400">{insight.description}</p><p className="mt-1 text-xs text-slate-500">{insight.category}</p></div>)}</PanelBlock>
      <PanelBlock title="Movement history" icon={<History className="h-4 w-4" />}><MovementList movements={MATERIAL_MOVEMENTS.slice(0, 4)} compact /></PanelBlock>
      <PanelBlock title="Supplier & audit" icon={<ShoppingCart className="h-4 w-4" />}><div className="space-y-2">{PURCHASE_REQUESTS.map((request) => <div key={request.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"><p className="font-semibold text-white">{request.status} · qty {request.quantity}</p><p className="text-slate-500">{request.reason} · expected {new Date(request.expectedAt).toLocaleDateString("ru-RU")}</p></div>)}{INVENTORY_AUDITS.map((audit) => <div key={audit.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"><p className="font-semibold text-white">Audit {audit.status}</p><Progress value={(audit.scanned / audit.expected) * 100} className="mt-2" /><p className="mt-1 text-slate-500">{audit.discrepancies} discrepancies</p></div>)}</div></PanelBlock>
    </aside>
  );
}

function MovementList({ movements, compact }: { movements: MaterialMovement[]; compact?: boolean }) {
  return <div className="space-y-2">{movements.map((movement) => <div key={movement.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"><div className="flex items-center justify-between"><p className="font-semibold text-white">{movement.type}</p><Badge>{movement.status}</Badge></div><p className="mt-1 text-slate-500">qty {movement.quantity} · {movement.actor} · {movement.workOrderId ?? "warehouse"}</p>{!compact && <p className="mt-1 text-xs text-slate-500">{movement.reason} · photo {String(movement.photoAttached)}/{String(movement.photoRequired)}</p>}</div>)}</div>;
}

function MaterialAnalytics({ row }: { row: InventoryRow }) {
  const usageCount = MATERIAL_USAGE_HISTORY.filter((usage) => usage.materialId === row.material.id).length;
  const supplier = SUPPLIERS.find((candidate) => candidate.id === row.material.defaultSupplierId) ?? SUPPLIERS[0];
  const transfer = TRANSFERS.find((candidate) => candidate.materialId === row.material.id);
  return <div className="grid gap-3 md:grid-cols-3"><InfoTile label="Monthly consumption" value={`${Math.max(usageCount * 12, row.stock.reserved + 4)} ${row.material.unit}`} /><InfoTile label="Supplier reliability" value={`${supplier.reliability}%`} /><InfoTile label="Transfer ETA" value={transfer ? new Date(transfer.eta).toLocaleString("ru-RU") : "none"} /><InfoTile label="Top used" value={row.material.emergencyPart ? "аварийная запчасть" : "standard"} /><InfoTile label="Repeat failures" value={usageCount > 0 ? "detected" : "none"} /><InfoTile label="Price index" value={`${supplier.priceIndex}`} /></div>;
}

function FlowCard({ title, icon, steps }: { title: string; icon: ReactNode; steps: string[] }) {
  return <Card className="border-slate-800 bg-slate-950/70"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><span className="text-orange-300">{icon}</span>{title}</CardTitle></CardHeader><CardContent>{steps.map((step, index) => <div key={step} className="mb-2 flex gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"><Badge>{index + 1}</Badge><span className="text-slate-300">{step}</span></div>)}</CardContent></Card>;
}

function PanelBlock({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <section><h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">{icon}{title}</h3>{children}</section>;
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map(([label, value]) => <InfoTile key={label} label={label} value={value} />)}</div>;
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-sm font-bold text-white">{value}</p></div>;
}

function PlaceholderCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"><span className="text-orange-300">{icon}</span><p className="mt-4 font-semibold text-white">{title}</p><p className="mt-1 text-sm text-slate-500">{text}</p></div>;
}

function Metric({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return <div className={cn("rounded-2xl border p-4", danger ? "border-red-400/30 bg-red-500/10" : "border-slate-800 bg-slate-900/60")}><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-white">{value}</p></div>;
}

function RiskBadge({ risk }: { risk: StockRisk }) {
  const cls = risk === "critical" || risk === "over_reserved" ? "bg-red-500/15 text-red-200" : risk === "low" ? "bg-orange-500/15 text-orange-200" : risk === "dead_stock" ? "bg-blue-500/15 text-blue-200" : "bg-emerald-500/15 text-emerald-200";
  return <Badge className={cls}>{risk}</Badge>;
}

function warehouseButtonClass(active: boolean) {
  return cn("w-full rounded-2xl border p-3 text-left text-sm transition", active ? "border-orange-400/60 bg-orange-500/10 text-orange-100" : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700");
}
