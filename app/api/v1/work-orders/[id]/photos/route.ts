import { NextRequest } from "next/server";
import {
  domainError,
  isErrorResponse,
  json,
  readJson,
  requireSession,
} from "@/lib/integration/api";
import type { PhotoLine } from "@/lib/integration/domain";
import { repositories } from "@/lib/integration/services";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireSession(request, "media:write");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{
    mediaId: string;
    category: PhotoLine["category"];
    url: string;
  }>(request);
  try {
    return json(
      await repositories.workOrders.addPhoto(
        params.id,
        {
          id: body.mediaId,
          category: body.category ?? "document",
          url: body.url ?? "/placeholder-photo.jpg",
        },
        session.userId,
      ),
    );
  } catch (error) {
    return domainError(error);
  }
}
