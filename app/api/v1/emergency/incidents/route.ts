import { NextRequest } from "next/server";
import {
  apiError,
  domainError,
  isErrorResponse,
  json,
  readJson,
  requireSession,
} from "@/lib/integration/api";
import type { EmergencyIncident } from "@/lib/integration/domain";
import { repositories } from "@/lib/integration/services";

export async function GET(request: NextRequest) {
  const session = await requireSession(request, "emergency:manage");
  if (isErrorResponse(session)) return session;
  return json({ incidents: await repositories.emergency.list() });
}

export async function POST(request: NextRequest) {
  const session = await requireSession(request, "emergency:manage");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{
    workOrderId: string;
    priority: EmergencyIncident["priority"];
  }>(request);
  if (!body.workOrderId) return apiError("VALIDATION_FAILED", "Нужен заказ-наряд", 422);
  try {
    return json(
      {
        incident: await repositories.emergency.create({
          workOrderId: body.workOrderId,
          priority: body.priority ?? "critical",
          actorUserId: session.userId,
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    return domainError(error);
  }
}
