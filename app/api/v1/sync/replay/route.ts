import { NextRequest } from "next/server";
import {
  isErrorResponse,
  json,
  readJson,
  requireSession,
} from "@/lib/integration/api";
import {
  getOperationalState,
  type SyncOperation,
} from "@/lib/integration/operational-store";

export async function POST(request: NextRequest) {
  const session = requireSession(request, "sync:write");
  if (isErrorResponse(session)) return session;
  const body = await readJson<{
    deviceId: string;
    operations: Array<Omit<SyncOperation, "id" | "createdAt" | "status">>;
  }>(request);
  const state = getOperationalState();
  const applied = (body.operations ?? []).map((operation) => {
    const item: SyncOperation = {
      ...operation,
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      deviceId: body.deviceId ?? "unknown",
      status: "applied",
      createdAt: new Date().toISOString(),
    };
    state.syncOperations.push(item);
    return item;
  });
  return json({ applied, cursor: new Date().toISOString(), conflicts: [] });
}
