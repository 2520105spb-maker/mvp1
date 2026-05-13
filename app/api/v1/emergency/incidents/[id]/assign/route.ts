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
} from "@/lib/integration/operational-store";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = requireSession(request, "emergency:manage");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{ mechanicId: string }>(request);
  if (!body.mechanicId)
    return apiError("VALIDATION_FAILED", "Нужно указать механика", 422);
  const incident = getOperationalState().emergency.find(
    (item) => item.id === params.id,
  );
  if (!incident) return apiError("NOT_FOUND", "Инцидент не найден", 404);
  incident.assignedMechanicId = body.mechanicId;
  incident.status = "assigned";
  notify({
    userId: body.mechanicId,
    type: "emergency",
    title: "Аварийный выезд",
    body: `Назначен инцидент ${incident.id}`,
  });
  return json({ incident });
}
