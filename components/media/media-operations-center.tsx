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
  BrainCircuit,
  Camera,
  CheckCircle2,
  CloudUpload,
  FileText,
  Gauge,
  HardDrive,
  Image as ImageIcon,
  Layers3,
  RefreshCcw,
  ScanSearch,
  ShieldCheck,
  Smartphone,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  AI_VALIDATION_RESULTS,
  DOCUMENTS,
  MEDIA_ALERTS,
  MEDIA_FILES,
  MEDIA_RECOMMENDATIONS,
  OFFLINE_MEDIA_CACHE,
  PDF_REPORTS,
  PHOTO_SESSIONS,
  REQUIREMENT_TEMPLATES,
  UPLOAD_QUEUE,
  buildMediaGridRows,
} from "@/lib/media/media-operations-data";
import type {
  AiValidationStatus,
  MediaGridRow,
  UploadStatus,
} from "@/lib/media/types";

type MediaView =
  | "operations"
  | "capture"
  | "documents"
  | "galleries"
  | "pipeline";

type MediaOpsState = {
  query: string;
  selectedView: MediaView;
  selectedMediaId: string;
  setQuery: (query: string) => void;
  setView: (view: MediaView) => void;
  selectMedia: (mediaId: string) => void;
};

const mediaQueryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 20_000, refetchOnWindowFocus: false },
  },
});

const viewLabels: Record<MediaView, string> = {
  operations: "Media operations",
  capture: "Photo capture",
  documents: "Document center",
  galleries: "Evidence galleries",
  pipeline: "Processing pipeline",
};

const useMediaOpsStore = create<MediaOpsState>((set) => ({
  query: "",
  selectedView: "operations",
  selectedMediaId: "media-4",
  setQuery: (query) => set({ query }),
  setView: (selectedView) => set({ selectedView }),
  selectMedia: (selectedMediaId) => set({ selectedMediaId }),
}));

export function MediaOperationsCenter() {
  return (
    <QueryClientProvider client={mediaQueryClient}>
      <MediaOperationsCenterInner />
    </QueryClientProvider>
  );
}

function MediaOperationsCenterInner() {
  const query = useMediaOpsStore((state) => state.query);
  const setQuery = useMediaOpsStore((state) => state.setQuery);
  const selectedView = useMediaOpsStore((state) => state.selectedView);
  const setView = useMediaOpsStore((state) => state.setView);
  const { data: rows = [] } = useQuery({
    queryKey: ["media-grid-rows"],
    queryFn: async () => buildMediaGridRows(),
    refetchInterval: 6000,
  });
  const filteredRows = rows.filter((row) =>
    [
      row.media.title,
      row.media.objectAddress,
      row.media.elevatorFactoryNumber,
      row.media.mechanicName,
      row.media.photoType,
      row.media.tags.join(" "),
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
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/15 text-cyan-200">
                <Camera className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  industrial field evidence platform
                </p>
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Photo, Media & Field Documentation Operations
                </h1>
              </div>
            </div>
            <p className="mt-3 max-w-5xl text-sm leading-6 text-slate-400">
              Production media operations center for НеоЛифт: фотофиксация
              работ, before/after evidence, документы объекта, PDF акты, offline
              IndexedDB uploads, AI validation, OCR, S3 storage and realtime
              upload recovery.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-cyan-400/30 bg-cyan-500/10 text-cyan-100">
              <CloudUpload className="h-3 w-3" /> resumable uploads
            </Badge>
            <Badge className="border-orange-400/30 bg-orange-500/10 text-orange-100">
              <WifiOff className="h-3 w-3" /> offline cache{" "}
              {OFFLINE_MEDIA_CACHE.pendingUploads}
            </Badge>
            <Badge className="border-emerald-400/30 bg-emerald-500/10 text-emerald-100">
              <ShieldCheck className="h-3 w-3" /> signed URLs
            </Badge>
          </div>
        </div>
        <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по объекту, лифту, механику, work order, типу фото, AI tags..."
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(viewLabels) as MediaView[]).map((view) => (
              <button
                key={view}
                onClick={() => setView(view)}
                className={cn(
                  "shrink-0 rounded-xl border px-3 py-2 text-xs font-bold",
                  selectedView === view
                    ? "border-cyan-400 bg-cyan-500/10 text-cyan-100"
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
        <LeftMediaPanel />
        <section className="min-w-0 border-slate-800 p-4 xl:border-l xl:p-6">
          {selectedView === "operations" && (
            <div className="space-y-5">
              <MediaGrid rows={filteredRows} />
              <SelectedMediaEvidence rows={rows} />
            </div>
          )}
          {selectedView === "capture" && <PhotoCaptureSystem />}
          {selectedView === "documents" && <DocumentCenter />}
          {selectedView === "galleries" && <GallerySystem />}
          {selectedView === "pipeline" && <MediaPipeline />}
        </section>
        <RightMediaIntelligence />
      </div>
    </main>
  );
}

function LeftMediaPanel() {
  const setView = useMediaOpsStore((state) => state.setView);
  const failedUploads = UPLOAD_QUEUE.filter(
    (item) => item.status === "failed",
  ).length;
  const pendingSync = UPLOAD_QUEUE.filter(
    (item) => item.status === "queued" || item.status === "uploading",
  ).length;
  const missingPhotos = PHOTO_SESSIONS.reduce(
    (total, session) => total + session.missingPhotoTypes.length,
    0,
  );
  const aiAlerts = AI_VALIDATION_RESULTS.filter(
    (result) => result.status === "failed" || result.status === "warning",
  ).length;

  return (
    <aside className="space-y-4 border-b border-slate-800 bg-slate-950/45 p-4 xl:border-b-0">
      <PanelBlock
        title="Operations queue"
        icon={<CloudUpload className="h-4 w-4" />}
      >
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Failed uploads" value={failedUploads} danger />
          <Metric label="Pending sync" value={pendingSync} />
          <Metric label="Missing photos" value={missingPhotos} danger />
          <Metric label="AI alerts" value={aiAlerts} danger />
        </div>
      </PanelBlock>
      <PanelBlock
        title="Recent uploads"
        icon={<ImageIcon className="h-4 w-4" />}
      >
        {MEDIA_FILES.slice(0, 4).map((file) => (
          <button
            key={file.id}
            onClick={() => useMediaOpsStore.getState().selectMedia(file.id)}
            className="mb-2 w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-left text-sm hover:border-cyan-500/50"
          >
            <p className="font-semibold text-white">{file.title}</p>
            <p className="text-slate-500">
              {file.workOrderId ?? file.elevatorFactoryNumber} ·{" "}
              {file.uploadStatus}
            </p>
          </button>
        ))}
      </PanelBlock>
      <PanelBlock
        title="Photo requirements"
        icon={<CheckCircle2 className="h-4 w-4" />}
      >
        {PHOTO_SESSIONS.map((session) => (
          <div
            key={session.id}
            className="mb-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{session.workOrderId}</p>
              <Badge>{session.completion}%</Badge>
            </div>
            <Progress value={session.completion} className="mt-2" />
            <p className="mt-2 text-xs text-slate-500">
              missing: {session.missingPhotoTypes.join(", ") || "none"}
            </p>
          </div>
        ))}
      </PanelBlock>
      <Button onClick={() => setView("capture")} className="w-full">
        <Camera className="h-4 w-4" /> Open capture workflow
      </Button>
    </aside>
  );
}

function MediaGrid({ rows }: { rows: MediaGridRow[] }) {
  const selectMedia = useMediaOpsStore((state) => state.selectMedia);
  const columns = useMemo<ColumnDef<MediaGridRow>[]>(
    () => [
      {
        header: "Preview",
        cell: ({ row }) => (
          <button
            onClick={() => selectMedia(row.original.media.id)}
            className="flex h-12 w-16 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-lg hover:border-cyan-400"
          >
            {row.original.media.kind === "photo" ? "📷" : "📄"}
          </button>
        ),
      },
      {
        header: "Тип фото",
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-white">
              {row.original.media.photoType ?? row.original.media.kind}
            </p>
            <p className="text-xs text-slate-500">
              {row.original.media.attachmentEntity}
            </p>
          </div>
        ),
      },
      { header: "Объект", accessorFn: (row) => row.media.objectAddress },
      {
        header: "Лифт",
        accessorFn: (row) => row.media.elevatorFactoryNumber ?? "—",
      },
      {
        header: "Механик",
        accessorFn: (row) => row.media.mechanicName ?? "Документ",
      },
      {
        header: "Upload status",
        cell: ({ row }) => (
          <UploadStatusBadge
            status={row.original.media.uploadStatus}
            progress={row.original.queue?.progress}
          />
        ),
      },
      {
        header: "AI status",
        cell: ({ row }) => (
          <AiStatusBadge status={row.original.media.aiStatus} />
        ),
      },
      {
        header: "created_at",
        cell: ({ row }) =>
          new Date(row.original.media.createdAt).toLocaleString("ru-RU"),
      },
    ],
    [selectMedia],
  );
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <CardTitle>Main media grid</CardTitle>
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

function SelectedMediaEvidence({ rows }: { rows: MediaGridRow[] }) {
  const selectedMediaId = useMediaOpsStore((state) => state.selectedMediaId);
  const row =
    rows.find((candidate) => candidate.media.id === selectedMediaId) ?? rows[0];
  if (!row) return null;
  const failedChecks = row.ai?.checks.filter((check) => !check.passed) ?? [];

  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Evidence card — {row.media.title}</CardTitle>
            <p className="mt-2 text-sm text-slate-500">
              {row.media.objectAddress} ·{" "}
              {row.media.elevatorFactoryNumber ?? "object document"} ·{" "}
              {row.media.workOrderId ?? "archive"}
            </p>
          </div>
          <AiStatusBadge status={row.media.aiStatus} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
        <div className="flex min-h-52 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/70 text-6xl">
          {row.media.kind === "photo" ? "📷" : "📄"}
        </div>
        <div className="space-y-4">
          <InfoGrid
            items={[
              ["S3 key", row.media.storageKey],
              ["Thumbnail", row.media.thumbnailKey],
              ["Checksum", row.media.checksum],
              ["Offline cached", String(row.media.offlineCached)],
              ["Processing", row.media.processing.join(" → ")],
              ["Tags", row.media.tags.join(", ")],
            ]}
          />
          {failedChecks.length > 0 && (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm">
              <p className="font-bold text-red-100">Validation blockers</p>
              {failedChecks.map((check) => (
                <p key={check.code} className="mt-1 text-red-200">
                  {check.code}: {check.message}
                </p>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PhotoCaptureSystem() {
  return (
    <div className="space-y-5">
      <Card className="border-slate-800 bg-slate-950/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-cyan-300" /> Industrial mobile
            photo capture
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <WorkflowTile
            title="Instant capture"
            text="Camera opens from work order with object/elevator context, GPS, timestamp and mechanic identity."
          />
          <WorkflowTile
            title="Batch & angles"
            text="Before, after, replacement, removed part, serial plate and node angles are grouped into one session."
          />
          <WorkflowTile
            title="Retake flow"
            text="AI quality blockers trigger retake before order closure while preserving audit trail."
          />
          <WorkflowTile
            title="Offline first"
            text="Originals are persisted in IndexedDB and queued for service-worker background sync."
          />
        </CardContent>
      </Card>
      <div className="grid gap-5 xl:grid-cols-2">
        <PanelCard
          title="Required photo engine"
          icon={<CheckCircle2 className="h-5 w-5" />}
        >
          {REQUIREMENT_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-white">{template.workType}</p>
                <Badge>{template.minPhotos} min</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Required: {template.requiredPhotoTypes.join(" → ")}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                AI checks: {template.aiChecks.join(", ")}
              </p>
            </div>
          ))}
        </PanelCard>
        <PanelCard
          title="Upload queue recovery"
          icon={<RefreshCcw className="h-5 w-5" />}
        >
          {UPLOAD_QUEUE.map((item) => (
            <div
              key={item.id}
              className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-white">{item.mediaFileId}</p>
                <UploadStatusBadge
                  status={item.status}
                  progress={item.progress}
                />
              </div>
              <Progress value={item.progress} className="mt-3" />
              <p className="mt-2 text-xs text-slate-500">
                chunks {item.uploadedChunks}/{item.chunkCount} · retries{" "}
                {item.retryCount} · {item.error ?? item.network}
              </p>
            </div>
          ))}
        </PanelCard>
      </div>
    </div>
  );
}

function DocumentCenter() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <PanelCard
        title="Object documents"
        icon={<FileText className="h-5 w-5" />}
      >
        {DOCUMENTS.map((document) => (
          <div
            key={document.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">{document.title}</p>
              <Badge>{document.permission}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {document.kind} · v{document.version} · OCR {document.ocrStatus}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              signed URL TTL {document.signedUrlTtlMinutes} minutes
            </p>
          </div>
        ))}
      </PanelCard>
      <PanelCard
        title="PDF generation pipeline"
        icon={<Layers3 className="h-5 w-5" />}
      >
        {PDF_REPORTS.map((report) => (
          <div
            key={report.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">
                {report.reportType} · {report.sourceEntityId}
              </p>
              <Badge>{report.status}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {report.pageCount} pages · media {report.mediaFileIds.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              export: {report.exportedTo ?? "not exported"}
            </p>
          </div>
        ))}
      </PanelCard>
    </div>
  );
}

function GallerySystem() {
  const galleries = [
    "Elevator gallery",
    "Timeline gallery",
    "Before/after gallery",
    "Node gallery",
    "Emergency gallery",
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {galleries.map((gallery) => (
        <Card key={gallery} className="border-slate-800 bg-slate-950/70">
          <CardHeader>
            <CardTitle className="text-base">{gallery}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {MEDIA_FILES.slice(0, 6).map((file) => (
                <div
                  key={`${gallery}-${file.id}`}
                  className="flex h-20 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-2xl"
                >
                  {file.kind === "photo" ? "📷" : "📄"}
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Lazy-loaded thumbnails, progressive previews, AI tags and
              permission-aware signed URLs.
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MediaPipeline() {
  const stages = [
    "S3 multipart intake",
    "Compression",
    "Thumbnail generation",
    "EXIF extraction",
    "OCR",
    "AI validation",
    "Watermarking",
    "CDN publish",
    "Archive lifecycle",
  ];
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <PanelCard title="Processing stages" icon={<Gauge className="h-5 w-5" />}>
        {stages.map((stage, index) => (
          <div
            key={stage}
            className="mb-2 flex gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
          >
            <Badge>{index + 1}</Badge>
            <span>{stage}</span>
          </div>
        ))}
      </PanelCard>
      <PanelCard title="OCR system" icon={<ScanSearch className="h-5 w-5" />}>
        <WorkflowTile
          title="Serial recognition"
          text="Elevator plate OCR extracts factory number and checks it against object registry."
        />
        <WorkflowTile
          title="Document OCR"
          text="PDF/manual/certificate text layer feeds global ERP search."
        />
        <WorkflowTile
          title="Invoice OCR"
          text="Supplier documents are parsed for materials and work-order reconciliation."
        />
      </PanelCard>
      <PanelCard
        title="Security & storage"
        icon={<HardDrive className="h-5 w-5" />}
      >
        <WorkflowTile
          title="S3-compatible storage"
          text="Hot evidence bucket, warm document bucket, archive lifecycle and CDN thumbnails."
        />
        <WorkflowTile
          title="Secure access"
          text="Short-lived signed URLs, permission scopes, watermark protection and audit logs."
        />
        <WorkflowTile
          title="Performance"
          text="Virtualized grids, thumbnail cache, chunk uploads and progressive PDF loading."
        />
      </PanelCard>
    </div>
  );
}

function RightMediaIntelligence() {
  const totalMb = MEDIA_FILES.reduce((sum, file) => sum + file.sizeMb, 0);
  const synced = MEDIA_FILES.filter(
    (file) => file.uploadStatus === "synced",
  ).length;
  return (
    <aside className="space-y-4 border-t border-slate-800 bg-slate-950/55 p-4 2xl:border-l 2xl:border-t-0">
      <PanelBlock
        title="Upload statistics"
        icon={<Gauge className="h-4 w-4" />}
      >
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Files" value={MEDIA_FILES.length} />
          <Metric label="Synced" value={synced} />
          <Metric label="Queue" value={UPLOAD_QUEUE.length} />
          <Metric label="Storage MB" value={Math.round(totalMb)} />
        </div>
      </PanelBlock>
      <PanelBlock
        title="Validation errors"
        icon={<AlertTriangle className="h-4 w-4" />}
      >
        {MEDIA_ALERTS.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "mb-2 rounded-2xl border p-3 text-sm",
              alert.severity === "critical"
                ? "border-red-400/30 bg-red-500/10"
                : "border-orange-400/30 bg-orange-500/10",
            )}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{alert.title}</p>
              <Badge>{alert.type}</Badge>
            </div>
            <p className="mt-1 text-slate-400">{alert.description}</p>
          </div>
        ))}
      </PanelBlock>
      <PanelBlock title="Offline cache" icon={<WifiOff className="h-4 w-4" />}>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">IndexedDB media cache</p>
            <Badge>{OFFLINE_MEDIA_CACHE.serviceWorkerState}</Badge>
          </div>
          <Progress
            value={
              (OFFLINE_MEDIA_CACHE.indexedDbUsedMb /
                OFFLINE_MEDIA_CACHE.maxMb) *
              100
            }
            className="mt-3"
          />
          <p className="mt-2 text-xs text-slate-500">
            {OFFLINE_MEDIA_CACHE.indexedDbUsedMb}/{OFFLINE_MEDIA_CACHE.maxMb} MB
            · pending {OFFLINE_MEDIA_CACHE.pendingUploads}
          </p>
        </div>
      </PanelBlock>
      <PanelBlock
        title="AI recommendations"
        icon={<BrainCircuit className="h-4 w-4" />}
      >
        {MEDIA_RECOMMENDATIONS.map((recommendation) => (
          <div
            key={recommendation.id}
            className="mb-2 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-blue-100">
                {recommendation.title}
              </p>
              <Badge>{recommendation.confidence}%</Badge>
            </div>
            <p className="mt-1 text-slate-400">{recommendation.description}</p>
            <p className="mt-1 text-xs text-slate-500">
              {recommendation.category}
            </p>
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
          <span className="text-cyan-300">{icon}</span>
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

function WorkflowTile({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3"
        >
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 break-all text-sm font-semibold text-white">
            {value}
          </p>
        </div>
      ))}
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

function UploadStatusBadge({
  status,
  progress,
}: {
  status: UploadStatus;
  progress?: number;
}) {
  const cls =
    status === "failed" || status === "conflict"
      ? "bg-red-500/15 text-red-200"
      : status === "uploading" || status === "queued"
        ? "bg-orange-500/15 text-orange-200"
        : status === "local_cached"
          ? "bg-blue-500/15 text-blue-200"
          : "bg-emerald-500/15 text-emerald-200";
  return (
    <Badge className={cls}>
      {status}
      {typeof progress === "number" ? ` ${progress}%` : ""}
    </Badge>
  );
}

function AiStatusBadge({ status }: { status: AiValidationStatus }) {
  const cls =
    status === "failed"
      ? "bg-red-500/15 text-red-200"
      : status === "warning" || status === "manual_review"
        ? "bg-orange-500/15 text-orange-200"
        : status === "pending"
          ? "bg-blue-500/15 text-blue-200"
          : "bg-emerald-500/15 text-emerald-200";
  return <Badge className={cls}>{status}</Badge>;
}
