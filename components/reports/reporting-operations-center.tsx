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
  Archive,
  Bot,
  CheckCircle2,
  ClipboardSignature,
  Download,
  FileArchive,
  FileText,
  History,
  Layers3,
  Printer,
  QrCode,
  RefreshCcw,
  Search,
  ShieldCheck,
  TableProperties,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  DOCUMENT_AI_WARNINGS,
  EXPORT_JOBS,
  GENERATED_DOCUMENTS,
  GENERATION_LOGS,
  PDF_FILES,
  PRINT_JOBS,
  REPORT_PERMISSIONS,
  REPORT_TEMPLATES,
  REPORT_VERSIONS,
  SCHEDULED_REPORTS,
  SERVICE_ACTS,
  SIGNATURE_BLOCKS,
  buildDocumentGridRows,
} from "@/lib/reports/reporting-data";
import type {
  DocumentGridRow,
  ExportStatus,
  GenerationStatus,
  SignatureStatus,
} from "@/lib/reports/types";

type ReportingView =
  | "documents"
  | "templates"
  | "signatures"
  | "exports"
  | "print"
  | "security"
  | "observability";

type ReportingOpsState = {
  query: string;
  selectedView: ReportingView;
  selectedDocumentId: string;
  setQuery: (query: string) => void;
  setView: (view: ReportingView) => void;
  selectDocument: (documentId: string) => void;
};

const reportingQueryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, refetchOnWindowFocus: false },
  },
});

const viewLabels: Record<ReportingView, string> = {
  documents: "Document grid",
  templates: "Templates & PDF engine",
  signatures: "Signatures",
  exports: "Exports & bulk",
  print: "Print engine",
  security: "Storage & security",
  observability: "Observability",
};

const useReportingOpsStore = create<ReportingOpsState>((set) => ({
  query: "",
  selectedView: "documents",
  selectedDocumentId: "doc-wo-3021",
  setQuery: (query) => set({ query }),
  setView: (selectedView) => set({ selectedView }),
  selectDocument: (selectedDocumentId) => set({ selectedDocumentId }),
}));

export function ReportingOperationsCenter() {
  return (
    <QueryClientProvider client={reportingQueryClient}>
      <ReportingOperationsCenterInner />
    </QueryClientProvider>
  );
}

function ReportingOperationsCenterInner() {
  const query = useReportingOpsStore((state) => state.query);
  const setQuery = useReportingOpsStore((state) => state.setQuery);
  const selectedView = useReportingOpsStore((state) => state.selectedView);
  const setView = useReportingOpsStore((state) => state.setView);
  const { data: rows = [] } = useQuery({
    queryKey: ["document-grid-rows"],
    queryFn: async () => buildDocumentGridRows(),
    refetchInterval: 7000,
  });
  const filteredRows = rows.filter((row) =>
    [
      row.document.title,
      row.document.documentType,
      row.document.objectAddress,
      row.document.customerName,
      row.document.elevatorFactoryNumber,
      row.document.workOrderId,
      row.document.mechanicName,
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
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/15 text-amber-200">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  enterprise document generation platform
                </p>
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Reporting, PDF Generation & Operational Documents
                </h1>
              </div>
            </div>
            <p className="mt-3 max-w-5xl text-sm leading-6 text-slate-400">
              Production reporting ERP for НеоЛифт: заказ-наряды, акты,
              inspection/audit/SLA reports, dynamic templates, photo evidence,
              signatures, QR verification, immutable S3 PDFs, print engine, bulk
              exports and compliance audit trail.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-amber-400/30 bg-amber-500/10 text-amber-100">
              <FileArchive className="h-3 w-3" /> PDF pipeline
            </Badge>
            <Badge className="border-emerald-400/30 bg-emerald-500/10 text-emerald-100">
              <ShieldCheck className="h-3 w-3" /> signed documents
            </Badge>
            <Badge className="border-blue-400/30 bg-blue-500/10 text-blue-100">
              <Archive className="h-3 w-3" /> S3 archive
            </Badge>
          </div>
        </div>
        <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по объекту, лифту, заказ-наряду, заказчику, механику, типу документа..."
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(viewLabels) as ReportingView[]).map((view) => (
              <button
                key={view}
                onClick={() => setView(view)}
                className={cn(
                  "shrink-0 rounded-xl border px-3 py-2 text-xs font-bold",
                  selectedView === view
                    ? "border-amber-400 bg-amber-500/10 text-amber-100"
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
        <LeftDocumentPanel />
        <section className="min-w-0 border-slate-800 p-4 xl:border-l xl:p-6">
          {selectedView === "documents" && (
            <div className="space-y-5">
              <DocumentGrid rows={filteredRows} />
              <SelectedDocument rows={rows} />
            </div>
          )}
          {selectedView === "templates" && <TemplateAndPdfEngine />}
          {selectedView === "signatures" && <SignatureWorkflows />}
          {selectedView === "exports" && <ExportAndBulkSystem />}
          {selectedView === "print" && <PrintEngine />}
          {selectedView === "security" && <StorageSecuritySystem />}
          {selectedView === "observability" && <ObservabilitySystem />}
        </section>
        <RightDocumentIntelligence />
      </div>
    </main>
  );
}

function LeftDocumentPanel() {
  const setView = useReportingOpsStore((state) => state.setView);
  const pendingSignatures = SIGNATURE_BLOCKS.filter(
    (signature) => signature.status === "pending",
  ).length;
  const failedGeneration = GENERATED_DOCUMENTS.filter(
    (document) => document.generationStatus === "failed",
  ).length;
  const exportQueue = EXPORT_JOBS.filter(
    (job) => job.status === "queued" || job.status === "exporting",
  ).length;
  const scheduled = SCHEDULED_REPORTS.filter((report) => report.enabled).length;

  return (
    <aside className="space-y-4 border-b border-slate-800 bg-slate-950/45 p-4 xl:border-b-0">
      <PanelBlock
        title="Document operations"
        icon={<FileText className="h-4 w-4" />}
      >
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Recent docs" value={GENERATED_DOCUMENTS.length} />
          <Metric label="Pending signatures" value={pendingSignatures} danger />
          <Metric label="Failed generation" value={failedGeneration} danger />
          <Metric label="Scheduled" value={scheduled} />
          <Metric label="Export queue" value={exportQueue} />
          <Metric label="PDF files" value={PDF_FILES.length} />
        </div>
      </PanelBlock>
      <PanelBlock
        title="Recent documents"
        icon={<History className="h-4 w-4" />}
      >
        {GENERATED_DOCUMENTS.slice(0, 4).map((document) => (
          <button
            key={document.id}
            onClick={() =>
              useReportingOpsStore.getState().selectDocument(document.id)
            }
            className="mb-2 w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-left text-sm hover:border-amber-500/50"
          >
            <p className="font-semibold text-white">{document.title}</p>
            <p className="text-slate-500">
              {document.objectAddress} · v{document.version} ·{" "}
              {document.generationStatus}
            </p>
          </button>
        ))}
      </PanelBlock>
      <PanelBlock
        title="Scheduled reports"
        icon={<RefreshCcw className="h-4 w-4" />}
      >
        {SCHEDULED_REPORTS.map((report) => (
          <div
            key={report.id}
            className="mb-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{report.name}</p>
              <Badge>{report.schedule}</Badge>
            </div>
            <p className="mt-1 text-slate-500">
              next {new Date(report.nextRunAt).toLocaleString("ru-RU")} ·{" "}
              {report.lastStatus}
            </p>
          </div>
        ))}
      </PanelBlock>
      <Button onClick={() => setView("templates")} className="w-full">
        <Layers3 className="h-4 w-4" /> Open template engine
      </Button>
    </aside>
  );
}

function DocumentGrid({ rows }: { rows: DocumentGridRow[] }) {
  const selectDocument = useReportingOpsStore((state) => state.selectDocument);
  const columns = useMemo<ColumnDef<DocumentGridRow>[]>(
    () => [
      {
        header: "Тип документа",
        cell: ({ row }) => (
          <button
            onClick={() => selectDocument(row.original.document.id)}
            className="text-left font-semibold text-white hover:text-amber-200"
          >
            {row.original.document.documentType}
          </button>
        ),
      },
      { header: "Объект", accessorFn: (row) => row.document.objectAddress },
      {
        header: "Лифт",
        accessorFn: (row) => row.document.elevatorFactoryNumber ?? "—",
      },
      {
        header: "Заказ-наряд",
        accessorFn: (row) => row.document.workOrderId ?? "—",
      },
      {
        header: "created_at",
        cell: ({ row }) =>
          new Date(row.original.document.createdAt).toLocaleString("ru-RU"),
      },
      {
        header: "Version",
        cell: ({ row }) => `v${row.original.document.version}`,
      },
      {
        header: "Signature status",
        cell: ({ row }) => (
          <SignatureBadge status={row.original.document.signatureStatus} />
        ),
      },
      {
        header: "Export status",
        cell: ({ row }) => (
          <ExportBadge status={row.original.document.exportStatus} />
        ),
      },
    ],
    [selectDocument],
  );
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <CardTitle>Main document grid</CardTitle>
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

function SelectedDocument({ rows }: { rows: DocumentGridRow[] }) {
  const selectedDocumentId = useReportingOpsStore(
    (state) => state.selectedDocumentId,
  );
  const row =
    rows.find((candidate) => candidate.document.id === selectedDocumentId) ??
    rows[0];
  if (!row) return null;

  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Document preview — {row.document.title}</CardTitle>
            <p className="mt-2 text-sm text-slate-500">
              {row.document.customerName} · {row.document.objectAddress} ·{" "}
              {row.document.workOrderId ?? "period report"}
            </p>
          </div>
          <GenerationBadge status={row.document.generationStatus} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
        <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/70 p-5 text-center">
          <FileText className="h-16 w-16 text-amber-300" />
          <p className="mt-4 font-bold text-white">A4 PDF preview</p>
          <p className="mt-2 text-sm text-slate-500">
            {row.pdf
              ? `${row.pdf.pageCount} pages · ${row.pdf.sizeMb} MB`
              : "rendering preview"}
          </p>
        </div>
        <div className="space-y-4">
          <InfoGrid
            items={[
              ["PDF", row.pdf?.fileName ?? "not generated"],
              ["S3 key", row.pdf?.s3Key ?? "pending"],
              ["QR verification", row.pdf?.qrVerificationUrl ?? "pending"],
              ["Checksum", row.pdf?.checksum ?? "pending"],
              [
                "Latest version",
                row.latestVersion?.diffSummary ?? "no versions",
              ],
              [
                "Warnings",
                row.warnings.map((warning) => warning.message).join(" · ") ||
                  "none",
              ],
            ]}
          />
          <div className="grid gap-3 md:grid-cols-2">
            {row.signatures.map((signature) => (
              <div
                key={signature.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">
                    {signature.signerName}
                  </p>
                  <SignatureBadge status={signature.status} />
                </div>
                <p className="mt-1 text-slate-500">
                  {signature.signerRole} ·{" "}
                  {signature.signedAt
                    ? new Date(signature.signedAt).toLocaleString("ru-RU")
                    : "pending"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateAndPdfEngine() {
  const pipeline = [
    "Collect work/material/media/signature data",
    "Resolve branded template",
    "Embed photo evidence and QR",
    "Render industrial A4 PDF",
    "Watermark and checksum",
    "Store immutable S3 version",
    "Publish signed URL",
  ];
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <PanelCard
          title="Dynamic template system"
          icon={<Layers3 className="h-5 w-5" />}
        >
          {REPORT_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-white">{template.name}</p>
                <Badge>v{template.version}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                {template.documentType} · brand {template.brandProfile}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                blocks: {template.blocks.join(" → ")}
              </p>
            </div>
          ))}
        </PanelCard>
        <PanelCard
          title="PDF engine pipeline"
          icon={<FileArchive className="h-5 w-5" />}
        >
          {pipeline.map((step, index) => (
            <div
              key={step}
              className="mb-2 flex gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
            >
              <Badge>{index + 1}</Badge>
              <span>{step}</span>
            </div>
          ))}
        </PanelCard>
      </div>
      <PhotoIntegration />
    </div>
  );
}

function PhotoIntegration() {
  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-amber-300" /> Photo evidence & QR
          system
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <WorkflowTile
          title="Before/after blocks"
          text="Work-order PDFs automatically include before, after, replacement and removed-part photo evidence."
        />
        <WorkflowTile
          title="Document QR"
          text="QR links validate document authenticity, work order, elevator and immutable version checksum."
        />
        <WorkflowTile
          title="Mobile friendly"
          text="Mechanics can open, sign, send and print PDFs directly from the PWA workspace."
        />
        <WorkflowTile
          title="Industrial layout"
          text="Templates are optimized for readable A4, grayscale, tables, photos and customer signatures."
        />
      </CardContent>
    </Card>
  );
}

function SignatureWorkflows() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <PanelCard
        title="Signature blocks"
        icon={<ClipboardSignature className="h-5 w-5" />}
      >
        {SIGNATURE_BLOCKS.map((signature) => (
          <div
            key={signature.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">{signature.signerName}</p>
              <SignatureBadge status={signature.status} />
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {signature.signerRole} ·{" "}
              {signature.deviceId ??
                signature.certificateThumbprint ??
                "server signing"}
            </p>
          </div>
        ))}
      </PanelCard>
      <PanelCard
        title="Versioning & diff trail"
        icon={<History className="h-5 w-5" />}
      >
        {REPORT_VERSIONS.map((version) => (
          <div
            key={version.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">
                {version.documentId} · v{version.version}
              </p>
              <Badge>{version.reason}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-400">{version.diffSummary}</p>
            <p className="mt-1 text-xs text-slate-500">
              {version.createdBy} ·{" "}
              {new Date(version.createdAt).toLocaleString("ru-RU")}
            </p>
          </div>
        ))}
      </PanelCard>
    </div>
  );
}

function ExportAndBulkSystem() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <PanelCard title="Export queue" icon={<Download className="h-5 w-5" />}>
        {EXPORT_JOBS.map((job) => (
          <div
            key={job.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">
                {job.format.toUpperCase()} · {job.target}
              </p>
              <ExportBadge status={job.status} />
            </div>
            <Progress value={job.progress} className="mt-3" />
            <p className="mt-2 text-sm text-slate-500">
              {job.documentIds.length} docs ·{" "}
              {job.error ?? "streaming export worker"}
            </p>
          </div>
        ))}
      </PanelCard>
      <PanelCard
        title="Bulk generation"
        icon={<TableProperties className="h-5 w-5" />}
      >
        {SERVICE_ACTS.map((act) => (
          <div
            key={act.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <p className="font-bold text-white">
              {act.customerName} · {act.periodStart}—{act.periodEnd}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {act.workOrdersIncluded} work orders · {act.totalAmount}
            </p>
          </div>
        ))}
        {SCHEDULED_REPORTS.map((report) => (
          <div
            key={report.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">{report.name}</p>
              <Badge>{report.enabled ? "enabled" : "paused"}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {report.schedule} · next{" "}
              {new Date(report.nextRunAt).toLocaleDateString("ru-RU")}
            </p>
          </div>
        ))}
      </PanelCard>
    </div>
  );
}

function PrintEngine() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <PanelCard title="Print jobs" icon={<Printer className="h-5 w-5" />}>
        {PRINT_JOBS.map((job) => (
          <div
            key={job.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">{job.printerName}</p>
              <Badge>{job.status}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {job.copies} copies · {job.paper} · margins {job.marginsMm}mm ·
              grayscale {String(job.grayscale)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {job.diagnostics ?? "A4 optimized print layout"}
            </p>
          </div>
        ))}
      </PanelCard>
      <PanelCard
        title="Printer-friendly rules"
        icon={<Search className="h-5 w-5" />}
      >
        <WorkflowTile
          title="A4 optimization"
          text="Headers, tables, photo grids and signatures are paginated with fixed margins and page-break control."
        />
        <WorkflowTile
          title="Grayscale mode"
          text="Warehouse and audit reports can render high-contrast grayscale variants for low-cost printing."
        />
        <WorkflowTile
          title="Mobile print"
          text="Mechanics can send signed PDFs to AirPrint/system print or share a signed URL."
        />
      </PanelCard>
    </div>
  );
}

function StorageSecuritySystem() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <PanelCard
        title="S3 storage architecture"
        icon={<Archive className="h-5 w-5" />}
      >
        {PDF_FILES.map((pdf) => (
          <div
            key={pdf.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <p className="font-bold text-white">{pdf.fileName}</p>
            <p className="mt-2 break-all text-sm text-slate-400">{pdf.s3Key}</p>
            <p className="mt-1 font-mono text-xs text-slate-600">
              {pdf.checksum}
            </p>
          </div>
        ))}
      </PanelCard>
      <PanelCard
        title="Permissions & tamper protection"
        icon={<ShieldCheck className="h-5 w-5" />}
      >
        {REPORT_PERMISSIONS.map((permission) => (
          <div
            key={permission.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">{permission.documentId}</p>
              <Badge>{permission.scope}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              view {String(permission.canView)} · download{" "}
              {String(permission.canDownload)} · print{" "}
              {String(permission.canPrint)} · sign {String(permission.canSign)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              redacted {String(permission.redacted)}
            </p>
          </div>
        ))}
      </PanelCard>
    </div>
  );
}

function ObservabilitySystem() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <PanelCard title="Generation logs" icon={<History className="h-5 w-5" />}>
        {GENERATION_LOGS.map((log) => (
          <div
            key={log.id}
            className={cn(
              "mb-2 rounded-2xl border p-3 text-sm",
              log.status === "error"
                ? "border-red-400/30 bg-red-500/10"
                : log.status === "warning"
                  ? "border-orange-400/30 bg-orange-500/10"
                  : "border-slate-800 bg-slate-900/60",
            )}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{log.stage}</p>
              <span className="text-xs text-slate-500">
                {new Date(log.createdAt).toLocaleTimeString("ru-RU")}
              </span>
            </div>
            <p className="mt-1 text-slate-400">{log.details}</p>
          </div>
        ))}
      </PanelCard>
      <PanelCard
        title="AI document warnings"
        icon={<Bot className="h-5 w-5" />}
      >
        {DOCUMENT_AI_WARNINGS.map((warning) => (
          <div
            key={warning.id}
            className={cn(
              "mb-2 rounded-2xl border p-3 text-sm",
              warning.severity === "critical"
                ? "border-red-400/30 bg-red-500/10"
                : warning.severity === "warning"
                  ? "border-orange-400/30 bg-orange-500/10"
                  : "border-blue-400/20 bg-blue-500/10",
            )}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{warning.category}</p>
              <Badge>{warning.severity}</Badge>
            </div>
            <p className="mt-1 text-slate-400">{warning.message}</p>
            <p className="mt-1 text-xs text-slate-500">
              {warning.recommendation}
            </p>
          </div>
        ))}
      </PanelCard>
    </div>
  );
}

function RightDocumentIntelligence() {
  const selectedDocumentId = useReportingOpsStore(
    (state) => state.selectedDocumentId,
  );
  const versions = REPORT_VERSIONS.filter(
    (version) => version.documentId === selectedDocumentId,
  );
  const warnings = DOCUMENT_AI_WARNINGS.filter(
    (warning) => warning.documentId === selectedDocumentId,
  );
  return (
    <aside className="space-y-4 border-t border-slate-800 bg-slate-950/55 p-4 2xl:border-l 2xl:border-t-0">
      <PanelBlock
        title="Document preview"
        icon={<FileText className="h-4 w-4" />}
      >
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
          <p className="font-semibold text-white">
            Selected: {selectedDocumentId}
          </p>
          <p className="mt-2 text-slate-500">
            Professional A4 PDF preview, thumbnails, QR verification and signed
            URL access.
          </p>
        </div>
      </PanelBlock>
      <PanelBlock
        title="Version history"
        icon={<History className="h-4 w-4" />}
      >
        {versions.length ? (
          versions.map((version) => (
            <div
              key={version.id}
              className="mb-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">v{version.version}</p>
                <Badge>{version.reason}</Badge>
              </div>
              <p className="mt-1 text-slate-500">{version.diffSummary}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">
            No version records for selected document
          </p>
        )}
      </PanelBlock>
      <PanelBlock
        title="AI warnings"
        icon={<AlertTriangle className="h-4 w-4" />}
      >
        {warnings.length ? (
          warnings.map((warning) => (
            <div
              key={warning.id}
              className="mb-2 rounded-2xl border border-orange-400/30 bg-orange-500/10 p-3 text-sm"
            >
              <p className="font-semibold text-white">{warning.category}</p>
              <p className="mt-1 text-slate-400">{warning.message}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No active warnings</p>
        )}
      </PanelBlock>
      <PanelBlock title="Print settings" icon={<Printer className="h-4 w-4" />}>
        {PRINT_JOBS.slice(0, 3).map((job) => (
          <div
            key={job.id}
            className="mb-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{job.paper}</p>
              <Badge>{job.status}</Badge>
            </div>
            <p className="mt-1 text-slate-500">
              {job.marginsMm}mm · grayscale {String(job.grayscale)}
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
          <span className="text-amber-300">{icon}</span>
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map(([label, value]) => (
        <InfoTile key={label} label={label} value={value} />
      ))}
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

function GenerationBadge({ status }: { status: GenerationStatus }) {
  const cls =
    status === "failed"
      ? "bg-red-500/15 text-red-200"
      : status === "rendering" || status === "queued"
        ? "bg-orange-500/15 text-orange-200"
        : status === "ready" || status === "archived"
          ? "bg-emerald-500/15 text-emerald-200"
          : "bg-slate-500/15 text-slate-300";
  return <Badge className={cls}>{status}</Badge>;
}

function SignatureBadge({ status }: { status: SignatureStatus }) {
  const cls =
    status === "pending" || status === "rejected"
      ? "bg-orange-500/15 text-orange-200"
      : status === "not_required"
        ? "bg-slate-500/15 text-slate-300"
        : "bg-emerald-500/15 text-emerald-200";
  const Icon =
    status === "pending" || status === "rejected"
      ? AlertTriangle
      : CheckCircle2;
  return (
    <Badge className={cls}>
      <Icon className="h-3 w-3" /> {status}
    </Badge>
  );
}

function ExportBadge({ status }: { status: ExportStatus }) {
  const cls =
    status === "failed"
      ? "bg-red-500/15 text-red-200"
      : status === "queued" || status === "exporting"
        ? "bg-orange-500/15 text-orange-200"
        : status === "sent" || status === "downloaded"
          ? "bg-emerald-500/15 text-emerald-200"
          : "bg-slate-500/15 text-slate-300";
  return <Badge className={cls}>{status}</Badge>;
}
