import { NextRequest } from "next/server";
import {
  apiError,
  isErrorResponse,
  json,
  readJson,
  requireSession,
} from "@/lib/integration/api";
import { reserveMaterial } from "@/lib/integration/operational-store";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = requireSession(request, "work-orders:write");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{
    materialId: string;
    warehouseId: string;
    quantity: number;
  }>(request);
  try {
    const movement = reserveMaterial(
      params.id,
      String(body.materialId),
      String(body.warehouseId ?? "wh_main"),
      Number(body.quantity ?? 0),
    );
    return json({ movement });
  } catch (error) {
    return apiError(
      "STOCK_ERROR",
      error instanceof Error ? error.message : "Ошибка склада",
      409,
    );
  }
}
