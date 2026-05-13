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
  nextWorkOrderNumber,
  notify,
  touchWorkOrder,
  type WorkOrder,
} from "@/lib/integration/operational-store";

export async function GET(request: NextRequest) {
  const session = requireSession(request, "work-orders:read");
  if (isErrorResponse(session)) return session;
  const state = getOperationalState();
  const status = request.nextUrl.searchParams.get("status");
  const mechanicOnly = session.role === "mechanic";
  const workOrders = state.workOrders.filter(
    (item) =>
      (!status || item.status === status) &&
      (!mechanicOnly || item.mechanicId === session.userId),
  );
  return json({ workOrders });
}

export async function POST(request: NextRequest) {
  const session = requireSession(request, "work-orders:write");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{
    objectId: string;
    elevatorId: string;
    title: string;
    priority: WorkOrder["priority"];
  }>(request);
  if (!body.objectId || !body.elevatorId || !body.title)
    return apiError("VALIDATION_FAILED", "Нужны объект, лифт и описание", 422);
  const state = getOperationalState();
  const created: WorkOrder = {
    id: `wo_${Date.now()}`,
    number: nextWorkOrderNumber(),
    objectId: body.objectId,
    elevatorId: body.elevatorId,
    priority: body.priority ?? "medium",
    status: "draft",
    title: body.title,
    workItems: [],
    materials: [],
    photos: [],
    slaDueAt: new Date(Date.now() + 4 * 60 * 60_000).toISOString(),
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.workOrders.unshift(created);
  notify({
    role: "dispatcher",
    type: "assignment",
    title: "Создан заказ-наряд",
    body: `${created.number}: ${created.title}`,
  });
  return json({ workOrder: touchWorkOrder(created) }, { status: 201 });
}
