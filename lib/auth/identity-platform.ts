import type { AccessScope, Permission, SessionRisk, UserRole } from "./types";

export type IdentityStatus = "active" | "locked" | "suspended" | "invited";
export type DeviceTrustState = "trusted" | "pending" | "revoked" | "lost";
export type SessionState = "active" | "refresh_required" | "offline_grace" | "revoked" | "expired";
export type SecurityEventType =
  | "login"
  | "logout"
  | "failed_login"
  | "password_reset"
  | "device_registration"
  | "device_revoked"
  | "session_revoked"
  | "refresh_rotated"
  | "permission_change"
  | "offline_reconnect"
  | "suspicious_activity";

export type ManagedIdentity = {
  id: string;
  name: string;
  role: UserRole;
  status: IdentityStatus;
  region: string;
  activeSessions: number;
  lastActivityAt: string;
  deviceCount: number;
  risk: SessionRisk;
  scope: AccessScope;
  permissions: Permission[];
};

export type ManagedSession = {
  id: string;
  userId: string;
  deviceId: string;
  state: SessionState;
  ipAddress: string;
  userAgent: string;
  startedAt: string;
  lastSeenAt: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
  offlineUntil?: string;
  rotationCounter: number;
  deviceBound: boolean;
};

export type ManagedDevice = {
  id: string;
  userId: string;
  label: string;
  platform: "pwa-mobile" | "desktop" | "rugged-android" | "tablet";
  trustState: DeviceTrustState;
  fingerprintHash: string;
  region: string;
  lastSeenAt: string;
  offlineCapable: boolean;
  revokedAt?: string;
};

export type LoginAttempt = {
  id: string;
  login: string;
  outcome: "success" | "failed" | "locked" | "step_up_required";
  ipAddress: string;
  region: string;
  attemptedAt: string;
  reason?: string;
};

export type SecurityEvent = {
  id: string;
  type: SecurityEventType;
  severity: "info" | "warning" | "critical";
  userId?: string;
  deviceId?: string;
  message: string;
  occurredAt: string;
  immutableHash: string;
};

export type OfflineSessionPolicy = {
  eligibleRoles: UserRole[];
  maxOfflineHours: number;
  localVault: "webcrypto-indexeddb";
  validation: string[];
  reconnectActions: string[];
};

export type TokenRotationPolicy = {
  accessTokenMinutes: number;
  refreshTokenDays: number;
  rotateRefreshOnUse: true;
  reuseDetection: true;
  bindToDeviceFingerprint: true;
  cookieMode: "HttpOnly Secure SameSite=Strict";
};

export const TOKEN_ROTATION_POLICY: TokenRotationPolicy = {
  accessTokenMinutes: 10,
  refreshTokenDays: 14,
  rotateRefreshOnUse: true,
  reuseDetection: true,
  bindToDeviceFingerprint: true,
  cookieMode: "HttpOnly Secure SameSite=Strict",
};

export const OFFLINE_SESSION_POLICY: OfflineSessionPolicy = {
  eligibleRoles: ["mechanic", "seniorMechanic"],
  maxOfflineHours: 12,
  localVault: "webcrypto-indexeddb",
  validation: [
    "device fingerprint hash matches trusted device envelope",
    "cached session is inside offlineUntil window",
    "encrypted offline grant was issued by the server after online login",
    "role snapshot only allows assigned work orders, assigned objects and local media queue",
  ],
  reconnectActions: [
    "submit offline session proof and operation cursor",
    "rotate refresh token family before new access token is issued",
    "sync revoked-device and forced-logout markers",
    "write offline_reconnect security event with conflict and replay metadata",
  ],
};

export const PASSWORD_SECURITY_POLICY = {
  hashing: "argon2id with per-user salt and server-side pepper reference",
  minLength: 14,
  rotationDaysForPrivilegedRoles: 90,
  failedAttemptWindowMinutes: 15,
  lockoutThreshold: 7,
  lockoutMinutes: 30,
  passwordResetMinutes: 20,
};

export const API_SECURITY_POLICY = {
  middleware: ["tenant resolution", "session lookup", "device trust check", "permission guard", "scope guard"],
  csrf: "double-submit token for mutating browser requests plus SameSite cookies",
  signedRequests: "HMAC request signing for worker/device sync APIs",
  rateLimits: ["login by login+ip", "refresh by session+device", "password reset by tenant+login"],
  audit: "all auth decisions emit immutable AuthAuditLog rows with correlation id",
};

export const PERMISSION_GROUPS = [
  { code: "field-work", label: "Field work", permissions: ["work_orders:read", "work_orders:create", "work_orders:close", "media:write", "sync:read"] satisfies Permission[] },
  { code: "dispatch", label: "Dispatch control", permissions: ["dispatch:read", "dispatch:manage", "work_orders:assign", "notifications:manage"] satisfies Permission[] },
  { code: "inventory", label: "Warehouse operations", permissions: ["warehouse:read", "warehouse:issue", "warehouse:approve"] satisfies Permission[] },
  { code: "governance", label: "Enterprise governance", permissions: ["users:read", "users:write", "roles:manage", "audit:read", "system:manage"] satisfies Permission[] },
];

export const managedIdentitiesSeed: ManagedIdentity[] = [
  {
    id: "u-mech-014",
    name: "Алексей Климов",
    role: "mechanic",
    status: "active",
    region: "Юг-2",
    activeSessions: 2,
    lastActivityAt: "2 мин назад",
    deviceCount: 2,
    risk: "normal",
    scope: { organizationId: "neo", regionIds: ["south"], territoryIds: ["t-yug-2"], objectIds: ["obj-104", "obj-118"], warehouseIds: ["wh-south"] },
    permissions: ["work_orders:read", "work_orders:create", "work_orders:close", "media:write", "sync:read"],
  },
  {
    id: "u-senior-021",
    name: "Дмитрий Назаров",
    role: "seniorMechanic",
    status: "active",
    region: "Север-1",
    activeSessions: 1,
    lastActivityAt: "17 мин назад",
    deviceCount: 3,
    risk: "normal",
    scope: { organizationId: "neo", regionIds: ["north"], territoryIds: ["t-north-1"], objectIds: ["obj-209", "obj-211"], warehouseIds: ["wh-north"] },
    permissions: ["work_orders:read", "work_orders:assign", "work_orders:approve", "media:approve", "sync:read"],
  },
  {
    id: "u-disp-003",
    name: "Марина Соколова",
    role: "dispatcher",
    status: "active",
    region: "Центр + Юг",
    activeSessions: 3,
    lastActivityAt: "только что",
    deviceCount: 2,
    risk: "elevated",
    scope: { organizationId: "neo", regionIds: ["central", "south"], territoryIds: ["t-center-1", "t-yug-2"], objectIds: [], warehouseIds: ["wh-central", "wh-south"] },
    permissions: ["dispatch:read", "dispatch:manage", "work_orders:assign", "notifications:manage"],
  },
  {
    id: "u-admin-001",
    name: "Илья Орлов",
    role: "administrator",
    status: "active",
    region: "Все регионы",
    activeSessions: 1,
    lastActivityAt: "6 мин назад",
    deviceCount: 4,
    risk: "normal",
    scope: { organizationId: "neo", regionIds: ["central", "south", "north"], territoryIds: ["*"], objectIds: ["*"], warehouseIds: ["*"] },
    permissions: ["users:read", "users:write", "roles:manage", "audit:read", "system:manage"],
  },
];

export const managedSessionsSeed: ManagedSession[] = [
  { id: "sess-7f31", userId: "u-mech-014", deviceId: "dev-rugged-14", state: "offline_grace", ipAddress: "10.42.8.34", userAgent: "NeoLift PWA Android", startedAt: "08:05", lastSeenAt: "10:12", accessExpiresAt: "10:22", refreshExpiresAt: "14 дней", offlineUntil: "22:12", rotationCounter: 18, deviceBound: true },
  { id: "sess-aa02", userId: "u-disp-003", deviceId: "dev-desk-03", state: "active", ipAddress: "10.12.2.9", userAgent: "Chrome Windows", startedAt: "07:42", lastSeenAt: "10:28", accessExpiresAt: "10:38", refreshExpiresAt: "14 дней", rotationCounter: 31, deviceBound: true },
  { id: "sess-rev-44", userId: "u-admin-001", deviceId: "dev-lost-77", state: "revoked", ipAddress: "unknown", userAgent: "Lost tablet", startedAt: "вчера", lastSeenAt: "вчера", accessExpiresAt: "revoked", refreshExpiresAt: "revoked", rotationCounter: 4, deviceBound: true },
];

export const managedDevicesSeed: ManagedDevice[] = [
  { id: "dev-rugged-14", userId: "u-mech-014", label: "Rugged Android шахта №14", platform: "rugged-android", trustState: "trusted", fingerprintHash: "fp_sha256_7bd…91a", region: "Юг-2", lastSeenAt: "10:12", offlineCapable: true },
  { id: "dev-desk-03", userId: "u-disp-003", label: "Dispatcher workstation", platform: "desktop", trustState: "trusted", fingerprintHash: "fp_sha256_e43…c20", region: "Центр", lastSeenAt: "10:28", offlineCapable: false },
  { id: "dev-lost-77", userId: "u-admin-001", label: "Lost service tablet", platform: "tablet", trustState: "lost", fingerprintHash: "fp_sha256_112…a9f", region: "Север", lastSeenAt: "вчера", offlineCapable: true, revokedAt: "09:44" },
];

export const loginAttemptsSeed: LoginAttempt[] = [
  { id: "login-1", login: "mech014", outcome: "success", ipAddress: "10.42.8.34", region: "Юг-2", attemptedAt: "10:02" },
  { id: "login-2", login: "unknown@neolift", outcome: "failed", ipAddress: "185.17.4.22", region: "external", attemptedAt: "09:58", reason: "unknown login" },
  { id: "login-3", login: "dispatcher003", outcome: "step_up_required", ipAddress: "10.12.2.9", region: "Центр", attemptedAt: "09:51", reason: "new browser fingerprint" },
];

export const securityEventsSeed: SecurityEvent[] = [
  { id: "sec-1", type: "device_revoked", severity: "critical", userId: "u-admin-001", deviceId: "dev-lost-77", message: "Lost tablet revoked; refresh family invalidated; offline grant flagged for reconnect denial.", occurredAt: "09:44", immutableHash: "hash_00018af" },
  { id: "sec-2", type: "refresh_rotated", severity: "info", userId: "u-mech-014", deviceId: "dev-rugged-14", message: "Refresh token rotated after mobile reconnect and offline operation replay.", occurredAt: "10:12", immutableHash: "hash_00018b0" },
  { id: "sec-3", type: "failed_login", severity: "warning", message: "Failed login burst detected from external IP; rate limiter escalated to tenant lockout rule.", occurredAt: "09:58", immutableHash: "hash_00018b1" },
];

export function canUseOfflineAuth(role: UserRole, device: Pick<ManagedDevice, "trustState" | "offlineCapable">) {
  return OFFLINE_SESSION_POLICY.eligibleRoles.includes(role) && device.offlineCapable && device.trustState === "trusted";
}

export function evaluateScopedPermission(identity: ManagedIdentity, permission: Permission, scope: Partial<AccessScope>) {
  if (!identity.permissions.includes(permission)) return false;
  if (identity.scope.objectIds.includes("*") || identity.scope.territoryIds.includes("*")) return true;
  const regionAllowed = !scope.regionIds?.length || scope.regionIds.some((region) => identity.scope.regionIds.includes(region));
  const objectAllowed = !scope.objectIds?.length || scope.objectIds.some((object) => identity.scope.objectIds.includes(object));
  const warehouseAllowed = !scope.warehouseIds?.length || scope.warehouseIds.some((warehouse) => identity.scope.warehouseIds.includes(warehouse));
  return regionAllowed && objectAllowed && warehouseAllowed;
}
