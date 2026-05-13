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
  const session = await requireSession(request, "dispatch:manage");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{ mechanicId: string }>(request);
  if (!body.mechanicId)
    return apiError("VALIDATION_FAILED", "Нужно указать механика", 422);
  try {
    return json({
      workOrder: await repositories.workOrders.assign(
        params.id,
        body.mechanicId,
        session.userId,
      ),
    });
  } catch (error) {
    return domainError(error);
  }
}
