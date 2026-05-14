import { NextRequest } from "next/server";
import {
  domainError,
  isErrorResponse,
  json,
  readJson,
  requireSession,
} from "@/lib/integration/api";
import { syncService } from "@/services/SyncService";

export async function POST(request: NextRequest) {
  const session = await requireSession(request, "sync:write");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{
    deviceId: string;
    operations: Array<Record<string, unknown>>;
  }>(request);
  try {
    const result = await syncService.replay({
      deviceId: body.deviceId ?? "unknown",
      operations: body.operations ?? [],
      requestId: request.headers.get("x-request-id") ?? undefined,
      userId: session.userId,
    });
    return json(result, { status: result.conflicts.length > 0 ? 409 : 200 });
  } catch (error) {
    return domainError(error);
  }
}
