import { NextRequest } from "next/server";
import {
  apiError,
  isErrorResponse,
  json,
  readJson,
  requireSession,
} from "@/lib/integration/api";
import { writeOffMaterial } from "@/lib/integration/operational-store";

export async function POST(request: NextRequest) {
  const session = requireSession(request, "warehouse:manage");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{
    workOrderId: string;
    materialId: string;
    warehouseId: string;
    quantity: number;
  }>(request);
  try {
    return json({
      movement: writeOffMaterial(
        String(body.workOrderId),
        String(body.materialId),
        String(body.warehouseId ?? "wh_main"),
        Number(body.quantity ?? 0),
      ),
    });
  } catch (error) {
    return apiError(
      "STOCK_ERROR",
      error instanceof Error ? error.message : "Ошибка списания",
      409,
    );
  }
}
