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
  touchWorkOrder,
} from "@/lib/integration/operational-store";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = requireSession(request, "work-orders:write");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{
    action: string;
    element: string;
    quantity: number;
  }>(request);
  if (!body.action || !body.element || !body.quantity)
    return apiError(
      "VALIDATION_FAILED",
      "Нужно указать работу, узел и количество",
      422,
    );
  const workOrder = getOperationalState().workOrders.find(
    (item) => item.id === params.id,
  );
  if (!workOrder) return apiError("NOT_FOUND", "Заказ-наряд не найден", 404);
  const item = {
    id: `wi_${Date.now()}`,
    action: body.action,
    element: body.element,
    quantity: Number(body.quantity),
  };
  workOrder.workItems.push(item);
  return json({ workOrder: touchWorkOrder(workOrder), item });
}
