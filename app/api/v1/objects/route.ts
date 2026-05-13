import { NextRequest } from "next/server";
import { isErrorResponse, json, requireSession } from "@/lib/integration/api";
import { repositories } from "@/lib/integration/services";

export async function GET(request: NextRequest) {
  const session = await requireSession(request, "objects:read");
  if (isErrorResponse(session)) return session;
  return json({
    objects: await repositories.objects.listObjects(
      request.nextUrl.searchParams.get("search") ?? "",
    ),
  });
}
