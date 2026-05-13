import { NextRequest } from "next/server";
import {
  apiError,
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
    action: string;
    element: string;
    quantity: number;
  }>(request);
  if (!body.action || !body.element || !body.quantity)
    return apiError(
      "VALIDATION_FAILED",
      "Нужно указать работу, узел и количество",
      422,
    );
  try {
    return json(
      await repositories.workOrders.addWorkItem(
        params.id,
        {
          action: body.action,
          element: body.element,
          quantity: Number(body.quantity),
        },
        session.userId,
      ),
    );
  } catch (error) {
    return domainError(error);
  }
}
