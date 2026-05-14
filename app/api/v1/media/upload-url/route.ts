import { NextRequest } from "next/server";
import {
  domainError,
  isErrorResponse,
  json,
  readJson,
  requireSession,
} from "@/lib/integration/api";
import { mediaUploadService } from "@/services/MediaUploadService";

export async function GET(request: NextRequest) {
  const session = await requireSession(request, "media:write");
  if (isErrorResponse(session)) return session;
  const params = request.nextUrl.searchParams;
  try {
    return json(
      await mediaUploadService.createPresignedUpload({
        ownerType:
          (params.get("ownerType") as "work_order" | "elevator" | "incident") ??
          "work_order",
        ownerId: params.get("ownerId") ?? "",
        category: params.get("category") ?? "document",
        fileName: params.get("fileName") ?? "upload.bin",
        contentType: params.get("contentType") ?? "",
        sizeBytes: Number(params.get("sizeBytes") ?? 0),
        requestId: request.headers.get("x-request-id") ?? undefined,
        userId: session.userId,
      }),
      { status: 201 },
    );
  } catch (error) {
    return domainError(error);
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession(request, "media:write");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{
    ownerType: "work_order" | "elevator" | "incident";
    ownerId: string;
    category: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
  }>(request);
  try {
    return json(
      await mediaUploadService.createPresignedUpload({
        ownerType: body.ownerType ?? "work_order",
        ownerId: String(body.ownerId ?? ""),
        category: body.category ?? "document",
        fileName: String(body.fileName ?? "upload.bin"),
        contentType: String(body.contentType ?? ""),
        sizeBytes: Number(body.sizeBytes ?? 0),
        requestId: request.headers.get("x-request-id") ?? undefined,
        userId: session.userId,
      }),
      { status: 201 },
    );
  } catch (error) {
    return domainError(error);
  }
}
