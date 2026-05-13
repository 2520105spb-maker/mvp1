import { NextRequest } from "next/server";
import {
  apiError,
  isErrorResponse,
  json,
  readJson,
  requireSession,
} from "@/lib/integration/api";
import {
  getOperationalState,
  notify,
  type EmergencyIncident,
} from "@/lib/integration/operational-store";

export async function GET(request: NextRequest) {
  const session = await requireSession(request, "emergency:manage");
  if (isErrorResponse(session)) return session;
  return json({ incidents: getOperationalState().emergency });
}

export async function POST(request: NextRequest) {
  const session = await requireSession(request, "emergency:manage");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{
    workOrderId: string;
    priority: EmergencyIncident["priority"];
  }>(request);
  if (!body.workOrderId)
    return apiError("VALIDATION_FAILED", "Нужен заказ-наряд", 422);
  const incident: EmergencyIncident = {
    id: `inc_${Date.now()}`,
    workOrderId: body.workOrderId,
    priority: body.priority ?? "critical",
    status: "new",
    slaDueAt: new Date(Date.now() + 30 * 60_000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  getOperationalState().emergency.unshift(incident);
  notify({
    role: "dispatcher",
    type: "emergency",
    title: "Аварийная заявка",
    body: `Инцидент ${incident.id}: критичный SLA`,
  });
  return json({ incident }, { status: 201 });
}
