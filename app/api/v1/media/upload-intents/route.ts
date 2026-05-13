import { NextRequest } from "next/server";
import {
  apiError,
  isErrorResponse,
  json,
  readJson,
  requireSession,
} from "@/lib/integration/api";
import {
  getOperationalState,
  type MediaFile,
} from "@/lib/integration/operational-store";

export async function POST(request: NextRequest) {
  const session = await requireSession(request, "media:write");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{
    ownerType: MediaFile["ownerType"];
    ownerId: string;
    category: string;
    fileName: string;
  }>(request);
  if (!body.ownerType || !body.ownerId || !body.fileName)
    return apiError("VALIDATION_FAILED", "Нужны владелец и имя файла", 422);
  const media: MediaFile = {
    id: `media_${Date.now()}`,
    ownerType: body.ownerType,
    ownerId: body.ownerId,
    category: body.category ?? "document",
    fileName: body.fileName,
    status: "pending",
    url: `/api/v1/media/${Date.now()}/preview`,
    createdAt: new Date().toISOString(),
  };
  getOperationalState().media.push(media);
  return json(
    {
      media,
      uploadUrl: `/api/v1/media/confirm?mediaId=${media.id}`,
      method: "POST",
    },
    { status: 201 },
  );
}
