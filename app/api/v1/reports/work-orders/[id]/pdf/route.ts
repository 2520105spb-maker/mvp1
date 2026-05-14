import { NextRequest, NextResponse } from "next/server";
import { apiError, isErrorResponse, requireSession } from "@/lib/integration/api";
import { repositories } from "@/lib/integration/services";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireSession(request, "reports:read");
  if (isErrorResponse(session)) return session;
  const report = await repositories.reports.workOrderPdf(params.id);
  if (!report) return apiError("NOT_FOUND", "Заказ-наряд не найден", 404);
  return new NextResponse(report.bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${report.fileName}"`,
    },
  });
}
