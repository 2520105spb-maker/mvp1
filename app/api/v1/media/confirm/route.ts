import { NextRequest } from "next/server";
import {
  apiError,
  isErrorResponse,
  json,
  readJson,
  requireSession,
} from "@/lib/integration/api";
import { getOperationalState } from "@/lib/integration/operational-store";

export async function POST(request: NextRequest) {
  const session = await requireSession(request, "media:write");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{ mediaId: string; url: string }>(request);
  const mediaId =
    body.mediaId ?? request.nextUrl.searchParams.get("mediaId") ?? "";
  const media = getOperationalState().media.find((item) => item.id === mediaId);
  if (!media) return apiError("NOT_FOUND", "Файл не найден", 404);
  media.status = "validated";
  media.url = body.url ?? media.url;
  return json({ media });
}
