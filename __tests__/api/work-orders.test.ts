import { NextRequest } from "next/server";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { POST as createWorkOrder } from "@/app/api/v1/work-orders/route";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => {
  const mockPrisma = {
    workOrder: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    serviceObject: { findUnique: jest.fn() },
    elevator: { findFirst: jest.fn() },
    auditRecord: { create: jest.fn() },
    domainEvent: { create: jest.fn() },
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

describe("POST /api/v1/work-orders", () => {
  it("creates a work order with relations and audit log", async () => {
    const loginResponse = await login(
      post("http://localhost/api/v1/auth/login", { role: "dispatcher" }),
    );
    const session = loginResponse.cookies.get("neo_session")?.value;
    const csrf = loginResponse.cookies.get("neo_csrf_token")?.value;

    (prisma.serviceObject.findUnique as jest.Mock).mockResolvedValue({ id: "obj_1" });
    (prisma.elevator.findFirst as jest.Mock).mockResolvedValue({ id: "elev_1" });
    (prisma.workOrder.count as jest.Mock).mockResolvedValue(0);
    (prisma.workOrder.create as jest.Mock).mockResolvedValue({
      id: "wo_1",
      tenantId: "tenant_demo",
      objectId: "obj_1",
      elevatorId: "elev_1",
      technicianId: null,
      number: "ЗН-0001",
      typeCode: "SERVICE",
      status: "DRAFT",
      priority: "HIGH",
      title: "Проверка дверей",
      description: null,
      acceptedAt: null,
      startedAt: null,
      completedAt: null,
      closedAt: null,
      serverVersion: 1,
      offlineVersion: 0,
      createdAt: new Date("2026-05-14T00:00:00.000Z"),
      updatedAt: new Date("2026-05-14T00:00:00.000Z"),
      deletedAt: null,
      materials: [],
      mediaFiles: [],
      requirements: [],
      signatures: [],
    });
    (prisma.auditRecord.create as jest.Mock).mockResolvedValue({ id: "audit_1" });
    (prisma.domainEvent.create as jest.Mock).mockResolvedValue({ id: "evt_1" });

    const response = await createWorkOrder(
      post(
        "http://localhost/api/v1/work-orders",
        {
          objectId: "obj_1",
          elevatorId: "elev_1",
          title: "Проверка дверей",
          priority: "high",
        },
        {
          cookie: `neo_session=${session}; neo_csrf_token=${csrf}`,
          "x-csrf-token": csrf ?? "",
        },
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.data.workOrder.id).toBe("wo_1");
    expect(prisma.workOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ objectId: "obj_1", elevatorId: "elev_1" }),
      }),
    );
    expect(prisma.auditRecord.create).toHaveBeenCalled();
  });
});
