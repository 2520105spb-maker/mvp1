import { NextRequest } from "next/server";
import { isErrorResponse, json, requireSession } from "@/lib/integration/api";
import { getOperationalState } from "@/lib/integration/operational-store";

export async function GET(request: NextRequest) {
  const session = await requireSession(request, "warehouse:manage");
  if (isErrorResponse(session)) return session;
  const search =
    request.nextUrl.searchParams.get("search")?.toLowerCase() ?? "";
  const state = getOperationalState();
  const materials = state.materials
    .filter(
      (item) =>
        !search ||
        item.name.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search),
    )
    .map((material) => ({
      ...material,
      stock: state.stock.filter((stock) => stock.materialId === material.id),
    }));
  return json({ materials });
}
