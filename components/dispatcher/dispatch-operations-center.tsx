"use client";

import { useMemo } from "react";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  Clock3,
  GitMerge,
  MapPin,
  Navigation,
  RadioTower,
  RefreshCw,
  Route,
  ShieldAlert,
  TimerReset,
  Truck,
  UserCheck,
  Users,
  Wifi,
  Wrench,
  Zap,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  DISPATCH_ENGINE_FACTORS,
  QUEUE_ARCHITECTURE,
  REALTIME_DISPATCH_STREAMS,
  SCHEDULING_ENGINE_CAPABILITIES,
  aiDispatchRecommendationsSeed,
  assignmentSuggestionsSeed,
  detectScheduleConflicts,
  dispatchEventsSeed,
  dispatchQueueSeed,
  emergencyDispatchSeed,
  geoZonesSeed,
  reassignmentsSeed,
  routePlansSeed,
  scheduleConflictsSeed,
  scoreAssignment,
  technicianSchedulesSeed,
  travelEstimatesSeed,
  type Assignment,
  type DispatchPriority,
  type DispatchQueueItem,
  type TechnicianSchedule,
} from "@/lib/dispatch/orchestration-platform";

type BoardFilter = "all" | DispatchPriority | "breach_risk" | "unassigned" | "reassignment";

type DispatchUiState = {
  selectedJobId: string;
  selectedTechnicianId: string;
  filter: BoardFilter;
  search: string;
  realtimeMode: "live" | "replay" | "degraded";
  setSelectedJobId: (id: string) => void;
  setSelectedTechnicianId: (id: string) => void;
  setFilter: (filter: BoardFilter) => void;
  setSearch: (search: string) => void;
  setRealtimeMode: (mode: "live" | "replay" | "degraded") => void;
};

const useDispatchUiStore = create<DispatchUiState>((set) => ({
  selectedJobId: dispatchQueueSeed[0].id,
  selectedTechnicianId: technicianSchedulesSeed[1].technicianId,
  filter: "all",
  search: "",
  realtimeMode: "live",
  setSelectedJobId: (id) => set({ selectedJobId: id }),
  setSelectedTechnicianId: (id) => set({ selectedTechnicianId: id }),
  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
  setRealtimeMode: (mode) => set({ realtimeMode: mode }),
}));

const dispatchQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 8_000,
      refetchInterval: 12_000,
      refetchOnWindowFocus: false,
    },
  },
});

const priorityTone: Record<DispatchPriority, "default" | "info" | "warning" | "danger" | "muted"> = {
  routine: "muted",
  planned: "info",
  urgent: "warning",
  emergency: "danger",
};

function useDispatchPlatformData() {
  return useQuery({
    queryKey: ["dispatch", "operations-center"],
    queryFn: () => Promise.resolve({
      queue: dispatchQueueSeed,
      technicians: technicianSchedulesSeed,
      assignments: assignmentSuggestionsSeed,
      routes: routePlansSeed,
      conflicts: scheduleConflictsSeed,
      events: dispatchEventsSeed,
      reassignments: reassignmentsSeed,
      emergencies: emergencyDispatchSeed,
      recommendations: aiDispatchRecommendationsSeed,
      zones: geoZonesSeed,
      travel: travelEstimatesSeed,
    }),
  });
}

function SignalCard({ label, value, hint, icon: Icon, tone = "info" }: { label: string; value: string; hint: string; icon: typeof Activity; tone?: "info" | "success" | "warning" | "danger" }) {
  const color = tone === "danger" ? "text-red-200 border-red-400/30 bg-red-400/10" : tone === "warning" ? "text-amber-200 border-amber-400/30 bg-amber-400/10" : tone === "success" ? "text-green-200 border-green-400/30 bg-green-400/10" : "text-blue-200 border-blue-400/30 bg-blue-400/10";
  return (
    <Card className="bg-slate-950/70">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{hint}</p>
        </div>
        <span className={cn("rounded-2xl border p-2", color)}><Icon className="h-5 w-5" /></span>
      </CardContent>
    </Card>
  );
}

function LeftDispatchPanel({ queue, technicians }: { queue: DispatchQueueItem[]; technicians: TechnicianSchedule[] }) {
  const setFilter = useDispatchUiStore((state) => state.setFilter);
  const selectedFilter = useDispatchUiStore((state) => state.filter);
  const availableMechanics = technicians.filter((tech) => tech.availability === "available" || tech.availability === "in_route").length;
  const groups = [
    { id: "unassigned" as BoardFilter, label: "Unassigned jobs", value: queue.filter((job) => job.state === "new" || job.state === "triaged").length, icon: GitMerge, tone: "info" as const },
    { id: "breach_risk" as BoardFilter, label: "SLA risks", value: queue.filter((job) => job.sla.breachProbability > 35).length, icon: TimerReset, tone: "danger" as const },
    { id: "emergency" as BoardFilter, label: "Emergency queue", value: queue.filter((job) => job.priority === "emergency").length, icon: ShieldAlert, tone: "danger" as const },
    { id: "all" as BoardFilter, label: "Available mechanics", value: availableMechanics, icon: Users, tone: "success" as const },
    { id: "urgent" as BoardFilter, label: "Delayed jobs", value: queue.filter((job) => job.state === "delayed").length, icon: Clock3, tone: "warning" as const },
    { id: "reassignment" as BoardFilter, label: "Reassignment queue", value: reassignmentsSeed.length, icon: RefreshCw, tone: "warning" as const },
  ];

  return (
    <aside className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><RadioTower className="h-4 w-4 text-orange-300" /> Dispatch queues</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {groups.map((group) => {
            const Icon = group.icon;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setFilter(group.id)}
                className={cn("w-full rounded-xl border p-3 text-left transition hover:border-orange-400/60", selectedFilter === group.id ? "border-orange-400 bg-orange-400/10" : "border-slate-800 bg-slate-950/60")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-bold text-slate-100"><Icon className="h-4 w-4" /> {group.label}</span>
                  <Badge tone={group.tone}>{group.value}</Badge>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Geo zones</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {geoZonesSeed.map((zone) => (
            <div key={zone.id} className="rounded-xl border border-slate-800 bg-navy-900 p-3 text-sm">
              <div className="flex items-center justify-between gap-2"><span className="font-bold text-slate-100">{zone.name}</span><Badge tone={zone.slaRiskCount > 4 ? "danger" : "warning"}>{zone.slaRiskCount} SLA</Badge></div>
              <p className="mt-1 text-xs text-slate-500">{zone.polygonLabel} · ETA {zone.averageEtaMinutes} min</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-300"><span>{zone.activeJobs} jobs</span><span>{zone.availableMechanics} mechanics</span></div>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

function JobCard({ job, selected, onSelect, assignment }: { job: DispatchQueueItem; selected: boolean; onSelect: () => void; assignment?: Assignment }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn("w-full rounded-2xl border p-4 text-left transition hover:border-orange-400/60", selected ? "border-orange-400 bg-orange-400/10" : "border-slate-800 bg-slate-950/70")}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-black text-slate-50">{job.workOrderNumber}</p>
          <p className="mt-1 text-sm text-slate-400">{job.address}</p>
        </div>
        <Badge tone={priorityTone[job.priority]}>{job.priority}</Badge>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-slate-400 md:grid-cols-3">
        <span><TimerReset className="mr-1 inline h-3 w-3" /> {job.sla.minutesRemaining} min SLA</span>
        <span><Wrench className="mr-1 inline h-3 w-3" /> {job.controller}</span>
        <span><MapPin className="mr-1 inline h-3 w-3" /> {job.geoZoneId}</span>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-slate-500"><span>SLA breach probability</span><span>{job.sla.breachProbability}%</span></div>
        <Progress value={job.sla.breachProbability} className="mt-1" />
      </div>
      {assignment ? <p className="mt-3 text-xs text-green-200">Suggested: {assignment.technicianId} · score {assignment.score} · route +{assignment.routeImpactMinutes}m</p> : null}
    </button>
  );
}

function TimelineBoard({ queue, technicians, assignments }: { queue: DispatchQueueItem[]; technicians: TechnicianSchedule[]; assignments: Assignment[] }) {
  const selectedJobId = useDispatchUiStore((state) => state.selectedJobId);
  const selectedTechnicianId = useDispatchUiStore((state) => state.selectedTechnicianId);
  const setSelectedJobId = useDispatchUiStore((state) => state.setSelectedJobId);
  const setSelectedTechnicianId = useDispatchUiStore((state) => state.setSelectedTechnicianId);
  const filter = useDispatchUiStore((state) => state.filter);
  const search = useDispatchUiStore((state) => state.search);

  const visibleQueue = useMemo(() => queue.filter((job) => {
    const matchesSearch = !search || `${job.workOrderNumber} ${job.address} ${job.customer} ${job.controller}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || job.priority === filter || job.state === filter || (filter === "unassigned" && ["new", "triaged"].includes(job.state)) || (filter === "reassignment" && reassignmentsSeed.some((item) => item.affectedJobs.includes(job.id)));
    return matchesSearch && matchesFilter;
  }), [filter, queue, search]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-orange-300" /> Operational scheduling board</CardTitle>
          <div className="flex flex-wrap gap-2"><Badge tone="success">timeline scheduling</Badge><Badge tone="info">route-aware</Badge><Badge tone="warning">conflict detection</Badge></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="space-y-3" aria-label="Dispatch queue">
            {visibleQueue.map((job) => (
              <JobCard key={job.id} job={job} selected={selectedJobId === job.id} onSelect={() => setSelectedJobId(job.id)} assignment={assignments.find((assignment) => assignment.queueItemId === job.id)} />
            ))}
          </section>
          <section className="space-y-3" aria-label="Technician timeline">
            {technicians.map((technician) => {
              const score = selectedJobId ? scoreAssignment(queue.find((job) => job.id === selectedJobId) ?? queue[0], technician) : 0;
              return (
                <button key={technician.technicianId} type="button" onClick={() => setSelectedTechnicianId(technician.technicianId)} className={cn("w-full rounded-2xl border p-4 text-left transition hover:border-orange-400/60", selectedTechnicianId === technician.technicianId ? "border-orange-400 bg-orange-400/10" : "border-slate-800 bg-navy-900")}> 
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div><p className="font-black text-slate-50">{technician.name}</p><p className="mt-1 text-sm text-slate-400">{technician.availability} · {technician.currentAddress}</p></div>
                    <Badge tone={technician.availability === "sick" || technician.availability === "off_shift" ? "danger" : technician.loadPercent > 80 ? "warning" : "success"}>{technician.loadPercent}% load</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-400 md:grid-cols-3">
                    <span><Users className="mr-1 inline h-3 w-3" /> {technician.activeAssignments} jobs</span>
                    <span><Clock3 className="mr-1 inline h-3 w-3" /> {technician.shift.startsAt}-{technician.shift.endsAt}</span>
                    <span><BrainCircuit className="mr-1 inline h-3 w-3" /> match {score}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {technician.skills.brands.map((brand) => <Badge key={brand} tone="muted">{brand}</Badge>)}
                    {technician.skills.emergencyAuthorized ? <Badge tone="danger">emergency auth</Badge> : null}
                  </div>
                </button>
              );
            })}
          </section>
        </div>
        <Alert tone="info"><Wifi className="mr-2 inline h-4 w-4" /> WebSocket streams publish assignment confirmations, mechanic accept/reject, ETA changes, SLA risk transitions and schedule version updates.</Alert>
      </CardContent>
    </Card>
  );
}

function RightOrchestrationPanel({ selectedJob, selectedTechnician }: { selectedJob: DispatchQueueItem; selectedTechnician: TechnicianSchedule }) {
  const queryClient = useQueryClient();
  const conflicts = detectScheduleConflicts(selectedJob, selectedTechnician);
  const recommendations = aiDispatchRecommendationsSeed.filter((item) => item.queueItemId === selectedJob.id);
  const routePlan = routePlansSeed.find((route) => route.technicianId === selectedTechnician.technicianId);

  function confirmAssignment() {
    queryClient.setQueryData(["dispatch", "last-confirmed"], { jobId: selectedJob.id, technicianId: selectedTechnician.technicianId, confirmedAt: new Date().toISOString() });
  }

  return (
    <aside className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-orange-300" /> Mechanic load</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between"><span className="font-bold text-slate-100">{selectedTechnician.name}</span><Badge tone="info">{selectedTechnician.availability}</Badge></div>
          <Progress value={selectedTechnician.loadPercent} />
          <p className="text-slate-400">{selectedTechnician.activeAssignments} active assignments · overtime {selectedTechnician.shift.overtimeMinutes} min · on-call {selectedTechnician.shift.onCall ? "yes" : "no"}</p>
          <Button type="button" className="w-full" onClick={confirmAssignment}><CheckCircle2 className="h-4 w-4" /> Confirm assignment</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><TimerReset className="h-4 w-4 text-orange-300" /> SLA countdowns</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-3"><p className="font-black text-red-100">{selectedJob.sla.minutesRemaining} minutes remaining</p><p className="text-xs text-red-200/80">Breach probability {selectedJob.sla.breachProbability}% · escalation L{selectedJob.sla.escalationLevel}</p></div>
          <p className="text-slate-400">Response due {selectedJob.sla.responseDueAt}; completion due {selectedJob.sla.completionDueAt}.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Route className="h-4 w-4 text-orange-300" /> Route impact</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {routePlan ? <><p className="text-slate-300">Travel {routePlan.totalTravelMinutes}m · work {routePlan.totalWorkMinutes}m · risk {routePlan.routeRisk}</p>{routePlan.stops.map((stop) => <div key={stop.id} className="rounded-xl border border-slate-800 bg-navy-900 p-2 text-xs text-slate-400">#{stop.sequence} {stop.queueItemId} ETA {stop.eta} · SLA impact {stop.slaImpactMinutes}m</div>)}</> : <p className="text-slate-500">No route built for selected mechanic.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-orange-300" /> AI recommendations</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {recommendations.map((recommendation) => (
            <div key={recommendation.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm">
              <div className="flex items-center justify-between"><span className="font-bold text-slate-100">{recommendation.preferredTechnicianId}</span><Badge tone="success">{recommendation.confidence}%</Badge></div>
              <div className="mt-2 space-y-1 text-xs text-slate-400">{recommendation.reasons.map((reason) => <p key={reason}>• {reason}</p>)}</div>
              {recommendation.risks.map((risk) => <Badge key={risk} tone="warning" className="mt-2 mr-1">{risk}</Badge>)}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-300" /> Conflict warnings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {conflicts.length ? conflicts.map((conflict) => <Alert key={conflict.id} tone={conflict.severity === "critical" ? "danger" : "warning"}>{conflict.message}<br /><span className="text-xs opacity-80">Resolution: {conflict.resolution}</span></Alert>) : <Alert tone="success">No conflicts detected for selected mechanic and job.</Alert>}
        </CardContent>
      </Card>
    </aside>
  );
}

function ArchitecturePanel() {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card><CardHeader><CardTitle>Dispatch engine</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-slate-300">{DISPATCH_ENGINE_FACTORS.map((factor) => <p key={factor}>• {factor}</p>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Scheduling engine</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-slate-300">{SCHEDULING_ENGINE_CAPABILITIES.map((capability) => <p key={capability}>• {capability}</p>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Realtime & queues</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-slate-300">{QUEUE_ARCHITECTURE.slice(0, 3).map((queue) => <p key={queue.name}>• {queue.name}: {queue.jobs.join(", ")}</p>)}</CardContent></Card>
    </div>
  );
}

function EventStreamPanel() {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-orange-300" /> Realtime dispatch stream</CardTitle></CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-2">
          {dispatchEventsSeed.map((event) => <div key={event.id} className="rounded-xl border border-slate-800 bg-navy-900 p-3 text-sm"><div className="flex items-center justify-between"><Badge tone="info">{event.type}</Badge><span className="text-xs text-slate-500">{event.occurredAt}</span></div><p className="mt-2 text-slate-300">{event.message}</p><p className="mt-1 font-mono text-xs text-slate-600">{event.auditHash}</p></div>)}
        </div>
        <div className="space-y-2">
          {REALTIME_DISPATCH_STREAMS.map((stream) => <div key={stream} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 font-mono text-xs text-blue-200">{stream}</div>)}
        </div>
      </CardContent>
    </Card>
  );
}

function DispatchOperationsInner() {
  const { data, isLoading, isError, refetch, isFetching } = useDispatchPlatformData();
  const filter = useDispatchUiStore((state) => state.filter);
  const search = useDispatchUiStore((state) => state.search);
  const setFilter = useDispatchUiStore((state) => state.setFilter);
  const setSearch = useDispatchUiStore((state) => state.setSearch);
  const realtimeMode = useDispatchUiStore((state) => state.realtimeMode);
  const setRealtimeMode = useDispatchUiStore((state) => state.setRealtimeMode);
  const selectedJobId = useDispatchUiStore((state) => state.selectedJobId);
  const selectedTechnicianId = useDispatchUiStore((state) => state.selectedTechnicianId);

  if (isLoading || !data) return <main className="min-h-screen bg-navy-950 p-4 text-slate-100"><div className="mx-auto max-w-[100rem] space-y-4"><div className="h-28 animate-pulse rounded-2xl bg-graphite-900" /><div className="h-[38rem] animate-pulse rounded-2xl bg-graphite-900" /></div></main>;
  if (isError) return <main className="min-h-screen bg-navy-950 p-4 text-slate-100"><Alert tone="danger">Dispatch platform data stream failed. Reconnect websocket and reload schedule snapshot.</Alert></main>;

  const selectedJob = data.queue.find((job) => job.id === selectedJobId) ?? data.queue[0];
  const selectedTechnician = data.technicians.find((tech) => tech.technicianId === selectedTechnicianId) ?? data.technicians[0];

  return (
    <main className="min-h-screen bg-navy-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-navy-950/95 px-3 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[100rem] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300">НеоЛифт Dispatch Operations Center</p>
            <h1 className="mt-1 text-2xl font-black text-white md:text-3xl">Field workforce orchestration & realtime scheduling</h1>
            <p className="mt-1 max-w-4xl text-sm text-slate-400">Industrial dispatch center for SLA-driven assignment, emergency rerouting, skill matching, workload balancing, shift control and route-aware schedule rebuilds.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={realtimeMode} onChange={(event) => setRealtimeMode(event.target.value as "live" | "replay" | "degraded")} className="w-36"><option value="live">Live stream</option><option value="replay">Replay cursor</option><option value="degraded">Degraded</option></Select>
            <Button type="button" variant="secondary" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} /> Refresh</Button>
            <Button type="button"><Zap className="h-4 w-4" /> Emergency rebuild</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[100rem] space-y-5 px-3 py-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SignalCard label="Active jobs" value="184" hint="hundreds-ready virtualized queue" icon={Truck} tone="info" />
          <SignalCard label="SLA risks" value="13" hint="realtime countdowns" icon={TimerReset} tone="danger" />
          <SignalCard label="Available mechanics" value="19" hint="skills + shift filtered" icon={Users} tone="success" />
          <SignalCard label="Reassignments" value="6" hint="sick leave and delay queue" icon={GitMerge} tone="warning" />
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_14rem]">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search jobs, addresses, customers, controllers..." />
          <Select value={filter} onChange={(event) => setFilter(event.target.value as BoardFilter)}>
            <option value="all">All dispatch</option>
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
            <option value="planned">Planned</option>
            <option value="breach_risk">SLA risk</option>
            <option value="unassigned">Unassigned</option>
            <option value="reassignment">Reassignment</option>
          </Select>
        </div>

        <div className="grid gap-5 xl:grid-cols-[20rem_minmax(0,1fr)_25rem]">
          <LeftDispatchPanel queue={data.queue} technicians={data.technicians} />
          <section className="space-y-4">
            <TimelineBoard queue={data.queue} technicians={data.technicians} assignments={data.assignments} />
            <ArchitecturePanel />
            <EventStreamPanel />
          </section>
          <RightOrchestrationPanel selectedJob={selectedJob} selectedTechnician={selectedTechnician} />
        </div>
      </div>
    </main>
  );
}

export function DispatchOperationsCenter() {
  return (
    <QueryClientProvider client={dispatchQueryClient}>
      <DispatchOperationsInner />
    </QueryClientProvider>
  );
}
