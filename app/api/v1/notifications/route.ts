import { NextRequest } from "next/server";
import { isErrorResponse, json, requireSession } from "@/lib/integration/api";
import { getOperationalState } from "@/lib/integration/operational-store";

export async function GET(request: NextRequest) {
  const session = requireSession(request, "notifications:read");
  if (isErrorResponse(session)) return session;
  const notifications = getOperationalState().notifications.filter(
    (item) =>
      !item.userId ||
      item.userId === session.userId ||
      !item.role ||
      item.role === session.role,
  );
  return json({ notifications });
}
