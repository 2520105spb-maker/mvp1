"use client";

import { useMemo } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Clock3,
  Compass,
  Crosshair,
  Database,
  Gauge,
  Layers3,
  LocateFixed,
  Map,
  MapPin,
  Navigation,
  RadioTower,
  RefreshCw,
  Route,
  Satellite,
  ShieldAlert,
  TimerReset,
  TrafficCone,
  Truck,
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
  GEO_ARCHITECTURE,
  GEOLOCATION_ENGINE_FACTORS,
  ROUTING_ENGINE_CAPABILITIES,
  arrivalPredictionsSeed,
  emergencyZonesSeed,
  geoAssignmentsSeed,
  geoAuditLogsSeed,
  geoObjectsSeed,
  geoZonesSeed,
  isLocationUsable,
  locationEventsSeed,
  predictSlaGeoRisk,
  routeHistorySeed,
  routePlansSeed,
  technicianLocationsSeed,
  trafficSnapshotsSeed,
  travelEstimatesSeed,
  type GeoObject,
  type RoutePlan,
  type TechnicianLocation,
} from "@/lib/geo/geo-intelligence-platform";

type GeoLayer = "all" | "routes" | "mechanics" | "objects" | "emergency" | "sla" | "traffic";

type GeoUiState = {
  selectedRouteId: string;
  selectedTechnicianId: string;
  selectedLayer: GeoLayer;
  query: string;
  provider: "mapbox" | "openstreetmap" | "internal-vector-tiles";
  setSelectedRouteId: (id: string) => void;
  setSelectedTechnicianId: (id: string) => void;
  setSelectedLayer: (layer: GeoLayer) => void;
  setQuery: (query: string) => void;
  setProvider: (provider: "mapbox" | "openstreetmap" | "internal-vector-tiles") => void;
};

const useGeoUiStore = create<GeoUiState>((set) => ({
  selectedRouteId: routePlansSeed[0].id,
  selectedTechnicianId: technicianLocationsSeed[0].technicianId,
  selectedLayer: "all",
  query: "",
  provider: "mapbox",
  setSelectedRouteId: (id) => set({ selectedRouteId: id }),
  setSelectedTechnicianId: (id) => set({ selectedTechnicianId: id }),
  setSelectedLayer: (layer) => set({ selectedLayer: layer }),
  setQuery: (query) => set({ query }),
  setProvider: (provider) => set({ provider }),
}));

const geoQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      refetchInterval: 10_000,
      refetchOnWindowFocus: false,
    },
  },
});

function useGeoOperationsData() {
  return useQuery({
    queryKey: ["geo", "operations-center"],
    queryFn: () => Promise.resolve({
      zones: geoZonesSeed,
      objects: geoObjectsSeed,
      technicians: technicianLocationsSeed,
      routes: routePlansSeed,
      emergencies: emergencyZonesSeed,
      traffic: trafficSnapshotsSeed,
      predictions: arrivalPredictionsSeed,
      assignments: geoAssignmentsSeed,
      events: locationEventsSeed,
      travel: travelEstimatesSeed,
      history: routeHistorySeed,
      audit: geoAuditLogsSeed,
    }),
  });
}

function SignalCard({ label, value, hint, icon: Icon, tone = "info" }: { label: string; value: string; hint: string; icon: typeof Map; tone?: "info" | "success" | "warning" | "danger" }) {
  const color = tone === "danger" ? "text-red-200 border-red-400/30 bg-red-400/10" : tone === "warning" ? "text-amber-200 border-amber-400/30 bg-amber-400/10" : tone === "success" ? "text-green-200 border-green-400/30 bg-green-400/10" : "text-blue-200 border-blue-400/30 bg-blue-400/10";
  return (
    <Card className="bg-slate-950/70">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-white">{value}</p><p className="mt-1 text-xs text-slate-400">{hint}</p></div>
        <span className={cn("rounded-2xl border p-2", color)}><Icon className="h-5 w-5" /></span>
      </CardContent>
    </Card>
  );
}

function LeftGeoPanel({ routes, technicians }: { routes: RoutePlan[]; technicians: TechnicianLocation[] }) {
  const selectedLayer = useGeoUiStore((state) => state.selectedLayer);
  const setSelectedLayer = useGeoUiStore((state) => state.setSelectedLayer);
  const groups = [
    { id: "routes" as GeoLayer, label: "Active routes", value: routes.filter((route) => route.status === "active").length, icon: Route, tone: "info" as const },
    { id: "emergency" as GeoLayer, label: "Emergency routes", value: emergencyZonesSeed.length, icon: ShieldAlert, tone: "danger" as const },
    { id: "mechanics" as GeoLayer, label: "Nearby mechanics", value: technicians.filter(isLocationUsable).length, icon: Truck, tone: "success" as const },
    { id: "traffic" as GeoLayer, label: "Delayed arrivals", value: trafficSnapshotsSeed.filter((traffic) => traffic.delayMinutes > 10).length, icon: TrafficCone, tone: "warning" as const },
    { id: "sla" as GeoLayer, label: "SLA geo risks", value: arrivalPredictionsSeed.filter((prediction) => prediction.slaBreachProbability > 15).length, icon: TimerReset, tone: "danger" as const },
    { id: "objects" as GeoLayer, label: "Unassigned regions", value: geoZonesSeed.filter((zone) => zone.activeRoutes === 0).length, icon: Layers3, tone: "warning" as const },
  ];

  return (
    <aside className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Map className="h-4 w-4 text-orange-300" /> Geo layers</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {groups.map((group) => {
            const Icon = group.icon;
            return (
              <button key={group.id} type="button" onClick={() => setSelectedLayer(group.id)} className={cn("w-full rounded-xl border p-3 text-left transition hover:border-orange-400/60", selectedLayer === group.id ? "border-orange-400 bg-orange-400/10" : "border-slate-800 bg-slate-950/60")}> 
                <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 font-bold text-slate-100"><Icon className="h-4 w-4" /> {group.label}</span><Badge tone={group.tone}>{group.value}</Badge></div>
              </button>
            );
          })}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Geofences</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {geoZonesSeed.map((zone) => (
            <div key={zone.id} className="rounded-xl border border-slate-800 bg-navy-900 p-3 text-sm">
              <div className="flex items-center justify-between"><span className="font-bold text-slate-100">{zone.name}</span><Badge tone={zone.emergency ? "danger" : zone.slaRiskCount > 4 ? "warning" : "info"}>{zone.slaRiskCount} SLA</Badge></div>
              <p className="mt-1 text-xs text-slate-500">{zone.polygonLabel} · {zone.activeRoutes} active routes · restricted {zone.restricted ? "yes" : "no"}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

function CoordinatePoint({ x, y, tone, label, onClick }: { x: number; y: number; tone: "orange" | "blue" | "red" | "green"; label: string; onClick?: () => void }) {
  const color = tone === "red" ? "bg-red-500 shadow-red-500/40" : tone === "green" ? "bg-green-400 shadow-green-400/40" : tone === "blue" ? "bg-blue-400 shadow-blue-400/40" : "bg-orange-400 shadow-orange-400/40";
  return <button type="button" onClick={onClick} className={cn("absolute z-20 h-4 w-4 rounded-full shadow-lg ring-4 ring-white/10", color)} style={{ left: `${x}%`, top: `${y}%` }} aria-label={label} title={label} />;
}

function OperationalMap({ objects, technicians, routes }: { objects: GeoObject[]; technicians: TechnicianLocation[]; routes: RoutePlan[] }) {
  const selectedRouteId = useGeoUiStore((state) => state.selectedRouteId);
  const setSelectedRouteId = useGeoUiStore((state) => state.setSelectedRouteId);
  const setSelectedTechnicianId = useGeoUiStore((state) => state.setSelectedTechnicianId);
  const provider = useGeoUiStore((state) => state.provider);
  const selectedLayer = useGeoUiStore((state) => state.selectedLayer);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="flex items-center gap-2"><Satellite className="h-4 w-4 text-orange-300" /> Operational map canvas</CardTitle>
          <div className="flex flex-wrap gap-2"><Badge tone="success">{provider}</Badge><Badge tone="info">PostGIS indexed</Badge><Badge tone="warning">layer: {selectedLayer}</Badge></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative min-h-[34rem] overflow-hidden rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_70%_45%,rgba(249,115,22,0.18),transparent_25%),linear-gradient(135deg,#020617,#111827)] p-4">
          <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
          <div className="absolute left-[8%] top-[18%] h-[42%] w-[30%] rounded-full border border-blue-300/20 bg-blue-400/5" />
          <div className="absolute right-[10%] top-[12%] h-[34%] w-[28%] rounded-full border border-red-300/30 bg-red-500/10" />
          <div className="absolute bottom-[10%] left-[35%] h-[28%] w-[35%] rounded-full border border-orange-300/20 bg-orange-400/5" />
          {routes.map((route, index) => (
            <button key={route.id} type="button" onClick={() => setSelectedRouteId(route.id)} className={cn("absolute z-10 h-1 origin-left rounded-full", selectedRouteId === route.id ? "bg-orange-400" : "bg-blue-400/70")} style={{ left: `${18 + index * 18}%`, top: `${30 + index * 20}%`, width: `${34 - index * 6}%`, transform: `rotate(${index === 0 ? 18 : -12}deg)` }} aria-label={route.id} />
          ))}
          {objects.map((object, index) => <CoordinatePoint key={object.id} x={24 + index * 24} y={24 + index * 18} tone={object.slaRisk === "critical" ? "red" : object.slaRisk === "watch" ? "orange" : "blue"} label={object.label} />)}
          {technicians.map((tech, index) => <CoordinatePoint key={tech.technicianId} x={30 + index * 20} y={58 - index * 16} tone={tech.freshness === "live" ? "green" : tech.freshness === "stale" ? "orange" : "red"} label={tech.name} onClick={() => setSelectedTechnicianId(tech.technicianId)} />)}
          {emergencyZonesSeed.map((zone) => <div key={zone.id} className="absolute right-[18%] top-[18%] z-0 h-32 w-32 animate-pulse rounded-full border-2 border-red-400/50 bg-red-500/10" title={zone.incidentId} />)}
          <div className="absolute bottom-4 left-4 right-4 z-30 grid gap-2 rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-xs text-slate-300 backdrop-blur md:grid-cols-4">
            <span><Wifi className="mr-1 inline h-3 w-3 text-green-300" /> realtime GPS streams</span>
            <span><Route className="mr-1 inline h-3 w-3 text-blue-300" /> live route layers</span>
            <span><TimerReset className="mr-1 inline h-3 w-3 text-red-300" /> SLA heat overlays</span>
            <span><Database className="mr-1 inline h-3 w-3 text-orange-300" /> vector tile cache</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RightGeoPanel({ route, technician }: { route: RoutePlan; technician: TechnicianLocation }) {
  const prediction = arrivalPredictionsSeed.find((item) => item.routePlanId === route.id) ?? arrivalPredictionsSeed[0];
  const risk = predictSlaGeoRisk(route, prediction);
  const traffic = trafficSnapshotsSeed.find((item) => item.delayMinutes === Math.max(...trafficSnapshotsSeed.map((snapshot) => snapshot.delayMinutes))) ?? trafficSnapshotsSeed[0];

  return (
    <aside className="space-y-4">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Gauge className="h-4 w-4 text-orange-300" /> ETA analytics</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div className="rounded-xl border border-blue-400/30 bg-blue-400/10 p-3"><p className="text-2xl font-black text-blue-100">{prediction.eta}</p><p className="text-xs text-blue-200/80">delta {prediction.etaDeltaMinutes}m · confidence from traffic + GPS</p></div><Progress value={risk} /><p className="text-slate-400">SLA geo risk after route: {risk}%</p></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Navigation className="h-4 w-4 text-orange-300" /> Route impact</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-slate-300"><p>{route.distanceKm} km · {route.durationMinutes} min · traffic +{route.trafficDelayMinutes}m</p>{route.stops.map((stop) => <div key={stop.id} className="rounded-xl border border-slate-800 bg-navy-900 p-2 text-xs">#{stop.sequence} {stop.label} ETA {stop.eta} · SLA {stop.slaMinutesRemaining}m</div>)}</CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><TrafficCone className="h-4 w-4 text-orange-300" /> Traffic warnings</CardTitle></CardHeader><CardContent><Alert tone={traffic.level === "blocked" || traffic.level === "heavy" ? "warning" : "info"}>{traffic.zoneId}: {traffic.level}, average {traffic.averageSpeedKmh} km/h, delay {traffic.delayMinutes}m.</Alert></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-orange-300" /> AI route recommendations</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-slate-300"><p>{prediction.reason}</p><p>Mechanic: {technician.name} · {technician.freshness} · speed {technician.speedKmh} km/h</p><Button type="button" className="w-full"><Zap className="h-4 w-4" /> Apply emergency reroute</Button></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-orange-300" /> SLA risk predictions</CardTitle></CardHeader><CardContent className="space-y-2">{arrivalPredictionsSeed.map((item) => <Alert key={item.id} tone={item.slaBreachProbability > 15 ? "danger" : "success"}>{item.stopId}: breach probability {item.slaBreachProbability}% · {item.reason}</Alert>)}</CardContent></Card>
    </aside>
  );
}

function ArchitecturePanel() {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card><CardHeader><CardTitle>Geolocation engine</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-slate-300">{GEOLOCATION_ENGINE_FACTORS.map((factor) => <p key={factor}>• {factor}</p>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Routing engine</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-slate-300">{ROUTING_ENGINE_CAPABILITIES.map((capability) => <p key={capability}>• {capability}</p>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Realtime architecture</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-slate-300">{GEO_ARCHITECTURE.realtime.map((stream) => <p key={stream} className="font-mono text-xs">• {stream}</p>)}</CardContent></Card>
    </div>
  );
}

function EventsPanel() {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-orange-300" /> Location events, route history & geo audit</CardTitle></CardHeader>
      <CardContent className="grid gap-3 xl:grid-cols-3">
        <div className="space-y-2">{locationEventsSeed.map((event) => <div key={event.id} className="rounded-xl border border-slate-800 bg-navy-900 p-3 text-sm"><Badge tone="info">{event.type}</Badge><p className="mt-2 text-slate-300">{event.message}</p><p className="mt-1 font-mono text-xs text-slate-600">{event.auditHash}</p></div>)}</div>
        <div className="space-y-2">{routeHistorySeed.map((history) => <div key={history.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">{history.routePlanId}: planned {history.plannedMinutes}m, actual {history.actualMinutes}m, deviation {history.deviationMeters}m</div>)}</div>
        <div className="space-y-2">{geoAuditLogsSeed.map((audit) => <div key={audit.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">{audit.action} · {audit.actor}<p className="font-mono text-xs text-slate-600">{audit.hash}</p></div>)}</div>
      </CardContent>
    </Card>
  );
}

function GeoOperationsInner() {
  const { data, isLoading, isError, refetch, isFetching } = useGeoOperationsData();
  const query = useGeoUiStore((state) => state.query);
  const setQuery = useGeoUiStore((state) => state.setQuery);
  const provider = useGeoUiStore((state) => state.provider);
  const setProvider = useGeoUiStore((state) => state.setProvider);
  const selectedRouteId = useGeoUiStore((state) => state.selectedRouteId);
  const selectedTechnicianId = useGeoUiStore((state) => state.selectedTechnicianId);

  if (isLoading || !data) return <main className="min-h-screen bg-navy-950 p-4 text-slate-100"><div className="mx-auto max-w-[100rem] space-y-4"><div className="h-28 animate-pulse rounded-2xl bg-graphite-900" /><div className="h-[38rem] animate-pulse rounded-2xl bg-graphite-900" /></div></main>;
  if (isError) return <main className="min-h-screen bg-navy-950 p-4 text-slate-100"><Alert tone="danger">Geo stream failed. Reconnect websocket, switch map provider or use cached vector tiles.</Alert></main>;

  const route = data.routes.find((item) => item.id === selectedRouteId) ?? data.routes[0];
  const technician = data.technicians.find((item) => item.technicianId === selectedTechnicianId) ?? data.technicians[0];
  const objects = data.objects.filter((object) => !query || `${object.label} ${object.address}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="min-h-screen bg-navy-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-navy-950/95 px-3 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[100rem] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300">НеоЛифт Geo Operations Center</p><h1 className="mt-1 text-2xl font-black text-white md:text-3xl">Realtime routing, geolocation & field geo-intelligence</h1><p className="mt-1 max-w-4xl text-sm text-slate-400">Industrial geospatial command center for object maps, mechanic GPS streams, ETA/SLA prediction, emergency route overlays, geofencing and route history.</p></div>
          <div className="flex flex-wrap gap-2"><Select value={provider} onChange={(event) => setProvider(event.target.value as "mapbox" | "openstreetmap" | "internal-vector-tiles")} className="w-48"><option value="mapbox">Mapbox vector</option><option value="openstreetmap">OpenStreetMap</option><option value="internal-vector-tiles">Internal tiles</option></Select><Button type="button" variant="secondary" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} /> Refresh</Button><Button type="button"><Crosshair className="h-4 w-4" /> Recalculate ETA</Button></div>
        </div>
      </header>
      <div className="mx-auto max-w-[100rem] space-y-5 px-3 py-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><SignalCard label="Realtime GPS" value="126" hint="batched live streams" icon={LocateFixed} tone="success" /><SignalCard label="Active routes" value="38" hint="SLA-aware route plans" icon={Route} tone="info" /><SignalCard label="Traffic delays" value="11" hint="provider + internal signals" icon={TrafficCone} tone="warning" /><SignalCard label="SLA geo risk" value="9" hint="ETA breach prediction" icon={TimerReset} tone="danger" /></div>
        <div className="grid gap-3 md:grid-cols-[1fr_14rem]"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search objects, elevators, addresses..." /><Select defaultValue="all"><option value="all">All geo scope</option><option value="emergency">Emergency</option><option value="routes">Routes</option><option value="mechanics">Mechanics</option></Select></div>
        <div className="grid gap-5 xl:grid-cols-[20rem_minmax(0,1fr)_25rem]"><LeftGeoPanel routes={data.routes} technicians={data.technicians} /><section className="space-y-4"><OperationalMap objects={objects} technicians={data.technicians} routes={data.routes} /><ArchitecturePanel /><EventsPanel /></section><RightGeoPanel route={route} technician={technician} /></div>
      </div>
    </main>
  );
}

export function GeoOperationsCenter() {
  return <QueryClientProvider client={geoQueryClient}><GeoOperationsInner /></QueryClientProvider>;
}
