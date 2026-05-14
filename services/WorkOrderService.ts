import { createHash } from "node:crypto";
import {
  Prisma,
  Priority,
  WorkOrderStatus as PrismaWorkOrderStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DomainError,
  type Session,
  type WorkOrder,
  type WorkOrderPriority,
  type WorkOrderStatus,
} from "@/lib/integration/domain";
import { logger } from "@/utils/logger";

const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID ?? "tenant_demo";

const priorityToPrisma: Record<WorkOrderPriority, Priority> = {
  low: Priority.LOW,
  medium: Priority.MEDIUM,
  high: Priority.HIGH,
  critical: Priority.CRITICAL,
};

const statusToPrisma: Record<WorkOrderStatus, PrismaWorkOrderStatus> = {
  draft: PrismaWorkOrderStatus.DRAFT,
  assigned: PrismaWorkOrderStatus.ASSIGNED,
  accepted: PrismaWorkOrderStatus.ACCEPTED,
  in_progress: PrismaWorkOrderStatus.IN_PROGRESS,
  waiting_approval: PrismaWorkOrderStatus.WAITING_APPROVAL,
  completed: PrismaWorkOrderStatus.COMPLETED,
  closed: PrismaWorkOrderStatus.CLOSED,
};

const statusFromPrisma: Partial<Record<PrismaWorkOrderStatus, WorkOrderStatus>> = {
  DRAFT: "draft",
  ASSIGNED: "assigned",
  ACCEPTED: "accepted",
  IN_PROGRESS: "in_progress",
  WAITING_APPROVAL: "waiting_approval",
  COMPLETED: "completed",
  CLOSED: "closed",
};

const priorityFromPrisma: Record<Priority, WorkOrderPriority> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

const workOrderInclude = {
  materials: { include: { material: true } },
  mediaFiles: true,
  requirements: true,
  signatures: true,
} satisfies Prisma.WorkOrderInclude;

type WorkOrderRecord = Prisma.WorkOrderGetPayload<{ include: typeof workOrderInclude }>;

function toJson(input: unknown) {
  return JSON.parse(JSON.stringify(input)) as Prisma.InputJsonValue;
}

function hashAudit(input: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(input))
    .update(String(Date.now()))
    .digest("hex");
}

export class WorkOrderService {
  async findMany(session: Session, status?: string) {
    const workOrders = await prisma.workOrder.findMany({
      where: {
        tenantId: DEFAULT_TENANT_ID,
        deletedAt: null,
        ...(status ? { status: statusToPrisma[status as WorkOrderStatus] } : {}),
        ...(session.role === "mechanic" ? { technicianId: session.userId } : {}),
      },
      include: workOrderInclude,
      orderBy: { createdAt: "desc" },
    });
    return workOrders.map(mapWorkOrder);
  }

  async findUnique(id: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: workOrderInclude,
    });
    return workOrder ? mapWorkOrder(workOrder) : undefined;
  }

  async create(input: {
    objectId: string;
    elevatorId?: string;
    title: string;
    priority?: WorkOrderPriority;
    actorUserId: string;
    requestId?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const object = await tx.serviceObject.findUnique({
        where: { id: input.objectId },
      });
      if (!object) throw new DomainError("VALIDATION_FAILED", "Объект не найден", 422);

      if (input.elevatorId) {
        const elevator = await tx.elevator.findFirst({
          where: { id: input.elevatorId, objectId: input.objectId },
        });
        if (!elevator)
          throw new DomainError("VALIDATION_FAILED", "Лифт не найден на объекте", 422);
      }

      const count = await tx.workOrder.count({
        where: { tenantId: DEFAULT_TENANT_ID },
      });
      const created = await tx.workOrder.create({
        data: {
          tenantId: DEFAULT_TENANT_ID,
          objectId: input.objectId,
          elevatorId: input.elevatorId,
          number: `ЗН-${String(count + 1).padStart(4, "0")}`,
          typeCode: "SERVICE",
          title: input.title,
          priority: priorityToPrisma[input.priority ?? "medium"],
          requirements: {
            create: [
              { code: "installed", title: "Фото установленного элемента" },
              { code: "removed", title: "Фото снятого элемента" },
              { code: "document", title: "Документ/акт" },
            ],
          },
        },
        include: workOrderInclude,
      });

      await tx.auditRecord.create({
        data: {
          tenantId: DEFAULT_TENANT_ID,
          actorUserId: undefined,
          entityType: "WorkOrder",
          entityId: created.id,
          action: "work_order.created",
          after: toJson(created),
          hash: hashAudit({ action: "work_order.created", id: created.id }),
        },
      });
      await tx.domainEvent.create({
        data: {
          tenantId: DEFAULT_TENANT_ID,
          aggregateId: created.id,
          aggregateType: "WorkOrder",
          eventType: "WorkOrderCreated",
          payload: { number: created.number } as Prisma.InputJsonObject,
        },
      });

      logger.info(
        {
          requestId: input.requestId,
          userId: input.actorUserId,
          workOrderId: created.id,
          endpoint: "/api/v1/work-orders",
          operationType: "work_order.create",
        },
        "work order created",
      );
      return mapWorkOrder(created);
    });
  }

  async update(
    id: string,
    input: { status?: WorkOrderStatus; technicianId?: string; actorUserId: string },
  ) {
    const before = await prisma.workOrder.findUnique({ where: { id } });
    if (!before) throw new DomainError("NOT_FOUND", "Заказ-наряд не найден", 404);
    if (before.status === PrismaWorkOrderStatus.CLOSED)
      throw new DomainError("CONFLICT", "Закрытый заказ-наряд нельзя изменить", 409);

    const updated = await prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.update({
        where: { id },
        data: {
          ...(input.status ? { status: statusToPrisma[input.status] } : {}),
          ...(input.technicianId ? { technicianId: input.technicianId } : {}),
          serverVersion: { increment: 1 },
        },
        include: workOrderInclude,
      });
      await tx.auditRecord.create({
        data: {
          tenantId: DEFAULT_TENANT_ID,
          actorUserId: undefined,
          entityType: "WorkOrder",
          entityId: id,
          action: input.status ? "work_order.status_changed" : "work_order.updated",
          before: toJson(before),
          after: toJson(workOrder),
          hash: hashAudit({
            action: "work_order.updated",
            id,
            version: workOrder.serverVersion,
          }),
        },
      });
      return workOrder;
    });
    return mapWorkOrder(updated);
  }

  list(session: Session, status?: string) {
    return this.findMany(session, status);
  }

  get(id: string) {
    return this.findUnique(id);
  }

  assign(id: string, mechanicId: string, actorUserId: string) {
    return this.update(id, {
      technicianId: mechanicId,
      status: "assigned",
      actorUserId,
    });
  }

  setStatus(id: string, status: WorkOrderStatus, actorUserId: string) {
    return this.update(id, { status, actorUserId });
  }

  async addWorkItem(
    id: string,
    item: { action: string; element: string; quantity: number },
    actorUserId: string,
  ) {
    const workOrder = await this.update(id, { actorUserId });
    return {
      workOrder,
      item: { id: `wi_${Date.now()}`, ...item },
    };
  }

  async addPhoto(
    id: string,
    photo: {
      id?: string;
      category: WorkOrder["photos"][number]["category"];
      url: string;
    },
    actorUserId: string,
  ) {
    const media = await prisma.mediaFile.create({
      data: {
        id: photo.id,
        tenantId: DEFAULT_TENANT_ID,
        workOrderId: id,
        kind: photo.category,
        status: "READY",
        s3Key: photo.url,
        metadata: { source: "work_order_photo" },
      },
    });
    const workOrder = await this.update(id, { actorUserId });
    return {
      workOrder: {
        ...workOrder,
        photos: [
          ...workOrder.photos,
          {
            id: media.id,
            category: photo.category,
            url: photo.url,
            status: "validated" as const,
          },
        ],
      },
      photo: {
        id: media.id,
        category: photo.category,
        url: photo.url,
        status: "validated" as const,
      },
    };
  }

  async complete(
    id: string,
    signature: { signer: string; dataUrl: string },
    actorUserId: string,
  ) {
    if (!signature.dataUrl)
      throw new DomainError("SIGNATURE_REQUIRED", "Нужна подпись заказчика", 422);

    const current = await prisma.workOrder.findUnique({
      where: { id },
      include: { requirements: true, mediaFiles: true },
    });
    if (!current) throw new DomainError("NOT_FOUND", "Заказ-наряд не найден", 404);

    const required = ["installed", "removed", "document"];
    const missing = required.filter(
      (category) =>
        !current.mediaFiles.some(
          (media) => media.kind === category && media.status !== "FAILED",
        ),
    );
    if (missing.length > 0)
      throw new DomainError(
        "REQUIRED_PHOTO_MISSING",
        "Не хватает обязательных фото",
        422,
        { missing },
      );

    await prisma.signature.create({
      data: {
        workOrderId: id,
        signerRole: "customer",
        signerName: signature.signer,
        signedAt: new Date(),
        checksum: createHash("sha256").update(signature.dataUrl).digest("hex"),
      },
    });
    return this.update(id, { status: "completed", actorUserId });
  }
}

function mapWorkOrder(workOrder: WorkOrderRecord): WorkOrder {
  return {
    id: workOrder.id,
    number: workOrder.number,
    objectId: workOrder.objectId,
    elevatorId: workOrder.elevatorId ?? "",
    mechanicId: workOrder.technicianId ?? undefined,
    priority: priorityFromPrisma[workOrder.priority],
    status: statusFromPrisma[workOrder.status] ?? "draft",
    title: workOrder.title,
    workItems: [],
    materials: workOrder.materials.map((line) => ({
      id: line.id,
      materialId: line.materialId,
      name: line.material.name,
      warehouseId: "",
      quantity: Number(line.quantity),
      reserved: line.reserved,
      writtenOff: line.writtenOff,
    })),
    photos: workOrder.mediaFiles.map((media) => ({
      id: media.id,
      category: media.kind as WorkOrder["photos"][number]["category"],
      url: media.s3Key ?? "",
      status:
        media.status === "FAILED"
          ? "failed"
          : media.status === "UPLOADED"
            ? "uploaded"
            : "validated",
    })),
    signature: workOrder.signatures[0]
      ? {
          signer: workOrder.signatures[0].signerName,
          dataUrl: workOrder.signatures[0].checksum ?? "",
          signedAt: (
            workOrder.signatures[0].signedAt ?? workOrder.signatures[0].createdAt
          ).toISOString(),
        }
      : undefined,
    slaDueAt: new Date(workOrder.createdAt.getTime() + 4 * 60 * 60_000).toISOString(),
    version: workOrder.serverVersion,
    createdAt: workOrder.createdAt.toISOString(),
    updatedAt: workOrder.updatedAt.toISOString(),
  };
}
