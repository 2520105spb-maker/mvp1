"use client";

import { useMemo, useRef, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { ColumnDef, SortingState, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { create } from "zustand";
import {
  ArrowLeftRight,
  Barcode,
  CheckCircle2,
  ClipboardList,
  Eye,
  PackageCheck,
  PackageMinus,
  QrCode,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShoppingCart,
  Warehouse,
  Wifi,
  X,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type StockStatus = "ok" | "low" | "critical" | "over_reserved" | "inactive";
type WarehouseType = "main" | "mechanic" | "mobile" | "object";
type MovementType = "issue" | "return" | "transfer" | "reserve" | "write_off" | "purchase" | "inventory";
type MovementStatus = "pending" | "confirmed" | "rejected" | "requires_approval";
type AiRisk = "ok" | "warning" | "blocking";
type PurchaseStatus = "suggested" | "pending_approval" | "approved" | "ordered" | "received";

type WarehouseRecord = {
  id: string;
  name: string;
  type: WarehouseType;
  zone: string;
};

type MechanicInventoryRecord = {
  mechanic: string;
  online: boolean;
  quantity: number;
  limit: number;
  lastWriteOff: string;
  overuseRisk: AiRisk;
};

type MaterialMovement = {
  id: string;
  type: MovementType;
  status: MovementStatus;
  quantity: number;
  warehouse: string;
  actor: string;
  workOrder?: string;
  photoConfirmed: boolean;
  createdAt: string;
  oldValue: string;
  newValue: string;
  reason: string;
};

type Supplier = {
  id: string;
  name: string;
  leadTimeDays: number;
  minOrder: number;
};

type PurchaseRequest = {
  id: string;
  status: PurchaseStatus;
  quantity: number;
  supplier: string;
  createdBy: string;
  reason: string;
};

type AiInventoryIssue = {
  id: string;
  severity: AiRisk;
  title: string;
  description: string;
  action: string;
};

type StockItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  compatibility: string[];
  warehouse: WarehouseRecord;
  photoUrl: string;
  onHand: number;
  reserved: number;
  minStock: number;
  dailyMovement: number;
  lastUsageAt: string;
  mechanics: MechanicInventoryRecord[];
  suppliers: Supplier[];
  movements: MaterialMovement[];
  purchaseRequests: PurchaseRequest[];
  aiIssues: AiInventoryIssue[];
  status: StockStatus;
};

type WarehouseFilters = {
  warehouse: string;
  category: string;
  status: "all" | StockStatus;
  problem: "all" | "low" | "critical" | "reservations" | "suspicious" | "mechanic" | "purchase";
  query: string;
};

type WarehouseUiState = {
  selectedMaterialId: string | null;
  selectedIds: string[];
  movementPanel: MovementType | null;
  purchasePanelOpen: boolean;
  setSelectedMaterialId: (id: string) => void;
  toggleSelectedId: (id: string) => void;
  clearSelectedIds: () => void;
  setMovementPanel: (type: MovementType | null) => void;
  setPurchasePanelOpen: (open: boolean) => void;
};

const useWarehouseUiStore = create<WarehouseUiState>((set) => ({
  selectedMaterialId: null,
  selectedIds: [],
  movementPanel: null,
  purchasePanelOpen: false,
  setSelectedMaterialId: (id) => set({ selectedMaterialId: id }),
  toggleSelectedId: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id) ? state.selectedIds.filter((item) => item !== id) : [...state.selectedIds, id],
  })),
  clearSelectedIds: () => set({ selectedIds: [] }),
  setMovementPanel: (type) => set({ movementPanel: type }),
  setPurchasePanelOpen: (open) => set({ purchasePanelOpen: open }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: false } },
});

const placeholder = (label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="520" height="360" viewBox="0 0 520 360"><rect width="520" height="360" fill="#0f172a"/><rect x="20" y="20" width="480" height="320" rx="24" fill="#1f2937" stroke="#475569" stroke-width="2"/><text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" fill="#ff7a1a" font-family="Arial" font-size="26" font-weight="700">${label}</text><text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="16">НеоЛифт склад</text></svg>`)}`;

const mainWarehouse: WarehouseRecord = { id: "wh-main", name: "Главный склад", type: "main", zone: "A-03" };
const mobileWarehouse: WarehouseRecord = { id: "wh-mobile", name: "Мобильный склад Север", type: "mobile", zone: "Авто-2" };
const objectWarehouse: WarehouseRecord = { id: "wh-object", name: "Объектовый склад Полярная", type: "object", zone: "Подвал" };

const stockSeed: StockItem[] = [
  {
    id: "mat-001",
    sku: "KV-12-24V",
    name: "Кнопка вызова КВ-12 24В",
    category: "Электрика",
    compatibility: ["ЩЛЗ", "МЛЗ", "OTIS адаптер"],
    warehouse: mainWarehouse,
    photoUrl: placeholder("Кнопка КВ-12"),
    onHand: 18,
    reserved: 7,
    minStock: 20,
    dailyMovement: 9,
    lastUsageAt: "09.05.2026 08:44",
    status: "low",
    mechanics: [
      { mechanic: "Иван Петров", online: true, quantity: 3, limit: 4, lastWriteOff: "09.05.2026", overuseRisk: "ok" },
      { mechanic: "Антон Мельников", online: true, quantity: 7, limit: 4, lastWriteOff: "08.05.2026", overuseRisk: "warning" },
    ],
    suppliers: [{ id: "sup-1", name: "ЛифтКомплект", leadTimeDays: 4, minOrder: 25 }],
    movements: [
      { id: "mov-1", type: "reserve", status: "confirmed", quantity: 2, warehouse: "Главный склад", actor: "Система", workOrder: "НЛ-2026-00417", photoConfirmed: true, createdAt: "09.05.2026 08:44", oldValue: "20", newValue: "18", reason: "Резерв по заказ-наряду" },
      { id: "mov-2", type: "issue", status: "confirmed", quantity: 5, warehouse: "Главный склад → Иван Петров", actor: "Кладовщик Сидоров", photoConfirmed: false, createdAt: "09.05.2026 07:20", oldValue: "25", newValue: "20", reason: "Выдача механику" },
    ],
    purchaseRequests: [{ id: "pr-1", status: "suggested", quantity: 50, supplier: "ЛифтКомплект", createdBy: "AI закупки", reason: "Остаток ниже минимума с учетом резервов" }],
    aiIssues: [{ id: "ai-1", severity: "warning", title: "Остаток ниже минимума", description: "Доступно 11 при минимуме 20. С учетом движения за день запас закончится за 2 дня.", action: "Создать заявку на закупку" }],
  },
  {
    id: "mat-002",
    sku: "ROLLER-D45",
    name: "Ролик двери D45",
    category: "Механика",
    compatibility: ["Двери кабины", "Двери шахты"],
    warehouse: mobileWarehouse,
    photoUrl: placeholder("Ролик D45"),
    onHand: 42,
    reserved: 12,
    minStock: 24,
    dailyMovement: 14,
    lastUsageAt: "09.05.2026 09:18",
    status: "ok",
    mechanics: [
      { mechanic: "Иван Петров", online: true, quantity: 6, limit: 8, lastWriteOff: "09.05.2026", overuseRisk: "ok" },
      { mechanic: "Денис Котов", online: false, quantity: 2, limit: 6, lastWriteOff: "07.05.2026", overuseRisk: "ok" },
    ],
    suppliers: [{ id: "sup-2", name: "ПромЛифт", leadTimeDays: 6, minOrder: 40 }],
    movements: [
      { id: "mov-3", type: "write_off", status: "confirmed", quantity: 2, warehouse: "Мобильный склад Север", actor: "Иван Петров", workOrder: "НЛ-2026-00421", photoConfirmed: true, createdAt: "09.05.2026 09:21", oldValue: "44", newValue: "42", reason: "Списание после подтверждения работ" },
      { id: "mov-4", type: "transfer", status: "confirmed", quantity: 20, warehouse: "Главный склад → Мобильный склад Север", actor: "Кладовщик Сидоров", photoConfirmed: false, createdAt: "08.05.2026 16:10", oldValue: "22", newValue: "42", reason: "Пополнение мобильного склада" },
    ],
    purchaseRequests: [],
    aiIssues: [],
  },
  {
    id: "mat-003",
    sku: "DK-1-CONTACT",
    name: "Контакт ДК-1",
    category: "Электрика",
    compatibility: ["Дверной контакт", "Цепь безопасности"],
    warehouse: mainWarehouse,
    photoUrl: placeholder("Контакт ДК-1"),
    onHand: 3,
    reserved: 6,
    minStock: 12,
    dailyMovement: 11,
    lastUsageAt: "09.05.2026 08:52",
    status: "over_reserved",
    mechanics: [
      { mechanic: "Антон Мельников", online: true, quantity: 4, limit: 2, lastWriteOff: "09.05.2026", overuseRisk: "blocking" },
    ],
    suppliers: [{ id: "sup-3", name: "ЭлектроЛифт", leadTimeDays: 3, minOrder: 20 }],
    movements: [
      { id: "mov-5", type: "reserve", status: "requires_approval", quantity: 4, warehouse: "Главный склад", actor: "Антон Мельников", workOrder: "НЛ-2026-00423", photoConfirmed: false, createdAt: "09.05.2026 08:52", oldValue: "7", newValue: "3", reason: "Подозрительный резерв: превышение нормы" },
      { id: "mov-6", type: "write_off", status: "pending", quantity: 2, warehouse: "Главный склад", actor: "Система", workOrder: "НЛ-2026-00413", photoConfirmed: true, createdAt: "08.05.2026 19:11", oldValue: "9", newValue: "7", reason: "Ожидает подтверждения диспетчера" },
    ],
    purchaseRequests: [{ id: "pr-2", status: "pending_approval", quantity: 40, supplier: "ЭлектроЛифт", createdBy: "Кладовщик Сидоров", reason: "Критический остаток и over-reservation" }],
    aiIssues: [
      { id: "ai-2", severity: "blocking", title: "Резерв превышает остаток", description: "Зарезервировано 6 при остатке 3. Требуется подтверждение или перенос со склада механика.", action: "Заблокировать списание" },
      { id: "ai-3", severity: "blocking", title: "Частые замены одной детали", description: "Антон Мельников списал 4 контакта ДК-1 за 24 часа. Есть повторные ремонты по одному объекту.", action: "Проверить фото и заказ-наряды" },
    ],
  },
  {
    id: "mat-004",
    sku: "GREASE-GUIDE-1L",
    name: "Смазка направляющих 1л",
    category: "Расходники",
    compatibility: ["Направляющие", "Дверной механизм"],
    warehouse: objectWarehouse,
    photoUrl: placeholder("Смазка 1л"),
    onHand: 8,
    reserved: 1,
    minStock: 6,
    dailyMovement: 5,
    lastUsageAt: "09.05.2026 09:05",
    status: "ok",
    mechanics: [{ mechanic: "Сергей Орлов", online: false, quantity: 1, limit: 2, lastWriteOff: "09.05.2026", overuseRisk: "warning" }],
    suppliers: [{ id: "sup-4", name: "ТехСнаб", leadTimeDays: 2, minOrder: 10 }],
    movements: [{ id: "mov-7", type: "return", status: "confirmed", quantity: 1, warehouse: "Сергей Орлов → Объектовый склад", actor: "Сергей Орлов", workOrder: "НЛ-2026-00416", photoConfirmed: true, createdAt: "09.05.2026 09:05", oldValue: "7", newValue: "8", reason: "Возврат неиспользованного материала" }],
    purchaseRequests: [],
    aiIssues: [{ id: "ai-4", severity: "warning", title: "Перерасход расходника", description: "За неделю расход выше средней нормы на 32%.", action: "Проверить повторные работы" }],
  },
];

function available(item: StockItem) {
  return item.onHand - item.reserved;
}

function statusTone(status: StockStatus): "default" | "success" | "warning" | "danger" | "info" | "muted" {
  if (status === "ok") return "success";
  if (status === "low") return "warning";
  if (status === "critical" || status === "over_reserved") return "danger";
  return "muted";
}

function riskTone(risk: AiRisk): "default" | "success" | "warning" | "danger" | "info" | "muted" {
  if (risk === "ok") return "success";
  if (risk === "warning") return "warning";
  return "danger";
}

function movementLabel(type: MovementType) {
  return {
    issue: "Выдача",
    return: "Возврат",
    transfer: "Перемещение",
    reserve: "Резерв",
    write_off: "Списание",
    purchase: "Закупка",
    inventory: "Инвентаризация",
  }[type];
}

function fetchStockItems() {
  return Promise.resolve(stockSeed);
}

function useStockItems() {
  return useQuery({ queryKey: ["warehouse", "stock-items"], queryFn: fetchStockItems });
}

function WarehouseKpiPanel({ items }: { items: StockItem[] }) {
  const kpis = [
    { label: "Низкие остатки", value: items.filter((item) => item.status === "low").length, tone: "warning" as const },
    { label: "Критические", value: items.filter((item) => item.status === "critical" || item.status === "over_reserved").length, tone: "danger" as const },
    { label: "Движение за день", value: items.reduce((sum, item) => sum + item.dailyMovement, 0), tone: "info" as const },
    { label: "Неподтв. списания", value: items.flatMap((item) => item.movements).filter((movement) => movement.status === "pending").length, tone: "warning" as const },
    { label: "Подозрительные", value: items.flatMap((item) => item.aiIssues).filter((issue) => issue.severity !== "ok").length, tone: "danger" as const },
    { label: "Возвраты", value: items.flatMap((item) => item.movements).filter((movement) => movement.type === "return").length, tone: "success" as const },
    { label: "Pending reserves", value: items.reduce((sum, item) => sum + item.reserved, 0), tone: "default" as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="shadow-none">
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{kpi.label}</span>
              <Badge tone={kpi.tone}>{kpi.value}</Badge>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-50">{kpi.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function WarehouseFiltersPanel({ filters, setFilters, warehouses, categories }: { filters: WarehouseFilters; setFilters: (filters: WarehouseFilters) => void; warehouses: string[]; categories: string[] }) {
  return (
    <Card className="shadow-none">
      <CardContent className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-6">
        <label>
          <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Поиск</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input className="pl-9" value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="Артикул, QR, название" />
          </div>
        </label>
        <label>
          <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Склад</span>
          <Select value={filters.warehouse} onChange={(event) => setFilters({ ...filters, warehouse: event.target.value })}>
            <option value="all">Все склады</option>
            {warehouses.map((warehouse) => <option key={warehouse}>{warehouse}</option>)}
          </Select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Категория</span>
          <Select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
            <option value="all">Все категории</option>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </Select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Статус</span>
          <Select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as WarehouseFilters["status"] })}>
            <option value="all">Все</option>
            <option value="ok">OK</option>
            <option value="low">Низкий</option>
            <option value="critical">Критический</option>
            <option value="over_reserved">Over-reserved</option>
          </Select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Проблемы</span>
          <Select value={filters.problem} onChange={(event) => setFilters({ ...filters, problem: event.target.value as WarehouseFilters["problem"] })}>
            <option value="all">Все</option>
            <option value="low">Низкие остатки</option>
            <option value="critical">Критические</option>
            <option value="reservations">Резервы</option>
            <option value="suspicious">Подозрительные</option>
            <option value="mechanic">Склад механика</option>
            <option value="purchase">Закупки</option>
          </Select>
        </label>
        <div className="grid grid-cols-2 gap-2 xl:flex xl:items-end">
          <Button type="button" variant="secondary" className="xl:flex-1"><Barcode className="h-4 w-4" /> Barcode</Button>
          <Button type="button" variant="outline" className="xl:flex-1"><QrCode className="h-4 w-4" /> QR</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StockOperationalTable({ items }: { items: StockItem[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "status", desc: true }]);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const selectedId = useWarehouseUiStore((state) => state.selectedMaterialId);
  const selectedIds = useWarehouseUiStore((state) => state.selectedIds);
  const setSelectedMaterialId = useWarehouseUiStore((state) => state.setSelectedMaterialId);
  const toggleSelectedId = useWarehouseUiStore((state) => state.toggleSelectedId);
  const clearSelectedIds = useWarehouseUiStore((state) => state.clearSelectedIds);
  const setMovementPanel = useWarehouseUiStore((state) => state.setMovementPanel);

  const columns = useMemo<ColumnDef<StockItem>[]>(() => [
    {
      id: "select",
      header: "",
      cell: ({ row }) => <input type="checkbox" checked={selectedIds.includes(row.original.id)} onChange={() => toggleSelectedId(row.original.id)} className="h-5 w-5 accent-orange-500" aria-label={`Выбрать ${row.original.name}`} />,
      size: 44,
    },
    {
      accessorKey: "name",
      header: "Материал",
      cell: ({ row }) => (
        <button className="max-w-[20rem] truncate text-left font-bold text-slate-100 hover:text-signal-orange" onClick={() => setSelectedMaterialId(row.original.id)}>
          {row.original.name}<span className="ml-2 text-xs font-normal text-slate-500">{row.original.sku}</span>
        </button>
      ),
      size: 330,
    },
    { accessorKey: "category", header: "Категория", size: 140 },
    { accessorKey: "warehouse.name", header: "Склад", cell: ({ row }) => row.original.warehouse.name, size: 190 },
    { accessorKey: "onHand", header: "Остаток", size: 96 },
    { accessorKey: "reserved", header: "Резерв", size: 96 },
    { id: "available", header: "Доступно", cell: ({ row }) => <span className={cn(available(row.original) < 0 && "font-bold text-red-300")}>{available(row.original)}</span>, size: 100 },
    { accessorKey: "minStock", header: "Мин.", size: 88 },
    { accessorKey: "status", header: "Статус", cell: ({ row }) => <Badge tone={statusTone(row.original.status)}>{row.original.status}</Badge>, size: 132 },
    { accessorKey: "dailyMovement", header: "Движение", size: 118 },
    { accessorKey: "lastUsageAt", header: "Последний расход", size: 170 },
    { id: "mechanics", header: "У механиков", cell: ({ row }) => <Badge tone="muted">{row.original.mechanics.length}</Badge>, size: 128 },
  ], [selectedIds, setSelectedMaterialId, toggleSelectedId]);

  const table = useReactTable({ data: items, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });
  const rows = table.getRowModel().rows;
  const virtualizer = useVirtualizer({ count: rows.length, getScrollElement: () => parentRef.current, estimateSize: () => 58, overscan: 8 });

  return (
    <Card className="overflow-hidden shadow-none">
      <CardHeader className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Операционная таблица остатков</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Virtualized inventory grid · sticky material column · batch warehouse operations</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={selectedIds.length === 0} onClick={() => setMovementPanel("transfer")}><ArrowLeftRight className="h-4 w-4" /> Переместить</Button>
          <Button type="button" variant="outline" disabled={selectedIds.length === 0} onClick={clearSelectedIds}>Снять выбор</Button>
        </div>
      </CardHeader>
      <div ref={parentRef} className="h-[32rem] overflow-auto border-t border-slate-800" role="region" aria-label="Таблица складских остатков">
        <table className="min-w-[1490px] border-separate border-spacing-0 text-left text-sm">
          <thead className="sticky top-0 z-20 bg-graphite-950 text-xs uppercase text-slate-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => (
                  <th key={header.id} className={cn("border-b border-slate-800 px-3 py-3 font-bold", index <= 1 && "sticky z-30 bg-graphite-950", index === 0 && "left-0", index === 1 && "left-11")} style={{ width: header.getSize() }}>
                    {header.isPlaceholder ? null : <button onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())}{header.column.getIsSorted() === "asc" ? " ↑" : header.column.getIsSorted() === "desc" ? " ↓" : ""}</button>}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr key={row.id} className={cn("absolute left-0 grid w-full grid-cols-[44px_330px_140px_190px_96px_96px_100px_88px_132px_118px_170px_128px] border-b border-slate-900 bg-navy-950 hover:bg-graphite-950", selectedId === row.original.id && "bg-graphite-900")} style={{ transform: `translateY(${virtualRow.start}px)`, height: `${virtualRow.size}px` }} onDoubleClick={() => setSelectedMaterialId(row.original.id)}>
                  {row.getVisibleCells().map((cell, index) => (
                    <td key={cell.id} className={cn("flex min-h-14 items-center border-r border-slate-900 px-3 text-slate-300", index <= 1 && "sticky z-10 bg-inherit", index === 0 && "left-0", index === 1 && "left-11")}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function MaterialWorkspace({ item }: { item: StockItem }) {
  return (
    <section className="grid gap-3 xl:grid-cols-[22rem_minmax(0,1fr)_24rem]" aria-label="Карточка материала">
      <MaterialLeftPanel item={item} />
      <MovementTimeline item={item} />
      <MaterialAiPanel item={item} />
    </section>
  );
}

function MaterialLeftPanel({ item }: { item: StockItem }) {
  const setMovementPanel = useWarehouseUiStore((state) => state.setMovementPanel);
  const setPurchasePanelOpen = useWarehouseUiStore((state) => state.setPurchasePanelOpen);
  return (
    <Card className="shadow-none">
      <CardHeader className="p-3">
        <CardTitle>{item.name}</CardTitle>
        <p className="mt-1 text-sm text-slate-500">{item.sku} · {item.category}</p>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        <img src={item.photoUrl} alt={item.name} className="aspect-[4/3] w-full rounded-xl border border-slate-800 object-cover" />
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Metric label="Остаток" value={item.onHand} />
          <Metric label="Резерв" value={item.reserved} />
          <Metric label="Доступно" value={available(item)} danger={available(item) < 0} />
          <Metric label="Мин. остаток" value={item.minStock} />
        </div>
        <div className="rounded-xl border border-slate-800 bg-navy-900 p-3">
          <div className="text-xs font-bold uppercase text-slate-500">Совместимость</div>
          <div className="mt-2 flex flex-wrap gap-2">{item.compatibility.map((entry) => <Badge key={entry} tone="muted">{entry}</Badge>)}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-navy-900 p-3">
          <div className="text-xs font-bold uppercase text-slate-500">Поставщики</div>
          {item.suppliers.map((supplier) => <div key={supplier.id} className="mt-2 text-sm text-slate-200">{supplier.name} · {supplier.leadTimeDays} дн. · мин. {supplier.minOrder}</div>)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" size="sm" onClick={() => setMovementPanel("issue")}><PackageMinus className="h-4 w-4" /> Выдать</Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setMovementPanel("return")}><RotateCcw className="h-4 w-4" /> Возврат</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setMovementPanel("reserve")}><PackageCheck className="h-4 w-4" /> Резерв</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setPurchasePanelOpen(true)}><ShoppingCart className="h-4 w-4" /> Закупка</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return <div className="rounded-xl border border-slate-800 bg-navy-900 p-3"><div className="text-xs font-bold uppercase text-slate-500">{label}</div><div className={cn("mt-1 text-xl font-black", danger ? "text-red-300" : "text-slate-50")}>{value}</div></div>;
}

function MovementTimeline({ item }: { item: StockItem }) {
  const [filter, setFilter] = useState<"all" | MovementType>("all");
  const movements = item.movements.filter((movement) => filter === "all" || movement.type === filter);
  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>История движения деталей</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Списания · выдачи · возвраты · резервы · закупки · realtime sync</p>
        </div>
        <Select className="md:w-52" value={filter} onChange={(event) => setFilter(event.target.value as "all" | MovementType)}>
          <option value="all">Все движения</option>
          <option value="issue">Выдачи</option>
          <option value="return">Возвраты</option>
          <option value="transfer">Перемещения</option>
          <option value="reserve">Резервы</option>
          <option value="write_off">Списания</option>
          <option value="purchase">Закупки</option>
          <option value="inventory">Инвентаризация</option>
        </Select>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        {movements.map((movement) => (
          <div key={movement.id} className="rounded-xl border border-slate-800 bg-navy-900 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-bold text-slate-100">{movementLabel(movement.type)} · {movement.quantity} шт.</div>
                <div className="mt-1 text-sm text-slate-500">{movement.createdAt} · {movement.actor} · {movement.warehouse}</div>
              </div>
              <Badge tone={movement.status === "confirmed" ? "success" : movement.status === "requires_approval" ? "danger" : "warning"}>{movement.status}</Badge>
            </div>
            <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
              <div className="rounded-lg bg-graphite-950 p-2">Было: {movement.oldValue}</div>
              <div className="rounded-lg bg-graphite-950 p-2">Стало: {movement.newValue}</div>
              <div className="rounded-lg bg-graphite-950 p-2">Фото: {movement.photoConfirmed ? "подтверждено" : "нет"}</div>
            </div>
            {movement.workOrder ? <div className="mt-2 text-sm text-slate-400">Заказ-наряд: {movement.workOrder}</div> : null}
            <div className="mt-2 text-sm text-slate-300">{movement.reason}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MaterialAiPanel({ item }: { item: StockItem }) {
  return (
    <div className="space-y-3">
      <Card className="shadow-none">
        <CardHeader className="p-3"><CardTitle>AI контроль склада</CardTitle></CardHeader>
        <CardContent className="space-y-2 p-3">
          {item.aiIssues.length === 0 ? <Alert tone="success"><CheckCircle2 className="mr-2 inline h-4 w-4" /> Подозрительных операций нет.</Alert> : null}
          {item.aiIssues.map((issue) => (
            <Alert key={issue.id} tone={issue.severity === "blocking" ? "danger" : "warning"}>
              <div className="font-bold">{issue.title}</div>
              <div className="mt-1">{issue.description}</div>
              <Button type="button" variant="outline" size="sm" className="mt-3">{issue.action}</Button>
            </Alert>
          ))}
        </CardContent>
      </Card>
      <MechanicInventory mechanics={item.mechanics} />
      <PurchaseRequests requests={item.purchaseRequests} />
    </div>
  );
}

function MechanicInventory({ mechanics }: { mechanics: MechanicInventoryRecord[] }) {
  return (
    <Card className="shadow-none">
      <CardHeader className="p-3"><CardTitle>Мини-склады механиков</CardTitle></CardHeader>
      <CardContent className="space-y-2 p-3">
        {mechanics.map((mechanic) => (
          <div key={mechanic.mechanic} className="rounded-xl border border-slate-800 bg-navy-900 p-3">
            <div className="flex items-start justify-between gap-3">
              <div><div className="font-bold text-slate-100"><span className={cn("mr-2 inline-block h-2.5 w-2.5 rounded-full", mechanic.online ? "bg-signal-green" : "bg-slate-600")} />{mechanic.mechanic}</div><div className="mt-1 text-sm text-slate-500">Остаток {mechanic.quantity} · лимит {mechanic.limit} · последнее списание {mechanic.lastWriteOff}</div></div>
              <Badge tone={riskTone(mechanic.overuseRisk)}>{mechanic.overuseRisk}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PurchaseRequests({ requests }: { requests: PurchaseRequest[] }) {
  return (
    <Card className="shadow-none">
      <CardHeader className="p-3"><CardTitle>Заявки на закупку</CardTitle></CardHeader>
      <CardContent className="space-y-2 p-3">
        {requests.length === 0 ? <Alert tone="info">Активных заявок нет.</Alert> : null}
        {requests.map((request) => (
          <div key={request.id} className="rounded-xl border border-slate-800 bg-navy-900 p-3">
            <div className="flex items-start justify-between gap-3"><div><div className="font-bold text-slate-100">{request.quantity} шт. · {request.supplier}</div><div className="mt-1 text-sm text-slate-500">{request.createdBy} · {request.reason}</div></div><Badge tone={request.status === "suggested" ? "warning" : "info"}>{request.status}</Badge></div>
            <div className="mt-3 grid grid-cols-2 gap-2"><Button type="button" size="sm"><CheckCircle2 className="h-4 w-4" /> Подтвердить</Button><Button type="button" variant="secondary" size="sm">Отклонить</Button></div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MovementPanel({ item }: { item?: StockItem }) {
  const movementPanel = useWarehouseUiStore((state) => state.movementPanel);
  const setMovementPanel = useWarehouseUiStore((state) => state.setMovementPanel);
  if (!movementPanel) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Операция движения материала">
      <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-auto rounded-t-2xl border border-slate-800 bg-graphite-900 p-4 shadow-industrial md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-[34rem] md:rounded-none">
        <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-xl font-black text-slate-50">{movementLabel(movementPanel)}</h2><p className="mt-1 text-sm text-slate-400">{item?.name ?? "Выбранные материалы"}</p></div><Button type="button" variant="ghost" size="icon" onClick={() => setMovementPanel(null)} aria-label="Закрыть операцию"><X className="h-5 w-5" /></Button></div>
        <div className="space-y-4">
          <label><span className="mb-1 block text-xs font-bold uppercase text-slate-500">Количество</span><Input type="number" defaultValue={1} min={1} /></label>
          <label><span className="mb-1 block text-xs font-bold uppercase text-slate-500">Склад / механик / зона</span><Select defaultValue="main"><option value="main">Главный склад</option><option value="mechanic">Склад механика</option><option value="mobile">Мобильный склад</option><option value="object">Объектовый склад</option></Select></label>
          <label><span className="mb-1 block text-xs font-bold uppercase text-slate-500">Основание</span><Input placeholder="Заказ-наряд, акт, инвентаризация" /></label>
          <label><span className="mb-1 block text-xs font-bold uppercase text-slate-500">Комментарий</span><textarea className="min-h-28 w-full rounded-xl border border-slate-700 bg-navy-900 p-3 text-slate-50 outline-none focus:border-signal-orange" placeholder="Причина движения, замечания, фото-подтверждение" /></label>
          <Alert tone="warning"><ShieldAlert className="mr-2 inline h-4 w-4" /> Операция создаст audit record и может потребовать подтверждение при превышении лимитов.</Alert>
          <div className="grid grid-cols-2 gap-2"><Button type="button" variant="secondary" onClick={() => setMovementPanel(null)}>Отмена</Button><Button type="button" onClick={() => setMovementPanel(null)}><ClipboardList className="h-4 w-4" /> Провести</Button></div>
        </div>
      </div>
    </div>
  );
}

function WarehouseRealtimeStrip() {
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-signal-green/30 bg-signal-green/10 p-3 text-sm text-green-100"><div className="flex items-center gap-2"><Wifi className="h-4 w-4" /> Live остатки · realtime reservations · movement sync · online mechanics · instant stock updates</div><Badge tone="success">inventory WS active</Badge></div>;
}

function WarehouseWorkspace() {
  const { data = [], isLoading, isError, refetch, isFetching } = useStockItems();
  const [filters, setFilters] = useState<WarehouseFilters>({ warehouse: "all", category: "all", status: "all", problem: "all", query: "" });
  const selectedMaterialId = useWarehouseUiStore((state) => state.selectedMaterialId);
  const setSelectedMaterialId = useWarehouseUiStore((state) => state.setSelectedMaterialId);
  const setMovementPanel = useWarehouseUiStore((state) => state.setMovementPanel);

  const warehouses = useMemo(() => Array.from(new Set(data.map((item) => item.warehouse.name))), [data]);
  const categories = useMemo(() => Array.from(new Set(data.map((item) => item.category))), [data]);
  const filtered = useMemo(() => data.filter((item) => {
    const query = filters.query.toLowerCase();
    const queryMatch = !query || `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(query);
    const warehouseMatch = filters.warehouse === "all" || item.warehouse.name === filters.warehouse;
    const categoryMatch = filters.category === "all" || item.category === filters.category;
    const statusMatch = filters.status === "all" || item.status === filters.status;
    const problemMatch =
      filters.problem === "all" ||
      (filters.problem === "low" && item.status === "low") ||
      (filters.problem === "critical" && (item.status === "critical" || item.status === "over_reserved")) ||
      (filters.problem === "reservations" && item.reserved > 0) ||
      (filters.problem === "suspicious" && item.aiIssues.length > 0) ||
      (filters.problem === "mechanic" && item.mechanics.length > 0) ||
      (filters.problem === "purchase" && item.purchaseRequests.length > 0);
    return queryMatch && warehouseMatch && categoryMatch && statusMatch && problemMatch;
  }), [data, filters]);
  const selected = data.find((item) => item.id === selectedMaterialId) ?? filtered[0];

  if (isLoading) return <main className="min-h-screen bg-navy-950 p-4 text-slate-100"><div className="mx-auto max-w-7xl space-y-4"><div className="h-24 animate-pulse rounded-2xl bg-graphite-900" /><div className="h-[32rem] animate-pulse rounded-2xl bg-graphite-900" /></div></main>;
  if (isError) return <main className="min-h-screen bg-navy-950 p-4 text-slate-100"><Alert tone="danger">Не удалось загрузить складские остатки.</Alert></main>;

  return (
    <main className="min-h-screen bg-navy-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-navy-950/95 px-3 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div><h1 className="text-xl font-black text-slate-50 md:text-2xl">Склад и материалы НеоЛифт</h1><p className="mt-1 text-sm text-slate-500">Industrial warehouse ERP · остатки · резервы · механики · закупки · audit</p></div>
          <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} /> Обновить</Button><Button type="button" onClick={() => setMovementPanel("inventory")}><Warehouse className="h-4 w-4" /> Инвентаризация</Button></div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl space-y-4 px-3 py-4">
        <WarehouseRealtimeStrip />
        <WarehouseKpiPanel items={data} />
        <WarehouseFiltersPanel filters={filters} setFilters={setFilters} warehouses={warehouses} categories={categories} />
        {filtered.length === 0 ? <Card className="shadow-none"><CardContent className="p-8 text-center text-slate-400">Нет материалов по выбранным фильтрам.</CardContent></Card> : <StockOperationalTable items={filtered} />}
        {selected ? <div className="space-y-3"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-black text-slate-50">Material operational workspace</h2><Button type="button" variant="outline" size="sm" onClick={() => setSelectedMaterialId(selected.id)}><Eye className="h-4 w-4" /> {selected.sku}</Button></div><MaterialWorkspace item={selected} /></div> : null}
      </div>
      <MovementPanel item={selected} />
    </main>
  );
}

export function WarehouseManagementModule() {
  return <QueryClientProvider client={queryClient}><WarehouseWorkspace /></QueryClientProvider>;
}
