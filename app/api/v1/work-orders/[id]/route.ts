import { NextRequest } from "next/server";
import {
  apiError,
  isErrorResponse,
  json,
  requireSession,
} from "@/lib/integration/api";
import { repositories } from "@/lib/integration/services";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireSession(request, "work-orders:read");
  if (isErrorResponse(session)) return session;
  const workOrder = await repositories.workOrders.get(params.id);
  if (!workOrder) return apiError("NOT_FOUND", "Заказ-наряд не найден", 404);
  return json({ workOrder });
}
