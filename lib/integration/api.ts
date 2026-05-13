import { NextRequest, NextResponse } from "next/server";
import { DomainError, type Role, type Session } from "./domain";
import { repositories } from "./services";

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

export function domainError(error: unknown) {
  if (error instanceof DomainError)
    return apiError(error.code, error.message, error.status, error.details);
  console.error(
    JSON.stringify({
      level: "error",
      event: "api_unhandled_error",
      message: error instanceof Error ? error.message : "Unknown error",
    }),
  );
  return apiError("VALIDATION_FAILED", "Операция не выполнена", 500);
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
    "reports:read",
  ],
  dispatcher: [
    "objects:read",
    "elevators:read",
    "work-orders:read",
    "work-orders:write",
    "dispatch:manage",
    "emergency:manage",
    "notifications:read",
    "reports:read",
  ],
  warehouse: ["warehouse:manage", "materials:write", "notifications:read"],
  supervisor: [
    "objects:read",
    "elevators:read",
    "work-orders:read",
    "dispatch:manage",
    "reports:read",
    "notifications:read",
    "emergency:manage",
  ],
  director: [
    "objects:read",
    "elevators:read",
    "work-orders:read",
    "reports:read",
    "notifications:read",
    "emergency:manage",
  ],
  administrator: ["*"],
};

export async function getSessionFromRequest(request: NextRequest) {
  return repositories.sessions.find(request.cookies.get("neo_session")?.value);
}

export async function requireSession(
  request: NextRequest,
  permission?: string,
): Promise<Session | NextResponse> {
  const session = await getSessionFromRequest(request);
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
