import { NextRequest } from "next/server";
import {
  apiError,
  isErrorResponse,
  json,
  requireSession,
} from "@/lib/integration/api";
import { getOperationalState } from "@/lib/integration/operational-store";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = requireSession(request, "work-orders:read");
  if (isErrorResponse(session)) return session;
  const workOrder = getOperationalState().workOrders.find(
    (item) => item.id === params.id,
  );
  if (!workOrder) return apiError("NOT_FOUND", "Заказ-наряд не найден", 404);
  return json({ workOrder });
}
