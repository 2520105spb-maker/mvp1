export type UserRole =
  | "mechanic"
  | "seniorMechanic"
  | "dispatcher"
  | "emergencyCoordinator"
  | "warehouse"
  | "supervisor"
  | "director"
  | "administrator";

export type Permission =
  | "dashboard:view"
  | "objects:read"
  | "objects:write"
  | "elevators:read"
  | "elevators:write"
  | "work_orders:read"
  | "work_orders:create"
  | "work_orders:assign"
  | "work_orders:approve"
  | "work_orders:close"
  | "warehouse:read"
  | "warehouse:issue"
  | "warehouse:approve"
  | "media:read"
  | "media:write"
  | "media:approve"
  | "sync:read"
  | "sync:manage"
  | "notifications:read"
  | "notifications:manage"
  | "reports:read"
  | "reports:manage"
  | "dispatch:read"
  | "dispatch:manage"
  | "emergency:read"
  | "emergency:manage"
  | "emergency:override"
  | "geo:read"
  | "geo:manage"
  | "analytics:read"
  | "imports:read"
  | "imports:manage"
  | "imports:rollback"
  | "mdm:manage"
  | "users:read"
  | "users:write"
  | "roles:manage"
  | "settings:read"
  | "settings:write"
  | "audit:read"
  | "system:manage";

export type AccessScope = {
  organizationId: string;
  regionIds: string[];
  territoryIds: string[];
  objectIds: string[];
  warehouseIds: string[];
};

export type SessionRisk = "normal" | "elevated" | "blocked";

export type AuthUser = {
  id: string;
  name: string;
  position: string;
  phone: string;
  role: UserRole;
  department: string;
  permissions: Permission[];
  scope: AccessScope;
  status: "active" | "suspended" | "invited";
};

export type DeviceSession = {
  id: string;
  deviceName: string;
  ip: string;
  lastSeenAt: string;
  trusted: boolean;
  current: boolean;
  risk: SessionRisk;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  refreshExpiresAt: string;
};

export type AuthSession = {
  user: AuthUser;
  tokens: AuthTokens;
  devices: DeviceSession[];
  createdAt: string;
  lastActivityAt: string;
  rememberSession: boolean;
  biometricReady: boolean;
  offlineCacheUntil: string;
  forcedLogoutReason?: string;
};

export type NavItem = {
  href: string;
  label: string;
  description: string;
  permission: Permission;
  roles?: UserRole[];
  mobile: boolean;
};

export type SyncState = {
  network: "online" | "degraded" | "offline";
  pendingMutations: number;
  lastSyncedAt: string;
  backgroundSync: "idle" | "running" | "failed";
};
