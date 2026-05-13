import { NextRequest } from "next/server";
import {
  apiError,
  domainError,
  isErrorResponse,
  json,
  readJson,
  requireSession,
} from "@/lib/integration/api";
import type { WorkOrder } from "@/lib/integration/domain";
import { repositories } from "@/lib/integration/services";

export async function GET(request: NextRequest) {
  const session = await requireSession(request, "work-orders:read");
  if (isErrorResponse(session)) return session;
  return json({
    workOrders: await repositories.workOrders.list(
      session,
      request.nextUrl.searchParams.get("status") ?? undefined,
    ),
  });
}

export async function POST(request: NextRequest) {
  const session = await requireSession(request, "work-orders:write");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{
    objectId: string;
    elevatorId: string;
    title: string;
    priority: WorkOrder["priority"];
  }>(request);
  if (!body.objectId || !body.elevatorId || !body.title)
    return apiError("VALIDATION_FAILED", "Нужны объект, лифт и описание", 422);
  try {
    return json(
      {
        workOrder: await repositories.workOrders.create({
          objectId: body.objectId,
          elevatorId: body.elevatorId,
          title: body.title,
          priority: body.priority,
          actorUserId: session.userId,
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    return domainError(error);
  }
}
