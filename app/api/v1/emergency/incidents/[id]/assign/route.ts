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
  const session = await requireSession(request, "emergency:manage");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{ mechanicId: string }>(request);
  if (!body.mechanicId)
    return apiError("VALIDATION_FAILED", "Нужно указать механика", 422);
  try {
    return json({
      incident: await repositories.emergency.assign(
        params.id,
        body.mechanicId,
        session.userId,
      ),
    });
  } catch (error) {
    return domainError(error);
  }
}
