"use client";

import { useMemo, useRef, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { create } from "zustand";
import {
  Bell,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileText,
  Maximize2,
  MessageSquare,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  UserCheck,
  Wifi,
  X,
  XCircle,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type WorkOrderStatus = "new" | "in_review" | "returned" | "approved" | "blocked" | "overdue";
type DispatcherStatus = "unassigned" | "assigned" | "checking" | "waiting_mechanic" | "done";
type AiStatus = "ok" | "warning" | "blocking" | "pending";
type PhotoStatus = "complete" | "missing" | "poor_quality" | "uploading";
type SignatureStatus = "present" | "missing";
type MaterialRisk = "ok" | "warning" | "blocking";
type IssueSeverity = "blocking" | "warning" | "info";
type PhotoType = "installed" | "removed" | "document";

type WorkItem = {
  id: string;
  action: string;
  element: string;
  quantity: number;
};

type MaterialLine = {
  id: string;
  name: string;
  type: string;
  quantity: number;
  stock: number;
  norm: number;
  risk: MaterialRisk;
  note?: string;
};

type PhotoEvidence = {
  id: string;
  type: PhotoType;
  label: string;
  status: PhotoStatus;
  url?: string;
  progress?: number;
  aiMessage?: string;
};

type ValidationIssue = {
  id: string;
  group: "Фото" | "Подпись" | "OCR" | "Материалы" | "Заполнение";
  severity: IssueSeverity;
  title: string;
  action: string;
};

type AuditEntry = {
  id: string;
  actor: string;
  role: string;
  changedAt: string;
  field: string;
  oldValue: string;
  newValue: string;
};

type DispatcherWorkOrder = {
  id: string;
  number: string;
  status: WorkOrderStatus;
  dispatcherStatus: DispatcherStatus;
  address: string;
  customer: string;
  elevatorNumber: string;
  elevatorType: string;
  mechanic: string;
  mechanicOnline: boolean;
  workType: string;
  date: string;
  submittedAt: string;
  dueAt: string;
  photos: PhotoStatus;
  photoCount: number;
  signature: SignatureStatus;
  materialsStatus: MaterialRisk;
  aiStatus: AiStatus;
  remarks: number;
  works: WorkItem[];
  materials: MaterialLine[];
  photoEvidence: PhotoEvidence[];
  validationIssues: ValidationIssue[];
  auditTrail: AuditEntry[];
};

type DispatcherFilters = {
  status: "all" | WorkOrderStatus;
  mechanic: string;
  date: string;
  object: string;
  problem: "all" | "photo" | "ai" | "materials" | "signature" | "returns" | "unconfirmed";
};

type DispatcherUiState = {
  selectedId: string | null;
  selectedIds: string[];
  compareMode: boolean;
  fullscreenPhotoId: string | null;
  returnPanelOpen: boolean;
  setSelectedId: (id: string) => void;
  toggleSelectedId: (id: string) => void;
  clearSelection: () => void;
  setCompareMode: (value: boolean) => void;
  setFullscreenPhotoId: (id: string | null) => void;
  setReturnPanelOpen: (value: boolean) => void;
};

const useDispatcherUiStore = create<DispatcherUiState>((set) => ({
  selectedId: null,
  selectedIds: [],
  compareMode: false,
  fullscreenPhotoId: null,
  returnPanelOpen: false,
  setSelectedId: (id) => set({ selectedId: id }),
  toggleSelectedId: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((selectedId) => selectedId !== id)
        : [...state.selectedIds, id],
    })),
  clearSelection: () => set({ selectedIds: [] }),
  setCompareMode: (value) => set({ compareMode: value }),
  setFullscreenPhotoId: (id) => set({ fullscreenPhotoId: id }),
  setReturnPanelOpen: (value) => set({ returnPanelOpen: value }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      refetchOnWindowFocus: false,
    },
  },
});

const photoPlaceholder = (label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" fill="#111827"/><rect x="24" y="24" width="592" height="372" rx="24" fill="#1f2937" stroke="#475569" stroke-width="2"/><text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" fill="#f97316" font-family="Arial" font-size="30" font-weight="700">${label}</text><text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="18">НеоЛифт фотофиксация</text></svg>`,
  )}`;

const workOrdersSeed: DispatcherWorkOrder[] = [
  {
    id: "wo-1001",
    number: "НЛ-2026-00421",
    status: "in_review",
    dispatcherStatus: "checking",
    address: "Москва, ул. Полярная, 18к2",
    customer: "УК Северный квартал",
    elevatorNumber: "Л-0427",
    elevatorType: "Пассажирский, 630 кг",
    mechanic: "Иван Петров",
    mechanicOnline: true,
    workType: "Ремонт",
    date: "09.05.2026",
    submittedAt: "09:18",
    dueAt: "10:00",
    photos: "poor_quality",
    photoCount: 3,
    signature: "present",
    materialsStatus: "warning",
    aiStatus: "warning",
    remarks: 2,
    works: [
      { id: "wi-1", action: "Замена", element: "роликов дверей", quantity: 2 },
      { id: "wi-2", action: "Регулировка", element: "дверей кабины", quantity: 1 },
    ],
    materials: [
      { id: "mu-1", name: "Ролик двери D45", type: "Механика", quantity: 2, stock: 12, norm: 2, risk: "ok" },
      { id: "mu-2", name: "Смазка направляющих", type: "Расходник", quantity: 2, stock: 2, norm: 1, risk: "warning", note: "Расход выше типовой нормы" },
    ],
    photoEvidence: [
      { id: "p-1", type: "installed", label: "Установленная деталь", status: "complete", url: photoPlaceholder("Установленная деталь") },
      { id: "p-2", type: "removed", label: "Демонтированная деталь", status: "poor_quality", url: photoPlaceholder("Размытое фото"), aiMessage: "AI: вероятная размытость, нужен переснимок." },
      { id: "p-3", type: "document", label: "Заказ-наряд", status: "complete", url: photoPlaceholder("Заказ-наряд") },
    ],
    validationIssues: [
      { id: "v-1", group: "Фото", severity: "warning", title: "Фото демонтированной детали размыто", action: "Запросить повторное фото" },
      { id: "v-2", group: "Материалы", severity: "warning", title: "Смазка выше типовой нормы", action: "Проверить списание" },
    ],
    auditTrail: [
      { id: "a-1", actor: "Иван Петров", role: "Механик", changedAt: "09.05.2026 09:18", field: "Статус", oldValue: "Черновик", newValue: "На проверке" },
      { id: "a-2", actor: "AI Validation", role: "Система", changedAt: "09.05.2026 09:19", field: "Фото", oldValue: "Ожидает", newValue: "Warning: blur" },
    ],
  },
  {
    id: "wo-1002",
    number: "НЛ-2026-00422",
    status: "new",
    dispatcherStatus: "unassigned",
    address: "Москва, Дмитровское ш., 71",
    customer: "ТСЖ Вертикаль",
    elevatorNumber: "Л-0118",
    elevatorType: "Грузопассажирский, 1000 кг",
    mechanic: "Сергей Орлов",
    mechanicOnline: false,
    workType: "ТО",
    date: "09.05.2026",
    submittedAt: "09:34",
    dueAt: "10:30",
    photos: "complete",
    photoCount: 3,
    signature: "present",
    materialsStatus: "ok",
    aiStatus: "ok",
    remarks: 0,
    works: [{ id: "wi-3", action: "Проверка", element: "цепи безопасности", quantity: 1 }],
    materials: [],
    photoEvidence: [
      { id: "p-4", type: "installed", label: "Установленная деталь", status: "complete", url: photoPlaceholder("ТО: узел") },
      { id: "p-5", type: "removed", label: "Демонтированная деталь", status: "complete", url: photoPlaceholder("Нет демонтажа") },
      { id: "p-6", type: "document", label: "Заказ-наряд", status: "complete", url: photoPlaceholder("Документ") },
    ],
    validationIssues: [],
    auditTrail: [{ id: "a-3", actor: "Сергей Орлов", role: "Механик", changedAt: "09.05.2026 09:34", field: "Статус", oldValue: "Заполнен", newValue: "На проверке" }],
  },
  {
    id: "wo-1003",
    number: "НЛ-2026-00423",
    status: "blocked",
    dispatcherStatus: "assigned",
    address: "Москва, ул. Енисейская, 4",
    customer: "ГБУ Жилищник",
    elevatorNumber: "Л-0891",
    elevatorType: "Пассажирский, 400 кг",
    mechanic: "Антон Мельников",
    mechanicOnline: true,
    workType: "Аварийная",
    date: "09.05.2026",
    submittedAt: "08:52",
    dueAt: "09:30",
    photos: "missing",
    photoCount: 2,
    signature: "missing",
    materialsStatus: "blocking",
    aiStatus: "blocking",
    remarks: 4,
    works: [{ id: "wi-4", action: "Замена", element: "контакта ДК", quantity: 1 }],
    materials: [{ id: "mu-3", name: "Контакт ДК-1", type: "Электрика", quantity: 4, stock: 1, norm: 1, risk: "blocking", note: "Превышение нормы и остатка" }],
    photoEvidence: [
      { id: "p-7", type: "installed", label: "Установленная деталь", status: "complete", url: photoPlaceholder("Контакт ДК") },
      { id: "p-8", type: "removed", label: "Демонтированная деталь", status: "missing" },
      { id: "p-9", type: "document", label: "Заказ-наряд", status: "uploading", progress: 54, url: photoPlaceholder("Загрузка") },
    ],
    validationIssues: [
      { id: "v-3", group: "Фото", severity: "blocking", title: "Нет фото демонтированной детали", action: "Обязательное исправление" },
      { id: "v-4", group: "Подпись", severity: "blocking", title: "Подпись заказчика отсутствует", action: "Вернуть механику" },
      { id: "v-5", group: "Материалы", severity: "blocking", title: "Списание контакта ДК превышает остаток", action: "Отклонить материалы" },
    ],
    auditTrail: [
      { id: "a-4", actor: "Антон Мельников", role: "Механик", changedAt: "09.05.2026 08:52", field: "Материалы", oldValue: "1 × Контакт ДК-1", newValue: "4 × Контакт ДК-1" },
      { id: "a-5", actor: "AI Validation", role: "Система", changedAt: "09.05.2026 08:53", field: "Проверка", oldValue: "Pending", newValue: "Blocking" },
    ],
  },
  {
    id: "wo-1004",
    number: "НЛ-2026-00418",
    status: "returned",
    dispatcherStatus: "waiting_mechanic",
    address: "Химки, Молодежная, 52",
    customer: "УК Старт",
    elevatorNumber: "Л-0315",
    elevatorType: "Пассажирский, 630 кг",
    mechanic: "Денис Котов",
    mechanicOnline: false,
    workType: "Повторный выезд",
    date: "08.05.2026",
    submittedAt: "18:17",
    dueAt: "09:00",
    photos: "missing",
    photoCount: 1,
    signature: "missing",
    materialsStatus: "ok",
    aiStatus: "blocking",
    remarks: 3,
    works: [{ id: "wi-5", action: "Регулировка", element: "дверей шахты", quantity: 1 }],
    materials: [],
    photoEvidence: [
      { id: "p-10", type: "installed", label: "Установленная деталь", status: "missing" },
      { id: "p-11", type: "removed", label: "Демонтированная деталь", status: "missing" },
      { id: "p-12", type: "document", label: "Заказ-наряд", status: "complete", url: photoPlaceholder("Возврат") },
    ],
    validationIssues: [
      { id: "v-6", group: "Фото", severity: "blocking", title: "Не хватает 2 обязательных фото", action: "Ожидается доработка" },
      { id: "v-7", group: "Подпись", severity: "blocking", title: "Нет подписи", action: "Ожидается доработка" },
    ],
    auditTrail: [
      { id: "a-6", actor: "Марина Волкова", role: "Диспетчер", changedAt: "08.05.2026 18:41", field: "Статус", oldValue: "На проверке", newValue: "Возвращен" },
    ],
  },
  {
    id: "wo-1005",
    number: "НЛ-2026-00417",
    status: "overdue",
    dispatcherStatus: "assigned",
    address: "Москва, ул. Летчика Бабушкина, 29",
    customer: "УК Север",
    elevatorNumber: "Л-0772",
    elevatorType: "Пассажирский, 320 кг",
    mechanic: "Иван Петров",
    mechanicOnline: true,
    workType: "Ремонт",
    date: "08.05.2026",
    submittedAt: "17:10",
    dueAt: "18:00",
    photos: "complete",
    photoCount: 3,
    signature: "present",
    materialsStatus: "warning",
    aiStatus: "pending",
    remarks: 1,
    works: [{ id: "wi-6", action: "Замена", element: "кнопок вызова", quantity: 2 }],
    materials: [{ id: "mu-4", name: "Кнопка вызова КВ-12", type: "Электрика", quantity: 2, stock: 8, norm: 2, risk: "ok" }],
    photoEvidence: [
      { id: "p-13", type: "installed", label: "Установленная деталь", status: "complete", url: photoPlaceholder("Кнопка новая") },
      { id: "p-14", type: "removed", label: "Демонтированная деталь", status: "complete", url: photoPlaceholder("Кнопка старая") },
      { id: "p-15", type: "document", label: "Заказ-наряд", status: "complete", url: photoPlaceholder("Документ") },
    ],
    validationIssues: [{ id: "v-8", group: "OCR", severity: "info", title: "OCR еще выполняется", action: "Дождаться результата" }],
    auditTrail: [{ id: "a-7", actor: "Система SLA", role: "Система", changedAt: "08.05.2026 18:01", field: "SLA", oldValue: "В срок", newValue: "Просрочен" }],
  },
];

function getStatusLabel(status: WorkOrderStatus) {
  return {
    new: "Новый",
    in_review: "На проверке",
    returned: "Возврат",
    approved: "Подтвержден",
    blocked: "Блокер",
    overdue: "Просрочен",
  }[status];
}

function getDispatcherStatusLabel(status: DispatcherStatus) {
  return {
    unassigned: "Не назначен",
    assigned: "Назначен",
    checking: "Проверяется",
    waiting_mechanic: "Ждет механика",
    done: "Готово",
  }[status];
}

function statusTone(status: WorkOrderStatus): "default" | "success" | "warning" | "danger" | "info" | "muted" {
  if (status === "blocked" || status === "overdue") return "danger";
  if (status === "returned") return "warning";
  if (status === "approved") return "success";
  if (status === "in_review") return "info";
  return "default";
}

function aiTone(status: AiStatus): "default" | "success" | "warning" | "danger" | "info" | "muted" {
  if (status === "ok") return "success";
  if (status === "warning") return "warning";
  if (status === "blocking") return "danger";
  return "info";
}

function riskTone(risk: MaterialRisk): "default" | "success" | "warning" | "danger" | "info" | "muted" {
  if (risk === "ok") return "success";
  if (risk === "warning") return "warning";
  return "danger";
}

function photoTone(status: PhotoStatus): "default" | "success" | "warning" | "danger" | "info" | "muted" {
  if (status === "complete") return "success";
  if (status === "uploading") return "info";
  if (status === "poor_quality") return "warning";
  return "danger";
}

function issueTone(severity: IssueSeverity): "default" | "success" | "warning" | "danger" | "info" | "muted" {
  if (severity === "blocking") return "danger";
  if (severity === "warning") return "warning";
  return "info";
}

function fetchDispatcherWorkOrders() {
  return Promise.resolve(workOrdersSeed);
}

function useDispatcherWorkOrders() {
  return useQuery<DispatcherWorkOrder[]>({
    queryKey: ["dispatcher", "work-orders"],
    queryFn: fetchDispatcherWorkOrders,
  });
}

function KpiBar({ workOrders }: { workOrders: DispatcherWorkOrder[] }) {
  const kpis = [
    { label: "Новые", value: workOrders.filter((item) => item.status === "new").length, tone: "info" as const },
    { label: "Ожидают проверки", value: workOrders.filter((item) => item.status === "in_review" || item.status === "new").length, tone: "default" as const },
    { label: "Возвраты", value: workOrders.filter((item) => item.status === "returned").length, tone: "warning" as const },
    { label: "Неподтвержденные", value: workOrders.filter((item) => item.status !== "approved").length, tone: "muted" as const },
    { label: "Проблемы фото", value: workOrders.filter((item) => item.photos !== "complete").length, tone: "danger" as const },
    { label: "Просроченные", value: workOrders.filter((item) => item.status === "overdue").length, tone: "danger" as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</span>
              <Badge tone={kpi.tone}>{kpi.value}</Badge>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-50">{kpi.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FiltersPanel({ filters, setFilters, mechanics }: { filters: DispatcherFilters; setFilters: (filters: DispatcherFilters) => void; mechanics: string[] }) {
  return (
    <Card className="shadow-none">
      <CardContent className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-6">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Статус</span>
          <Select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as DispatcherFilters["status"] })}>
            <option value="all">Все</option>
            <option value="new">Новые</option>
            <option value="in_review">На проверке</option>
            <option value="returned">Возвраты</option>
            <option value="blocked">Блокеры</option>
            <option value="overdue">Просроченные</option>
          </Select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Механик</span>
          <Select value={filters.mechanic} onChange={(event) => setFilters({ ...filters, mechanic: event.target.value })}>
            <option value="all">Все механики</option>
            {mechanics.map((mechanic) => <option key={mechanic}>{mechanic}</option>)}
          </Select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Дата</span>
          <Input type="date" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Объект</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input className="pl-9" value={filters.object} onChange={(event) => setFilters({ ...filters, object: event.target.value })} placeholder="Адрес или лифт" />
          </div>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Проблемы</span>
          <Select value={filters.problem} onChange={(event) => setFilters({ ...filters, problem: event.target.value as DispatcherFilters["problem"] })}>
            <option value="all">Все</option>
            <option value="photo">Отсутствие фото</option>
            <option value="ai">AI ошибки</option>
            <option value="materials">Материалы</option>
            <option value="signature">Нет подписи</option>
            <option value="returns">Возвраты</option>
            <option value="unconfirmed">Неподтвержденные</option>
          </Select>
        </label>
        <div className="flex items-end">
          <Button type="button" variant="secondary" className="w-full" onClick={() => setFilters({ status: "all", mechanic: "all", date: "", object: "", problem: "all" })}>
            Сбросить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function OperationalTable({ workOrders }: { workOrders: DispatcherWorkOrder[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "submittedAt", desc: true }]);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const selectedId = useDispatcherUiStore((state) => state.selectedId);
  const selectedIds = useDispatcherUiStore((state) => state.selectedIds);
  const setSelectedId = useDispatcherUiStore((state) => state.setSelectedId);
  const toggleSelectedId = useDispatcherUiStore((state) => state.toggleSelectedId);
  const clearSelection = useDispatcherUiStore((state) => state.clearSelection);
  const setReturnPanelOpen = useDispatcherUiStore((state) => state.setReturnPanelOpen);

  const columns = useMemo<ColumnDef<DispatcherWorkOrder>[]>(() => [
    {
      id: "select",
      header: "",
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.original.id)}
          onChange={() => toggleSelectedId(row.original.id)}
          aria-label={`Выбрать ${row.original.number}`}
          className="h-5 w-5 rounded border-slate-600 bg-navy-900 accent-orange-500"
        />
      ),
      size: 44,
    },
    {
      accessorKey: "status",
      header: "Статус",
      cell: ({ row }) => <Badge tone={statusTone(row.original.status)}>{getStatusLabel(row.original.status)}</Badge>,
      size: 136,
    },
    {
      accessorKey: "address",
      header: "Адрес",
      cell: ({ row }) => (
        <button className="max-w-[18rem] truncate text-left font-semibold text-slate-100 hover:text-signal-orange" onClick={() => setSelectedId(row.original.id)}>
          {row.original.address}
        </button>
      ),
      size: 290,
    },
    { accessorKey: "elevatorNumber", header: "Лифт", size: 92 },
    {
      accessorKey: "mechanic",
      header: "Механик",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", row.original.mechanicOnline ? "bg-signal-green" : "bg-slate-600")} />
          {row.original.mechanic}
        </span>
      ),
      size: 180,
    },
    { accessorKey: "workType", header: "Тип", size: 120 },
    { accessorKey: "date", header: "Дата", size: 112 },
    {
      accessorKey: "photos",
      header: "Фото",
      cell: ({ row }) => <Badge tone={photoTone(row.original.photos)}>{row.original.photoCount}/3</Badge>,
      size: 96,
    },
    {
      accessorKey: "signature",
      header: "Подпись",
      cell: ({ row }) => <Badge tone={row.original.signature === "present" ? "success" : "danger"}>{row.original.signature === "present" ? "Есть" : "Нет"}</Badge>,
      size: 112,
    },
    {
      accessorKey: "materialsStatus",
      header: "Материалы",
      cell: ({ row }) => <Badge tone={riskTone(row.original.materialsStatus)}>{row.original.materialsStatus === "ok" ? "OK" : row.original.materialsStatus === "warning" ? "Риск" : "Блок"}</Badge>,
      size: 128,
    },
    {
      accessorKey: "aiStatus",
      header: "AI",
      cell: ({ row }) => <Badge tone={aiTone(row.original.aiStatus)}>{row.original.aiStatus.toUpperCase()}</Badge>,
      size: 92,
    },
    { accessorKey: "remarks", header: "Замечания", size: 112 },
    {
      accessorKey: "dispatcherStatus",
      header: "Диспетчер",
      cell: ({ row }) => <Badge tone="muted">{getDispatcherStatusLabel(row.original.dispatcherStatus)}</Badge>,
      size: 164,
    },
  ], [selectedIds, setSelectedId, toggleSelectedId]);

  const table = useReactTable({
    data: workOrders,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  const rows = table.getRowModel().rows;
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 8,
  });

  return (
    <Card className="overflow-hidden shadow-none">
      <CardHeader className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Операционная очередь заказ-нарядов</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Virtualized grid · sticky columns · realtime updates · batch actions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={selectedIds.length === 0} onClick={() => setReturnPanelOpen(true)}>
            <RotateCcw className="h-4 w-4" /> Вернуть выбранные
          </Button>
          <Button type="button" variant="outline" disabled={selectedIds.length === 0} onClick={clearSelection}>Снять выбор</Button>
        </div>
      </CardHeader>
      <div ref={parentRef} className="h-[32rem] overflow-auto border-t border-slate-800" role="region" aria-label="Операционная таблица заказ-нарядов">
        <table className="min-w-[1260px] border-separate border-spacing-0 text-left text-sm">
          <thead className="sticky top-0 z-20 bg-graphite-950 text-xs uppercase text-slate-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => (
                  <th
                    key={header.id}
                    className={cn(
                      "border-b border-slate-800 px-3 py-3 font-bold",
                      index <= 2 && "sticky z-30 bg-graphite-950",
                      index === 0 && "left-0",
                      index === 1 && "left-11",
                      index === 2 && "left-[11rem]",
                    )}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <button className="inline-flex items-center gap-1" onClick={header.column.getToggleSortingHandler()}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" ? "↑" : header.column.getIsSorted() === "desc" ? "↓" : ""}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "absolute left-0 grid w-full grid-cols-[44px_136px_290px_92px_180px_120px_112px_96px_112px_128px_92px_112px_164px] border-b border-slate-900 bg-navy-950 hover:bg-graphite-950",
                    selectedId === row.original.id && "bg-graphite-900",
                  )}
                  style={{ transform: `translateY(${virtualRow.start}px)`, height: `${virtualRow.size}px` }}
                  onDoubleClick={() => setSelectedId(row.original.id)}
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <td
                      key={cell.id}
                      className={cn(
                        "flex min-h-14 items-center border-r border-slate-900 px-3 text-slate-300",
                        index <= 2 && "sticky z-10 bg-inherit",
                        index === 0 && "left-0",
                        index === 1 && "left-11",
                        index === 2 && "left-[11rem]",
                      )}
                    >
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

function WorkOrderDetailPanel({ workOrder }: { workOrder: DispatcherWorkOrder }) {
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(26rem,0.9fr)]">
      <div className="space-y-3">
        <Card className="shadow-none">
          <CardHeader className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{workOrder.number}</CardTitle>
                <p className="mt-1 text-sm text-slate-400">{workOrder.address} · лифт {workOrder.elevatorNumber}</p>
              </div>
              <Badge tone={statusTone(workOrder.status)}>{getStatusLabel(workOrder.status)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 p-3 sm:grid-cols-2">
            <InfoLine label="Заказчик" value={workOrder.customer} />
            <InfoLine label="Лифт" value={`${workOrder.elevatorNumber} · ${workOrder.elevatorType}`} />
            <InfoLine label="Механик" value={workOrder.mechanic} extra={workOrder.mechanicOnline ? "онлайн" : "офлайн"} />
            <InfoLine label="Тип работ" value={workOrder.workType} />
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="p-3"><CardTitle>Работы</CardTitle></CardHeader>
          <CardContent className="space-y-2 p-3">
            {workOrder.works.map((work) => (
              <div key={work.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-xl border border-slate-800 bg-navy-900 p-3">
                <span className="font-semibold text-slate-100">{work.action} {work.element}</span>
                <Badge tone="muted">{work.quantity}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <MaterialControl materials={workOrder.materials} />
        <AuditTrail auditTrail={workOrder.auditTrail} />
      </div>

      <div className="space-y-3">
        <PhotoEvidencePanel workOrder={workOrder} />
        <AiValidationPanel issues={workOrder.validationIssues} />
        <WorkflowActions workOrder={workOrder} />
      </div>
    </div>
  );
}

function InfoLine({ label, value, extra }: { label: string; value: string; extra?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-navy-900 p-3">
      <div className="text-xs font-bold uppercase text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-100">{value}</div>
      {extra ? <div className="mt-1 text-xs text-signal-green">{extra}</div> : null}
    </div>
  );
}

function PhotoEvidencePanel({ workOrder }: { workOrder: DispatcherWorkOrder }) {
  const compareMode = useDispatcherUiStore((state) => state.compareMode);
  const setCompareMode = useDispatcherUiStore((state) => state.setCompareMode);
  const setFullscreenPhotoId = useDispatcherUiStore((state) => state.setFullscreenPhotoId);

  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center justify-between p-3">
        <div>
          <CardTitle>Фотофиксация</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Installed / removed / document photo</p>
        </div>
        <Button type="button" variant={compareMode ? "primary" : "secondary"} size="sm" onClick={() => setCompareMode(!compareMode)}>
          <Eye className="h-4 w-4" /> Compare
        </Button>
      </CardHeader>
      <CardContent className={cn("grid gap-3 p-3", compareMode ? "md:grid-cols-2" : "md:grid-cols-3")}>
        {workOrder.photoEvidence.map((photo) => (
          <div key={photo.id} className="rounded-xl border border-slate-800 bg-navy-900 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-bold text-slate-100">{photo.label}</span>
              <Badge tone={photoTone(photo.status)}>{photo.status === "complete" ? "OK" : photo.status === "missing" ? "Нет" : photo.status === "uploading" ? "Загрузка" : "Плохо"}</Badge>
            </div>
            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-graphite-950">
              {photo.url ? (
                <img src={photo.url} alt={photo.label} className="h-full w-full object-cover" />
              ) : (
                <div className="text-center text-sm text-slate-500"><Camera className="mx-auto mb-2 h-8 w-8" />Фото отсутствует</div>
              )}
            </div>
            {photo.progress ? <div className="mt-2 h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-signal-orange" style={{ width: `${photo.progress}%` }} /></div> : null}
            {photo.aiMessage ? <p className="mt-2 text-sm text-amber-200">{photo.aiMessage}</p> : null}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button type="button" variant="secondary" size="sm" disabled={!photo.url}><Maximize2 className="h-4 w-4" /> Zoom</Button>
              <Button type="button" variant="outline" size="sm" disabled={!photo.url} onClick={() => setFullscreenPhotoId(photo.id)}>Fullscreen</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AiValidationPanel({ issues }: { issues: ValidationIssue[] }) {
  const grouped = issues.reduce<Record<string, ValidationIssue[]>>((acc, issue) => {
    acc[issue.group] = [...(acc[issue.group] ?? []), issue];
    return acc;
  }, {});

  return (
    <Card className="shadow-none">
      <CardHeader className="p-3">
        <CardTitle>AI validation panel</CardTitle>
        <p className="mt-1 text-sm text-slate-500">Blurry detection · OCR · signature · suspicious write-offs</p>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        {issues.length === 0 ? <Alert tone="success"><CheckCircle2 className="mr-2 inline h-4 w-4" /> Блокирующих AI замечаний нет.</Alert> : null}
        {Object.entries(grouped).map(([group, groupIssues]) => (
          <div key={group} className="rounded-xl border border-slate-800 bg-navy-900 p-3">
            <div className="mb-2 font-bold text-slate-100">{group}</div>
            <div className="space-y-2">
              {groupIssues.map((issue) => (
                <div key={issue.id} className="flex items-start justify-between gap-3 rounded-lg bg-graphite-950 p-2">
                  <div>
                    <Badge tone={issueTone(issue.severity)}>{issue.severity}</Badge>
                    <div className="mt-2 text-sm font-semibold text-slate-100">{issue.title}</div>
                  </div>
                  <Button type="button" variant="outline" size="sm">{issue.action}</Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MaterialControl({ materials }: { materials: MaterialLine[] }) {
  return (
    <Card className="shadow-none">
      <CardHeader className="p-3"><CardTitle>Контроль материалов</CardTitle></CardHeader>
      <CardContent className="space-y-2 p-3">
        {materials.length === 0 ? <Alert tone="info">Материалы не указаны. Проверьте, соответствует ли это типу работ.</Alert> : null}
        {materials.map((material) => (
          <div key={material.id} className="rounded-xl border border-slate-800 bg-navy-900 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold text-slate-100">{material.name}</div>
                <div className="mt-1 text-sm text-slate-500">{material.type} · расход {material.quantity} · норма {material.norm} · склад {material.stock}</div>
              </div>
              <Badge tone={riskTone(material.risk)}>{material.risk === "ok" ? "OK" : material.risk === "warning" ? "Риск" : "Блок"}</Badge>
            </div>
            {material.note ? <Alert tone={material.risk === "blocking" ? "danger" : "warning"} className="mt-3">{material.note}</Alert> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm"><PackageCheck className="h-4 w-4" /> Подтвердить</Button>
              <Button type="button" variant="secondary" size="sm"><ShieldAlert className="h-4 w-4" /> Отклонить материалы</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AuditTrail({ auditTrail }: { auditTrail: AuditEntry[] }) {
  return (
    <Card className="shadow-none">
      <CardHeader className="p-3"><CardTitle>Audit trail</CardTitle></CardHeader>
      <CardContent className="space-y-2 p-3">
        {auditTrail.map((entry) => (
          <div key={entry.id} className="rounded-xl border border-slate-800 bg-navy-900 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-slate-100">{entry.actor}</span>
              <span className="text-xs text-slate-500">{entry.changedAt}</span>
            </div>
            <div className="mt-1 text-slate-500">{entry.role} · {entry.field}</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-graphite-950 p-2"><span className="text-slate-500">Было:</span> {entry.oldValue}</div>
              <div className="rounded-lg bg-graphite-950 p-2"><span className="text-slate-500">Стало:</span> {entry.newValue}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WorkflowActions({ workOrder }: { workOrder: DispatcherWorkOrder }) {
  const queryClient = useQueryClient();
  const setReturnPanelOpen = useDispatcherUiStore((state) => state.setReturnPanelOpen);

  const markApproved = () => {
    queryClient.setQueryData(["dispatcher", "work-orders"], (current: DispatcherWorkOrder[] | undefined) =>
      current?.map((item) => item.id === workOrder.id ? { ...item, status: "approved", dispatcherStatus: "done", remarks: 0 } : item),
    );
  };

  return (
    <Card className="shadow-none">
      <CardHeader className="p-3"><CardTitle>Workflow actions</CardTitle></CardHeader>
      <CardContent className="grid gap-2 p-3 sm:grid-cols-2">
        <Button type="button" onClick={markApproved}><CheckCircle2 className="h-4 w-4" /> Подтвердить</Button>
        <Button type="button" variant="danger" onClick={() => setReturnPanelOpen(true)}><RotateCcw className="h-4 w-4" /> Вернуть</Button>
        <Button type="button" variant="secondary"><MessageSquare className="h-4 w-4" /> Комментарий</Button>
        <Button type="button" variant="secondary"><Camera className="h-4 w-4" /> Повторное фото</Button>
        <Button type="button" variant="outline"><XCircle className="h-4 w-4" /> Отклонить материалы</Button>
        <Button type="button" variant="outline"><UserCheck className="h-4 w-4" /> Назначить проверку</Button>
      </CardContent>
    </Card>
  );
}

function ReturnFlowPanel({ workOrder }: { workOrder?: DispatcherWorkOrder }) {
  const isOpen = useDispatcherUiStore((state) => state.returnPanelOpen);
  const setOpen = useDispatcherUiStore((state) => state.setReturnPanelOpen);
  const [requiredFixes, setRequiredFixes] = useState<string[]>(["photo", "signature"]);

  if (!isOpen) return null;

  const toggleFix = (fix: string) => {
    setRequiredFixes((current) => current.includes(fix) ? current.filter((item) => item !== fix) : [...current, fix]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Возврат заказ-наряда">
      <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-auto rounded-t-2xl border border-slate-800 bg-graphite-900 p-4 shadow-industrial md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-[32rem] md:rounded-none">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-50">Вернуть на доработку</h2>
            <p className="mt-1 text-sm text-slate-400">{workOrder?.number ?? "Выбранные заказ-наряды"}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Закрыть возврат"><X className="h-5 w-5" /></Button>
        </div>

        <div className="space-y-4">
          <label>
            <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Причина</span>
            <Select defaultValue="missing_photo">
              <option value="missing_photo">Отсутствует обязательное фото</option>
              <option value="poor_photo">Плохое качество фото</option>
              <option value="missing_signature">Нет подписи</option>
              <option value="materials_issue">Ошибка материалов</option>
              <option value="ocr_issue">Заказ-наряд не читается</option>
            </Select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Комментарий механику</span>
            <textarea className="min-h-28 w-full rounded-xl border border-slate-700 bg-navy-900 p-3 text-slate-50 outline-none focus:border-signal-orange" defaultValue="Переснять демонтированную деталь и добавить подпись заказчика." />
          </label>
          <div>
            <div className="mb-2 text-xs font-bold uppercase text-slate-500">Обязательные исправления</div>
            <div className="space-y-2">
              {[
                ["photo", "Переснять фото"],
                ["signature", "Добавить подпись"],
                ["materials", "Исправить материалы"],
                ["comment", "Добавить пояснение"],
              ].map(([id, label]) => (
                <label key={id} className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-800 bg-navy-900 px-3">
                  <input type="checkbox" checked={requiredFixes.includes(id)} onChange={() => toggleFix(id)} className="h-5 w-5 accent-orange-500" />
                  <span className="font-semibold text-slate-100">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <Alert tone="info"><Bell className="mr-2 inline h-4 w-4" /> После возврата механик получит push, toast и mobile alert с обязательными исправлениями.</Alert>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Отмена</Button>
            <Button type="button" onClick={() => setOpen(false)}><Send className="h-4 w-4" /> Вернуть</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RealtimeStrip() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-signal-green/30 bg-signal-green/10 p-3 text-sm text-green-100">
      <div className="flex items-center gap-2"><Wifi className="h-4 w-4" /> Realtime stream active · новые заказ-наряды, upload progress, approval sync, online status механиков</div>
      <Badge tone="success">WS connected</Badge>
    </div>
  );
}

function DispatcherWorkspace() {
  const { data = [], isLoading, isError, refetch, isFetching } = useDispatcherWorkOrders();
  const [filters, setFilters] = useState<DispatcherFilters>({ status: "all", mechanic: "all", date: "", object: "", problem: "all" });
  const selectedId = useDispatcherUiStore((state) => state.selectedId);
  const setSelectedId = useDispatcherUiStore((state) => state.setSelectedId);

  const mechanics = useMemo<string[]>(() => Array.from(new Set(data.map((item) => item.mechanic))), [data]);
  const filtered = useMemo(() => data.filter((item) => {
    const statusMatch = filters.status === "all" || item.status === filters.status;
    const mechanicMatch = filters.mechanic === "all" || item.mechanic === filters.mechanic;
    const dateMatch = !filters.date || item.date.split(".").reverse().join("-") === filters.date;
    const objectMatch = !filters.object || `${item.address} ${item.elevatorNumber}`.toLowerCase().includes(filters.object.toLowerCase());
    const problemMatch =
      filters.problem === "all" ||
      (filters.problem === "photo" && item.photos !== "complete") ||
      (filters.problem === "ai" && item.aiStatus !== "ok") ||
      (filters.problem === "materials" && item.materialsStatus !== "ok") ||
      (filters.problem === "signature" && item.signature === "missing") ||
      (filters.problem === "returns" && item.status === "returned") ||
      (filters.problem === "unconfirmed" && item.status !== "approved");
    return statusMatch && mechanicMatch && dateMatch && objectMatch && problemMatch;
  }), [data, filters]);

  const selected = data.find((item) => item.id === selectedId) ?? filtered[0];

  if (isLoading) {
    return <main className="min-h-screen bg-navy-950 p-4 text-slate-100"><div className="mx-auto max-w-7xl space-y-4"><div className="h-24 animate-pulse rounded-2xl bg-graphite-900" /><div className="h-[32rem] animate-pulse rounded-2xl bg-graphite-900" /></div></main>;
  }

  if (isError) {
    return <main className="min-h-screen bg-navy-950 p-4 text-slate-100"><Alert tone="danger">Не удалось загрузить очередь диспетчера.</Alert></main>;
  }

  return (
    <main className="min-h-screen bg-navy-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-navy-950/95 px-3 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-50 md:text-2xl">Диспетчерский центр НеоЛифт</h1>
            <p className="mt-1 text-sm text-slate-500">Operational dispatch workspace · проверка заказ-нарядов · фото · материалы · audit</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} /> Обновить</Button>
            <Button type="button"><ClipboardCheck className="h-4 w-4" /> Моя очередь</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-4 px-3 py-4">
        <RealtimeStrip />
        <KpiBar workOrders={data} />
        <FiltersPanel filters={filters} setFilters={setFilters} mechanics={mechanics} />
        {filtered.length === 0 ? (
          <Card className="shadow-none"><CardContent className="p-8 text-center text-slate-400">Очередь пуста по выбранным фильтрам.</CardContent></Card>
        ) : (
          <OperationalTable workOrders={filtered} />
        )}
        {selected ? (
          <section className="space-y-3" aria-label="Split-view карточка заказ-наряда">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-slate-50">Split-view проверка</h2>
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedId(selected.id)}><FileText className="h-4 w-4" /> {selected.number}</Button>
            </div>
            <WorkOrderDetailPanel workOrder={selected} />
          </section>
        ) : null}
      </div>
      <ReturnFlowPanel workOrder={selected} />
    </main>
  );
}

export function DispatcherWorkflowModule() {
  return (
    <QueryClientProvider client={queryClient}>
      <DispatcherWorkspace />
    </QueryClientProvider>
  );
}
