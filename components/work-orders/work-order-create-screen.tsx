"use client";

import { ChangeEvent, PointerEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  ChevronDown,
  ClipboardCheck,
  CloudOff,
  FileSignature,
  Loader2,
  Minus,
  PackageSearch,
  PenLine,
  Plus,
  Save,
  Send,
  Trash2,
  Wifi,
  X,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type WorkOrderStatus = "draft" | "filled" | "queued" | "submitted" | "error";
type AutosaveState = "saved" | "saving" | "offline" | "error";
type ValidationSeverity = "blocking" | "warning";
type PhotoType = "installed" | "removed" | "document";

type WorkItem = {
  id: string;
  action: string;
  element: string;
  quantity: number;
  expanded: boolean;
};

type MaterialItem = {
  id: string;
  name: string;
  type: string;
  quantity: number;
  stock: number;
};

type PhotoItem = {
  type: PhotoType;
  label: string;
  required: boolean;
  previewUrl?: string;
  fileName?: string;
  progress: number;
  aiStatus: "missing" | "uploading" | "checking" | "ok" | "warning" | "error";
  aiMessage?: string;
};

type ValidationIssue = {
  id: string;
  severity: ValidationSeverity;
  section: "works" | "materials" | "photos" | "signature" | "general";
  message: string;
};

type ToastMessage = {
  id: string;
  tone: "success" | "warning" | "danger" | "info";
  text: string;
};

const workTemplates = [
  { action: "Замена", element: "кнопок вызова", quantity: 1 },
  { action: "Регулировка", element: "дверей кабины", quantity: 1 },
  { action: "Замена", element: "роликов дверей", quantity: 2 },
  { action: "Замена", element: "контакта ДК", quantity: 1 },
  { action: "Проверка", element: "цепи безопасности", quantity: 1 },
  { action: "Очистка", element: "поста приказов", quantity: 1 },
];

const materialSuggestions = [
  { name: "Кнопка вызова КВ-12", type: "Электрика", stock: 8 },
  { name: "Ролик двери D45", type: "Механика", stock: 12 },
  { name: "Контакт ДК-1", type: "Электрика", stock: 5 },
  { name: "Лампа LED 24В", type: "Освещение", stock: 3 },
  { name: "Смазка направляющих", type: "Расходник", stock: 2 },
];

const initialPhotos: PhotoItem[] = [
  { type: "installed", label: "Установленная деталь", required: true, progress: 0, aiStatus: "missing" },
  { type: "removed", label: "Демонтированная деталь", required: true, progress: 0, aiStatus: "missing" },
  { type: "document", label: "Заказ-наряд", required: true, progress: 0, aiStatus: "missing" },
];

const objectInfo = {
  customer: "УК Северный квартал",
  address: "Москва, ул. Полярная, 18к2",
  entrance: "3",
  elevatorNumber: "Л-0427",
  date: "08.05.2026",
  mechanic: "Иван Петров",
  workType: "Ремонт",
};

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function validateOrder(workItems: WorkItem[], materials: MaterialItem[], photos: PhotoItem[], hasSignature: boolean): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (workItems.length === 0) {
    issues.push({ id: "works-empty", severity: "blocking", section: "works", message: "Добавьте минимум одну выполненную работу." });
  }

  workItems.forEach((item) => {
    if (!item.action.trim() || !item.element.trim()) {
      issues.push({ id: `work-${item.id}`, severity: "blocking", section: "works", message: "В работе должен быть указан тип действия и элемент." });
    }
    if (item.quantity <= 0) {
      issues.push({ id: `work-qty-${item.id}`, severity: "blocking", section: "works", message: "Количество работы должно быть больше нуля." });
    }
  });

  materials.forEach((material) => {
    if (material.quantity <= 0) {
      issues.push({ id: `material-qty-${material.id}`, severity: "blocking", section: "materials", message: "Количество материала должно быть больше нуля." });
    }
    if (material.quantity > material.stock) {
      issues.push({ id: `material-stock-${material.id}`, severity: "warning", section: "materials", message: `${material.name}: расход выше остатка на складе механика.` });
    }
  });

  photos.filter((photo) => photo.required).forEach((photo) => {
    if (!photo.previewUrl) {
      issues.push({ id: `photo-${photo.type}`, severity: "blocking", section: "photos", message: `Отсутствует обязательное фото: ${photo.label}.` });
    }
    if (photo.aiStatus === "error") {
      issues.push({ id: `photo-ai-${photo.type}`, severity: "blocking", section: "photos", message: photo.aiMessage ?? `${photo.label}: фото не прошло AI-проверку.` });
    }
    if (photo.aiStatus === "warning") {
      issues.push({ id: `photo-ai-warning-${photo.type}`, severity: "warning", section: "photos", message: photo.aiMessage ?? `${photo.label}: качество фото среднее.` });
    }
  });

  if (!hasSignature) {
    issues.push({ id: "signature-missing", severity: "blocking", section: "signature", message: "Подпись заказчика отсутствует." });
  }

  return issues;
}

function SectionHeader({ title, subtitle, icon, count, open, onToggle }: { title: string; subtitle: string; icon: ReactNode; count?: string; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="flex min-h-16 w-full items-center justify-between gap-3 text-left" aria-expanded={open}>
      <span className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-signal-orange/15 text-signal-orange">{icon}</span>
        <span>
          <span className="block text-base font-bold text-slate-50">{title}</span>
          <span className="block text-sm text-slate-400">{subtitle}</span>
        </span>
      </span>
      <span className="flex items-center gap-2">
        {count ? <Badge tone="muted">{count}</Badge> : null}
        <ChevronDown className={cn("h-5 w-5 text-slate-400 transition", open && "rotate-180")} aria-hidden="true" />
      </span>
    </button>
  );
}

function Field({ label, value, readOnly = true }: { label: string; value: string; readOnly?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <Input
        value={readOnly ? value : undefined}
        defaultValue={readOnly ? undefined : value}
        readOnly={readOnly}
        aria-label={label}
        className={readOnly ? "border-slate-800 bg-graphite-950 text-slate-300" : undefined}
      />
    </label>
  );
}

function ToastStack({ toasts, dismiss }: { toasts: ToastMessage[]; dismiss: (id: string) => void }) {
  return (
    <div className="fixed right-3 top-24 z-50 flex w-[calc(100vw-1.5rem)] max-w-sm flex-col gap-2 sm:right-5" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-700 bg-graphite-900 p-3 text-sm text-slate-100 shadow-industrial">
          <span>{toast.text}</span>
          <button className="min-h-8 min-w-8 text-slate-400" onClick={() => dismiss(toast.id)} aria-label="Закрыть уведомление">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function WorkOrderCreateScreen() {
  const [status, setStatus] = useState<WorkOrderStatus>("draft");
  const [isOffline, setIsOffline] = useState(true);
  const [autosave, setAutosave] = useState<AutosaveState>("saved");
  const [isLoading, setIsLoading] = useState(false);
  const [openSections, setOpenSections] = useState({ general: true, works: true, materials: true, photos: true, signature: true, validation: true });
  const [workItems, setWorkItems] = useState<WorkItem[]>([{ id: "work-1", action: "Регулировка", element: "дверей кабины", quantity: 1, expanded: false }]);
  const [materials, setMaterials] = useState<MaterialItem[]>([{ id: "mat-1", name: "Ролик двери D45", type: "Механика", quantity: 2, stock: 12 }]);
  const [materialSearch, setMaterialSearch] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos);
  const [signatureSaved, setSignatureSaved] = useState(false);
  const [signatureDirty, setSignatureDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  const validationIssues = useMemo(() => validateOrder(workItems, materials, photos, signatureSaved), [workItems, materials, photos, signatureSaved]);
  const blockingIssues = validationIssues.filter((issue) => issue.severity === "blocking");
  const warningIssues = validationIssues.filter((issue) => issue.severity === "warning");

  useEffect(() => {
    if (autosave === "saving") {
      const timeout = window.setTimeout(() => setAutosave(isOffline ? "offline" : "saved"), 650);
      return () => window.clearTimeout(timeout);
    }
  }, [autosave, isOffline]);

  const queueAutosave = () => {
    setAutosave("saving");
  };

  const showToast = (text: string, tone: ToastMessage["tone"] = "info") => {
    const id = createId("toast");
    setToasts((current) => [...current, { id, text, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4200);
  };

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((current) => ({ ...current, [key]: !current[key] }));
  };

  const applyTemplate = (template: (typeof workTemplates)[number]) => {
    setWorkItems((current) => [...current, { id: createId("work"), ...template, expanded: true }]);
    queueAutosave();
    showToast("Работа добавлена из шаблона", "success");
  };

  const updateWork = (id: string, patch: Partial<WorkItem>) => {
    setWorkItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    queueAutosave();
  };

  const removeWork = (id: string) => {
    setWorkItems((current) => current.filter((item) => item.id !== id));
    queueAutosave();
  };

  const addEmptyWork = () => {
    setWorkItems((current) => [...current, { id: createId("work"), action: "", element: "", quantity: 1, expanded: true }]);
    queueAutosave();
  };

  const addMaterial = (suggestion: (typeof materialSuggestions)[number]) => {
    setMaterials((current) => {
      const existing = current.find((item) => item.name === suggestion.name);
      if (existing) {
        return current.map((item) => (item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...current, { id: createId("mat"), name: suggestion.name, type: suggestion.type, quantity: 1, stock: suggestion.stock }];
    });
    setMaterialSearch("");
    queueAutosave();
  };

  const updateMaterial = (id: string, quantity: number) => {
    setMaterials((current) => current.map((item) => (item.id === id ? { ...item, quantity } : item)));
    queueAutosave();
  };

  const removeMaterial = (id: string) => {
    setMaterials((current) => current.filter((item) => item.id !== id));
    queueAutosave();
  };

  const handlePhotoChange = (type: PhotoType, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPhotos((current) => current.map((photo) => (photo.type === type ? { ...photo, previewUrl, fileName: file.name, progress: 24, aiStatus: "uploading", aiMessage: undefined } : photo)));
    queueAutosave();

    const progressSteps = [48, 76, 100];
    progressSteps.forEach((progress, index) => {
      window.setTimeout(() => {
        setPhotos((current) => current.map((photo) => (photo.type === type ? { ...photo, progress, aiStatus: progress === 100 ? "checking" : "uploading" } : photo)));
      }, 350 * (index + 1));
    });

    window.setTimeout(() => {
      setPhotos((current) =>
        current.map((photo) => {
          if (photo.type !== type) return photo;
          if (type === "document" && file.name.toLowerCase().includes("blur")) {
            return { ...photo, aiStatus: "error", aiMessage: "Заказ-наряд не читается: переснимите ближе и без бликов." };
          }
          return { ...photo, aiStatus: "ok", aiMessage: "AI-проверка: качество достаточно для офиса." };
        }),
      );
      showToast("Фото сохранено и проверено", "success");
    }, 1500);
  };

  const removePhoto = (type: PhotoType) => {
    setPhotos((current) => current.map((photo) => (photo.type === type ? { ...photo, previewUrl: undefined, fileName: undefined, progress: 0, aiStatus: "missing", aiMessage: undefined } : photo)));
    queueAutosave();
  };

  const getCanvasPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * canvas.width) / rect.width,
      y: ((event.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    isDrawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    const point = getCanvasPoint(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    setSignatureDirty(true);
  };

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const point = getCanvasPoint(event);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDirty(false);
    setSignatureSaved(false);
    queueAutosave();
  };

  const saveSignature = () => {
    if (!signatureDirty) {
      showToast("Подпись пустая. Попросите заказчика расписаться в поле.", "warning");
      return;
    }
    setSignatureSaved(true);
    queueAutosave();
    showToast("Подпись заказчика сохранена", "success");
  };

  const saveDraft = () => {
    setStatus("draft");
    setAutosave(isOffline ? "offline" : "saved");
    showToast(isOffline ? "Черновик сохранен на устройстве" : "Черновик сохранен", "success");
  };

  const submitOrder = () => {
    if (blockingIssues.length > 0) {
      setOpenSections((current) => ({ ...current, validation: true }));
      showToast(`Исправьте блокирующие ошибки: ${blockingIssues.length}`, "danger");
      return;
    }

    setIsSubmitting(true);
    setStatus(isOffline ? "queued" : "filled");
    window.setTimeout(() => {
      setIsSubmitting(false);
      setStatus(isOffline ? "queued" : "submitted");
      showToast(isOffline ? "Заказ-наряд поставлен в очередь отправки" : "Заказ-наряд отправлен диспетчеру", "success");
    }, 900);
  };

  const simulateLoad = () => {
    setIsLoading(true);
    window.setTimeout(() => setIsLoading(false), 900);
  };

  const filteredMaterials = materialSuggestions.filter((item) => item.name.toLowerCase().includes(materialSearch.toLowerCase()) || item.type.toLowerCase().includes(materialSearch.toLowerCase()));

  if (isLoading) {
    return (
      <main className="min-h-screen bg-navy-950 p-4 text-slate-100">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="h-24 animate-pulse rounded-2xl bg-graphite-900" />
          <div className="h-48 animate-pulse rounded-2xl bg-graphite-900" />
          <div className="h-72 animate-pulse rounded-2xl bg-graphite-900" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-navy-950 pb-36 text-slate-100">
      <ToastStack toasts={toasts} dismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      <header className="sticky top-0 z-40 border-b border-slate-800 bg-navy-950/95 px-3 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-black text-slate-50 sm:text-xl">Создание заказ-наряда</h1>
              <Badge tone={status === "queued" ? "warning" : status === "submitted" ? "success" : "default"}>{status === "queued" ? "В очереди" : status === "submitted" ? "Отправлен" : "Черновик"}</Badge>
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-slate-300">{objectInfo.address}</p>
            <p className="text-xs text-slate-500">Лифт {objectInfo.elevatorNumber} · {objectInfo.workType}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <button type="button" onClick={() => setIsOffline((value) => !value)} className="min-h-10 rounded-xl border border-slate-700 bg-graphite-900 px-3 text-xs font-bold text-slate-100" aria-label="Переключить демонстрационный статус сети">
              {isOffline ? <CloudOff className="mr-1 inline h-4 w-4 text-signal-amber" /> : <Wifi className="mr-1 inline h-4 w-4 text-signal-green" />}
              {isOffline ? "Офлайн" : "Онлайн"}
            </button>
            <Badge tone={autosave === "error" ? "danger" : autosave === "saving" ? "warning" : autosave === "offline" ? "warning" : "success"}>
              {autosave === "saving" ? "Автосохранение…" : autosave === "offline" ? "Сохранено локально" : autosave === "error" ? "Ошибка save" : "Сохранено"}
            </Badge>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-4 px-3 py-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          {isOffline ? (
            <Alert tone="warning" className="flex items-start gap-3">
              <CloudOff className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <strong>Офлайн-режим.</strong> Черновик, фото и подпись сохраняются на устройстве. Отправка уйдет в очередь синхронизации.
              </div>
            </Alert>
          ) : null}

          <Card>
            <CardHeader>
              <SectionHeader title="Общая информация" subtitle="Проверка объекта и лифта" icon={<ClipboardCheck className="h-5 w-5" />} open={openSections.general} onToggle={() => toggleSection("general")} />
            </CardHeader>
            {openSections.general ? (
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Field label="Заказчик" value={objectInfo.customer} />
                <Field label="Дата" value={objectInfo.date} />
                <Field label="Адрес" value={objectInfo.address} />
                <Field label="Подъезд" value={objectInfo.entrance} />
                <Field label="Номер лифта" value={objectInfo.elevatorNumber} />
                <Field label="Механик" value={objectInfo.mechanic} />
              </CardContent>
            ) : null}
          </Card>

          <Card>
            <CardHeader>
              <SectionHeader title="Работы" subtitle="Действие, элемент, количество" icon={<PenLine className="h-5 w-5" />} count={`${workItems.length}`} open={openSections.works} onToggle={() => toggleSection("works")} />
            </CardHeader>
            {openSections.works ? (
              <CardContent className="space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Быстрые шаблоны работ">
                  {workTemplates.map((template) => (
                    <Button key={`${template.action}-${template.element}`} type="button" variant="outline" size="sm" className="shrink-0" onClick={() => applyTemplate(template)}>
                      {template.action} {template.element}
                    </Button>
                  ))}
                </div>

                <div className="space-y-3">
                  {workItems.map((item, index) => (
                    <div key={item.id} className="rounded-2xl border border-slate-800 bg-navy-900 p-3">
                      <button type="button" className="flex min-h-12 w-full items-center justify-between gap-3 text-left" onClick={() => updateWork(item.id, { expanded: !item.expanded })} aria-expanded={item.expanded}>
                        <span>
                          <span className="block font-bold text-slate-100">Работа {index + 1}: {item.action || "тип"} {item.element || "элемент"}</span>
                          <span className="text-sm text-slate-500">Количество: {item.quantity}</span>
                        </span>
                        <ChevronDown className={cn("h-5 w-5 text-slate-400 transition", item.expanded && "rotate-180")} />
                      </button>

                      {item.expanded ? (
                        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                          <label>
                            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Тип действия</span>
                            <Select value={item.action} onChange={(event) => updateWork(item.id, { action: event.target.value })} aria-label="Тип действия работы">
                              <option value="">Выберите</option>
                              <option>Замена</option>
                              <option>Регулировка</option>
                              <option>Проверка</option>
                              <option>Очистка</option>
                              <option>Ремонт</option>
                            </Select>
                          </label>
                          <label>
                            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Элемент</span>
                            <Input list="work-elements" value={item.element} onChange={(event) => updateWork(item.id, { element: event.target.value })} placeholder="Например: двери кабины" aria-label="Элемент работы" />
                          </label>
                          <div>
                            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Кол-во</span>
                            <div className="flex items-center gap-2">
                              <Button type="button" variant="secondary" size="icon" onClick={() => updateWork(item.id, { quantity: Math.max(1, item.quantity - 1) })} aria-label="Уменьшить количество работы"><Minus className="h-5 w-5" /></Button>
                              <Input className="w-20 text-center" type="number" min={1} value={item.quantity} onChange={(event) => updateWork(item.id, { quantity: Number(event.target.value) })} aria-label="Количество работы" />
                              <Button type="button" variant="secondary" size="icon" onClick={() => updateWork(item.id, { quantity: item.quantity + 1 })} aria-label="Увеличить количество работы"><Plus className="h-5 w-5" /></Button>
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeWork(item.id)} aria-label="Удалить работу"><Trash2 className="h-5 w-5 text-red-300" /></Button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
                <datalist id="work-elements">
                  <option value="дверей кабины" />
                  <option value="роликов дверей" />
                  <option value="кнопок вызова" />
                  <option value="контакта ДК" />
                  <option value="цепи безопасности" />
                </datalist>
                <Button type="button" className="w-full" size="lg" onClick={addEmptyWork}><Plus className="h-5 w-5" /> Добавить работу</Button>
              </CardContent>
            ) : null}
          </Card>

          <Card>
            <CardHeader>
              <SectionHeader title="Материалы" subtitle="Списание после подтверждения офисом" icon={<PackageSearch className="h-5 w-5" />} count={`${materials.length}`} open={openSections.materials} onToggle={() => toggleSection("materials")} />
            </CardHeader>
            {openSections.materials ? (
              <CardContent className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Поиск материала</span>
                  <Input value={materialSearch} onChange={(event) => setMaterialSearch(event.target.value)} placeholder="Кнопка, ролик, контакт…" aria-label="Поиск материала" />
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {filteredMaterials.map((suggestion) => (
                    <button key={suggestion.name} type="button" onClick={() => addMaterial(suggestion)} className="min-h-16 rounded-xl border border-slate-800 bg-navy-900 p-3 text-left transition hover:border-signal-orange/60">
                      <span className="block font-semibold text-slate-100">{suggestion.name}</span>
                      <span className="text-sm text-slate-500">{suggestion.type} · остаток {suggestion.stock}</span>
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {materials.map((material) => (
                    <div key={material.id} className="grid gap-3 rounded-2xl border border-slate-800 bg-navy-900 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <div className="font-bold text-slate-100">{material.name}</div>
                        <div className="text-sm text-slate-500">{material.type} · остаток на складе: {material.stock}</div>
                        {material.quantity > material.stock ? <Badge tone="warning" className="mt-2">Недостаточный остаток</Badge> : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="secondary" size="icon" onClick={() => updateMaterial(material.id, Math.max(1, material.quantity - 1))} aria-label="Уменьшить количество материала"><Minus className="h-5 w-5" /></Button>
                        <Input className="w-20 text-center" type="number" min={1} value={material.quantity} onChange={(event) => updateMaterial(material.id, Number(event.target.value))} aria-label="Количество материала" />
                        <Button type="button" variant="secondary" size="icon" onClick={() => updateMaterial(material.id, material.quantity + 1)} aria-label="Увеличить количество материала"><Plus className="h-5 w-5" /></Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeMaterial(material.id)} aria-label="Удалить материал"><Trash2 className="h-5 w-5 text-red-300" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            ) : null}
          </Card>

          <Card>
            <CardHeader>
              <SectionHeader title="Фотофиксация" subtitle="3 обязательных категории" icon={<Camera className="h-5 w-5" />} count={`${photos.filter((photo) => photo.previewUrl).length}/3`} open={openSections.photos} onToggle={() => toggleSection("photos")} />
            </CardHeader>
            {openSections.photos ? (
              <CardContent className="grid gap-3 md:grid-cols-3">
                {photos.map((photo) => (
                  <div key={photo.type} className="rounded-2xl border border-slate-800 bg-navy-900 p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-100">{photo.label}</h3>
                      <Badge tone={photo.aiStatus === "ok" ? "success" : photo.aiStatus === "error" ? "danger" : photo.aiStatus === "warning" ? "warning" : photo.aiStatus === "missing" ? "danger" : "info"}>
                        {photo.aiStatus === "missing" ? "Нет фото" : photo.aiStatus === "uploading" ? "Загрузка" : photo.aiStatus === "checking" ? "AI" : photo.aiStatus === "ok" ? "OK" : "Ошибка"}
                      </Badge>
                    </div>
                    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-700 bg-graphite-950">
                      {photo.previewUrl ? <img src={photo.previewUrl} alt={`Превью: ${photo.label}`} className="h-full w-full object-cover" /> : <Camera className="h-10 w-10 text-slate-600" aria-hidden="true" />}
                    </div>
                    {photo.progress > 0 && photo.progress < 100 ? <Progress value={photo.progress} className="mt-3" /> : null}
                    {photo.aiMessage ? <p className={cn("mt-2 text-sm", photo.aiStatus === "error" ? "text-red-200" : "text-green-200")}>{photo.aiMessage}</p> : null}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-signal-orange px-3 text-sm font-bold text-black">
                        <Camera className="h-4 w-4" /> Камера
                        <input className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => handlePhotoChange(photo.type, event)} />
                      </label>
                      <label className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl bg-graphite-800 px-3 text-sm font-bold text-slate-100">
                        Галерея
                        <input className="sr-only" type="file" accept="image/*" onChange={(event) => handlePhotoChange(photo.type, event)} />
                      </label>
                    </div>
                    {photo.previewUrl ? <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => removePhoto(photo.type)}><Trash2 className="h-4 w-4" /> Удалить фото</Button> : null}
                  </div>
                ))}
              </CardContent>
            ) : null}
          </Card>

          <Card>
            <CardHeader>
              <SectionHeader title="Подпись заказчика" subtitle="Touch canvas для телефона" icon={<FileSignature className="h-5 w-5" />} count={signatureSaved ? "Есть" : "Нет"} open={openSections.signature} onToggle={() => toggleSection("signature")} />
            </CardHeader>
            {openSections.signature ? (
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Подписант" value="Алексей Смирнов" readOnly={false} />
                  <Field label="Должность" value="Представитель заказчика" readOnly={false} />
                </div>
                <div className="rounded-2xl border border-slate-700 bg-white/95 p-2">
                  <canvas ref={canvasRef} width={720} height={220} className="h-52 w-full rounded-xl bg-slate-50" aria-label="Поле подписи заказчика" onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerCancel={stopDrawing} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="secondary" size="lg" onClick={clearSignature}>Очистить</Button>
                  <Button type="button" size="lg" onClick={saveSignature}><Check className="h-5 w-5" /> Сохранить подпись</Button>
                </div>
              </CardContent>
            ) : null}
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <SectionHeader title="AI-проверка" subtitle="Блокирующие ошибки и предупреждения" icon={<AlertTriangle className="h-5 w-5" />} count={`${blockingIssues.length}/${warningIssues.length}`} open={openSections.validation} onToggle={() => toggleSection("validation")} />
            </CardHeader>
            {openSections.validation ? (
              <CardContent className="space-y-3">
                {blockingIssues.length === 0 ? <Alert tone="success"><Check className="mr-2 inline h-4 w-4" /> Блокирующих ошибок нет. Можно отправить после синхронизации.</Alert> : null}
                {blockingIssues.map((issue) => <Alert key={issue.id} tone="danger">{issue.message}</Alert>)}
                {warningIssues.map((issue) => <Alert key={issue.id} tone="warning">{issue.message}</Alert>)}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-navy-900 p-3"><div className="text-slate-500">Работы</div><div className="font-bold">{workItems.length}</div></div>
                  <div className="rounded-xl bg-navy-900 p-3"><div className="text-slate-500">Фото</div><div className="font-bold">{photos.filter((photo) => photo.previewUrl).length}/3</div></div>
                  <div className="rounded-xl bg-navy-900 p-3"><div className="text-slate-500">Подпись</div><div className="font-bold">{signatureSaved ? "Есть" : "Нет"}</div></div>
                  <div className="rounded-xl bg-navy-900 p-3"><div className="text-slate-500">Сеть</div><div className="font-bold">{isOffline ? "Офлайн" : "Онлайн"}</div></div>
                </div>
                <Button type="button" variant="outline" className="w-full" onClick={simulateLoad}>Проверить заново</Button>
              </CardContent>
            ) : null}
          </Card>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-navy-950/95 px-3 py-3 shadow-2xl backdrop-blur safe-bottom">
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-2">
          <Button type="button" variant="secondary" size="lg" onClick={saveDraft} className="px-2 text-xs sm:text-sm"><Save className="h-5 w-5" /> <span className="hidden sm:inline">Сохранить</span><span className="sm:hidden">Черновик</span></Button>
          <Button type="button" variant="outline" size="lg" onClick={() => showToast("Можно закрыть экран: черновик останется на устройстве", "info")} className="px-2 text-xs sm:text-sm">Позже</Button>
          <Button type="button" size="lg" onClick={submitOrder} disabled={isSubmitting} className="px-2 text-xs sm:text-sm">
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {blockingIssues.length > 0 ? `Ошибки ${blockingIssues.length}` : isOffline ? "В очередь" : "Отправить"}
          </Button>
        </div>
      </div>
    </main>
  );
}
