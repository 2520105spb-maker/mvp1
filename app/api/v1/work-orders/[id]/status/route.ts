import { NextRequest } from "next/server";
import {
  apiError,
  domainError,
  isErrorResponse,
  json,
  readJson,
  requireSession,
} from "@/lib/integration/api";
import type { WorkOrderStatus } from "@/lib/integration/domain";
import { repositories } from "@/lib/integration/services";

const allowed: WorkOrderStatus[] = [
  "draft",
  "assigned",
  "accepted",
  "in_progress",
  "waiting_approval",
  "completed",
  "closed",
];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireSession(request, "work-orders:write");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{ status: WorkOrderStatus }>(request);
  if (!body.status || !allowed.includes(body.status))
    return apiError("VALIDATION_FAILED", "Некорректный статус", 422);
  try {
    return json({
      workOrder: await repositories.workOrders.setStatus(
        params.id,
        body.status,
        session.userId,
      ),
    });
  } catch (error) {
    return domainError(error);
  }
}
