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
  type WorkOrderStatus,
} from "@/lib/integration/operational-store";

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
  const session = requireSession(request, "work-orders:write");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{ status: WorkOrderStatus }>(request);
  if (!body.status || !allowed.includes(body.status))
    return apiError("VALIDATION_FAILED", "Некорректный статус", 422);
  const workOrder = getOperationalState().workOrders.find(
    (item) => item.id === params.id,
  );
  if (!workOrder) return apiError("NOT_FOUND", "Заказ-наряд не найден", 404);
  workOrder.status = body.status;
  if (body.status === "in_progress") workOrder.workItems ||= [];
  return json({ workOrder: touchWorkOrder(workOrder) });
}
