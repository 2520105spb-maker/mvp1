import { NextRequest } from "next/server";
import { isErrorResponse, json, requireSession } from "@/lib/integration/api";
import { getOperationalState } from "@/lib/integration/operational-store";

export async function GET(request: NextRequest) {
  const session = await requireSession(request, "warehouse:manage");
  if (isErrorResponse(session)) return session;
  return json({ movements: getOperationalState().movements });
}
