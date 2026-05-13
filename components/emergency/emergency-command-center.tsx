"use client";

import { useMemo } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  BellRing,
  BrainCircuit,
  Clock3,
  Gauge,
  MapPin,
  MessageSquareWarning,
  Navigation,
  PhoneCall,
  RadioTower,
  RefreshCw,
  Route,
  ShieldAlert,
  Siren,
  TimerReset,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
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
  CRITICAL_SLA_ENGINE,
  EMERGENCY_ARCHITECTURE,
  EMERGENCY_ORCHESTRATION_FACTORS,
  REALTIME_EMERGENCY_STREAMS,
  criticalAlertsSeed,
  emergencyAssignmentsSeed,
  emergencyGeoZonesSeed,
  emergencyIncidentsSeed,
  emergencyQueuesSeed,
  emergencyResponsesSeed,
  escalationChainsSeed,
  incidentAuditLogsSeed,
  incidentCommunicationsSeed,
  incidentTimelineSeed,
  predictIncidentRisk,
  scoreEmergencyAssignment,
  slaTimersSeed,
  type EmergencyIncident,
  type IncidentPriority,
} from "@/lib/emergency/emergency-operations-platform";

type EmergencyFilter = "all" | "critical" | "sla_risk" | "lost_contact" | "escalated";

type EmergencyUiState = {
  selectedIncidentId: string;
  filter: EmergencyFilter;
  commandMode: "dispatcher" | "coordinator" | "supervisor" | "director";
  query: string;
  setSelectedIncidentId: (id: string) => void;
  setFilter: (filter: EmergencyFilter) => void;
  setCommandMode: (mode: "dispatcher" | "coordinator" | "supervisor" | "director") => void;
  setQuery: (query: string) => void;
};

const useEmergencyUiStore = create<EmergencyUiState>((set) => ({
  selectedIncidentId: emergencyIncidentsSeed[0].id,
  filter: "all",
  commandMode: "dispatcher",
  query: "",
  setSelectedIncidentId: (id) => set({ selectedIncidentId: id }),
  setFilter: (filter) => set({ filter }),
  setCommandMode: (mode) => set({ commandMode: mode }),
  setQuery: (query) => set({ query }),
}));

const emergencyQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2_000,
      refetchInterval: 5_000,
      refetchOnWindowFocus: false,
    },
  },
});

function useEmergencyOperationsData() {
  return useQuery({
    queryKey: ["emergency", "command-center"],
    queryFn: () =>
      Promise.resolve({
        incidents: emergencyIncidentsSeed,
        assignments: emergencyAssignmentsSeed,
        timers: slaTimersSeed,
        chains: escalationChainsSeed,
        responses: emergencyResponsesSeed,
        queues: emergencyQueuesSeed,
        timeline: incidentTimelineSeed,
        alerts: criticalAlertsSeed,
        zones: emergencyGeoZonesSeed,
        communications: incidentCommunicationsSeed,
        audit: incidentAuditLogsSeed,
      }),
  });
}

function priorityTone(priority: IncidentPriority) {
  return priority === "critical" ? "danger" : priority === "high" ? "warning" : priority === "medium" ? "info" : "success";
}

function CommandMetric({ label, value, hint, icon: Icon, tone = "info" }: { label: string; value: string; hint: string; icon: typeof Siren; tone?: "info" | "success" | "warning" | "danger" }) {
  const toneClass = {
    info: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
    success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
    warning: "border-amber-400/30 bg-amber-500/10 text-amber-100",
    danger: "border-red-400/40 bg-red-500/15 text-red-100",
  }[tone];

  return (
    <Card className={cn("overflow-hidden", tone === "danger" && "shadow-[0_0_35px_rgba(239,68,68,0.18)]")}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("rounded-2xl border p-3", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
          <p className="text-2xl font-black text-slate-50">{value}</p>
          <p className="text-xs text-slate-400">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function IncidentCard({ incident, selected, onSelect }: { incident: EmergencyIncident; selected: boolean; onSelect: () => void }) {
  return (
    <button
      className={cn(
        "w-full rounded-2xl border p-3 text-left transition hover:border-red-400/70",
        selected ? "border-red-400 bg-red-500/15" : "border-slate-800 bg-slate-950/60",
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{incident.number}</p>
          <h3 className="mt-1 font-black text-slate-50">{incident.title}</h3>
        </div>
        <Badge tone={priorityTone(incident.priority)}>{incident.priority}</Badge>
      </div>
      <p className="mt-2 text-sm text-slate-300">{incident.objectName} · {incident.elevatorLabel}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <span className="rounded-xl bg-slate-900 p-2 text-slate-300">ETA <b className="text-slate-50">{incident.etaMinutes}m</b></span>
        <span className="rounded-xl bg-slate-900 p-2 text-slate-300">SLA <b className="text-slate-50">{incident.responseTargetMinutes}m</b></span>
        <span className="rounded-xl bg-slate-900 p-2 text-slate-300">Risk <b className="text-red-200">{incident.breachProbability}%</b></span>
      </div>
    </button>
  );
}

function EmergencyMap({ incident }: { incident: EmergencyIncident }) {
  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_50%_45%,rgba(239,68,68,0.22),transparent_22%),linear-gradient(135deg,rgba(15,23,42,1),rgba(2,6,23,1))]">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.12)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute left-[45%] top-[38%] flex h-24 w-24 items-center justify-center rounded-full border border-red-400/60 bg-red-500/20 text-red-100 shadow-[0_0_50px_rgba(239,68,68,0.35)]">
        <Siren className="h-10 w-10 animate-pulse" />
      </div>
      <div className="absolute left-[19%] top-[61%] rounded-2xl border border-cyan-400/40 bg-cyan-500/15 p-3 text-cyan-100">
        <Navigation className="mb-1 h-5 w-5" />
        Mechanic route · {incident.etaMinutes}m
      </div>
      <div className="absolute right-[16%] top-[18%] rounded-2xl border border-amber-400/40 bg-amber-500/15 p-3 text-amber-100">
        <AlertTriangle className="mb-1 h-5 w-5" />
        SLA risk corridor
      </div>
      <div className="absolute bottom-4 left-4 right-4 grid gap-3 md:grid-cols-4">
        {["incident stream", "mechanic movement", "ETA drift", "escalation ack"].map((label) => (
          <div key={label} className="rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-xs uppercase tracking-[0.18em] text-slate-400">
            <Wifi className="mb-2 h-4 w-4 text-emerald-300" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmergencyCommandCenterInner() {
  const { data } = useEmergencyOperationsData();
  const { selectedIncidentId, filter, commandMode, query, setSelectedIncidentId, setFilter, setCommandMode, setQuery } = useEmergencyUiStore();
  const operations = data ?? {
    incidents: emergencyIncidentsSeed,
    assignments: emergencyAssignmentsSeed,
    timers: slaTimersSeed,
    chains: escalationChainsSeed,
    responses: emergencyResponsesSeed,
    queues: emergencyQueuesSeed,
    timeline: incidentTimelineSeed,
    alerts: criticalAlertsSeed,
    zones: emergencyGeoZonesSeed,
    communications: incidentCommunicationsSeed,
    audit: incidentAuditLogsSeed,
  };

  const filteredIncidents = useMemo(() => {
    return operations.incidents.filter((incident) => {
      const matchesFilter = filter === "all" || incident.priority === filter || incident.status === filter || incident.scenario === filter;
      const matchesQuery = [incident.number, incident.title, incident.objectName, incident.address].join(" ").toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [filter, operations.incidents, query]);

  const selectedIncident = operations.incidents.find((incident) => incident.id === selectedIncidentId) ?? operations.incidents[0];
  const selectedTimer = operations.timers.find((timer) => timer.incidentId === selectedIncident.id) ?? operations.timers[0];
  const selectedAssignment = operations.assignments.find((assignment) => assignment.incidentId === selectedIncident.id) ?? operations.assignments[0];
  const selectedChain = operations.chains.find((chain) => chain.incidentId === selectedIncident.id) ?? operations.chains[0];
  const selectedResponse = operations.responses.find((response) => response.incidentId === selectedIncident.id) ?? operations.responses[0];
  const selectedCommunication = operations.communications.find((communication) => communication.incidentId === selectedIncident.id) ?? operations.communications[0];
  const selectedTimeline = operations.timeline.filter((event) => event.incidentId === selectedIncident.id);
  const selectedRisk = predictIncidentRisk(selectedIncident, selectedTimer);
  const assignmentScore = scoreEmergencyAssignment({ ...selectedAssignment, humanSafety: selectedIncident.humanSafety, escalationLevel: selectedIncident.escalationLevel });

  const criticalCount = operations.incidents.filter((incident) => incident.priority === "critical").length;
  const slaRiskCount = operations.incidents.filter((incident) => incident.status === "sla_risk" || incident.breachProbability >= 70).length;
  const offlineCount = operations.communications.filter((communication) => communication.status === "lost_contact").length;
  const delayedCount = operations.assignments.filter((assignment) => assignment.status === "failed" || assignment.geoAvailability !== "fresh").length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-red-500/20 bg-[linear-gradient(135deg,rgba(127,29,29,.42),rgba(15,23,42,.94))] px-4 py-5 lg:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="danger">EMERGENCY COMMAND</Badge>
              <Badge tone="warning">Realtime SLA</Badge>
              <Badge tone="info">Redis/WebSocket live</Badge>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">НеоЛифт Emergency Operations Platform</h1>
            <p className="mt-2 max-w-4xl text-sm text-slate-300 md:text-base">
              Industrial emergency command center for trapped passengers, critical SLA control, аварийный dispatch, escalation orchestration, mechanic coordination, and compliant incident response.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:w-[520px]">
            <CommandMetric label="critical" value={String(criticalCount)} hint="human safety priority" icon={Siren} tone="danger" />
            <CommandMetric label="SLA risks" value={String(slaRiskCount)} hint="breach predicted" icon={TimerReset} tone="warning" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 p-4 lg:grid-cols-[340px_minmax(0,1fr)_380px] lg:p-6">
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-red-300" /> Left command panel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Search incidents, objects, addresses" value={query} onChange={(event) => setQuery(event.target.value)} />
              <Select value={filter} onChange={(event) => setFilter(event.target.value as EmergencyFilter)}>
                <option value="all">All active incidents</option>
                <option value="critical">Critical queue</option>
                <option value="sla_risk">SLA risks</option>
                <option value="lost_contact">Lost contact</option>
                <option value="escalated">Escalation queue</option>
              </Select>
              <Select value={commandMode} onChange={(event) => setCommandMode(event.target.value as EmergencyUiState["commandMode"])}>
                <option value="dispatcher">Dispatcher command mode</option>
                <option value="coordinator">Emergency coordinator</option>
                <option value="supervisor">Supervisor escalation</option>
                <option value="director">Director oversight</option>
              </Select>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3"><b>{criticalCount}</b><br />critical queue</div>
                <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3"><b>{slaRiskCount}</b><br />SLA risks</div>
                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3"><b>{offlineCount}</b><br />offline mechanics</div>
                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3"><b>{delayedCount}</b><br />delayed responses</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Active incident stream</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {filteredIncidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} selected={incident.id === selectedIncident.id} onSelect={() => setSelectedIncidentId(incident.id)} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Emergency queues</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {operations.queues.map((queue) => (
                <div key={queue.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between"><b>{queue.name}</b><Badge tone={queue.status === "saturated" ? "danger" : "warning"}>{queue.status}</Badge></div>
                  <p className="mt-1 text-xs text-slate-500">{queue.redisStream} · {queue.incidentIds.length}/{queue.concurrencyLimit} concurrent</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-4">
          <Alert tone="danger">
            <b>Fullscreen dispatcher alert behavior:</b> Critical trapped-passenger calls open this command center in focus mode, start the SLA timer immediately, select nearest certified mechanics, push the mechanic mobile alert, and continue escalation if ETA drifts.
          </Alert>

          <div className="grid gap-3 md:grid-cols-4">
            <CommandMetric label="selected SLA" value={`${selectedTimer.remainingMinutes}m`} hint={selectedTimer.state} icon={Clock3} tone={selectedTimer.remainingMinutes <= 0 ? "danger" : "warning"} />
            <CommandMetric label="ETA" value={`${selectedIncident.etaMinutes}m`} hint="traffic-aware route" icon={Route} tone="info" />
            <CommandMetric label="assignment" value={`${assignmentScore}%`} hint="orchestration score" icon={UserCheck} tone={assignmentScore > 80 ? "success" : "warning"} />
            <CommandMetric label="contact" value={selectedCommunication.status.replace("_", " ")} hint={`${selectedCommunication.failedPushCount} failed push`} icon={selectedCommunication.status === "lost_contact" ? WifiOff : Wifi} tone={selectedCommunication.status === "lost_contact" ? "danger" : "success"} />
          </div>

          <Card className="border-red-500/20">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><AlertOctagon className="h-5 w-5 text-red-300" /> Realtime emergency board</CardTitle>
                <p className="mt-1 text-sm text-slate-400">{selectedIncident.title} · {selectedIncident.address}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="danger"><BellRing className="mr-2 h-4 w-4" /> Emergency override</Button>
                <Button variant="secondary"><RefreshCw className="mr-2 h-4 w-4" /> Reassign</Button>
                <Button variant="secondary"><PhoneCall className="mr-2 h-4 w-4" /> Voice fallback</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <EmergencyMap incident={selectedIncident} />
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">mechanic status</p>
                  <h3 className="mt-2 text-xl font-black">{selectedAssignment.mechanicName}</h3>
                  <p className="text-sm text-slate-400">{selectedAssignment.status} · {selectedAssignment.shiftState} · GPS {selectedAssignment.geoAvailability}</p>
                  <Progress value={assignmentScore} className="mt-3" />
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">SLA countdown</p>
                  <h3 className="mt-2 text-xl font-black">{selectedTimer.elapsedMinutes}/{selectedTimer.targetMinutes} minutes</h3>
                  <p className="text-sm text-slate-400">Predicted breach delta: {selectedTimer.breachPredictionMinutes}m</p>
                  <Progress value={Math.min(100, (selectedTimer.elapsedMinutes / selectedTimer.targetMinutes) * 100)} className="mt-3" />
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">response playbook</p>
                  <h3 className="mt-2 text-xl font-black">{selectedResponse.phase}</h3>
                  <p className="text-sm text-slate-400">{selectedResponse.nextAction}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Orchestration engine inputs</CardTitle></CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                {EMERGENCY_ORCHESTRATION_FACTORS.map((factor) => (
                  <div key={factor} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300"><Zap className="mb-2 h-4 w-4 text-amber-300" />{factor}</div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Critical SLA engine</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {CRITICAL_SLA_ENGINE.map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300"><TimerReset className="mr-2 inline h-4 w-4 text-red-300" />{item}</div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-cyan-300" /> Right intelligence panel</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-red-200">AI risk prediction</p>
                <h3 className="mt-2 text-xl font-black text-red-50">{selectedRisk}</h3>
                <p className="mt-1 text-sm text-red-100/80">Smart reassignment, anomaly detection, incident prioritization, and predictive escalation foundation.</p>
              </div>
              <div>
                <p className="mb-2 text-sm font-bold text-slate-200">Escalation chain</p>
                <div className="space-y-2">
                  {selectedChain.steps.map((step) => (
                    <div key={`${step.role}-${step.level}`} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-sm">
                      <span>{step.role}</span>
                      <Badge tone={step.status === "pending" ? "warning" : "success"}>{step.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-bold text-slate-200">Incident timeline</p>
                <div className="space-y-2">
                  {selectedTimeline.map((event) => (
                    <div key={event.id} className={cn("rounded-2xl border p-3", event.critical ? "border-red-400/30 bg-red-500/10" : "border-slate-800 bg-slate-950/70")}>
                      <div className="flex items-center justify-between gap-2"><b>{event.label}</b><span className="text-xs text-slate-500">{event.occurredAt}</span></div>
                      <p className="text-xs text-slate-400">{event.type} · {event.actor}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Communication delivery</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {operations.alerts.filter((alert) => alert.incidentId === selectedIncident.id || alert.severity === "critical").map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between"><span className="text-sm font-bold">{alert.recipientRole}</span><Badge tone={alert.delivery === "failed" ? "danger" : alert.delivery === "fallback_sent" ? "warning" : "success"}>{alert.delivery}</Badge></div>
                  <p className="mt-1 text-xs text-slate-400">{alert.channel} · {alert.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Geo emergency zones</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {operations.zones.map((zone) => (
                <div key={zone.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between"><b>{zone.name}</b><Badge tone={zone.risk === "normal" ? "success" : "warning"}>{zone.risk}</Badge></div>
                  <p className="mt-1 text-xs text-slate-400">{zone.activeIncidents} incidents · {zone.nearestMechanics} mechanics · avg ETA {zone.avgEtaMinutes}m</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </section>

      <section className="grid gap-4 px-4 pb-6 lg:grid-cols-3 lg:px-6">
        <Card>
          <CardHeader><CardTitle><RadioTower className="mr-2 inline h-5 w-5 text-cyan-300" />Realtime streams</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {REALTIME_EMERGENCY_STREAMS.map((stream) => <div key={stream} className="rounded-xl bg-slate-900 p-2 text-sm text-slate-300">{stream}</div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle><Gauge className="mr-2 inline h-5 w-5 text-emerald-300" />Production architecture</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            {Object.entries(EMERGENCY_ARCHITECTURE).map(([key, value]) => <p key={key}><b className="text-slate-100">{key}:</b> {value}</p>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle><BrainCircuit className="mr-2 inline h-5 w-5 text-purple-300" />Audit & observability</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {operations.audit.map((audit) => <div key={audit.id} className="rounded-xl bg-slate-900 p-2 text-sm text-slate-300">{audit.action} · {audit.actor} · {audit.hash}</div>)}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export function EmergencyCommandCenter() {
  return (
    <QueryClientProvider client={emergencyQueryClient}>
      <EmergencyCommandCenterInner />
    </QueryClientProvider>
  );
}
