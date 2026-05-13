import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  isErrorResponse,
  requireSession,
} from "@/lib/integration/api";
import {
  createPdfBytes,
  getOperationalState,
} from "@/lib/integration/operational-store";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = requireSession(request, "reports:read");
  if (isErrorResponse(session)) return session;
  const workOrder = getOperationalState().workOrders.find(
    (item) => item.id === params.id,
  );
  if (!workOrder) return apiError("NOT_FOUND", "Заказ-наряд не найден", 404);
  return new NextResponse(createPdfBytes(workOrder), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${workOrder.number}.pdf"`,
    },
  });
}
