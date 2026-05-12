import type { AuthUser, Permission, UserRole } from "./types";

export const ROLE_LABELS: Record<UserRole, string> = {
  mechanic: "Механик",
  dispatcher: "Диспетчер",
  warehouse: "Склад",
  supervisor: "Руководитель участка",
  director: "Директор",
  administrator: "Администратор",
};

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  mechanic: [
    "dashboard:view",
    "objects:read",
    "elevators:read",
    "work_orders:read",
    "work_orders:create",
    "work_orders:close",
    "warehouse:read",
    "settings:read",
  ],
  dispatcher: [
    "dashboard:view",
    "objects:read",
    "elevators:read",
    "work_orders:read",
    "work_orders:create",
    "work_orders:assign",
    "dispatch:read",
    "dispatch:manage",
    "analytics:read",
    "imports:read",
    "settings:read",
  ],
  warehouse: [
    "dashboard:view",
    "objects:read",
    "work_orders:read",
    "warehouse:read",
    "warehouse:issue",
    "warehouse:approve",
    "imports:read",
    "imports:manage",
    "settings:read",
  ],
  supervisor: [
    "dashboard:view",
    "objects:read",
    "objects:write",
    "elevators:read",
    "elevators:write",
    "work_orders:read",
    "work_orders:assign",
    "work_orders:approve",
    "warehouse:read",
    "dispatch:read",
    "analytics:read",
    "imports:read",
    "imports:manage",
    "users:read",
    "settings:read",
  ],
  director: [
    "dashboard:view",
    "objects:read",
    "objects:write",
    "elevators:read",
    "elevators:write",
    "work_orders:read",
    "work_orders:assign",
    "work_orders:approve",
    "warehouse:read",
    "warehouse:approve",
    "dispatch:read",
    "dispatch:manage",
    "analytics:read",
    "imports:read",
    "imports:manage",
    "imports:rollback",
    "mdm:manage",
    "users:read",
    "settings:read",
    "audit:read",
  ],
  administrator: [
    "dashboard:view",
    "objects:read",
    "objects:write",
    "elevators:read",
    "elevators:write",
    "work_orders:read",
    "work_orders:create",
    "work_orders:assign",
    "work_orders:approve",
    "work_orders:close",
    "warehouse:read",
    "warehouse:issue",
    "warehouse:approve",
    "dispatch:read",
    "dispatch:manage",
    "analytics:read",
    "imports:read",
    "imports:manage",
    "imports:rollback",
    "mdm:manage",
    "users:read",
    "users:write",
    "roles:manage",
    "settings:read",
    "settings:write",
    "audit:read",
    "system:manage",
  ],
};

export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/dashboard": "dashboard:view",
  "/mechanic": "work_orders:read",
  "/objects": "objects:read",
  "/elevators": "elevators:read",
  "/work-orders": "work_orders:read",
  "/warehouse": "warehouse:read",
  "/dispatch": "dispatch:read",
  "/analytics": "analytics:read",
  "/imports": "imports:read",
  "/admin": "users:read",
  "/settings": "settings:read",
};

export function hasPermission(user: Pick<AuthUser, "permissions"> | null, permission: Permission) {
  return Boolean(user?.permissions.includes(permission));
}

export function canAccessRoute(user: AuthUser | null, pathname: string) {
  const permission = Object.entries(ROUTE_PERMISSIONS)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([route]) => pathname.startsWith(route))?.[1];

  return permission ? hasPermission(user, permission) : Boolean(user);
}

export function canAccessObject(user: AuthUser | null, object: { id: string; regionId: string; territoryId: string }) {
  if (!user) return false;
  if (user.role === "director" || user.role === "administrator") return true;
  if (user.scope.objectIds.includes(object.id)) return true;
  if (user.scope.territoryIds.includes(object.territoryId)) return true;
  return user.scope.regionIds.includes(object.regionId) && user.role !== "mechanic";
}

export const PERMISSION_MATRIX = Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => ({
  role: role as UserRole,
  permissions,
  objectScope:
    role === "mechanic"
      ? "assigned objects only"
      : role === "dispatcher"
        ? "dispatcher region"
        : role === "warehouse"
          ? "linked warehouses and work orders"
          : "organization-wide or delegated regions",
}));
