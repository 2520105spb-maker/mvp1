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
  writeOffMaterial,
} from "@/lib/integration/operational-store";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = requireSession(request, "work-orders:write");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{ signature: string; signer: string }>(request);
  const workOrder = getOperationalState().workOrders.find(
    (item) => item.id === params.id,
  );
  if (!workOrder) return apiError("NOT_FOUND", "Заказ-наряд не найден", 404);
  const required = ["installed", "removed", "document"];
  const missing = required.filter(
    (category) =>
      !workOrder.photos.some(
        (photo) => photo.category === category && photo.status !== "failed",
      ),
  );
  if (missing.length > 0)
    return apiError(
      "REQUIRED_PHOTO_MISSING",
      "Не хватает обязательных фото",
      422,
      { missing },
    );
  if (!body.signature)
    return apiError("SIGNATURE_REQUIRED", "Нужна подпись заказчика", 422);
  try {
    for (const line of workOrder.materials.filter((item) => !item.writtenOff))
      writeOffMaterial(
        workOrder.id,
        line.materialId,
        line.warehouseId,
        line.quantity,
      );
  } catch (error) {
    return apiError(
      "STOCK_ERROR",
      error instanceof Error ? error.message : "Ошибка списания",
      409,
    );
  }
  workOrder.signature = {
    signer: body.signer ?? "Заказчик",
    dataUrl: body.signature,
    signedAt: new Date().toISOString(),
  };
  workOrder.status = "completed";
  touchWorkOrder(workOrder);
  notify({
    role: "dispatcher",
    type: "assignment",
    title: "Заказ-наряд завершен",
    body: `${workOrder.number} ожидает проверки`,
  });
  return json({ workOrder });
}
