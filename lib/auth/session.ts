import { ROLE_PERMISSIONS } from "./rbac";
import type { AuthSession, AuthUser, UserRole } from "./types";

const SESSION_KEY = "neolift.auth.session.v1";
const OFFLINE_KEY = "neolift.auth.offline-cache.v1";
const ACCESS_TOKEN_MINUTES = 12;
const REFRESH_TOKEN_DAYS = 14;
const OFFLINE_CACHE_HOURS = 12;

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000).toISOString();
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 3_600_000).toISOString();
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000).toISOString();
}

function createToken(prefix: string) {
  return `${prefix}.${crypto.randomUUID()}.${Date.now()}`;
}

export const DEMO_USERS: AuthUser[] = [
  {
    id: "u-mech-014",
    name: "Алексей Климов",
    position: "Механик аварийной бригады",
    phone: "+7 900 014-22-11",
    role: "mechanic",
    department: "Сервис Юг",
    status: "active",
    permissions: ROLE_PERMISSIONS.mechanic,
    scope: { organizationId: "neo", regionIds: ["south"], territoryIds: ["t-yug-2"], objectIds: ["obj-104", "obj-118", "obj-124"], warehouseIds: ["wh-south"] },
  },
  {
    id: "u-disp-003",
    name: "Марина Соколова",
    position: "Старший диспетчер",
    phone: "+7 900 003-45-80",
    role: "dispatcher",
    department: "Диспетчерская",
    status: "active",
    permissions: ROLE_PERMISSIONS.dispatcher,
    scope: { organizationId: "neo", regionIds: ["central", "south"], territoryIds: ["t-center-1", "t-yug-2"], objectIds: [], warehouseIds: ["wh-central", "wh-south"] },
  },
  {
    id: "u-wh-002",
    name: "Олег Романов",
    position: "Кладовщик основного склада",
    phone: "+7 900 002-30-70",
    role: "warehouse",
    department: "Склад и снабжение",
    status: "active",
    permissions: ROLE_PERMISSIONS.warehouse,
    scope: { organizationId: "neo", regionIds: ["central", "south"], territoryIds: ["t-center-1", "t-yug-2"], objectIds: [], warehouseIds: ["wh-central", "wh-south"] },
  },
  {
    id: "u-super-004",
    name: "Виктор Лебедев",
    position: "Руководитель сервисного участка",
    phone: "+7 900 004-11-90",
    role: "supervisor",
    department: "Эксплуатация",
    status: "active",
    permissions: ROLE_PERMISSIONS.supervisor,
    scope: { organizationId: "neo", regionIds: ["central", "south"], territoryIds: ["t-center-1", "t-yug-2"], objectIds: [], warehouseIds: ["wh-central", "wh-south"] },
  },
  {
    id: "u-dir-005",
    name: "Анна Белова",
    position: "Операционный директор",
    phone: "+7 900 005-51-20",
    role: "director",
    department: "Дирекция",
    status: "active",
    permissions: ROLE_PERMISSIONS.director,
    scope: { organizationId: "neo", regionIds: ["central", "south", "north"], territoryIds: ["*"], objectIds: ["*"], warehouseIds: ["*"] },
  },
  {
    id: "u-admin-001",
    name: "Илья Орлов",
    position: "Администратор ERP",
    phone: "+7 900 001-00-01",
    role: "administrator",
    department: "ИТ и безопасность",
    status: "active",
    permissions: ROLE_PERMISSIONS.administrator,
    scope: { organizationId: "neo", regionIds: ["central", "south", "north"], territoryIds: ["*"], objectIds: ["*"], warehouseIds: ["*"] },
  },
];

export function buildSession(role: UserRole, rememberSession: boolean): AuthSession {
  const now = new Date();
  const user = DEMO_USERS.find((candidate) => candidate.role === role) ?? DEMO_USERS[0];

  return {
    user,
    createdAt: now.toISOString(),
    lastActivityAt: now.toISOString(),
    rememberSession,
    biometricReady: role === "mechanic",
    offlineCacheUntil: addHours(now, OFFLINE_CACHE_HOURS),
    tokens: {
      accessToken: createToken("jwt.access"),
      refreshToken: createToken("jwt.refresh"),
      expiresAt: addMinutes(now, ACCESS_TOKEN_MINUTES),
      refreshExpiresAt: addDays(now, rememberSession ? REFRESH_TOKEN_DAYS : 1),
    },
    devices: [
      { id: "dev-current", deviceName: "PWA / текущий терминал", ip: "10.42.7.21", lastSeenAt: now.toISOString(), trusted: true, current: true, risk: "normal" },
      { id: "dev-mobile", deviceName: "Android rugged phone", ip: "10.42.8.34", lastSeenAt: addMinutes(now, -38), trusted: true, current: false, risk: "normal" },
      { id: "dev-office", deviceName: "Dispatcher workstation", ip: "10.12.2.9", lastSeenAt: addMinutes(now, -94), trusted: false, current: false, risk: "elevated" },
    ],
  };
}

export function persistSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.localStorage.setItem(OFFLINE_KEY, JSON.stringify({ user: session.user, offlineCacheUntil: session.offlineCacheUntil, permissions: session.user.permissions }));
}

export function restoreSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AuthSession;
    return new Date(session.tokens.refreshExpiresAt).getTime() > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
}

export function refreshAccessToken(session: AuthSession): AuthSession {
  const now = new Date();
  return {
    ...session,
    lastActivityAt: now.toISOString(),
    tokens: {
      ...session.tokens,
      accessToken: createToken("jwt.access"),
      expiresAt: addMinutes(now, ACCESS_TOKEN_MINUTES),
    },
  };
}

export const SESSION_POLICY = {
  accessTokenMinutes: ACCESS_TOKEN_MINUTES,
  refreshTokenDays: REFRESH_TOKEN_DAYS,
  inactivityTimeoutMinutes: 20,
  forcedLogoutChannels: ["role-changed", "user-disabled", "device-revoked", "security-incident"],
  concurrentSessionLimit: 5,
  offlineCacheHours: OFFLINE_CACHE_HOURS,
};
