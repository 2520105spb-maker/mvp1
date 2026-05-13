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
  const body = await readJson<{ signature: string; signer: string }>(request);
  try {
    return json({
      workOrder: await repositories.workOrders.complete(
        params.id,
        { signer: body.signer ?? "Заказчик", dataUrl: body.signature ?? "" },
        session.userId,
      ),
    });
  } catch (error) {
    return domainError(error);
  }
}
