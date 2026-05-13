import { NextRequest } from "next/server";
import {
  domainError,
  isErrorResponse,
  json,
  readJson,
  requireSession,
} from "@/lib/integration/api";
import { repositories } from "@/lib/integration/services";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireSession(request, "work-orders:write");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{
    materialId: string;
    warehouseId: string;
    quantity: number;
  }>(request);
  try {
    return json({
      movement: await repositories.warehouse.reserve({
        workOrderId: params.id,
        materialId: String(body.materialId),
        warehouseId: String(body.warehouseId ?? "wh_main"),
        quantity: Number(body.quantity ?? 0),
        actorUserId: session.userId,
      }),
    });
  } catch (error) {
    return domainError(error);
  }
}
