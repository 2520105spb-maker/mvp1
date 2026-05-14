import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import {
  domainError,
  isErrorResponse,
  json,
  readJson,
  requireSession,
} from "@/lib/integration/api";
import { prisma } from "@/lib/prisma";
import { logger } from "@/utils/logger";

export async function POST(request: NextRequest) {
  const session = await requireSession(request, "media:write");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{
    mediaId: string;
    checksum?: string;
    metadata?: Record<string, unknown>;
  }>(request);
  try {
    const media = await prisma.mediaFile.update({
      where: { id: String(body.mediaId) },
      data: {
        status: "UPLOADED",
        checksum: body.checksum,
        metadata: body.metadata ? (body.metadata as Prisma.InputJsonObject) : undefined,
      },
    });
    logger.info(
      {
        userId: session.userId,
        endpoint: "/api/v1/media/confirm",
        operationType: "media.confirm_upload",
        upload: { mediaId: media.id, s3Key: media.s3Key },
      },
      "media upload confirmed",
    );
    return json({ media });
  } catch (error) {
    return domainError(error);
  }
}
