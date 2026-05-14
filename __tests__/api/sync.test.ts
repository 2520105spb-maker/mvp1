import { NextRequest } from "next/server";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { POST as sync } from "@/app/api/v1/sync/route";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => {
  const mockPrisma = {
    syncOperation: { findUnique: jest.fn(), create: jest.fn() },
    workOrder: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

function post(url: string, body: unknown, headers?: HeadersInit) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...(headers ?? {}) },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/sync", () => {
  it("deduplicates operations and returns conflicts with payloads", async () => {
    const loginResponse = await login(
      post("http://localhost/api/v1/auth/login", { role: "mechanic" }),
    );
    const session = loginResponse.cookies.get("neo_session")?.value;
    const csrf = loginResponse.cookies.get("neo_csrf_token")?.value;

    (prisma.syncOperation.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: "sync_existing",
        status: "APPLIED",
        idempotencyKey: "dup",
      })
      .mockResolvedValueOnce(null);
    (prisma.workOrder.findUnique as jest.Mock).mockResolvedValue({
      id: "wo_1",
      serverVersion: 5,
      title: "server",
    });
    (prisma.syncOperation.create as jest.Mock).mockResolvedValue({
      id: "sync_conflict",
      status: "CONFLICT",
      conflict: { reason: "OPTIMISTIC_VERSION_MISMATCH" },
    });

    const response = await sync(
      post(
        "http://localhost/api/v1/sync",
        {
          deviceId: "device-1",
          operations: [
            {
              idempotencyKey: "dup",
              operationType: "work_order.update",
              workOrderId: "wo_1",
              baseVersion: 5,
              localVersion: 6,
              payload: { title: "duplicate" },
            },
            {
              idempotencyKey: "conflict",
              operationType: "work_order.update",
              workOrderId: "wo_1",
              baseVersion: 3,
              localVersion: 4,
              payload: { title: "client" },
            },
          ],
        },
        {
          cookie: `neo_session=${session}; neo_csrf_token=${csrf}`,
          "x-csrf-token": csrf ?? "",
        },
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.data.duplicates).toHaveLength(1);
    expect(payload.data.conflicts).toHaveLength(1);
    expect(prisma.workOrder.update).not.toHaveBeenCalled();
  });
});
