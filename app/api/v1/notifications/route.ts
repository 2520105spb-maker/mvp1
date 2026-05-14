import { NextRequest } from "next/server";
import { isErrorResponse, json, requireSession } from "@/lib/integration/api";
import { repositories } from "@/lib/integration/services";

export async function GET(request: NextRequest) {
  const session = await requireSession(request, "notifications:read");
  if (isErrorResponse(session)) return session;
  return json({ notifications: await repositories.notifications.list(session) });
}
