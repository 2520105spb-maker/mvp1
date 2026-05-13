import type { AuthUser, Permission, UserRole } from "./types";

export const ROLE_LABELS: Record<UserRole, string> = {
  mechanic: "Механик",
  seniorMechanic: "Старший механик",
  dispatcher: "Диспетчер",
  emergencyCoordinator: "Координатор аварий",
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
    "emergency:read",
    "geo:read",
    "warehouse:read",
    "media:read",
    "media:write",
    "sync:read",
    "notifications:read",
    "reports:read",
    "settings:read",
  ],

  seniorMechanic: [
    "dashboard:view",
    "objects:read",
    "elevators:read",
    "work_orders:read",
    "work_orders:create",
    "work_orders:assign",
    "work_orders:approve",
    "work_orders:close",
    "emergency:read",
    "geo:read",
    "warehouse:read",
    "media:read",
    "media:write",
    "media:approve",
    "sync:read",
    "sync:manage",
    "notifications:read",
    "reports:read",
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
    "emergency:read",
    "emergency:manage",
    "geo:read",
    "geo:manage",
    "media:read",
    "sync:read",
    "notifications:read",
    "notifications:manage",
    "reports:read",
    "analytics:read",
    "imports:read",
    "settings:read",
  ],
  emergencyCoordinator: [
    "dashboard:view",
    "objects:read",
    "elevators:read",
    "work_orders:read",
    "work_orders:create",
    "work_orders:assign",
    "work_orders:approve",
    "dispatch:read",
    "dispatch:manage",
    "emergency:read",
    "emergency:manage",
    "emergency:override",
    "geo:read",
    "geo:manage",
    "media:read",
    "sync:read",
    "notifications:read",
    "notifications:manage",
    "reports:read",
    "analytics:read",
    "settings:read",
  ],
  warehouse: [
    "dashboard:view",
    "objects:read",
    "work_orders:read",
    "warehouse:read",
    "warehouse:issue",
    "warehouse:approve",
    "media:read",
    "media:approve",
    "sync:read",
    "notifications:read",
    "reports:read",
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
    "media:read",
    "media:approve",
    "sync:read",
    "sync:manage",
    "notifications:read",
    "notifications:manage",
    "reports:read",
    "reports:manage",
    "dispatch:read",
    "emergency:read",
    "geo:read",
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
    "media:read",
    "media:write",
    "media:approve",
    "sync:read",
    "sync:manage",
    "notifications:read",
    "notifications:manage",
    "reports:read",
    "reports:manage",
    "dispatch:read",
    "dispatch:manage",
    "emergency:read",
    "emergency:manage",
    "emergency:override",
    "geo:read",
    "geo:manage",
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
    "media:read",
    "media:write",
    "media:approve",
    "sync:read",
    "sync:manage",
    "notifications:read",
    "notifications:manage",
    "reports:read",
    "reports:manage",
    "dispatch:read",
    "dispatch:manage",
    "emergency:read",
    "emergency:manage",
    "emergency:override",
    "geo:read",
    "geo:manage",
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
  "/media": "media:read",
  "/sync": "sync:read",
  "/notifications": "notifications:read",
  "/reports": "reports:read",
  "/dispatch": "dispatch:read",
  "/dispatcher": "dispatch:read",
  "/emergency": "emergency:read",
  "/maps": "geo:read",
  "/analytics": "analytics:read",
  "/imports": "imports:read",
  "/admin": "users:read",
  "/settings": "settings:read",
};

export function hasPermission(
  user: Pick<AuthUser, "permissions"> | null,
  permission: Permission,
) {
  return Boolean(user?.permissions.includes(permission));
}

export function canAccessRoute(user: AuthUser | null, pathname: string) {
  const permission = Object.entries(ROUTE_PERMISSIONS)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([route]) => pathname.startsWith(route))?.[1];

  return permission ? hasPermission(user, permission) : Boolean(user);
}

export function canAccessObject(
  user: AuthUser | null,
  object: { id: string; regionId: string; territoryId: string },
) {
  if (!user) return false;
  if (user.role === "director" || user.role === "administrator") return true;
  if (user.scope.objectIds.includes(object.id)) return true;
  if (user.scope.territoryIds.includes(object.territoryId)) return true;
  return (
    user.scope.regionIds.includes(object.regionId) && user.role !== "mechanic"
  );
}

export const PERMISSION_MATRIX = Object.entries(ROLE_PERMISSIONS).map(
  ([role, permissions]) => ({
    role: role as UserRole,
    permissions,
    objectScope:
      role === "mechanic"
        ? "assigned objects only"
        : role === "seniorMechanic"
          ? "assigned objects plus brigade approvals"
          : role === "dispatcher"
          ? "dispatcher region"
          : role === "emergencyCoordinator"
            ? "emergency override region with escalation audit"
            : role === "warehouse"
            ? "linked warehouses and work orders"
            : "organization-wide or delegated regions",
  }),
);
