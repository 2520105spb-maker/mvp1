import { NextRequest } from "next/server";
import { isErrorResponse, json, requireSession } from "@/lib/integration/api";
import { getOperationalState } from "@/lib/integration/operational-store";

export async function GET(request: NextRequest) {
  const session = requireSession(request, "elevators:read");
  if (isErrorResponse(session)) return session;
  const objectId = request.nextUrl.searchParams.get("objectId");
  const search =
    request.nextUrl.searchParams.get("search")?.toLowerCase() ?? "";
  const elevators = getOperationalState().elevators.filter(
    (item) =>
      (!objectId || item.objectId === objectId) &&
      (!search ||
        item.number.toLowerCase().includes(search) ||
        item.factoryNumber.toLowerCase().includes(search)),
  );
  return json({ elevators });
}
