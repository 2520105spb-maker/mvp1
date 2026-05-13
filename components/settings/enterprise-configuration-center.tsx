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
  BookOpen,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ClipboardList,
  Database,
  FileCog,
  FileDown,
  Globe2,
  History,
  KeyRound,
  Layers3,
  Network,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  APPROVAL_CHAINS,
  BUSINESS_RULES,
  CONFIG_AUDIT_LOGS,
  IMPACT_ANALYSIS,
  IMPORT_EXPORT_JOBS,
  LOCALIZATION_TERMS,
  MASTER_DATA,
  SLA_PROFILES,
  SYSTEM_SETTINGS,
  TEMPLATE_CONFIGURATIONS,
  VALIDATION_WARNINGS,
  WORKFLOW_RULES,
  WORK_TYPES,
  ENTERPRISE_ROLES,
  buildConfigurationGridRows,
} from "@/lib/settings/mdm-data";
import type {
  ConfigurationGridRow,
  ConfigStatus,
  ValidationStatus,
} from "@/lib/settings/types";

type ConfigView =
  | "grid"
  | "workflows"
  | "sla"
  | "roles"
  | "localization"
  | "templates"
  | "audit";

type ConfigState = {
  query: string;
  selectedView: ConfigView;
  selectedEntityId: string;
  setQuery: (query: string) => void;
  setView: (view: ConfigView) => void;
  selectEntity: (entityId: string) => void;
};

const configQueryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 20_000, refetchOnWindowFocus: false },
  },
});

const viewLabels: Record<ConfigView, string> = {
  grid: "Реестр конфигурации",
  workflows: "Workflow и правила",
  sla: "SLA",
  roles: "Роли и права",
  localization: "Русская терминология",
  templates: "Шаблоны",
  audit: "Аудит и импорт",
};

const useConfigStore = create<ConfigState>((set) => ({
  query: "",
  selectedView: "grid",
  selectedEntityId: "wt-door-repair",
  setQuery: (query) => set({ query }),
  setView: (selectedView) => set({ selectedView }),
  selectEntity: (selectedEntityId) => set({ selectedEntityId }),
}));

export function EnterpriseConfigurationCenter() {
  return (
    <QueryClientProvider client={configQueryClient}>
      <EnterpriseConfigurationCenterInner />
    </QueryClientProvider>
  );
}

function EnterpriseConfigurationCenterInner() {
  const query = useConfigStore((state) => state.query);
  const setQuery = useConfigStore((state) => state.setQuery);
  const selectedView = useConfigStore((state) => state.selectedView);
  const setView = useConfigStore((state) => state.setView);
  const { data: rows = [] } = useQuery({
    queryKey: ["configuration-grid"],
    queryFn: async () => buildConfigurationGridRows(),
    refetchInterval: 9000,
  });
  const filteredRows = rows.filter((row) =>
    [
      row.entity,
      row.entityType,
      row.status,
      row.updatedBy,
      row.dependencies.join(" "),
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
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-200">
                <SlidersHorizontal className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  центр промышленного управления справочниками
                </p>
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Настройки, НСИ и корпоративная конфигурация
                </h1>
              </div>
            </div>
            <p className="mt-3 max-w-5xl text-sm leading-6 text-slate-400">
              Единая русскоязычная платформа администрирования НеоЛифт:
              справочники, типы работ, SLA, роли, права, workflow, approvals,
              шаблоны, терминология, бизнес-правила, импорт/экспорт и
              неизменяемый аудит.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-100">
              <Database className="h-3 w-3" /> НСИ
            </Badge>
            <Badge className="border-emerald-400/30 bg-emerald-500/10 text-emerald-100">
              <ShieldCheck className="h-3 w-3" /> RBAC
            </Badge>
            <Badge className="border-blue-400/30 bg-blue-500/10 text-blue-100">
              <Globe2 className="h-3 w-3" /> русский UI
            </Badge>
          </div>
        </div>
        <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по справочнику, типу работ, SLA, роли, правилу, версии, владельцу..."
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(viewLabels) as ConfigView[]).map((view) => (
              <button
                key={view}
                onClick={() => setView(view)}
                className={cn(
                  "shrink-0 rounded-xl border px-3 py-2 text-xs font-bold",
                  selectedView === view
                    ? "border-fuchsia-400 bg-fuchsia-500/10 text-fuchsia-100"
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
        <LeftConfigPanel />
        <section className="min-w-0 border-slate-800 p-4 xl:border-l xl:p-6">
          {selectedView === "grid" && (
            <div className="space-y-5">
              <ConfigurationGrid rows={filteredRows} />
              <SelectedConfiguration rows={rows} />
            </div>
          )}
          {selectedView === "workflows" && <WorkflowRuleEngine />}
          {selectedView === "sla" && <SlaConfigurationEngine />}
          {selectedView === "roles" && <RbacAdministration />}
          {selectedView === "localization" && <LocalizationCenter />}
          {selectedView === "templates" && <TemplateManagement />}
          {selectedView === "audit" && <AuditAndImportCenter />}
        </section>
        <RightGovernancePanel />
      </div>
    </main>
  );
}

function LeftConfigPanel() {
  const setView = useConfigStore((state) => state.setView);
  const warnings = VALIDATION_WARNINGS.length;
  const activeSla = SLA_PROFILES.filter(
    (profile) => profile.status === "active",
  ).length;
  const workflows = WORKFLOW_RULES.filter(
    (rule) => rule.status === "active",
  ).length;
  const roles = ENTERPRISE_ROLES.length;
  return (
    <aside className="space-y-4 border-b border-slate-800 bg-slate-950/45 p-4 xl:border-b-0">
      <PanelBlock
        title="Разделы управления"
        icon={<Building2 className="h-4 w-4" />}
      >
        <div className="grid grid-cols-2 gap-3">
          <Metric label="НСИ" value={MASTER_DATA.length} />
          <Metric label="Workflow" value={workflows} />
          <Metric label="SLA" value={activeSla} />
          <Metric label="Роли" value={roles} />
          <Metric label="Ошибки" value={warnings} danger />
          <Metric label="Аудит" value={CONFIG_AUDIT_LOGS.length} />
        </div>
      </PanelBlock>
      <PanelBlock title="Навигация" icon={<Layers3 className="h-4 w-4" />}>
        {[
          { label: "Справочники", view: "grid" },
          { label: "Workflow", view: "workflows" },
          { label: "Права", view: "roles" },
          { label: "SLA", view: "sla" },
          { label: "Локализация", view: "localization" },
          { label: "Аудит", view: "audit" },
        ].map((item) => (
          <button
            key={item.view}
            onClick={() => setView(item.view as ConfigView)}
            className="mb-2 w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-left text-sm font-semibold text-white hover:border-fuchsia-500/50"
          >
            {item.label}
          </button>
        ))}
      </PanelBlock>
      <PanelBlock
        title="Системные настройки"
        icon={<FileCog className="h-4 w-4" />}
      >
        {SYSTEM_SETTINGS.map((setting) => (
          <div
            key={setting.id}
            className="mb-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{setting.name}</p>
              <Badge>{setting.group}</Badge>
            </div>
            <p className="mt-1 text-slate-500">
              {setting.value} · v{setting.version}
            </p>
          </div>
        ))}
      </PanelBlock>
      <Button onClick={() => setView("workflows")} className="w-full">
        <Workflow className="h-4 w-4" /> Настроить тип работ
      </Button>
    </aside>
  );
}

function ConfigurationGrid({ rows }: { rows: ConfigurationGridRow[] }) {
  const selectEntity = useConfigStore((state) => state.selectEntity);
  const columns = useMemo<ColumnDef<ConfigurationGridRow>[]>(
    () => [
      {
        header: "Сущность",
        cell: ({ row }) => (
          <button
            onClick={() => selectEntity(row.original.id)}
            className="text-left font-semibold text-white hover:text-fuchsia-200"
          >
            {row.original.entity}
          </button>
        ),
      },
      { header: "Тип", accessorFn: (row) => row.entityType },
      {
        header: "Статус",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        header: "Обновлено",
        cell: ({ row }) =>
          new Date(row.original.updatedAt).toLocaleString("ru-RU"),
      },
      { header: "Кем", accessorFn: (row) => row.updatedBy },
      { header: "Версия", cell: ({ row }) => `v${row.original.version}` },
      {
        header: "Валидация",
        cell: ({ row }) => (
          <ValidationBadge status={row.original.validationStatus} />
        ),
      },
    ],
    [selectEntity],
  );
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <CardTitle>Главный реестр конфигурации</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full min-w-[980px] text-left text-sm">
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

function SelectedConfiguration({ rows }: { rows: ConfigurationGridRow[] }) {
  const selectedEntityId = useConfigStore((state) => state.selectedEntityId);
  const row =
    rows.find((candidate) => candidate.id === selectedEntityId) ?? rows[0];
  if (!row) return null;
  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Карточка конфигурации — {row.entity}</CardTitle>
            <p className="mt-2 text-sm text-slate-500">
              {row.entityType} · версия {row.version} · обновил {row.updatedBy}
            </p>
          </div>
          <ValidationBadge status={row.validationStatus} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <InfoTile label="Зависимости" value={row.dependencies.join(" · ")} />
        <InfoTile label="Статус" value={row.status} />
        <InfoTile label="Версия" value={`v${row.version}`} />
        <InfoTile
          label="Последнее изменение"
          value={new Date(row.updatedAt).toLocaleString("ru-RU")}
        />
        <InfoTile
          label="Аудит"
          value={
            CONFIG_AUDIT_LOGS.find((log) => log.entityId === row.id)?.details ??
            "нет записей"
          }
        />
        <InfoTile
          label="Предупреждения"
          value={
            VALIDATION_WARNINGS.filter((warning) => warning.entityId === row.id)
              .map((warning) => warning.message)
              .join(" · ") || "нет"
          }
        />
      </CardContent>
    </Card>
  );
}

function WorkflowRuleEngine() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <PanelCard
        title="Типы работ"
        icon={<ClipboardList className="h-5 w-5" />}
      >
        {WORK_TYPES.map((type) => (
          <div
            key={type.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">{type.name}</p>
              <StatusBadge status={type.status} />
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Фото: {type.requiredPhotos.join(", ")}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Материалы: {type.requiredMaterials.join(", ")} · SLA{" "}
              {type.slaProfileId}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Подписи: {type.requiredSignatures.join(", ")} · шаблон{" "}
              {type.reportTemplateId}
            </p>
          </div>
        ))}
      </PanelCard>
      <PanelCard title="Бизнес-правила" icon={<Workflow className="h-5 w-5" />}>
        {WORKFLOW_RULES.map((rule) => (
          <div
            key={rule.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">{rule.name}</p>
              <ValidationBadge status={rule.validationStatus} />
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Если: {rule.condition}
            </p>
            <p className="mt-1 text-sm text-slate-400">То: {rule.action}</p>
          </div>
        ))}
        {BUSINESS_RULES.map((rule) => (
          <div
            key={rule.id}
            className="mb-3 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-4"
          >
            <p className="font-bold text-white">{rule.name}</p>
            <p className="mt-2 text-sm text-slate-400">{rule.expression}</p>
            <p className="mt-1 text-xs text-slate-500">
              предотвращает: {rule.prevents}
            </p>
          </div>
        ))}
      </PanelCard>
    </div>
  );
}

function SlaConfigurationEngine() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {SLA_PROFILES.map((profile) => (
        <Card key={profile.id} className="border-slate-800 bg-slate-950/70">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{profile.name}</CardTitle>
              <Badge>{profile.criticality}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <InfoTile
                label="Реакция"
                value={`${profile.responseMinutes} минут`}
              />
              <InfoTile
                label="Решение"
                value={`${profile.resolutionMinutes} минут`}
              />
              <InfoTile label="Календарь" value={profile.holidayCalendar} />
              <InfoTile label="Логика" value={profile.priorityLogic} />
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm">
              <p className="font-semibold text-white">Цепочка эскалации</p>
              <p className="mt-2 text-slate-400">
                {profile.escalationChain.join(" → ")}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RbacAdministration() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <PanelCard
        title="Корпоративные роли"
        icon={<Users className="h-5 w-5" />}
      >
        {ENTERPRISE_ROLES.map((role) => (
          <div
            key={role.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">{role.name}</p>
              <StatusBadge status={role.status} />
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Права: {role.permissions.join(", ")}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Объекты: {role.objectScope} · регионы: {role.regionScope}
            </p>
          </div>
        ))}
      </PanelCard>
      <PanelCard
        title="Цепочки согласования"
        icon={<KeyRound className="h-5 w-5" />}
      >
        {APPROVAL_CHAINS.map((chain) => (
          <div
            key={chain.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">{chain.name}</p>
              <Badge>{chain.escalationTarget}</Badge>
            </div>
            {chain.levels.map((level) => (
              <p
                key={`${chain.id}-${level.role}`}
                className="mt-2 text-sm text-slate-400"
              >
                {level.role}: {level.condition}, {level.timeoutMinutes} мин.
              </p>
            ))}
          </div>
        ))}
      </PanelCard>
    </div>
  );
}

function LocalizationCenter() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <PanelCard
        title="Терминологический словарь"
        icon={<BookOpen className="h-5 w-5" />}
      >
        {LOCALIZATION_TERMS.map((term) => (
          <div
            key={term.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">
                {term.source} → {term.ru}
              </p>
              <Badge>{term.approved ? "утверждено" : "черновик"}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-400">Домен: {term.domain}</p>
          </div>
        ))}
      </PanelCard>
      <PanelCard
        title="Архитектура локализации"
        icon={<Globe2 className="h-5 w-5" />}
      >
        <FlowLine
          title="Центральные переводы"
          text="Все термины интерфейса и документов проходят через единый словарь без английских утечек."
        />
        <FlowLine
          title="Промышленная терминология"
          text="Используются русские термины лифтового сервиса: заказ-наряд, НСИ, шильдик, эскалация, списание."
        />
        <FlowLine
          title="Контроль качества"
          text="Валидация блокирует публикацию шаблонов и уведомлений с неутвержденной терминологией."
        />
      </PanelCard>
    </div>
  );
}

function TemplateManagement() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <PanelCard title="Шаблоны" icon={<FileCog className="h-5 w-5" />}>
        {TEMPLATE_CONFIGURATIONS.map((template) => (
          <div
            key={template.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">{template.name}</p>
              <Badge>{template.type}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Связи: {template.linkedEntities.join(", ")} · v{template.version}
            </p>
          </div>
        ))}
      </PanelCard>
      <PanelCard
        title="Импорт и экспорт"
        icon={<FileDown className="h-5 w-5" />}
      >
        {IMPORT_EXPORT_JOBS.map((job) => (
          <div
            key={job.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">{job.type}</p>
              <Badge>{job.status}</Badge>
            </div>
            <Progress value={job.progress} className="mt-3" />
            <p className="mt-2 text-sm text-slate-500">
              {job.records} записей · {job.error ?? "без ошибок"}
            </p>
          </div>
        ))}
      </PanelCard>
    </div>
  );
}

function AuditAndImportCenter() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <PanelCard
        title="Неизменяемый аудит"
        icon={<History className="h-5 w-5" />}
      >
        {CONFIG_AUDIT_LOGS.map((log) => (
          <div
            key={log.id}
            className="mb-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">
                {log.action} · {log.entityId}
              </p>
              <span className="text-xs text-slate-500">
                {new Date(log.createdAt).toLocaleTimeString("ru-RU")}
              </span>
            </div>
            <p className="mt-1 text-slate-400">{log.details}</p>
            <p className="mt-1 font-mono text-xs text-slate-600">
              {log.immutableHash}
            </p>
          </div>
        ))}
      </PanelCard>
      <PanelCard title="Валидация" icon={<AlertTriangle className="h-5 w-5" />}>
        {VALIDATION_WARNINGS.map((warning) => (
          <div
            key={warning.id}
            className={cn(
              "mb-2 rounded-2xl border p-3 text-sm",
              warning.severity === "критично"
                ? "border-red-400/30 bg-red-500/10"
                : "border-orange-400/30 bg-orange-500/10",
            )}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{warning.entityId}</p>
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

function RightGovernancePanel() {
  const selectedEntityId = useConfigStore((state) => state.selectedEntityId);
  const impacts = IMPACT_ANALYSIS.filter(
    (impact) =>
      impact.entityId === selectedEntityId || impact.impact === "critical",
  );
  const warnings = VALIDATION_WARNINGS.filter(
    (warning) => warning.entityId === selectedEntityId,
  );
  return (
    <aside className="space-y-4 border-t border-slate-800 bg-slate-950/55 p-4 2xl:border-l 2xl:border-t-0">
      <PanelBlock title="Зависимости" icon={<Network className="h-4 w-4" />}>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
          <p className="font-semibold text-white">
            Выбрано: {selectedEntityId}
          </p>
          <p className="mt-2 text-slate-500">
            Индексы зависимостей связывают типы работ, SLA, роли, approvals,
            материалы и шаблоны.
          </p>
        </div>
      </PanelBlock>
      <PanelBlock
        title="Impact analysis"
        icon={<BrainCircuit className="h-4 w-4" />}
      >
        {impacts.map((impact) => (
          <div
            key={impact.id}
            className="mb-2 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{impact.entityId}</p>
              <Badge>{impact.impact}</Badge>
            </div>
            <p className="mt-1 text-slate-400">{impact.summary}</p>
            <p className="mt-1 text-xs text-slate-500">
              объекты {impact.affectedObjects} · workflows{" "}
              {impact.affectedWorkflows} · роли {impact.affectedRoles}
            </p>
          </div>
        ))}
      </PanelBlock>
      <PanelBlock
        title="Предупреждения"
        icon={<AlertTriangle className="h-4 w-4" />}
      >
        {warnings.length ? (
          warnings.map((warning) => (
            <div
              key={warning.id}
              className="mb-2 rounded-2xl border border-orange-400/30 bg-orange-500/10 p-3 text-sm"
            >
              <p className="font-semibold text-white">{warning.message}</p>
              <p className="mt-1 text-slate-500">{warning.recommendation}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">
            Нет предупреждений по выбранной сущности
          </p>
        )}
      </PanelBlock>
      <PanelBlock title="История аудита" icon={<History className="h-4 w-4" />}>
        {CONFIG_AUDIT_LOGS.slice(0, 3).map((log) => (
          <div
            key={log.id}
            className="mb-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"
          >
            <p className="font-semibold text-white">{log.actor}</p>
            <p className="mt-1 text-slate-500">{log.details}</p>
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
          <span className="text-fuchsia-300">{icon}</span>
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

function FlowLine({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
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

function StatusBadge({ status }: { status: ConfigStatus }) {
  const cls =
    status === "blocked"
      ? "bg-red-500/15 text-red-200"
      : status === "requires_review" || status === "draft"
        ? "bg-orange-500/15 text-orange-200"
        : status === "active"
          ? "bg-emerald-500/15 text-emerald-200"
          : "bg-slate-500/15 text-slate-300";
  return <Badge className={cls}>{status}</Badge>;
}

function ValidationBadge({ status }: { status: ValidationStatus }) {
  const cls =
    status === "error"
      ? "bg-red-500/15 text-red-200"
      : status === "warning" || status === "pending"
        ? "bg-orange-500/15 text-orange-200"
        : "bg-emerald-500/15 text-emerald-200";
  const Icon = status === "valid" ? CheckCircle2 : AlertTriangle;
  return (
    <Badge className={cls}>
      <Icon className="h-3 w-3" /> {status}
    </Badge>
  );
}
