"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CloudOff,
  DatabaseZap,
  Database,
  Fingerprint,
  Gauge,
  HardHat,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Map,
  Menu,
  MonitorSmartphone,
  RadioTower,
  RefreshCw,
  Settings,
  ShieldCheck,
  Smartphone,
  Truck,
  Users,
  Warehouse,
  Wifi,
  X,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { GLOBAL_NAVIGATION } from "@/lib/auth/navigation";
import { DEFAULT_SYNC_STATE, PWA_FOUNDATION } from "@/lib/auth/pwa";
import { PERMISSION_MATRIX, ROLE_LABELS, canAccessRoute, hasPermission } from "@/lib/auth/rbac";
import {
  DEMO_USERS,
  SESSION_POLICY,
  buildSession,
  clearSession,
  persistSession,
  refreshAccessToken,
  restoreSession,
} from "@/lib/auth/session";
import type { AuthSession, Permission, SyncState, UserRole } from "@/lib/auth/types";

type ShellPage = "dashboard" | "admin" | "settings";

type AuthStore = {
  session: AuthSession | null;
  sync: SyncState;
  activePage: ShellPage;
  sidebarOpen: boolean;
  notificationsOpen: boolean;
  deniedAction?: string;
  login: (role: UserRole, rememberSession: boolean) => void;
  logout: (reason?: string) => void;
  restore: () => void;
  refresh: () => void;
  setActivePage: (page: ShellPage) => void;
  toggleSidebar: () => void;
  toggleNotifications: () => void;
  requirePermission: (permission: Permission, action: string) => boolean;
};

const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  sync: DEFAULT_SYNC_STATE,
  activePage: "dashboard",
  sidebarOpen: false,
  notificationsOpen: false,
  login: (role, rememberSession) => {
    const session = buildSession(role, rememberSession);
    persistSession(session);
    document.cookie = `neo_access_token=${session.tokens.accessToken}; path=/; max-age=${rememberSession ? 1209600 : 86400}; SameSite=Lax`;
    document.cookie = `neo_role=${session.user.role}; path=/; max-age=${rememberSession ? 1209600 : 86400}; SameSite=Lax`;
    set({ session, activePage: "dashboard", deniedAction: undefined });
  },
  logout: (reason) => {
    const current = get().session;
    if (current && reason) set({ session: { ...current, forcedLogoutReason: reason } });
    clearSession();
    document.cookie = "neo_access_token=; path=/; max-age=0";
    document.cookie = "neo_role=; path=/; max-age=0";
    set({ session: null, notificationsOpen: false, sidebarOpen: false });
  },
  restore: () => {
    const session = restoreSession();
    if (session) set({ session });
  },
  refresh: () => {
    const session = get().session;
    if (!session) return;
    const next = refreshAccessToken(session);
    persistSession(next);
    document.cookie = `neo_access_token=${next.tokens.accessToken}; path=/; max-age=86400; SameSite=Lax`;
    set({ session: next });
  },
  setActivePage: (page) => set({ activePage: page, sidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleNotifications: () => set((state) => ({ notificationsOpen: !state.notificationsOpen })),
  requirePermission: (permission, action) => {
    const allowed = hasPermission(get().session?.user ?? null, permission);
    if (!allowed) set({ deniedAction: action });
    return allowed;
  },
}));

const queryClient = new QueryClient();

const navIcons: Record<string, ReactNode> = {
  Dashboard: <LayoutDashboard className="h-4 w-4" />,
  Mechanic: <HardHat className="h-4 w-4" />,
  Objects: <Building2 className="h-4 w-4" />,
  Elevators: <Gauge className="h-4 w-4" />,
  "Work Orders": <ClipboardList className="h-4 w-4" />,
  Warehouse: <Warehouse className="h-4 w-4" />,
  Dispatch: <RadioTower className="h-4 w-4" />,
  "Geo Ops": <Map className="h-4 w-4" />,
  Analytics: <Activity className="h-4 w-4" />,
  Imports: <Database className="h-4 w-4" />,
  Identity: <Users className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
};

const roleOptions: UserRole[] = ["mechanic", "seniorMechanic", "dispatcher", "emergencyCoordinator", "warehouse", "supervisor", "director", "administrator"];

const notifications = [
  { id: "n1", level: "critical", title: "Аварийная заявка", text: "Лифт остановлен: БЦ Север, пассажир внутри", time: "2 мин" },
  { id: "n2", level: "warning", title: "SLA риск", text: "Заявка WO-2841 достигнет порога через 18 минут", time: "7 мин" },
  { id: "n3", level: "info", title: "Согласование", text: "Списание двигателя ожидает подтверждения руководителя", time: "14 мин" },
];

const auditEvents = [
  "u-admin-001 changed dispatcher permissions",
  "u-disp-003 force-closed stale mobile session",
  "u-mech-014 restored offline cache after reconnect",
  "system rotated refresh token family",
];

const managedUsers = [
  { name: "Алексей Климов", role: "Механик", territory: "Юг-2", status: "active", objects: 18 },
  { name: "Марина Соколова", role: "Диспетчер", territory: "Центр + Юг", status: "active", objects: 212 },
  { name: "Олег Романов", role: "Склад", territory: "Основной склад", status: "invited", objects: 0 },
  { name: "Виктор Лебедев", role: "Руководитель", territory: "Все участки", status: "suspended", objects: 0 },
];

function AuthProvider({ children }: { children: ReactNode }) {
  const restore = useAuthStore((state) => state.restore);
  const refresh = useAuthStore((state) => state.refresh);

  useEffect(() => {
    restore();
    const interval = window.setInterval(refresh, SESSION_POLICY.accessTokenMinutes * 60_000 - 30_000);
    return () => window.clearInterval(interval);
  }, [refresh, restore]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(PWA_FOUNDATION.serviceWorker).catch(() => undefined);
    }
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export function NeoLiftLoginScreen() {
  return (
    <AuthProvider>
      <LoginInner />
    </AuthProvider>
  );
}

function LoginInner() {
  const [role, setRole] = useState<UserRole>("mechanic");
  const [rememberSession, setRememberSession] = useState(true);
  const login = useAuthStore((state) => state.login);
  const session = useAuthStore((state) => state.session);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login(role, rememberSession);
  }

  if (session) return <NeoLiftAppShell initialPage="dashboard" />;

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between border-b border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(255,122,26,0.14),transparent_28rem)] p-5 lg:border-b-0 lg:border-r lg:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-400/40 bg-orange-500/15 text-orange-300">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight">НеоЛифт ERP</p>
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">secure operations shell</p>
            </div>
          </div>

          <div className="my-12 max-w-2xl">
            <Badge className="border-orange-400/30 bg-orange-500/10 text-orange-200">Industrial auth foundation</Badge>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">Вход в контур полевых операций</h1>
            <p className="mt-4 text-base leading-7 text-slate-400">
              Минимальный быстрый экран без маркетинга: JWT-сессия, RBAC, offline cache, контроль устройств, будущая биометрия и защищенная ERP-оболочка.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {["JWT refresh", "RBAC scopes", "Offline PWA"].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                <CheckCircle2 className="mb-3 h-5 w-5 text-orange-300" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-4 sm:p-8">
          <Card className="w-full max-w-md border-slate-800 bg-slate-950/90 shadow-2xl shadow-black/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-white"><LockKeyhole className="h-5 w-5 text-orange-300" /> Авторизация</CardTitle>
              <p className="text-sm text-slate-500">Демо-учетные роли имитируют production login/password flow.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">Логин</label>
                  <Input defaultValue="operator@neolift.local" autoComplete="username" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">Пароль</label>
                  <Input defaultValue="••••••••••••" type="password" autoComplete="current-password" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">Роль демо-сессии</label>
                  <Select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
                    {roleOptions.map((candidate) => (
                      <option key={candidate} value={candidate}>{ROLE_LABELS[candidate]}</option>
                    ))}
                  </Select>
                </div>
                <label className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-300">
                  <span>Запомнить терминал и refresh token family</span>
                  <input checked={rememberSession} onChange={(event) => setRememberSession(event.target.checked)} type="checkbox" className="h-5 w-5 accent-orange-500" />
                </label>
                <Button type="submit" className="w-full justify-center bg-orange-500 text-slate-950 hover:bg-orange-400">
                  <KeyRound className="mr-2 h-4 w-4" /> Войти в ERP
                </Button>
              </form>

              <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-slate-400">
                <div className="rounded-xl border border-slate-800 p-3"><Fingerprint className="mb-2 h-4 w-4 text-orange-300" /> Биометрия: future-ready</div>
                <div className="rounded-xl border border-slate-800 p-3"><CloudOff className="mb-2 h-4 w-4 text-orange-300" /> Offline login cache</div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

export function NeoLiftAppShell({ initialPage = "dashboard" }: { initialPage?: ShellPage }) {
  return (
    <AuthProvider>
      <ShellInner initialPage={initialPage} />
    </AuthProvider>
  );
}

function ShellInner({ initialPage }: { initialPage: ShellPage }) {
  const session = useAuthStore((state) => state.session);
  const activePage = useAuthStore((state) => state.activePage);
  const setActivePage = useAuthStore((state) => state.setActivePage);
  const sidebarOpen = useAuthStore((state) => state.sidebarOpen);
  const toggleSidebar = useAuthStore((state) => state.toggleSidebar);
  const notificationsOpen = useAuthStore((state) => state.notificationsOpen);
  const toggleNotifications = useAuthStore((state) => state.toggleNotifications);
  const logout = useAuthStore((state) => state.logout);
  const sync = useAuthStore((state) => state.sync);

  useEffect(() => setActivePage(initialPage), [initialPage, setActivePage]);

  if (!session) return <NeoLiftLoginScreen />;

  const nav = GLOBAL_NAVIGATION.filter((item) => hasPermission(session.user, item.permission));
  const page = activePage === "admin" && !canAccessRoute(session.user, "/admin") ? "dashboard" : activePage;

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="flex min-h-screen">
        <aside className={cn("fixed inset-y-0 left-0 z-40 w-80 border-r border-slate-800 bg-slate-950/95 p-4 transition lg:sticky lg:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3"><ShieldCheck className="h-8 w-8 text-orange-300" /><div><p className="font-black">НеоЛифт ERP</p><p className="text-xs text-slate-500">operations shell</p></div></div>
            <Button variant="ghost" size="sm" onClick={toggleSidebar} className="lg:hidden"><X className="h-4 w-4" /></Button>
          </div>
          <nav className="space-y-2">
            {nav.map((item) => (
              <button key={item.href} onClick={() => { if (item.href === "/admin") setActivePage("admin"); else if (item.href === "/settings") setActivePage("settings"); else if (item.href === "/dashboard") setActivePage("dashboard"); else window.location.href = item.href; }} className="flex w-full items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-3 text-left text-sm text-slate-300 hover:border-orange-400/50 hover:text-white">
                {navIcons[item.label]}<span className="flex-1"><span className="block font-semibold">{item.label}</span><span className="block text-xs text-slate-500">{item.description}</span></span><ChevronRight className="h-4 w-4" />
              </button>
            ))}
          </nav>
          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-400">
            <p className="mb-2 font-semibold text-slate-200">Scope guard</p>
            <p>{ROLE_LABELS[session.user.role]} · regions {session.user.scope.regionIds.join(", ")} · objects {session.user.scope.objectIds.join(", ") || "delegated"}</p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">
          <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#07111f]/95 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={toggleSidebar} className="lg:hidden"><Menu className="h-4 w-4" /></Button>
              <div className="min-w-0 flex-1"><p className="truncate text-sm text-slate-500">{session.user.department}</p><h1 className="truncate text-lg font-black text-white">{session.user.name}</h1></div>
              <SyncPill sync={sync} />
              <Button variant="secondary" size="sm" onClick={toggleNotifications}><Bell className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => logout("user logout")}><LogOut className="h-4 w-4" /></Button>
            </div>
          </header>

          {sync.network !== "online" && <Alert className="m-4 border-orange-500/40 bg-orange-500/10 text-orange-100">Нет стабильной сети: используются локальные permissions и pending sync queue.</Alert>}

          <div className="grid flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 p-4 lg:p-6">
              {page === "dashboard" && <RoleDashboard />}
              {page === "admin" && <AdminWorkspace />}
              {page === "settings" && <SettingsWorkspace />}
            </div>
            <aside className={cn("border-l border-slate-800 bg-slate-950/60 p-4 xl:block", notificationsOpen ? "fixed inset-y-0 right-0 z-50 block w-full max-w-sm" : "hidden")}>
              <NotificationsPanel />
            </aside>
          </div>

          <MobileBottomNav />
        </section>
      </div>
    </main>
  );
}

function SyncPill({ sync }: { sync: SyncState }) {
  return <Badge className="hidden border-emerald-400/30 bg-emerald-500/10 text-emerald-200 sm:inline-flex"><Wifi className="mr-1 h-3 w-3" /> {sync.pendingMutations} sync</Badge>;
}

function RoleDashboard() {
  const session = useAuthStore((state) => state.session)!;
  const deniedAction = useAuthStore((state) => state.deniedAction);
  const requirePermission = useAuthStore((state) => state.requirePermission);
  const { data } = useQuery({ queryKey: ["role-dashboard", session.user.role], queryFn: async () => getDashboardCards(session.user.role) });

  return (
    <div className="space-y-5">
      {deniedAction && <Alert className="border-red-400/40 bg-red-500/10 text-red-100">RBAC denied: {deniedAction}</Alert>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(data ?? []).map((card) => <MetricCard key={card.label} {...card} />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-800 bg-slate-950/70">
          <CardHeader><CardTitle>Role-based workspace</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {dashboardTasks(session.user.role).map((task) => (
              <div key={task.title} className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <task.icon className="mt-1 h-5 w-5 text-orange-300" />
                <div className="flex-1"><p className="font-semibold text-white">{task.title}</p><p className="text-sm text-slate-400">{task.description}</p></div>
                <Button size="sm" variant="secondary" onClick={() => requirePermission(task.permission, task.title)}>Действие</Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-950/70">
          <CardHeader><CardTitle>Session & devices</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {session.devices.map((device) => (
              <div key={device.id} className="rounded-2xl border border-slate-800 p-3 text-sm">
                <div className="flex items-center justify-between"><span className="font-semibold text-white">{device.deviceName}</span><Badge className={device.risk === "normal" ? "bg-emerald-500/15 text-emerald-200" : "bg-orange-500/15 text-orange-200"}>{device.risk}</Badge></div>
                <p className="mt-1 text-slate-500">IP {device.ip} · {device.current ? "current" : "parallel session"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <Card className="border-slate-800 bg-slate-950/70"><CardContent className="p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-white">{value}</p><p className="mt-1 text-xs text-slate-400">{hint}</p></CardContent></Card>;
}

async function getDashboardCards(role: UserRole) {
  const map: Record<UserRole, Array<{ label: string; value: string; hint: string }>> = {
    mechanic: [
      { label: "Сегодня", value: "8", hint: "назначенных заявок" },
      { label: "Черновики", value: "3", hint: "offline forms" },
      { label: "Срочные", value: "2", hint: "аварии и SLA" },
      { label: "Sync", value: "7", hint: "pending mutations" },
    ],
    seniorMechanic: [
      { label: "Бригада", value: "6", hint: "механиков на смене" },
      { label: "Approvals", value: "5", hint: "закрытие и фото" },
      { label: "Повторы", value: "3", hint: "объекты под контролем" },
      { label: "Offline", value: "11", hint: "пакетов механиков" },
    ],
    dispatcher: [
      { label: "Новые", value: "24", hint: "заказ-наряда" },
      { label: "Аварии", value: "5", hint: "active emergency" },
      { label: "SLA alerts", value: "9", hint: "needs escalation" },
      { label: "Механики", value: "37", hint: "online/on shift" },
    ],
    emergencyCoordinator: [
      { label: "Аварии", value: "7", hint: "active emergency queue" },
      { label: "Override", value: "3", hint: "schedule rebuilds" },
      { label: "SLA", value: "4", hint: "critical timers" },
      { label: "Дежурные", value: "12", hint: "available response team" },
    ],
    warehouse: [
      { label: "Резервы", value: "31", hint: "awaiting issue" },
      { label: "Дефицит", value: "12", hint: "critical SKUs" },
      { label: "Возвраты", value: "8", hint: "needs inspect" },
      { label: "Approvals", value: "4", hint: "write-off queue" },
    ],
    supervisor: [
      { label: "KPI", value: "91%", hint: "SLA compliance" },
      { label: "Проблемные", value: "14", hint: "objects at risk" },
      { label: "Повторы", value: "6", hint: "repeat visits" },
      { label: "Эффективность", value: "84%", hint: "crew utilization" },
    ],
    director: [
      { label: "SLA", value: "93%", hint: "company-wide" },
      { label: "Маржа", value: "18%", hint: "service operations" },
      { label: "Аварии", value: "11", hint: "open critical" },
      { label: "Объекты", value: "842", hint: "under contract" },
    ],
    administrator: [
      { label: "Users", value: "146", hint: "active accounts" },
      { label: "Roles", value: "6", hint: "RBAC profiles" },
      { label: "Audit", value: "1.2k", hint: "events today" },
      { label: "Sessions", value: "88", hint: "active devices" },
    ],
  };
  return map[role];
}

function dashboardTasks(role: UserRole) {
  if (role === "mechanic" || role === "seniorMechanic") return [
    { title: "Открыть сегодняшние заявки", description: "Только назначенные объекты и локальные drafts", icon: HardHat, permission: "work_orders:read" as Permission },
    { title: "Синхронизировать offline пакет", description: "Фотографии, подписи, расход материалов", icon: RefreshCw, permission: "work_orders:close" as Permission },
  ];
  if (role === "dispatcher" || role === "emergencyCoordinator") return [
    { title: "Назначить аварийную заявку", description: "С учетом региона, навыков и маршрута", icon: RadioTower, permission: "dispatch:manage" as Permission },
    { title: "Поднять SLA escalation", description: "Уведомления руководителю и механикам", icon: AlertTriangle, permission: "work_orders:assign" as Permission },
  ];
  return [
    { title: "Проверить проблемные объекты", description: "KPI, повторы, надежность оборудования", icon: Gauge, permission: "analytics:read" as Permission },
    { title: "Управлять доступом", description: "Пользователи, роли, территории, аудит", icon: Users, permission: "users:write" as Permission },
  ];
}

function AdminWorkspace() {
  const session = useAuthStore((state) => state.session)!;
  const canWrite = hasPermission(session.user, "users:write");

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-black text-white">Administrator workspace</h2><p className="text-slate-500">Users, roles, permissions, object access, audit logs and system settings.</p></div>
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Card className="border-slate-800 bg-slate-950/70">
          <CardHeader><CardTitle>User management workflow</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {managedUsers.map((user) => (
              <div key={user.name} className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm md:grid-cols-[1fr_auto_auto] md:items-center">
                <div><p className="font-semibold text-white">{user.name}</p><p className="text-slate-500">{user.role} · {user.territory} · objects {user.objects}</p></div>
                <Badge className={user.status === "active" ? "bg-emerald-500/15 text-emerald-200" : "bg-orange-500/15 text-orange-200"}>{user.status}</Badge>
                <Button size="sm" variant="secondary" disabled={!canWrite}>Edit access</Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-950/70">
          <CardHeader><CardTitle>Permissions matrix</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {PERMISSION_MATRIX.map((row) => (
              <div key={row.role} className="rounded-2xl border border-slate-800 p-3 text-sm">
                <p className="font-semibold text-white">{ROLE_LABELS[row.role]}</p>
                <p className="text-xs text-slate-500">{row.objectScope}</p>
                <p className="mt-2 text-xs text-slate-400">{row.permissions.length} permissions</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="border-slate-800 bg-slate-950/70"><CardHeader><CardTitle>Audit logs</CardTitle></CardHeader><CardContent className="grid gap-2 md:grid-cols-2">{auditEvents.map((event) => <div key={event} className="rounded-xl bg-slate-900/70 p-3 text-sm text-slate-300">{event}</div>)}</CardContent></Card>
    </div>
  );
}

function SettingsWorkspace() {
  const settings = ["Profile", "Notifications", "App preferences", "Warehouse settings", "SLA settings", "Organization settings"];
  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-black text-white">Settings architecture</h2><p className="text-slate-500">Central preference surface with role-aware sections and audit-backed changes.</p></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {settings.map((setting) => <Card key={setting} className="border-slate-800 bg-slate-950/70"><CardContent className="p-4"><Settings className="mb-4 h-5 w-5 text-orange-300" /><p className="font-semibold text-white">{setting}</p><p className="mt-2 text-sm text-slate-500">Protected by route guards, permission checks and sync-safe forms.</p></CardContent></Card>)}
      </div>
      <Card className="border-slate-800 bg-slate-950/70"><CardHeader><CardTitle>PWA foundation</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{Object.entries(PWA_FOUNDATION).map(([key, value]) => <div key={key} className="rounded-2xl border border-slate-800 p-3 text-sm"><p className="font-semibold text-white">{key}</p><p className="mt-1 text-slate-500">{typeof value === "string" ? value : JSON.stringify(value)}</p></div>)}</CardContent></Card>
    </div>
  );
}

function NotificationsPanel() {
  const toggle = useAuthStore((state) => state.toggleNotifications);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-black text-white">Realtime system</h2><Button size="sm" variant="ghost" onClick={toggle} className="xl:hidden"><X className="h-4 w-4" /></Button></div>
      <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
        <div className="rounded-2xl border border-slate-800 p-3"><MonitorSmartphone className="mb-2 h-4 w-4 text-orange-300" /> online status</div>
        <div className="rounded-2xl border border-slate-800 p-3"><DatabaseZap className="mb-2 h-4 w-4 text-orange-300" /> sync queue</div>
      </div>
      {notifications.map((item) => <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><div className="flex items-center justify-between"><p className="font-semibold text-white">{item.title}</p><Badge>{item.time}</Badge></div><p className="mt-2 text-sm text-slate-400">{item.text}</p></div>)}
    </div>
  );
}

function MobileBottomNav() {
  const session = useAuthStore((state) => state.session)!;
  const setActivePage = useAuthStore((state) => state.setActivePage);
  const nav = GLOBAL_NAVIGATION.filter((item) => item.mobile && hasPermission(session.user, item.permission)).slice(0, 5);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 p-2 safe-bottom lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {nav.map((item) => <button key={item.href} onClick={() => setActivePage(item.href === "/settings" ? "settings" : "dashboard")} className="rounded-xl p-2 text-center text-[11px] text-slate-400 hover:bg-slate-900 hover:text-white"><span className="mx-auto mb-1 flex justify-center">{navIcons[item.label]}</span>{item.label}</button>)}
      </div>
    </nav>
  );
}
