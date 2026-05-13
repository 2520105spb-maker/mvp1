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
  touchWorkOrder,
} from "@/lib/integration/operational-store";

export async function POST(request: NextRequest) {
  const session = requireSession(request, "dispatch:manage");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{ workOrderId: string; mechanicId: string }>(
    request,
  );
  if (!body.workOrderId || !body.mechanicId)
    return apiError("VALIDATION_FAILED", "Нужны заказ-наряд и механик", 422);
  const workOrder = getOperationalState().workOrders.find(
    (item) => item.id === body.workOrderId,
  );
  if (!workOrder) return apiError("NOT_FOUND", "Заказ-наряд не найден", 404);
  workOrder.mechanicId = body.mechanicId;
  workOrder.status = "assigned";
  touchWorkOrder(workOrder);
  notify({
    userId: body.mechanicId,
    type: "assignment",
    title: "Назначена заявка",
    body: `${workOrder.number}: ${workOrder.title}`,
  });
  return json({ workOrder });
}
