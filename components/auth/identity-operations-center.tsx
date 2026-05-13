"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  MonitorSmartphone,
  RadioTower,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Users,
  WifiOff,
  XCircle,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/auth/rbac";
import {
  API_SECURITY_POLICY,
  OFFLINE_SESSION_POLICY,
  PASSWORD_SECURITY_POLICY,
  PERMISSION_GROUPS,
  TOKEN_ROTATION_POLICY,
  canUseOfflineAuth,
  loginAttemptsSeed,
  managedDevicesSeed,
  managedIdentitiesSeed,
  managedSessionsSeed,
  securityEventsSeed,
  type ManagedDevice,
  type ManagedIdentity,
  type ManagedSession,
  type SecurityEvent,
} from "@/lib/auth/identity-platform";
import type { SessionRisk, UserRole } from "@/lib/auth/types";

type IdentityFilter = "all" | "active" | "elevated" | "locked" | UserRole;

const sessionStateTone: Record<ManagedSession["state"], "success" | "warning" | "danger" | "info" | "muted"> = {
  active: "success",
  refresh_required: "warning",
  offline_grace: "info",
  revoked: "danger",
  expired: "muted",
};

const riskTone: Record<SessionRisk, "success" | "warning" | "danger"> = {
  normal: "success",
  elevated: "warning",
  blocked: "danger",
};

function IdentityMetric({ label, value, hint, icon: Icon }: { label: string; value: string; hint: string; icon: typeof ShieldCheck }) {
  return (
    <Card className="bg-slate-950/70">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{hint}</p>
        </div>
        <span className="rounded-2xl border border-orange-400/30 bg-orange-400/10 p-2 text-orange-200"><Icon className="h-5 w-5" /></span>
      </CardContent>
    </Card>
  );
}

function LeftSecurityPanel({ selected, onSelect }: { selected: ManagedIdentity; onSelect: (identity: ManagedIdentity) => void }) {
  const activeSessions = managedSessionsSeed.filter((session) => session.state === "active" || session.state === "offline_grace").length;
  const revokedDevices = managedDevicesSeed.filter((device) => device.trustState === "revoked" || device.trustState === "lost").length;
  const failedLogins = loginAttemptsSeed.filter((attempt) => attempt.outcome === "failed" || attempt.outcome === "locked").length;

  return (
    <aside className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-orange-300" /> Identity signals</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {[
            { label: "Active sessions", value: activeSessions, icon: RadioTower, tone: "success" as const },
            { label: "Devices", value: managedDevicesSeed.length, icon: Smartphone, tone: "info" as const },
            { label: "Security alerts", value: securityEventsSeed.filter((event) => event.severity !== "info").length, icon: AlertTriangle, tone: "warning" as const },
            { label: "Failed logins", value: failedLogins, icon: XCircle, tone: "danger" as const },
            { label: "Revoked/lost devices", value: revokedDevices, icon: WifiOff, tone: "danger" as const },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="flex items-center gap-2 text-slate-300"><Icon className="h-4 w-4" /> {item.label}</span>
                <Badge tone={item.tone}>{item.value}</Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Permission groups</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.code} className="rounded-xl border border-slate-800 bg-navy-900 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-100">{group.label}</span>
                <Badge tone="muted">{group.permissions.length}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {group.permissions.map((permission) => <Badge key={permission} tone="info">{permission}</Badge>)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Quick user focus</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {managedIdentitiesSeed.map((identity) => (
            <button
              key={identity.id}
              type="button"
              onClick={() => onSelect(identity)}
              className={cn(
                "w-full rounded-xl border p-3 text-left transition hover:border-orange-400/60",
                selected.id === identity.id ? "border-orange-400 bg-orange-400/10" : "border-slate-800 bg-slate-950/60",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-100">{identity.name}</span>
                <Badge tone={riskTone[identity.risk]}>{identity.risk}</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">{ROLE_LABELS[identity.role]} · {identity.region}</p>
            </button>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

function UsersGrid({ identities, selectedId, onSelect }: { identities: ManagedIdentity[]; selectedId: string; onSelect: (identity: ManagedIdentity) => void }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-orange-300" /> Users grid</CardTitle>
          <Badge tone="info">RBAC + region/object isolation</Badge>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-950 text-xs uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Имя</th>
              <th className="px-4 py-3">Роль</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Регион</th>
              <th className="px-4 py-3">Active session</th>
              <th className="px-4 py-3">Last activity</th>
              <th className="px-4 py-3">Devices</th>
            </tr>
          </thead>
          <tbody>
            {identities.map((identity) => (
              <tr
                key={identity.id}
                onClick={() => onSelect(identity)}
                className={cn("cursor-pointer border-b border-slate-800/70 transition hover:bg-orange-400/5", selectedId === identity.id && "bg-orange-400/10")}
              >
                <td className="px-4 py-4 font-bold text-slate-100">{identity.name}</td>
                <td className="px-4 py-4"><Badge>{ROLE_LABELS[identity.role]}</Badge></td>
                <td className="px-4 py-4"><Badge tone={identity.status === "active" ? "success" : identity.status === "locked" ? "danger" : "warning"}>{identity.status}</Badge></td>
                <td className="px-4 py-4 text-slate-300">{identity.region}</td>
                <td className="px-4 py-4 text-slate-300">{identity.activeSessions}</td>
                <td className="px-4 py-4 text-slate-300">{identity.lastActivityAt}</td>
                <td className="px-4 py-4 text-slate-300">{identity.deviceCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function SessionCard({ session, device }: { session: ManagedSession; device?: ManagedDevice }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-navy-900 p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-slate-100">{session.id}</span>
        <Badge tone={sessionStateTone[session.state]}>{session.state}</Badge>
      </div>
      <div className="mt-2 grid gap-1 text-xs text-slate-400">
        <span>Device: {device?.label ?? session.deviceId}</span>
        <span>IP: {session.ipAddress} · UA: {session.userAgent}</span>
        <span>Access exp: {session.accessExpiresAt} · Refresh exp: {session.refreshExpiresAt}</span>
        <span>Refresh rotations: {session.rotationCounter} · bound: {session.deviceBound ? "yes" : "no"}</span>
        {session.offlineUntil ? <span className="text-blue-200">Offline grant until: {session.offlineUntil}</span> : null}
      </div>
    </div>
  );
}

function SecurityEventRow({ event }: { event: SecurityEvent }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <Badge tone={event.severity === "critical" ? "danger" : event.severity === "warning" ? "warning" : "info"}>{event.type}</Badge>
        <span className="text-xs text-slate-500">{event.occurredAt}</span>
      </div>
      <p className="mt-2 text-slate-300">{event.message}</p>
      <p className="mt-2 font-mono text-xs text-slate-600">immutable {event.immutableHash}</p>
    </div>
  );
}

function RightSecurityPanel({ identity }: { identity: ManagedIdentity }) {
  const sessions = managedSessionsSeed.filter((session) => session.userId === identity.id);
  const devices = managedDevicesSeed.filter((device) => device.userId === identity.id);
  const events = securityEventsSeed.filter((event) => !event.userId || event.userId === identity.id);

  return (
    <aside className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-orange-300" /> Session history</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {sessions.length ? sessions.map((session) => <SessionCard key={session.id} session={session} device={devices.find((device) => device.id === session.deviceId)} />) : <p className="text-sm text-slate-500">No active sessions for selected user.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MonitorSmartphone className="h-4 w-4 text-orange-300" /> Devices</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {devices.map((device) => (
            <div key={device.id} className="rounded-xl border border-slate-800 bg-navy-900 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-100">{device.label}</span>
                <Badge tone={device.trustState === "trusted" ? "success" : device.trustState === "lost" ? "danger" : "warning"}>{device.trustState}</Badge>
              </div>
              <p className="mt-2 text-xs text-slate-400">{device.platform} · {device.region} · {device.fingerprintHash}</p>
              <p className="mt-1 text-xs text-slate-400">Offline auth: {canUseOfflineAuth(identity.role, device) ? "allowed" : "blocked"}</p>
              <Button type="button" variant="danger" size="sm" className="mt-3 w-full">Revoke device access</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-orange-300" /> Security events</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {events.map((event) => <SecurityEventRow key={event.id} event={event} />)}
        </CardContent>
      </Card>
    </aside>
  );
}

function ArchitectureStrip() {
  return (
    <div className="grid gap-3 xl:grid-cols-3">
      <Alert tone="info"><LockKeyhole className="mr-2 inline h-4 w-4" /> Access tokens live {TOKEN_ROTATION_POLICY.accessTokenMinutes} minutes; refresh tokens rotate on every use and are bound to trusted devices.</Alert>
      <Alert tone="warning"><CloudOff className="mr-2 inline h-4 w-4" /> Offline auth grants are encrypted locally and limited to {OFFLINE_SESSION_POLICY.maxOfflineHours} hours for mechanics only.</Alert>
      <Alert tone="success"><Fingerprint className="mr-2 inline h-4 w-4" /> WebAuthn, biometric unlock, SSO and hardware-key step-up are modeled as credential providers, not login-page hacks.</Alert>
    </div>
  );
}

function PolicyPanel() {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card>
        <CardHeader><CardTitle>Session management</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          <p>HttpOnly secure cookies carry opaque access/refresh grants. Server session rows hold device binding, rotation family, revocation markers and replay detection.</p>
          <p>Forced logout invalidates session, refresh family, offline grants and realtime authorization cache.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>API security</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          {API_SECURITY_POLICY.middleware.map((item) => <p key={item}>• {item}</p>)}
          <p>CSRF: {API_SECURITY_POLICY.csrf}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Password & lockout</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          <p>{PASSWORD_SECURITY_POLICY.hashing}</p>
          <p>Lockout after {PASSWORD_SECURITY_POLICY.lockoutThreshold} failed attempts in {PASSWORD_SECURITY_POLICY.failedAttemptWindowMinutes} minutes.</p>
          <p>Privileged password rotation: {PASSWORD_SECURITY_POLICY.rotationDaysForPrivilegedRoles} days.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function IdentityOperationsCenter() {
  const [filter, setFilter] = useState<IdentityFilter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ManagedIdentity>(managedIdentitiesSeed[0]);

  const filtered = useMemo(() => managedIdentitiesSeed.filter((identity) => {
    const matchesQuery = !query || `${identity.name} ${identity.region} ${identity.role}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && identity.status === "active") ||
      (filter === "elevated" && identity.risk !== "normal") ||
      (filter === "locked" && identity.status === "locked") ||
      identity.role === filter;
    return matchesQuery && matchesFilter;
  }), [filter, query]);

  return (
    <main className="min-h-screen bg-navy-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-navy-950/95 px-3 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[100rem] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300">НеоЛифт Enterprise Identity Platform</p>
            <h1 className="mt-1 text-2xl font-black text-white md:text-3xl">Authentication, sessions, devices & operational access</h1>
            <p className="mt-1 max-w-4xl text-sm text-slate-400">Industrial identity center for mechanics in shafts, dispatchers, warehouse operators and privileged administrators: RBAC, offline auth, device-bound sessions, refresh rotation and immutable security audit.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary"><RefreshCw className="h-4 w-4" /> Rotate session cache</Button>
            <Button type="button"><ShieldCheck className="h-4 w-4" /> Run access audit</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[100rem] space-y-5 px-3 py-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <IdentityMetric label="Active sessions" value="87" hint="device-bound server sessions" icon={RadioTower} />
          <IdentityMetric label="Trusted devices" value="126" hint="PWA, desktop and rugged Android" icon={MonitorSmartphone} />
          <IdentityMetric label="Offline grants" value="29" hint="mechanic encrypted vaults" icon={CloudOff} />
          <IdentityMetric label="Security events" value="1.2k" hint="immutable events today" icon={ShieldAlert} />
        </div>

        <ArchitectureStrip />

        <div className="grid gap-5 xl:grid-cols-[20rem_minmax(0,1fr)_24rem]">
          <LeftSecurityPanel selected={selected} onSelect={setSelected} />
          <section className="space-y-4">
            <Card>
              <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_14rem]">
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users, regions, roles..." />
                <Select value={filter} onChange={(event) => setFilter(event.target.value as IdentityFilter)}>
                  <option value="all">All identities</option>
                  <option value="active">Active</option>
                  <option value="elevated">Elevated risk</option>
                  <option value="locked">Locked</option>
                  <option value="mechanic">Mechanic</option>
                  <option value="seniorMechanic">Senior mechanic</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="director">Director</option>
                  <option value="administrator">Administrator</option>
                </Select>
              </CardContent>
            </Card>
            <UsersGrid identities={filtered} selectedId={selected.id} onSelect={setSelected} />
            <PolicyPanel />
          </section>
          <RightSecurityPanel identity={selected} />
        </div>
      </div>
    </main>
  );
}
