import { NextRequest, NextResponse } from "next/server";
import { findSession, type Role, type Session } from "./operational-store";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: unknown } };

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiResult<T>>({ ok: true, data }, init);
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
) {
  return NextResponse.json<ApiResult<never>>(
    { ok: false, error: { code, message, details } },
    { status },
  );
}

export async function readJson<T extends Record<string, unknown>>(
  request: NextRequest,
): Promise<Partial<T>> {
  try {
    return (await request.json()) as Partial<T>;
  } catch {
    return {};
  }
}

const permissions: Record<Role, string[]> = {
  mechanic: [
    "objects:read",
    "elevators:read",
    "work-orders:read",
    "work-orders:write",
    "media:write",
    "sync:write",
    "notifications:read",
  ],
  dispatcher: [
    "objects:read",
    "elevators:read",
    "work-orders:read",
    "work-orders:write",
    "dispatch:manage",
    "emergency:manage",
    "notifications:read",
  ],
  warehouse: ["warehouse:manage", "materials:write", "notifications:read"],
  supervisor: [
    "objects:read",
    "elevators:read",
    "work-orders:read",
    "dispatch:manage",
    "reports:read",
    "notifications:read",
  ],
  director: [
    "objects:read",
    "elevators:read",
    "work-orders:read",
    "reports:read",
    "notifications:read",
  ],
  administrator: ["*"],
};

export function getSessionFromRequest(request: NextRequest) {
  return findSession(request.cookies.get("neo_session")?.value);
}

export function requireSession(
  request: NextRequest,
  permission?: string,
): Session | NextResponse {
  const session = getSessionFromRequest(request);
  if (!session)
    return apiError("UNAUTHENTICATED", "Требуется вход в систему", 401);
  if (permission && !hasPermission(session.role, permission))
    return apiError("FORBIDDEN", "Недостаточно прав", 403, { permission });
  return session;
}

export function hasPermission(role: Role, permission: string) {
  const allowed = permissions[role] ?? [];
  return allowed.includes("*") || allowed.includes(permission);
}

export function isErrorResponse(
  value: Session | NextResponse,
): value is NextResponse {
  return value instanceof NextResponse;
}
