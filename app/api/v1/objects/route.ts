import { NextRequest } from "next/server";
import { isErrorResponse, json, requireSession } from "@/lib/integration/api";
import { getOperationalState } from "@/lib/integration/operational-store";

export async function GET(request: NextRequest) {
  const session = requireSession(request, "objects:read");
  if (isErrorResponse(session)) return session;
  const search =
    request.nextUrl.searchParams.get("search")?.toLowerCase() ?? "";
  const state = getOperationalState();
  const objects = state.objects.filter(
    (item) =>
      !search ||
      item.address.toLowerCase().includes(search) ||
      item.customer.toLowerCase().includes(search),
  );
  return json({ objects });
}
