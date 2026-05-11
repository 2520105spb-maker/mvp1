"use client";

import { ReactNode, useMemo } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { create } from "zustand";
import {
  AlertTriangle,
  BadgeCheck,
  BellRing,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Gauge,
  KeyRound,
  MapPin,
  RadioTower,
  ShieldCheck,
  Siren,
  TimerReset,
  UserCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ACCESS_POLICIES,
  CERTIFICATIONS,
  EMPLOYEE_AUDIT_EVENTS,
  EMPLOYEE_DOCUMENTS,
  EMPLOYEES,
  MECHANIC_ASSIGNMENTS,
  ON_CALL_SCHEDULES,
  PERFORMANCE_METRICS,
  SHIFTS,
  TEAMS,
  TERRITORIES,
  buildWorkforceRows,
} from "@/lib/workforce/workforce-data";
import type { Employee, WorkforceRow } from "@/lib/workforce/types";

type EmployeeTab = "profile" | "roles" | "skills" | "certifications" | "objects" | "history" | "kpi" | "schedule" | "on_call" | "documents" | "audit";

type WorkforceState = {
  query: string;
  selectedEmployeeId: string;
  activeTab: EmployeeTab;
  setQuery: (query: string) => void;
  selectEmployee: (employeeId: string) => void;
  setActiveTab: (tab: EmployeeTab) => void;
};

const useWorkforceStore = create<WorkforceState>((set) => ({
  query: "",
  selectedEmployeeId: "emp-022",
  activeTab: "profile",
  setQuery: (query) => set({ query }),
  selectEmployee: (selectedEmployeeId) => set({ selectedEmployeeId, activeTab: "profile" }),
  setActiveTab: (activeTab) => set({ activeTab }),
}));

const queryClient = new QueryClient();

const employeeTabs: EmployeeTab[] = ["profile", "roles", "skills", "certifications", "objects", "history", "kpi", "schedule", "on_call", "documents", "audit"];
const tabLabels: Record<EmployeeTab, string> = {
  profile: "Профиль",
  roles: "Роли и права",
  skills: "Навыки",
  certifications: "Сертификаты",
  objects: "Объекты",
  history: "История работ",
  kpi: "KPI",
  schedule: "График",
  on_call: "Дежурства",
  documents: "Документы",
  audit: "Аудит действий",
};

export function WorkforceOperationsModule() {
  return (
    <QueryClientProvider client={queryClient}>
      <WorkforceOperationsInner />
    </QueryClientProvider>
  );
}

function WorkforceOperationsInner() {
  const query = useWorkforceStore((state) => state.query);
  const setQuery = useWorkforceStore((state) => state.setQuery);
  const { data: rows = [] } = useQuery({ queryKey: ["workforce-rows"], queryFn: async () => buildWorkforceRows() });
  const filteredRows = rows.filter((row) => [row.employee.name, row.employee.role, row.employee.region, row.team.name, row.user.email, ...row.territories.map((territory) => territory.zone)].join(" ").toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-400/40 bg-orange-500/15 text-orange-300"><BriefcaseBusiness className="h-6 w-6" /></div>
              <div><p className="text-xs uppercase tracking-[0.28em] text-slate-500">enterprise workforce center</p><h1 className="text-2xl font-black tracking-tight text-white">User Management, Employee Operations & Workforce</h1></div>
            </div>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">Industrial personnel operations platform для механиков, диспетчеров, склада, руководителей, ролей, допусков, навыков, территорий, графиков, KPI, дежурств и granular object access.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="border-emerald-400/30 bg-emerald-500/10 text-emerald-200"><ShieldCheck className="h-3 w-3" /> RBAC inheritance</Badge>
            <Badge className="border-orange-400/30 bg-orange-500/10 text-orange-200"><RadioTower className="h-3 w-3" /> realtime status</Badge>
          </div>
        </div>
        <div className="mt-4"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск сотрудника, роли, региона, команды, email, территории..." /></div>
      </header>
      <div className="grid min-h-[calc(100vh-150px)] grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)_380px]">
        <LeftWorkforcePanel rows={rows} />
        <section className="min-w-0 border-slate-800 p-4 lg:border-l lg:p-6"><WorkforceWorkspace rows={filteredRows} /></section>
        <RightWorkforcePanel />
      </div>
    </main>
  );
}

function LeftWorkforcePanel({ rows }: { rows: WorkforceRow[] }) {
  const onlineMechanics = rows.filter((row) => row.employee.role.includes("mechanic") && row.employee.onlineStatus !== "offline");
  const absent = rows.filter((row) => row.employee.status === "vacation" || row.employee.status === "sick_leave");
  return (
    <aside className="space-y-4 border-b border-slate-800 bg-slate-950/45 p-4 lg:border-b-0">
      <PanelBlock title="Команды" icon={<Users className="h-4 w-4" />}>
        <div className="space-y-2">{TEAMS.map((team) => <div key={team.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm"><div className="flex items-center justify-between"><p className="font-semibold text-white">{team.name}</p><RiskBadge risk={team.slaRisk} /></div><p className="mt-1 text-xs text-slate-500">{team.region} · {team.memberIds.length} сотрудников</p></div>)}</div>
      </PanelBlock>
      <PanelBlock title="Регионы" icon={<MapPin className="h-4 w-4" />}>
        <div className="grid gap-2">{TERRITORIES.map((territory) => <div key={territory.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs"><p className="font-semibold text-slate-200">{territory.zone}</p><p className="mt-1 text-slate-500">{territory.objectIds.length} objects · dispatcher {territory.dispatcherId}</p></div>)}</div>
      </PanelBlock>
      <PanelBlock title="Дежурства и online" icon={<Siren className="h-4 w-4" />}>
        <div className="grid gap-2 text-sm"><InfoLine label="Online mechanics" value={`${onlineMechanics.length}`} /><InfoLine label="On-call windows" value={`${ON_CALL_SCHEDULES.length}`} /><InfoLine label="Absent employees" value={`${absent.length}`} /></div>
      </PanelBlock>
      <PanelBlock title="SLA risk teams" icon={<AlertTriangle className="h-4 w-4" />}>
        <div className="space-y-2">{TEAMS.filter((team) => team.slaRisk !== "normal").map((team) => <div key={team.id} className="rounded-xl border border-orange-400/30 bg-orange-500/10 p-3 text-sm text-orange-100">{team.name} · {team.slaRisk}</div>)}</div>
      </PanelBlock>
    </aside>
  );
}

function WorkforceWorkspace({ rows }: { rows: WorkforceRow[] }) {
  return <div className="space-y-5"><WorkforceGrid rows={rows} /><EmployeeCard /></div>;
}

function WorkforceGrid({ rows }: { rows: WorkforceRow[] }) {
  const selectEmployee = useWorkforceStore((state) => state.selectEmployee);
  const columns = useMemo<ColumnDef<WorkforceRow>[]>(() => [
    { header: "Сотрудник", accessorFn: (row) => row.employee.name, cell: ({ row }) => <button onClick={() => selectEmployee(row.original.employee.id)} className="text-left font-semibold text-white hover:text-orange-200">{row.original.employee.name}<span className="block text-xs text-slate-500">{row.original.employee.personnelNumber}</span></button> },
    { header: "Роль", accessorFn: (row) => row.employee.role, cell: ({ row }) => <Badge>{row.original.employee.role}</Badge> },
    { header: "Регион", accessorFn: (row) => row.employee.region },
    { header: "Статус", accessorFn: (row) => row.employee.status },
    { header: "Смена", accessorFn: (row) => row.shift?.type ?? "—", cell: ({ row }) => <Badge className="bg-blue-500/15 text-blue-200">{row.original.shift?.type ?? "—"}</Badge> },
    { header: "Объекты", accessorFn: (row) => row.employee.assignedObjectIds.length, cell: ({ row }) => row.original.employee.assignedObjectIds.join(", ") },
    { header: "Активные заявки", accessorFn: (row) => row.employee.activeWorkOrders, cell: ({ row }) => <span className={row.original.employee.activeWorkOrders > 8 ? "text-orange-200" : "text-slate-300"}>{row.original.employee.activeWorkOrders}</span> },
    { header: "KPI", accessorFn: (row) => row.employee.kpiScore, cell: ({ row }) => <Score value={row.original.employee.kpiScore} /> },
    { header: "SLA", accessorFn: (row) => row.employee.slaPerformance, cell: ({ row }) => <Score value={row.original.employee.slaPerformance} /> },
    { header: "Online", accessorFn: (row) => row.employee.onlineStatus, cell: ({ row }) => <OnlineBadge status={row.original.employee.onlineStatus} /> },
  ], [selectEmployee]);
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });
  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader><CardTitle>Workforce operational grid</CardTitle></CardHeader>
      <CardContent><div className="overflow-x-auto rounded-2xl border border-slate-800"><table className="w-full min-w-[1120px] text-left text-sm"><thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-500">{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id} className="px-4 py-3">{flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map((row) => <tr key={row.id} className="border-t border-slate-800">{row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3 text-slate-300">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div></CardContent>
    </Card>
  );
}

function EmployeeCard() {
  const employeeId = useWorkforceStore((state) => state.selectedEmployeeId);
  const activeTab = useWorkforceStore((state) => state.activeTab);
  const setActiveTab = useWorkforceStore((state) => state.setActiveTab);
  const employee = EMPLOYEES.find((candidate) => candidate.id === employeeId) ?? EMPLOYEES[0];
  const metrics = PERFORMANCE_METRICS.find((candidate) => candidate.employeeId === employee.id) ?? PERFORMANCE_METRICS[0];
  const certifications = CERTIFICATIONS.filter((certification) => certification.employeeId === employee.id);
  const shifts = SHIFTS.filter((shift) => shift.employeeId === employee.id);
  const assignments = MECHANIC_ASSIGNMENTS.filter((assignment) => assignment.employeeId === employee.id);
  const docs = EMPLOYEE_DOCUMENTS.filter((doc) => doc.employeeId === employee.id);
  const policies = ACCESS_POLICIES.filter((policy) => policy.employeeId === employee.id);
  const audits = EMPLOYEE_AUDIT_EVENTS.filter((event) => event.employeeId === employee.id);

  return (
    <Card className="border-slate-800 bg-slate-950/70">
      <CardHeader><div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between"><div><CardTitle className="text-xl">Employee card — {employee.name}</CardTitle><p className="mt-2 text-sm text-slate-500">{employee.personnelNumber} · {employee.role} · {employee.department} · {employee.region}</p></div><OnlineBadge status={employee.onlineStatus} /></div></CardHeader>
      <CardContent className="space-y-4">
        <ScrollableTabs tabs={employeeTabs} active={activeTab} labels={tabLabels} onSelect={setActiveTab} />
        {activeTab === "profile" && <InfoGrid items={[["Role", employee.role], ["Department", employee.department], ["Region", employee.region], ["Status", employee.status], ["Active WO", `${employee.activeWorkOrders}`], ["Objects", employee.assignedObjectIds.join(", ")]]} />}
        {activeTab === "roles" && <CardList icon={<KeyRound className="h-4 w-4 text-orange-300" />} items={policies.map((policy) => ({ title: `${policy.scope}: ${policy.target}`, body: `${policy.permissions.join(", ")} · inherited ${policy.inheritedFrom ?? "direct"}` }))} />}
        {activeTab === "skills" && <CardList icon={<BadgeCheck className="h-4 w-4 text-orange-300" />} items={employee.skills.map((skill) => ({ title: skill.label, body: `${skill.level} · verified ${skill.verifiedAt}` }))} />}
        {activeTab === "certifications" && <CardList icon={<ShieldCheck className="h-4 w-4 text-orange-300" />} items={certifications.map((certification) => ({ title: certification.title, body: `${certification.status} · expires ${certification.expiresAt} · blocks assignment ${certification.blocksAssignment ? "yes" : "no"}` }))} />}
        {activeTab === "objects" && <CardList icon={<MapPin className="h-4 w-4 text-orange-300" />} items={assignments.map((assignment) => ({ title: assignment.objectAddress, body: `${assignment.elevatorTypes.join(", ")} · active WO ${assignment.activeWorkOrders} · emergency ${assignment.emergencyDuty}` }))} />}
        {activeTab === "history" && <CardList icon={<ClipboardCheck className="h-4 w-4 text-orange-300" />} items={[{ title: "WO-2841 аварийная заявка", body: "Дверной привод · фото до/после · SLA met" }, { title: "WO-2829 замена ролика", body: "Повторный ремонт, requires supervisor review" }]} />}
        {activeTab === "kpi" && <KpiPanel metrics={metrics} />}
        {activeTab === "schedule" && <CardList icon={<CalendarClock className="h-4 w-4 text-orange-300" />} items={shifts.map((shift) => ({ title: shift.type, body: `${new Date(shift.startsAt).toLocaleString("ru-RU")} — ${new Date(shift.endsAt).toLocaleString("ru-RU")} · overtime ${shift.overtimeMinutes}m` }))} />}
        {activeTab === "on_call" && <CardList icon={<Siren className="h-4 w-4 text-orange-300" />} items={ON_CALL_SCHEDULES.filter((item) => item.employeeId === employee.id).map((item) => ({ title: item.territoryId, body: `${new Date(item.startsAt).toLocaleString("ru-RU")} — priority ${item.emergencyPriority}` }))} />}
        {activeTab === "documents" && <CardList icon={<FileText className="h-4 w-4 text-orange-300" />} items={docs.map((doc) => ({ title: doc.title, body: `${doc.type} · updated ${doc.updatedAt} · ${doc.secure ? "secure" : "public"}` }))} />}
        {activeTab === "audit" && <CardList icon={<ShieldCheck className="h-4 w-4 text-orange-300" />} items={audits.map((audit) => ({ title: audit.action, body: `${audit.actor} · ${new Date(audit.happenedAt).toLocaleString("ru-RU")} · ${audit.risk}` }))} />}
      </CardContent>
    </Card>
  );
}

function RightWorkforcePanel() {
  const selectedEmployeeId = useWorkforceStore((state) => state.selectedEmployeeId);
  const selected = EMPLOYEES.find((candidate) => candidate.id === selectedEmployeeId) ?? EMPLOYEES[0];
  const certAlerts = CERTIFICATIONS.filter((certification) => certification.status === "expired" || certification.status === "expiring");
  const overload = EMPLOYEES.filter((employee) => employee.activeWorkOrders > 8);
  const selectedMetrics = PERFORMANCE_METRICS.find((metric) => metric.employeeId === selected.id) ?? PERFORMANCE_METRICS[0];
  return (
    <aside className="space-y-4 border-t border-slate-800 bg-slate-950/55 p-4 2xl:border-l 2xl:border-t-0">
      <PanelBlock title="Alerts" icon={<BellRing className="h-4 w-4" />}><div className="space-y-2"><AlertCard tone="danger" title="Expired certification" text="Денис Морозов: электробезопасность expired, assignment blocking enabled." /><AlertCard tone="warning" title="SLA risk team" text="Склад основной: SLA critical due material queue and absent backup." /></div></PanelBlock>
      <PanelBlock title="Expired certifications" icon={<TimerReset className="h-4 w-4" />}><div className="space-y-2">{certAlerts.map((cert) => <AlertCard key={cert.id} tone={cert.status === "expired" ? "danger" : "warning"} title={cert.title} text={`${cert.employeeId} · expires ${cert.expiresAt} · blocks ${cert.blocksAssignment}`} />)}</div></PanelBlock>
      <PanelBlock title="Overload warnings" icon={<Gauge className="h-4 w-4" />}><div className="space-y-2">{overload.map((employee) => <AlertCard key={employee.id} tone="warning" title={employee.name} text={`${employee.activeWorkOrders} active work orders · online ${employee.onlineStatus}`} />)}</div></PanelBlock>
      <PanelBlock title="AI workforce analytics" icon={<Bot className="h-4 w-4" />}><div className="space-y-2 text-sm text-slate-400"><Recommendation text={`Burnout risk for ${selected.name}: ${selectedMetrics.burnoutRisk}; balance active jobs and overtime.`} /><Recommendation text="Skill gap detected: only one mechanic has expert controller skill in South territory." /><Recommendation text="Smart dispatching should avoid assigning expired electrical safety mechanic to emergency elevator work." /></div></PanelBlock>
    </aside>
  );
}

function KpiPanel({ metrics }: { metrics: typeof PERFORMANCE_METRICS[number] }) {
  return <div className="grid gap-3 md:grid-cols-3"><Metric label="SLA score" value={`${metrics.slaScore}%`} /><Metric label="Avg repair" value={`${metrics.averageRepairMinutes}m`} /><Metric label="Return rate" value={`${metrics.returnRate}%`} /><Metric label="Material usage" value={`${metrics.materialOveruse}%`} /><Metric label="Photo quality" value={`${metrics.photoQuality}%`} /><Metric label="Repeat repairs" value={`${metrics.repeatRepairs}`} /><Metric label="Emergency response" value={`${metrics.emergencyResponseMinutes}m`} /><Metric label="WO 30d" value={`${metrics.workOrders30d}`} /><Metric label="Burnout" value={metrics.burnoutRisk} /></div>;
}

function ScrollableTabs<T extends string>({ tabs, active, labels, onSelect }: { tabs: T[]; active: T; labels: Record<T, string>; onSelect: (tab: T) => void }) {
  return <div className="flex gap-2 overflow-x-auto pb-1">{tabs.map((tab) => <button key={tab} onClick={() => onSelect(tab)} className={cn("shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold", active === tab ? "border-orange-400 bg-orange-500/10 text-orange-100" : "border-slate-800 bg-slate-900/60 text-slate-400")}>{labels[tab]}</button>)}</div>;
}

function CardList({ icon, items }: { icon: ReactNode; items: Array<{ title: string; body: string }> }) {
  return <div className="grid gap-3 md:grid-cols-2">{items.length > 0 ? items.map((item) => <div key={`${item.title}-${item.body}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm"><div className="mb-3">{icon}</div><p className="font-semibold text-white">{item.title}</p><p className="mt-1 text-slate-500">{item.body}</p></div>) : <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">No records for this employee.</div>}</div>;
}

function InfoGrid({ items }: { items: string[][] }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map(([label, value]) => <Metric key={label ?? value} label={label ?? "—"} value={value ?? "—"} />)}</div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-xl font-black text-white">{value}</p></div>;
}

function PanelBlock({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <section><h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">{icon}{title}</h3>{children}</section>;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3"><span className="text-slate-500">{label}</span><span className="font-bold text-white">{value}</span></div>;
}

function OnlineBadge({ status }: { status: Employee["onlineStatus"] }) {
  const cls = status === "emergency" ? "bg-red-500/15 text-red-200" : status === "on_site" || status === "en_route" ? "bg-orange-500/15 text-orange-200" : status === "online" ? "bg-emerald-500/15 text-emerald-200" : "bg-slate-800 text-slate-300";
  return <Badge className={cls}><UserCheck className="h-3 w-3" />{status}</Badge>;
}

function Score({ value }: { value: number }) {
  return <span className={value >= 90 ? "text-emerald-200" : value >= 80 ? "text-orange-200" : "text-red-200"}>{value}%</span>;
}

function RiskBadge({ risk }: { risk: "normal" | "watch" | "critical" }) {
  return <Badge className={risk === "critical" ? "bg-red-500/15 text-red-200" : risk === "watch" ? "bg-orange-500/15 text-orange-200" : "bg-emerald-500/15 text-emerald-200"}>{risk}</Badge>;
}

function AlertCard({ title, text, tone }: { title: string; text: string; tone: "warning" | "danger" }) {
  return <div className={cn("rounded-2xl border p-3 text-sm", tone === "danger" ? "border-red-400/30 bg-red-500/10" : "border-orange-400/30 bg-orange-500/10")}><p className="font-semibold text-white">{title}</p><p className="mt-1 text-slate-400">{text}</p></div>;
}

function Recommendation({ text }: { text: string }) {
  return <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3"><div className="mb-2 flex items-center gap-2 text-blue-100"><Bot className="h-4 w-4" /><span className="font-semibold">AI recommendation</span></div><p>{text}</p></div>;
}
