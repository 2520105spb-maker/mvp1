import { NextRequest } from "next/server";
import { apiError, json, readJson } from "@/lib/integration/api";
import { attachCsrfCookie } from "@/lib/security/csrf";
import type { Role } from "@/lib/integration/domain";
import { repositories } from "@/lib/integration/services";

const roles: Role[] = [
  "mechanic",
  "dispatcher",
  "warehouse",
  "supervisor",
  "director",
  "administrator",
];

export async function POST(request: NextRequest) {
  const body = await readJson<{ role: Role; login: string; password: string }>(request);
  const role = body.role ?? "mechanic";
  if (!roles.includes(role))
    return apiError("VALIDATION_FAILED", "Неизвестная роль", 422);
  const session = await repositories.sessions.create(role);
  const response = json({ session });
  response.cookies.set("neo_session", session.id, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  response.cookies.set("neo_access_token", session.id, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  response.cookies.set("neo_role", session.role, {
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  attachCsrfCookie(response);
  return response;
}
