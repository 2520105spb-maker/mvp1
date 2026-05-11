"use client";

import { ReactNode, useMemo } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { create } from "zustand";
import {
  AlertTriangle,
  ArchiveRestore,
  Bot,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Database,
  FileArchive,
  FileSpreadsheet,
  Gauge,
  GitMerge,
  History,
  Layers3,
  ListChecks,
  Loader2,
  LockKeyhole,
  PackageCheck,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  SearchCheck,
  ServerCog,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IMPORT_JOBS, IMPORT_TEMPLATES, MDM_REFERENCES, PIPELINE_STEPS, QUEUE_WORKERS } from "@/lib/imports/import-center-data";
import type { ImportEntityType, ImportJob, ImportMapping, ImportPreviewRecord, ImportStage } from "@/lib/imports/types";

type ImportCenterState = {
  selectedJobId: string;
  activeStage: ImportStage;
  activeEntityType: ImportEntityType;
  mdmMode: boolean;
  setSelectedJob: (jobId: string) => void;
  setStage: (stage: ImportStage) => void;
  setEntityType: (entityType: ImportEntityType) => void;
  toggleMdmMode: () => void;
};

const stageOrder: ImportStage[] = ["upload", "mapping", "validation", "preview", "import", "report"];

const stageLabels: Record<ImportStage, string> = {
  upload: "Upload",
  mapping: "Mapping",
  validation: "Validation",
  preview: "Preview",
  import: "Import",
  report: "Report",
};

const entityLabels: Record<ImportEntityType, string> = {
  elevators: "Лифты",
  objects: "Объекты",
  warehouse: "Склад",
  customers: "Заказчики",
  users: "Пользователи",
  contracts: "Договоры",
  mdm: "MDM справочники",
};

const entityDescriptions: Record<ImportEntityType, string> = {
  elevators: "Паспорта, заводские номера, производители, типы, объекты и договоры обслуживания.",
  objects: "Адреса, подъезды, заказчики, SLA, типы обслуживания и региональные зоны.",
  warehouse: "Материалы, остатки, склады, артикулы, категории, поставщики и ячейки хранения.",
  customers: "Контрагенты, реквизиты, контакты, договорные отношения и SLA профили.",
  users: "Пользователи, роли, подразделения, территории, статусы и object access.",
  contracts: "Договоры, тарифы, SLA, приложения, объекты и финансовые условия.",
  mdm: "Производители, типы лифтов, материалы, узлы, категории аварий и SLA справочники.",
};

const useImportCenterStore = create<ImportCenterState>((set) => ({
  selectedJobId: IMPORT_JOBS[0].id,
  activeStage: IMPORT_JOBS[0].stage,
  activeEntityType: IMPORT_JOBS[0].entityType,
  mdmMode: false,
  setSelectedJob: (jobId) => {
    const job = IMPORT_JOBS.find((candidate) => candidate.id === jobId) ?? IMPORT_JOBS[0];
    set({ selectedJobId: job.id, activeStage: job.stage, activeEntityType: job.entityType, mdmMode: false });
  },
  setStage: (activeStage) => set({ activeStage }),
  setEntityType: (activeEntityType) => set({ activeEntityType }),
  toggleMdmMode: () => set((state) => ({ mdmMode: !state.mdmMode })),
}));

const queryClient = new QueryClient();

export function ImportMigrationCenter() {
  return (
    <QueryClientProvider client={queryClient}>
      <ImportMigrationCenterInner />
    </QueryClientProvider>
  );
}

function ImportMigrationCenterInner() {
  const selectedJobId = useImportCenterStore((state) => state.selectedJobId);
  const activeStage = useImportCenterStore((state) => state.activeStage);
  const activeEntityType = useImportCenterStore((state) => state.activeEntityType);
  const mdmMode = useImportCenterStore((state) => state.mdmMode);
  const setStage = useImportCenterStore((state) => state.setStage);
  const setEntityType = useImportCenterStore((state) => state.setEntityType);
  const toggleMdmMode = useImportCenterStore((state) => state.toggleMdmMode);
  const { data: jobs = [] } = useQuery({ queryKey: ["import-jobs"], queryFn: async () => IMPORT_JOBS });
  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? IMPORT_JOBS[0];

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-400/40 bg-orange-500/15 text-orange-300">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">enterprise migration center</p>
                <h1 className="text-2xl font-black tracking-tight text-white">Import, Migration & Master Data</h1>
              </div>
            </div>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
              Production onboarding workspace для массовой загрузки лифтов, объектов, материалов, складских остатков, заказчиков, пользователей и договоров с mapping, validation, deduplication, rollback и MDM governance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-emerald-400/30 bg-emerald-500/10 text-emerald-200"><ShieldCheck className="h-3 w-3" /> secure upload</Badge>
            <Badge className="border-orange-400/30 bg-orange-500/10 text-orange-200"><Loader2 className="h-3 w-3 animate-spin" /> live queues</Badge>
            <Button variant="secondary" onClick={toggleMdmMode}><Layers3 className="h-4 w-4" /> {mdmMode ? "Import workspace" : "MDM workspace"}</Button>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-112px)] grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)_380px]">
        <LeftOperationsPanel jobs={jobs} activeEntityType={activeEntityType} onEntityTypeChange={setEntityType} />
        <section className="min-w-0 border-slate-800 p-4 lg:border-l lg:p-6">
          {mdmMode ? <MdmWorkspace /> : <ImportWorkspace job={selectedJob} activeStage={activeStage} onStageChange={setStage} />}
        </section>
        <RightIntelligencePanel job={selectedJob} />
      </div>
    </main>
  );
}

function LeftOperationsPanel({ jobs, activeEntityType, onEntityTypeChange }: { jobs: ImportJob[]; activeEntityType: ImportEntityType; onEntityTypeChange: (type: ImportEntityType) => void }) {
  const setSelectedJob = useImportCenterStore((state) => state.setSelectedJob);
  const selectedJobId = useImportCenterStore((state) => state.selectedJobId);
  const importTypes = Object.keys(entityLabels) as ImportEntityType[];

  return (
    <aside className="space-y-4 border-b border-slate-800 bg-slate-950/45 p-4 lg:border-b-0">
      <PanelBlock title="Типы импорта" icon={<FileSpreadsheet className="h-4 w-4" />}>
        <div className="grid gap-2">
          {importTypes.map((type) => (
            <button key={type} onClick={() => onEntityTypeChange(type)} className={cn("rounded-2xl border p-3 text-left text-sm transition", activeEntityType === type ? "border-orange-400/60 bg-orange-500/10 text-orange-100" : "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white")}>
              <span className="block font-semibold">{entityLabels[type]}</span>
              <span className="mt-1 block text-xs text-slate-500">{entityDescriptions[type]}</span>
            </button>
          ))}
        </div>
      </PanelBlock>

      <PanelBlock title="Шаблоны" icon={<ClipboardCheck className="h-4 w-4" />}>
        <div className="space-y-2">
          {IMPORT_TEMPLATES.map((template) => (
            <div key={template.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3 text-sm">
              <div className="flex items-start justify-between gap-2"><p className="font-semibold text-slate-100">{template.name}</p><Badge>{template.version}</Badge></div>
              <p className="mt-1 text-xs text-slate-500">{template.requiredFields.length} required · {template.fileType}</p>
            </div>
          ))}
        </div>
      </PanelBlock>

      <PanelBlock title="Последние импорты" icon={<History className="h-4 w-4" />}>
        <div className="space-y-2">
          {jobs.map((job) => (
            <button key={job.id} onClick={() => setSelectedJob(job.id)} className={cn("w-full rounded-2xl border p-3 text-left text-sm", selectedJobId === job.id ? "border-orange-400/60 bg-orange-500/10" : "border-slate-800 bg-slate-900/50")}>
              <p className="font-semibold text-white">{job.number}</p>
              <p className="mt-1 text-xs text-slate-500">{job.name}</p>
              <ProgressBar value={job.progress} className="mt-3" />
            </button>
          ))}
        </div>
      </PanelBlock>

      <PanelBlock title="Очереди обработки" icon={<ServerCog className="h-4 w-4" />}>
        <div className="space-y-2">
          {QUEUE_WORKERS.map((worker) => (
            <div key={worker.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
              <div className="flex items-center justify-between"><span className="font-semibold text-slate-200">{worker.queue}</span><Badge className={worker.status === "busy" ? "bg-orange-500/15 text-orange-200" : "bg-emerald-500/15 text-emerald-200"}>{worker.status}</Badge></div>
              <p className="mt-1 text-slate-500">{worker.throughputPerMinute.toLocaleString("ru-RU")} rows/min · retries {worker.retryCount}</p>
            </div>
          ))}
        </div>
      </PanelBlock>
    </aside>
  );
}

function ImportWorkspace({ job, activeStage, onStageChange }: { job: ImportJob; activeStage: ImportStage; onStageChange: (stage: ImportStage) => void }) {
  return (
    <div className="space-y-5">
      <Card className="border-slate-800 bg-slate-950/70">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2"><Badge>{job.number}</Badge><Badge className="bg-blue-500/15 text-blue-200">{entityLabels[job.entityType]}</Badge><Badge className="bg-emerald-500/15 text-emerald-200">{job.status}</Badge></div>
              <h2 className="mt-3 text-2xl font-black text-white">{job.name}</h2>
              <p className="mt-2 text-sm text-slate-500">{job.file.name} · {job.file.sizeMb} MB · {job.file.sheets.join(", ")} · checksum {job.file.checksum}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6 xl:min-w-[520px]">
              {stageOrder.map((stage, index) => (
                <button key={stage} onClick={() => onStageChange(stage)} className={cn("rounded-2xl border p-2 text-xs", activeStage === stage ? "border-orange-400 bg-orange-500/10 text-orange-100" : "border-slate-800 bg-slate-900/50 text-slate-500")}>
                  <span className="block text-[10px] text-slate-500">{index + 1}</span>{stageLabels[stage]}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {activeStage === "upload" && <UploadStage job={job} />}
      {activeStage === "mapping" && <MappingStage job={job} />}
      {activeStage === "validation" && <ValidationStage job={job} />}
      {activeStage === "preview" && <PreviewStage job={job} />}
      {activeStage === "import" && <BatchImportStage job={job} />}
      {activeStage === "report" && <ReportStage job={job} />}

      <PipelineArchitecture />
    </div>
  );
}

function UploadStage({ job }: { job: ImportJob }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
      <Card className="border-dashed border-orange-400/40 bg-orange-500/5">
        <CardContent className="flex min-h-72 flex-col items-center justify-center p-6 text-center">
          <UploadCloud className="h-14 w-14 text-orange-300" />
          <h3 className="mt-4 text-xl font-black text-white">Chunked upload zone</h3>
          <p className="mt-2 max-w-xl text-sm text-slate-400">Поддерживает .xlsx, CSV, ZIP archives и multi-sheet imports. Большие файлы грузятся чанками, проверяются checksum и помещаются в quarantine до virus scan.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Badge className="justify-center bg-slate-900 text-slate-300"><FileSpreadsheet className="h-3 w-3" /> XLSX/CSV</Badge>
            <Badge className="justify-center bg-slate-900 text-slate-300"><FileArchive className="h-3 w-3" /> ZIP</Badge>
            <Badge className="justify-center bg-slate-900 text-slate-300"><ShieldCheck className="h-3 w-3" /> AV clean</Badge>
          </div>
        </CardContent>
      </Card>
      <Card className="border-slate-800 bg-slate-950/70">
        <CardHeader><CardTitle>File intelligence</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <InfoRow label="File" value={job.file.name} />
          <InfoRow label="Type" value={job.file.fileType} />
          <InfoRow label="Sheets" value={job.file.sheets.join(", ")} />
          <InfoRow label="Chunks" value={`${job.file.chunkCount} resumable chunks`} />
          <InfoRow label="Virus scan" value={job.file.virusScan} />
          <InfoRow label="Source reliability" value={`${job.dataSource.reliabilityScore}%`} />
        </CardContent>
      </Card>
    </div>
  );
}

function MappingStage({ job }: { job: ImportJob }) {
  const columns = useMemo<ColumnDef<ImportMapping>[]>(() => [
    { accessorKey: "sourceColumn", header: "Source column" },
    { accessorKey: "targetField", header: "Target field" },
    { accessorKey: "transform", header: "Transform" },
    { accessorKey: "confidence", header: "AI score", cell: ({ row }) => <Badge className={row.original.confidence > 90 ? "bg-emerald-500/15 text-emerald-200" : "bg-orange-500/15 text-orange-200"}>{row.original.confidence}%</Badge> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge>{row.original.status}</Badge> },
  ], []);
  const table = useReactTable({ data: job.mappings, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><GitMerge className="h-5 w-5 text-orange-300" /> Intelligent column mapping</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 border-blue-400/40 bg-blue-500/10 text-blue-100">AI сопоставляет колонки по названию, sample values, историческим шаблонам и MDM aliases. Mapping можно сохранить как template version.</Alert>
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-500">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>{headerGroup.headers.map((header) => <th key={header.id} className="px-4 py-3">{flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-800">
                  {row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3 text-slate-300">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <MappingDropZone title="Required fields" value={job.template.requiredFields.join(", ")} />
          <MappingDropZone title="Saved templates" value={`${job.template.name} v${job.template.version}`} />
          <MappingDropZone title="AI suggestions" value="Normalize address, dictionary lookup, SKU alias merge" />
        </div>
      </CardContent>
    </Card>
  );
}

function ValidationStage({ job }: { job: ImportJob }) {
  const rules = ["required_fields", "data_types", "unique_factory_number", "reference_exists", "address_quality", "sku_exists", "relation_integrity"];
  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="border-slate-800 bg-slate-950/70">
        <CardHeader><CardTitle><ListChecks className="mr-2 inline h-5 w-5 text-orange-300" /> Validation engine</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {rules.map((rule, index) => <ValidationRule key={rule} rule={rule} status={index < 4 ? "running" : "queued"} />)}
        </CardContent>
      </Card>
      <Card className="border-slate-800 bg-slate-950/70">
        <CardHeader><CardTitle><SearchCheck className="mr-2 inline h-5 w-5 text-orange-300" /> Duplicate detection</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {job.duplicates.map((duplicate) => (
            <div key={duplicate.id} className="rounded-2xl border border-orange-400/30 bg-orange-500/10 p-4 text-sm">
              <div className="flex items-center justify-between"><p className="font-semibold text-white">Row {duplicate.row}: {duplicate.importedValue}</p><Badge className="bg-orange-500/20 text-orange-100">{duplicate.confidence}</Badge></div>
              <p className="mt-2 text-slate-400">Existing: {duplicate.existingValue}</p>
              <p className="mt-1 text-xs text-slate-500">{duplicate.reason} · resolution: {duplicate.resolution}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PreviewStage({ job }: { job: ImportJob }) {
  const columns = useMemo<ColumnDef<ImportPreviewRecord>[]>(() => [
    { accessorKey: "row", header: "Row" },
    { accessorKey: "entity", header: "Entity" },
    { accessorKey: "action", header: "Action", cell: ({ row }) => <ActionBadge action={row.original.action} /> },
    { accessorKey: "affectedObject", header: "Affected object" },
    { accessorKey: "confidence", header: "Confidence", cell: ({ row }) => `${row.original.confidence}%` },
    { accessorKey: "warnings", header: "Warnings" },
  ], []);
  const table = useReactTable({ data: job.preview, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader><CardTitle>Preview mode — create/update/reject/review</CardTitle></CardHeader>
      <CardContent>
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <Metric label="Create" value={job.stats.creates} tone="success" />
          <Metric label="Update" value={job.stats.updates} tone="info" />
          <Metric label="Reject" value={job.stats.rejected} tone="danger" />
          <Metric label="Review" value={job.stats.reviewRequired} tone="warning" />
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase text-slate-500">{table.getHeaderGroups().map((headerGroup) => <tr key={headerGroup.id}>{headerGroup.headers.map((header) => <th key={header.id} className="px-4 py-3">{flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>)}</thead>
            <tbody>{table.getRowModel().rows.map((row) => <tr key={row.id} className="border-t border-slate-800">{row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3 text-slate-300">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function BatchImportStage({ job }: { job: ImportJob }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
      <Card className="border-slate-800 bg-slate-950/70">
        <CardHeader><CardTitle><PlayCircle className="mr-2 inline h-5 w-5 text-orange-300" /> Batch processing architecture</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ProgressBar value={job.progress} />
          <div className="grid gap-3 sm:grid-cols-2">
            {QUEUE_WORKERS.map((worker) => <div key={worker.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"><p className="font-semibold text-white">{worker.name}</p><p className="mt-1 text-sm text-slate-500">Queue: {worker.queue} · {worker.throughputPerMinute.toLocaleString("ru-RU")} rows/min</p></div>)}
          </div>
          <Alert className="border-emerald-400/40 bg-emerald-500/10 text-emerald-100">Imports are resumable and transactional by row-group. Partial success boundaries preserve valid batches while rejected records remain in remediation queue.</Alert>
        </CardContent>
      </Card>
      <Card className="border-slate-800 bg-slate-950/70">
        <CardHeader><CardTitle><RotateCcw className="mr-2 inline h-5 w-5 text-orange-300" /> Rollback snapshot</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {job.rollbackSnapshot ? <>
            <InfoRow label="Snapshot" value={job.rollbackSnapshot.id} />
            <InfoRow label="Captured" value={job.rollbackSnapshot.recordsCaptured.toLocaleString("ru-RU")} />
            <InfoRow label="Protected until" value={new Date(job.rollbackSnapshot.protectedUntil).toLocaleDateString("ru-RU")} />
            <InfoRow label="Status" value={job.rollbackSnapshot.status} />
            <Button className="w-full" variant="danger"><ArchiveRestore className="h-4 w-4" /> Request protected rollback</Button>
          </> : <p className="text-slate-500">Snapshot will be created before transactional import starts.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function ReportStage({ job }: { job: ImportJob }) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <ReportCard title="Import history" icon={<History className="h-5 w-5" />} lines={[`Imported by: ${job.createdBy}`, `Started: ${job.startedAt ?? job.createdAt}`, `Completed: ${job.completedAt ?? "in progress"}`]} />
      <ReportCard title="Affected records" icon={<PackageCheck className="h-5 w-5" />} lines={[`${job.stats.affectedRecords.toLocaleString("ru-RU")} affected`, `${job.stats.creates.toLocaleString("ru-RU")} creates`, `${job.stats.updates.toLocaleString("ru-RU")} updates`]} />
      <ReportCard title="Audit & rollback" icon={<LockKeyhole className="h-5 w-5" />} lines={["Signed report stored", "Audit events immutable", job.rollbackSnapshot ? `Rollback: ${job.rollbackSnapshot.status}` : "Rollback pending"]} />
    </div>
  );
}

function RightIntelligencePanel({ job }: { job: ImportJob }) {
  return (
    <aside className="space-y-4 border-t border-slate-800 bg-slate-950/55 p-4 2xl:border-l 2xl:border-t-0">
      <PanelBlock title="Validation errors" icon={<AlertTriangle className="h-4 w-4" />}>
        <div className="space-y-2">
          {job.validationErrors.map((error) => <div key={error.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"><div className="flex items-center justify-between"><span className="font-semibold text-white">Row {error.row}</span><Badge className={error.severity === "blocking" ? "bg-red-500/15 text-red-200" : "bg-orange-500/15 text-orange-200"}>{error.severity}</Badge></div><p className="mt-1 text-slate-400">{error.message}</p><p className="mt-2 text-xs text-slate-500">AI: {error.suggestion}</p></div>)}
        </div>
      </PanelBlock>
      <PanelBlock title="AI recommendations" icon={<Bot className="h-4 w-4" />}>
        <div className="space-y-2 text-sm text-slate-400">
          <Recommendation text="Сохранить mapping as template v3.5 после подтверждения manufacturer aliases." />
          <Recommendation text="Объединить 2 похожих адреса через normalized FIAS key before import." />
          <Recommendation text="Запустить SKU alias enrichment для складского шаблона перед batch commit." />
        </div>
      </PanelBlock>
      <PanelBlock title="Import statistics" icon={<Gauge className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Rows" value={job.stats.totalRows} />
          <Metric label="Affected" value={job.stats.affectedRecords} />
          <Metric label="Rejected" value={job.stats.rejected} tone="danger" />
          <Metric label="Review" value={job.stats.reviewRequired} tone="warning" />
        </div>
      </PanelBlock>
    </aside>
  );
}

function MdmWorkspace() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-white">Master Data Management workspace</h2>
        <p className="mt-2 text-sm text-slate-500">Centralized reference data: типы лифтов, производители, типы работ, материалы, узлы, категории аварий, SLA категории и типы объектов.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MDM_REFERENCES.map((reference) => (
          <Card key={reference.id} className="border-slate-800 bg-slate-950/70">
            <CardHeader><CardTitle className="flex items-center justify-between"><span>{reference.name}</span><Badge>{reference.version}</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Records" value={reference.records.toLocaleString("ru-RU")} />
              <InfoRow label="Usage" value={reference.usage.toLocaleString("ru-RU")} />
              <InfoRow label="Dependencies" value={reference.dependencies.join(", ")} />
              {reference.warnings.length > 0 ? <Alert className="border-orange-400/40 bg-orange-500/10 text-orange-100">{reference.warnings.join("; ")}</Alert> : <Alert className="border-emerald-400/40 bg-emerald-500/10 text-emerald-100">No dependency warnings</Alert>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PipelineArchitecture() {
  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader><CardTitle>File processing pipeline</CardTitle></CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {PIPELINE_STEPS.map((step, index) => <div key={step.key} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><div className="mb-3 flex items-center justify-between"><Badge>{index + 1}</Badge><ChevronRight className="h-4 w-4 text-slate-600" /></div><p className="font-semibold text-white">{step.name}</p><p className="mt-2 text-sm text-slate-500">{step.description}</p></div>)}
      </CardContent>
    </Card>
  );
}

function PanelBlock({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <section><h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">{icon}{title}</h3>{children}</section>;
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return <div className={cn("h-2 overflow-hidden rounded-full bg-slate-800", className)}><div className="h-full rounded-full bg-orange-400" style={{ width: `${value}%` }} /></div>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-2 last:border-b-0"><span className="text-slate-500">{label}</span><span className="text-right font-semibold text-slate-200">{value}</span></div>;
}

function MappingDropZone({ title, value }: { title: string; value: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-4"><p className="font-semibold text-white">{title}</p><p className="mt-2 text-sm text-slate-500">{value}</p></div>;
}

function ValidationRule({ rule, status }: { rule: string; status: "running" | "queued" }) {
  return <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"><span className="font-semibold text-slate-200">{rule}</span><Badge className={status === "running" ? "bg-blue-500/15 text-blue-200" : "bg-slate-800 text-slate-300"}>{status === "running" ? <RefreshCw className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}{status}</Badge></div>;
}

function ActionBadge({ action }: { action: ImportPreviewRecord["action"] }) {
  const classes = {
    create: "bg-emerald-500/15 text-emerald-200",
    update: "bg-blue-500/15 text-blue-200",
    reject: "bg-red-500/15 text-red-200",
    review: "bg-orange-500/15 text-orange-200",
  };
  return <Badge className={classes[action]}>{action}</Badge>;
}

function Metric({ label, value, tone = "info" }: { label: string; value: number; tone?: "info" | "success" | "warning" | "danger" }) {
  const toneClass = {
    info: "border-blue-400/20 bg-blue-500/10 text-blue-100",
    success: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
    warning: "border-orange-400/20 bg-orange-500/10 text-orange-100",
    danger: "border-red-400/20 bg-red-500/10 text-red-100",
  };
  return <div className={cn("rounded-2xl border p-3", toneClass[tone])}><p className="text-xs opacity-70">{label}</p><p className="mt-1 text-xl font-black">{value.toLocaleString("ru-RU")}</p></div>;
}

function ReportCard({ title, icon, lines }: { title: string; icon: ReactNode; lines: string[] }) {
  return <Card className="border-slate-800 bg-slate-950/70"><CardHeader><CardTitle className="flex items-center gap-2 text-white">{icon}{title}</CardTitle></CardHeader><CardContent className="space-y-2">{lines.map((line) => <p key={line} className="rounded-xl bg-slate-900/70 p-3 text-sm text-slate-300">{line}</p>)}</CardContent></Card>;
}

function Recommendation({ text }: { text: string }) {
  return <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3"><div className="mb-2 flex items-center gap-2 text-blue-100"><Bot className="h-4 w-4" /><span className="font-semibold">AI recommendation</span></div><p>{text}</p></div>;
}
