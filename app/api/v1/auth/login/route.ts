import { NextRequest } from "next/server";
import { apiError, json, readJson } from "@/lib/integration/api";
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
  const body = await readJson<{ role: Role; login: string; password: string }>(
    request,
  );
  const role = body.role ?? "mechanic";
  if (!roles.includes(role))
    return apiError("VALIDATION_FAILED", "Неизвестная роль", 422);
  const session = await repositories.sessions.create(role);
  const response = json({ session });
  response.cookies.set("neo_session", session.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  response.cookies.set("neo_role", session.role, {
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
