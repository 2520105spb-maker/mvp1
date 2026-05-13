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
  type PhotoLine,
} from "@/lib/integration/operational-store";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = requireSession(request, "media:write");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{
    mediaId: string;
    category: PhotoLine["category"];
    url: string;
  }>(request);
  const workOrder = getOperationalState().workOrders.find(
    (item) => item.id === params.id,
  );
  if (!workOrder) return apiError("NOT_FOUND", "Заказ-наряд не найден", 404);
  const photo: PhotoLine = {
    id: body.mediaId ?? `photo_${Date.now()}`,
    category: body.category ?? "document",
    url: body.url ?? "/placeholder-photo.jpg",
    status: "validated",
  };
  workOrder.photos.push(photo);
  return json({ workOrder: touchWorkOrder(workOrder), photo });
}
