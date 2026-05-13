import { NextRequest } from "next/server";
import { isErrorResponse, json, requireSession } from "@/lib/integration/api";
import { getOperationalState } from "@/lib/integration/operational-store";

export async function GET(request: NextRequest) {
  const session = await requireSession(request, "dispatch:manage");
  if (isErrorResponse(session)) return session;
  const state = getOperationalState();
  return json({
    unassigned: state.workOrders.filter((item) => !item.mechanicId),
    assigned: state.workOrders.filter(
      (item) => item.mechanicId && item.status !== "closed",
    ),
    workload: state.workOrders.reduce<Record<string, number>>((acc, item) => {
      if (item.mechanicId)
        acc[item.mechanicId] = (acc[item.mechanicId] ?? 0) + 1;
      return acc;
    }, {}),
  });
}
