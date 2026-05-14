import { NextRequest } from "next/server";
import {
  apiError,
  domainError,
  isErrorResponse,
  json,
  readJson,
  requireSession,
} from "@/lib/integration/api";
import { repositories } from "@/lib/integration/services";

export async function POST(request: NextRequest) {
  const session = await requireSession(request, "dispatch:manage");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{ workOrderId: string; mechanicId: string }>(request);
  if (!body.workOrderId || !body.mechanicId)
    return apiError("VALIDATION_FAILED", "Нужны заказ-наряд и механик", 422);
  try {
    return json({
      workOrder: await repositories.workOrders.assign(
        body.workOrderId,
        body.mechanicId,
        session.userId,
      ),
    });
  } catch (error) {
    return domainError(error);
  }
}
