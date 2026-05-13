import {
  addMinutes,
  createId,
  type OperationalPersistence,
} from "./persistence";
import {
  DomainError,
  type EmergencyIncident,
  type MediaFile,
  type Movement,
  type Notification,
  type OperationalState,
  type PhotoLine,
  type Role,
  type Session,
  type SyncOperation,
  type WorkItem,
  type WorkOrder,
  type WorkOrderPriority,
  type WorkOrderStatus,
} from "./domain";

const now = () => new Date().toISOString();

export class SessionRepository {
  constructor(private readonly persistence: OperationalPersistence) {}

  async create(role: Role) {
    return this.persistence.transaction((state) => {
      const session: Session = {
        id: createId("sess"),
        userId: role === "mechanic" ? "mech_1" : `user_${role}`,
        role,
        displayName: role === "mechanic" ? "Алексей Климов" : roleName(role),
        createdAt: now(),
        expiresAt: addMinutes(24 * 60),
      };
      state.sessions.push(session);
      appendAudit(
        state,
        "session.created",
        "Session",
        session.id,
        session.userId,
        undefined,
        session,
      );
      return session;
    });
  }

  async find(sessionId?: string) {
    if (!sessionId) return undefined;
    const state = await this.persistence.read();
    const session = state.sessions.find((item) => item.id === sessionId);
    if (!session || new Date(session.expiresAt).getTime() < Date.now())
      return undefined;
    return session;
  }

  async remove(sessionId?: string) {
    if (!sessionId) return;
    await this.persistence.transaction((state) => {
      state.sessions = state.sessions.filter(
        (session) => session.id !== sessionId,
      );
      appendAudit(state, "session.removed", "Session", sessionId);
    });
  }
}

export class ObjectRepository {
  constructor(private readonly persistence: OperationalPersistence) {}

  async listObjects(search = "") {
    const normalized = search.toLowerCase();
    const state = await this.persistence.read();
    return state.objects.filter(
      (item) =>
        !normalized ||
        item.address.toLowerCase().includes(normalized) ||
        item.customer.toLowerCase().includes(normalized),
    );
  }

  async listElevators(objectId?: string, search = "") {
    const normalized = search.toLowerCase();
    const state = await this.persistence.read();
    return state.elevators.filter(
      (item) =>
        (!objectId || item.objectId === objectId) &&
        (!normalized ||
          item.number.toLowerCase().includes(normalized) ||
          item.factoryNumber.toLowerCase().includes(normalized)),
    );
  }
}

export class WorkOrderRepository {
  constructor(private readonly persistence: OperationalPersistence) {}

  async list(session: Session, status?: string) {
    const state = await this.persistence.read();
    return state.workOrders.filter(
      (item) =>
        (!status || item.status === status) &&
        (session.role !== "mechanic" || item.mechanicId === session.userId),
    );
  }

  async get(id: string) {
    const state = await this.persistence.read();
    return state.workOrders.find((item) => item.id === id);
  }

  async create(input: {
    objectId: string;
    elevatorId: string;
    title: string;
    priority?: WorkOrderPriority;
    actorUserId: string;
  }) {
    return this.persistence.transaction((state) => {
      if (!state.objects.some((item) => item.id === input.objectId))
        throw new DomainError("VALIDATION_FAILED", "Объект не найден", 422);
      if (
        !state.elevators.some(
          (item) =>
            item.id === input.elevatorId && item.objectId === input.objectId,
        )
      )
        throw new DomainError(
          "VALIDATION_FAILED",
          "Лифт не найден на объекте",
          422,
        );
      const created: WorkOrder = {
        id: createId("wo"),
        number: `ЗН-${String(state.workOrders.length + 1).padStart(4, "0")}`,
        objectId: input.objectId,
        elevatorId: input.elevatorId,
        priority: input.priority ?? "medium",
        status: "draft",
        title: input.title,
        workItems: [],
        materials: [],
        photos: [],
        slaDueAt: addMinutes(4 * 60),
        version: 1,
        createdAt: now(),
        updatedAt: now(),
      };
      state.workOrders.unshift(created);
      appendAudit(
        state,
        "work_order.created",
        "WorkOrder",
        created.id,
        input.actorUserId,
        undefined,
        created,
      );
      appendEvent(state, "WorkOrderCreated", created.id, {
        number: created.number,
      });
      pushNotification(state, {
        role: "dispatcher",
        type: "assignment",
        title: "Создан заказ-наряд",
        body: `${created.number}: ${created.title}`,
      });
      return touch(created);
    });
  }

  async assign(id: string, mechanicId: string, actorUserId: string) {
    return this.persistence.transaction((state) => {
      const workOrder = requireWorkOrder(state, id);
      const before = structuredClone(workOrder);
      workOrder.mechanicId = mechanicId;
      workOrder.status = "assigned";
      touch(workOrder);
      appendAudit(
        state,
        "work_order.assigned",
        "WorkOrder",
        id,
        actorUserId,
        before,
        workOrder,
      );
      appendEvent(state, "WorkOrderAssigned", id, { mechanicId });
      pushNotification(state, {
        userId: mechanicId,
        type: "assignment",
        title: "Назначена заявка",
        body: `${workOrder.number}: ${workOrder.title}`,
      });
      return workOrder;
    });
  }

  async setStatus(id: string, status: WorkOrderStatus, actorUserId: string) {
    return this.persistence.transaction((state) => {
      const workOrder = requireWorkOrder(state, id);
      const before = structuredClone(workOrder);
      workOrder.status = status;
      touch(workOrder);
      appendAudit(
        state,
        "work_order.status_changed",
        "WorkOrder",
        id,
        actorUserId,
        before,
        workOrder,
      );
      appendEvent(state, "WorkOrderStatusChanged", id, { status });
      return workOrder;
    });
  }

  async addWorkItem(
    id: string,
    item: Omit<WorkItem, "id">,
    actorUserId: string,
  ) {
    return this.persistence.transaction((state) => {
      const workOrder = requireWorkOrder(state, id);
      const workItem = { ...item, id: createId("wi") };
      workOrder.workItems.push(workItem);
      touch(workOrder);
      appendAudit(
        state,
        "work_order.work_item_added",
        "WorkOrder",
        id,
        actorUserId,
        undefined,
        workItem,
      );
      return { workOrder, item: workItem };
    });
  }

  async addPhoto(
    id: string,
    photo: Omit<PhotoLine, "id" | "status"> & {
      id?: string;
      status?: PhotoLine["status"];
    },
    actorUserId: string,
  ) {
    return this.persistence.transaction((state) => {
      const workOrder = requireWorkOrder(state, id);
      const line: PhotoLine = {
        id: photo.id ?? createId("photo"),
        category: photo.category,
        url: photo.url,
        status: photo.status ?? "validated",
      };
      workOrder.photos.push(line);
      touch(workOrder);
      appendAudit(
        state,
        "work_order.photo_added",
        "WorkOrder",
        id,
        actorUserId,
        undefined,
        line,
      );
      appendEvent(state, "PhotoAttached", id, {
        photoId: line.id,
        category: line.category,
      });
      return { workOrder, photo: line };
    });
  }

  async complete(
    id: string,
    signature: { signer: string; dataUrl: string },
    actorUserId: string,
  ) {
    return this.persistence.transaction((state) => {
      const workOrder = requireWorkOrder(state, id);
      const before = structuredClone(workOrder);
      const missing = ["installed", "removed", "document"].filter(
        (category) =>
          !workOrder.photos.some(
            (photo) => photo.category === category && photo.status !== "failed",
          ),
      );
      if (missing.length > 0)
        throw new DomainError(
          "REQUIRED_PHOTO_MISSING",
          "Не хватает обязательных фото",
          422,
          { missing },
        );
      if (!signature.dataUrl)
        throw new DomainError(
          "SIGNATURE_REQUIRED",
          "Нужна подпись заказчика",
          422,
        );
      for (const line of workOrder.materials.filter((item) => !item.writtenOff))
        writeOffMaterialInState(
          state,
          workOrder.id,
          line.materialId,
          line.warehouseId,
          line.quantity,
        );
      workOrder.signature = {
        signer: signature.signer,
        dataUrl: signature.dataUrl,
        signedAt: now(),
      };
      workOrder.status = "completed";
      touch(workOrder);
      appendAudit(
        state,
        "work_order.completed",
        "WorkOrder",
        id,
        actorUserId,
        before,
        workOrder,
      );
      appendEvent(state, "WorkOrderCompleted", id, {
        number: workOrder.number,
      });
      pushNotification(state, {
        role: "dispatcher",
        type: "assignment",
        title: "Заказ-наряд завершен",
        body: `${workOrder.number} ожидает проверки`,
      });
      return workOrder;
    });
  }
}

export class WarehouseRepository {
  constructor(private readonly persistence: OperationalPersistence) {}

  async listMaterials(search = "") {
    const normalized = search.toLowerCase();
    const state = await this.persistence.read();
    return state.materials
      .filter(
        (item) =>
          !normalized ||
          item.name.toLowerCase().includes(normalized) ||
          item.sku.toLowerCase().includes(normalized),
      )
      .map((material) => ({
        ...material,
        stock: state.stock.filter((stock) => stock.materialId === material.id),
      }));
  }

  async movements() {
    return (await this.persistence.read()).movements;
  }

  async reserve(input: {
    workOrderId: string;
    materialId: string;
    warehouseId: string;
    quantity: number;
    actorUserId: string;
  }) {
    return this.persistence.transaction((state) =>
      reserveMaterialInState(
        state,
        input.workOrderId,
        input.materialId,
        input.warehouseId,
        input.quantity,
        input.actorUserId,
      ),
    );
  }

  async writeOff(input: {
    workOrderId: string;
    materialId: string;
    warehouseId: string;
    quantity: number;
    actorUserId: string;
  }) {
    return this.persistence.transaction((state) =>
      writeOffMaterialInState(
        state,
        input.workOrderId,
        input.materialId,
        input.warehouseId,
        input.quantity,
        input.actorUserId,
      ),
    );
  }
}

export class MediaRepository {
  constructor(private readonly persistence: OperationalPersistence) {}

  async createUploadIntent(input: {
    ownerType: MediaFile["ownerType"];
    ownerId: string;
    category: string;
    fileName: string;
    actorUserId: string;
  }) {
    return this.persistence.transaction((state) => {
      const media: MediaFile = {
        id: createId("media"),
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        category: input.category,
        fileName: input.fileName,
        status: "pending",
        url: `/api/v1/media/${Date.now()}/preview`,
        createdAt: now(),
      };
      state.media.push(media);
      appendAudit(
        state,
        "media.upload_intent_created",
        "MediaFile",
        media.id,
        input.actorUserId,
        undefined,
        media,
      );
      return {
        media,
        uploadUrl: `/api/v1/media/confirm?mediaId=${media.id}`,
        method: "POST" as const,
      };
    });
  }

  async confirm(mediaId: string, url?: string, actorUserId?: string) {
    return this.persistence.transaction((state) => {
      const media = state.media.find((item) => item.id === mediaId);
      if (!media) throw new DomainError("NOT_FOUND", "Файл не найден", 404);
      const before = structuredClone(media);
      media.status = "validated";
      media.url = url ?? media.url;
      appendAudit(
        state,
        "media.confirmed",
        "MediaFile",
        media.id,
        actorUserId,
        before,
        media,
      );
      appendEvent(state, "MediaConfirmed", media.id, {
        ownerId: media.ownerId,
      });
      return media;
    });
  }
}

export class NotificationRepository {
  constructor(private readonly persistence: OperationalPersistence) {}

  async list(session: Session) {
    const state = await this.persistence.read();
    return state.notifications.filter(
      (item) =>
        !item.userId ||
        item.userId === session.userId ||
        !item.role ||
        item.role === session.role,
    );
  }
}

export class DispatchRepository {
  constructor(private readonly persistence: OperationalPersistence) {}

  async queue() {
    const state = await this.persistence.read();
    return {
      unassigned: state.workOrders.filter((item) => !item.mechanicId),
      assigned: state.workOrders.filter(
        (item) => item.mechanicId && item.status !== "closed",
      ),
      workload: state.workOrders.reduce<Record<string, number>>((acc, item) => {
        if (item.mechanicId)
          acc[item.mechanicId] = (acc[item.mechanicId] ?? 0) + 1;
        return acc;
      }, {}),
    };
  }
}

export class EmergencyRepository {
  constructor(private readonly persistence: OperationalPersistence) {}

  async list() {
    return (await this.persistence.read()).emergency;
  }

  async create(input: {
    workOrderId: string;
    priority: EmergencyIncident["priority"];
    actorUserId: string;
  }) {
    return this.persistence.transaction((state) => {
      if (!state.workOrders.some((item) => item.id === input.workOrderId))
        throw new DomainError(
          "VALIDATION_FAILED",
          "Нужен существующий заказ-наряд",
          422,
        );
      const incident: EmergencyIncident = {
        id: createId("inc"),
        workOrderId: input.workOrderId,
        priority: input.priority,
        status: "new",
        slaDueAt: addMinutes(30),
        createdAt: now(),
      };
      state.emergency.unshift(incident);
      appendAudit(
        state,
        "incident.created",
        "EmergencyIncident",
        incident.id,
        input.actorUserId,
        undefined,
        incident,
      );
      appendEvent(state, "EmergencyIncidentCreated", incident.id, {
        workOrderId: input.workOrderId,
      });
      pushNotification(state, {
        role: "dispatcher",
        type: "emergency",
        title: "Аварийная заявка",
        body: `Инцидент ${incident.id}: критичный SLA`,
      });
      return incident;
    });
  }

  async assign(id: string, mechanicId: string, actorUserId: string) {
    return this.persistence.transaction((state) => {
      const incident = state.emergency.find((item) => item.id === id);
      if (!incident)
        throw new DomainError("NOT_FOUND", "Инцидент не найден", 404);
      const before = structuredClone(incident);
      incident.assignedMechanicId = mechanicId;
      incident.status = "assigned";
      appendAudit(
        state,
        "incident.assigned",
        "EmergencyIncident",
        incident.id,
        actorUserId,
        before,
        incident,
      );
      pushNotification(state, {
        userId: mechanicId,
        type: "emergency",
        title: "Аварийный выезд",
        body: `Назначен инцидент ${incident.id}`,
      });
      return incident;
    });
  }
}

export class SyncRepository {
  constructor(private readonly persistence: OperationalPersistence) {}

  async replay(
    deviceId: string,
    operations: Array<
      Omit<SyncOperation, "id" | "createdAt" | "status" | "deviceId">
    >,
  ) {
    return this.persistence.transaction((state) => {
      const applied = operations.map((operation) => {
        const duplicate = operation.idempotencyKey
          ? state.syncOperations.find(
              (item) => item.idempotencyKey === operation.idempotencyKey,
            )
          : undefined;
        if (duplicate) return duplicate;
        const item: SyncOperation = {
          ...operation,
          id: createId("sync"),
          deviceId,
          status: "applied",
          createdAt: now(),
        };
        state.syncOperations.push(item);
        appendAudit(
          state,
          "sync.operation_applied",
          "SyncOperation",
          item.id,
          deviceId,
          undefined,
          item,
        );
        return item;
      });
      return { applied, cursor: now(), conflicts: [] as SyncOperation[] };
    });
  }
}

export class ReportRepository {
  constructor(private readonly persistence: OperationalPersistence) {}

  async workOrderPdf(id: string) {
    const state = await this.persistence.read();
    const workOrder = state.workOrders.find((item) => item.id === id);
    if (!workOrder)
      throw new DomainError("NOT_FOUND", "Заказ-наряд не найден", 404);
    const text = `НеоЛифт Заказ-наряд ${workOrder.number} ${workOrder.title} Статус ${workOrder.status}`;
    return {
      workOrder,
      bytes: `%PDF-1.4\n1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj\n2 0 obj <</Type/Pages/Count 1/Kids[3 0 R]>> endobj\n3 0 obj <</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R>> endobj\n4 0 obj <</Length ${text.length + 42}>> stream\nBT /F1 18 Tf 72 760 Td (${text}) Tj ET\nendstream endobj\ntrailer <</Root 1 0 R>>\n%%EOF`,
    };
  }
}

function roleName(role: Role) {
  const labels: Record<Role, string> = {
    mechanic: "Механик",
    dispatcher: "Диспетчер",
    warehouse: "Склад",
    supervisor: "Руководитель",
    director: "Директор",
    administrator: "Администратор",
  };
  return labels[role];
}

function requireWorkOrder(state: OperationalState, id: string) {
  const workOrder = state.workOrders.find((item) => item.id === id);
  if (!workOrder)
    throw new DomainError("NOT_FOUND", "Заказ-наряд не найден", 404);
  if (workOrder.status === "closed")
    throw new DomainError(
      "CONFLICT",
      "Закрытый заказ-наряд нельзя изменить",
      409,
    );
  return workOrder;
}

function touch(workOrder: WorkOrder) {
  workOrder.version += 1;
  workOrder.updatedAt = now();
  return workOrder;
}

function reserveMaterialInState(
  state: OperationalState,
  workOrderId: string,
  materialId: string,
  warehouseId: string,
  quantity: number,
  actorUserId?: string,
) {
  if (quantity <= 0)
    throw new DomainError(
      "VALIDATION_FAILED",
      "Количество должно быть больше нуля",
      422,
    );
  const stock = state.stock.find(
    (item) =>
      item.materialId === materialId && item.warehouseId === warehouseId,
  );
  if (!stock)
    throw new DomainError("STOCK_ERROR", "Материал не найден на складе", 404);
  if (stock.onHand - stock.reserved < quantity)
    throw new DomainError(
      "STOCK_ERROR",
      "Недостаточно доступного остатка",
      409,
    );
  const material = state.materials.find((item) => item.id === materialId);
  const workOrder = requireWorkOrder(state, workOrderId);
  stock.reserved += quantity;
  if (material) {
    workOrder.materials.push({
      id: createId("wol"),
      materialId,
      name: material.name,
      warehouseId,
      quantity,
      reserved: true,
      writtenOff: false,
    });
    touch(workOrder);
  }
  const movement: Movement = {
    id: createId("mov"),
    materialId,
    warehouseId,
    workOrderId,
    type: "reservation",
    quantity,
    createdAt: now(),
  };
  state.movements.push(movement);
  appendAudit(
    state,
    "stock.reserved",
    "MaterialMovement",
    movement.id,
    actorUserId,
    undefined,
    movement,
  );
  return movement;
}

function writeOffMaterialInState(
  state: OperationalState,
  workOrderId: string,
  materialId: string,
  warehouseId: string,
  quantity: number,
  actorUserId?: string,
) {
  if (quantity <= 0)
    throw new DomainError(
      "VALIDATION_FAILED",
      "Количество должно быть больше нуля",
      422,
    );
  const stock = state.stock.find(
    (item) =>
      item.materialId === materialId && item.warehouseId === warehouseId,
  );
  if (!stock)
    throw new DomainError("STOCK_ERROR", "Материал не найден на складе", 404);
  if (stock.onHand < quantity)
    throw new DomainError(
      "STOCK_ERROR",
      "Недостаточно остатка для списания",
      409,
    );
  stock.onHand -= quantity;
  stock.reserved = Math.max(0, stock.reserved - quantity);
  const line = state.workOrders
    .find((item) => item.id === workOrderId)
    ?.materials.find(
      (item) =>
        item.materialId === materialId &&
        item.warehouseId === warehouseId &&
        !item.writtenOff,
    );
  if (line) line.writtenOff = true;
  const movement: Movement = {
    id: createId("mov"),
    materialId,
    warehouseId,
    workOrderId,
    type: "write_off",
    quantity,
    createdAt: now(),
  };
  state.movements.push(movement);
  appendAudit(
    state,
    "stock.written_off",
    "MaterialMovement",
    movement.id,
    actorUserId,
    undefined,
    movement,
  );
  appendEvent(state, "MaterialWrittenOff", movement.id, {
    materialId,
    workOrderId,
    quantity,
  });
  return movement;
}

function pushNotification(
  state: OperationalState,
  notification: Omit<Notification, "id" | "createdAt" | "read">,
) {
  state.notifications.unshift({
    ...notification,
    id: createId("notif"),
    read: false,
    createdAt: now(),
  });
}

function appendAudit(
  state: OperationalState,
  action: string,
  entity: string,
  entityId: string,
  actorUserId?: string,
  before?: unknown,
  after?: unknown,
) {
  state.auditLogs.push({
    id: createId("audit"),
    action,
    entity,
    entityId,
    actorUserId,
    before,
    after,
    createdAt: now(),
  });
}

function appendEvent(
  state: OperationalState,
  type: string,
  entityId: string,
  payload: unknown,
) {
  state.events.push({
    id: createId("evt"),
    type,
    entityId,
    payload,
    createdAt: now(),
    published: false,
  });
}
