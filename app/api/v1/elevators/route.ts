import { NextRequest } from "next/server";
import { isErrorResponse, json, requireSession } from "@/lib/integration/api";
import { repositories } from "@/lib/integration/services";

export async function GET(request: NextRequest) {
  const session = await requireSession(request, "elevators:read");
  if (isErrorResponse(session)) return session;
  return json({
    elevators: await repositories.objects.listElevators(
      request.nextUrl.searchParams.get("objectId") ?? undefined,
      request.nextUrl.searchParams.get("search") ?? "",
    ),
  });
}
