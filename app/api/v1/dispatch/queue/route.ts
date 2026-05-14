import { NextRequest } from "next/server";
import { isErrorResponse, json, requireSession } from "@/lib/integration/api";
import { repositories } from "@/lib/integration/services";

export async function GET(request: NextRequest) {
  const session = await requireSession(request, "dispatch:manage");
  if (isErrorResponse(session)) return session;
  return json(await repositories.dispatch.queue());
}
