export type Role =
  | "mechanic"
  | "dispatcher"
  | "warehouse"
  | "supervisor"
  | "director"
  | "administrator";

export type Session = {
  id: string;
  userId: string;
  role: Role;
  displayName: string;
  createdAt: string;
  expiresAt: string;
};

export type ElevatorObject = {
  id: string;
  address: string;
  customer: string;
  region: string;
  status: "active" | "sla_risk" | "emergency";
  assignedMechanicId: string;
};

export type Elevator = {
  id: string;
  objectId: string;
  number: string;
  factoryNumber: string;
  model: string;
  controller: string;
  status: "active" | "maintenance" | "emergency";
};

export type WorkOrderStatus =
  | "draft"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "waiting_approval"
  | "completed"
  | "closed";

export type WorkItem = {
  id: string;
  action: string;
  element: string;
  quantity: number;
};
export type MaterialLine = {
  id: string;
  materialId: string;
  name: string;
  warehouseId: string;
  quantity: number;
  reserved: boolean;
  writtenOff: boolean;
};
export type PhotoLine = {
  id: string;
  category: "installed" | "removed" | "document" | "before" | "after";
  url: string;
  status: "queued" | "uploaded" | "validated" | "failed";
};

export type WorkOrder = {
  id: string;
  number: string;
  objectId: string;
  elevatorId: string;
  mechanicId?: string;
  priority: "low" | "medium" | "high" | "critical";
  status: WorkOrderStatus;
  title: string;
  workItems: WorkItem[];
  materials: MaterialLine[];
  photos: PhotoLine[];
  signature?: { signer: string; dataUrl: string; signedAt: string };
  slaDueAt: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type Material = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  minLevel: number;
};
export type StockBalance = {
  materialId: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
};
export type Movement = {
  id: string;
  materialId: string;
  warehouseId: string;
  workOrderId?: string;
  type: "reservation" | "write_off" | "return";
  quantity: number;
  createdAt: string;
};
export type MediaFile = {
  id: string;
  ownerType: "work_order" | "elevator" | "incident";
  ownerId: string;
  category: string;
  fileName: string;
  status: "pending" | "uploaded" | "validated";
  url: string;
  createdAt: string;
};
export type Notification = {
  id: string;
  userId?: string;
  role?: Role;
  type: "assignment" | "sla" | "emergency" | "sync";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};
export type EmergencyIncident = {
  id: string;
  workOrderId: string;
  priority: "critical" | "high";
  status: "new" | "assigned" | "en_route" | "resolved";
  slaDueAt: string;
  assignedMechanicId?: string;
  createdAt: string;
};
export type SyncOperation = {
  id: string;
  deviceId: string;
  entity: "work_order" | "media" | "material";
  operation: string;
  payload: unknown;
  status: "queued" | "applied" | "conflict";
  createdAt: string;
};

export type OperationalState = {
  sessions: Session[];
  objects: ElevatorObject[];
  elevators: Elevator[];
  workOrders: WorkOrder[];
  materials: Material[];
  stock: StockBalance[];
  movements: Movement[];
  media: MediaFile[];
  notifications: Notification[];
  emergency: EmergencyIncident[];
  syncOperations: SyncOperation[];
};

const now = () => new Date().toISOString();
const id = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const addMinutes = (minutes: number) =>
  new Date(Date.now() + minutes * 60_000).toISOString();

const initialState = (): OperationalState => ({
  sessions: [],
  objects: [
    {
      id: "obj_1",
      address: "Москва, ул. Промышленная, 12",
      customer: "УК Север",
      region: "Север",
      status: "active",
      assignedMechanicId: "mech_1",
    },
    {
      id: "obj_2",
      address: "Москва, БЦ Вертикаль, корпус 2",
      customer: "БЦ Вертикаль",
      region: "Центр",
      status: "sla_risk",
      assignedMechanicId: "mech_2",
    },
  ],
  elevators: [
    {
      id: "elev_1",
      objectId: "obj_1",
      number: "Л-01",
      factoryNumber: "ЩЛЗ-332918",
      model: "Пассажирский 1000",
      controller: "УКЛ-17",
      status: "active",
    },
    {
      id: "elev_2",
      objectId: "obj_2",
      number: "Л-04",
      factoryNumber: "OTIS-88420",
      model: "Gen2",
      controller: "OTIS OVF",
      status: "maintenance",
    },
  ],
  workOrders: [
    {
      id: "wo_1",
      number: "ЗН-0001",
      objectId: "obj_1",
      elevatorId: "elev_1",
      mechanicId: "mech_1",
      priority: "high",
      status: "assigned",
      title: "Регулировка дверей и проверка ДК",
      workItems: [
        {
          id: "wi_1",
          action: "Регулировка",
          element: "Двери кабины",
          quantity: 1,
        },
      ],
      materials: [],
      photos: [],
      slaDueAt: addMinutes(120),
      version: 1,
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  materials: [
    {
      id: "mat_1",
      sku: "DK-44",
      name: "Контакт ДК",
      category: "Двери",
      unit: "шт",
      minLevel: 5,
    },
    {
      id: "mat_2",
      sku: "BTN-12",
      name: "Кнопка вызова",
      category: "Посты",
      unit: "шт",
      minLevel: 10,
    },
    {
      id: "mat_3",
      sku: "ROL-77",
      name: "Ролик двери",
      category: "Двери",
      unit: "шт",
      minLevel: 8,
    },
  ],
  stock: [
    { materialId: "mat_1", warehouseId: "wh_main", onHand: 24, reserved: 0 },
    { materialId: "mat_2", warehouseId: "wh_main", onHand: 64, reserved: 0 },
    { materialId: "mat_3", warehouseId: "wh_main", onHand: 18, reserved: 0 },
  ],
  movements: [],
  media: [],
  notifications: [],
  emergency: [],
  syncOperations: [],
});

type GlobalStore = { __neoliftOperationalState?: OperationalState };
const globalStore = globalThis as GlobalStore;

export function getOperationalState() {
  globalStore.__neoliftOperationalState ??= initialState();
  return globalStore.__neoliftOperationalState;
}

export function findSession(sessionId?: string) {
  if (!sessionId) return undefined;
  const state = getOperationalState();
  const session = state.sessions.find((item) => item.id === sessionId);
  if (!session || new Date(session.expiresAt).getTime() < Date.now())
    return undefined;
  return session;
}

export function createSession(role: Role) {
  const state = getOperationalState();
  const session: Session = {
    id: id("sess"),
    userId: role === "mechanic" ? "mech_1" : `user_${role}`,
    role,
    displayName: role === "mechanic" ? "Алексей Климов" : roleName(role),
    createdAt: now(),
    expiresAt: addMinutes(24 * 60),
  };
  state.sessions.push(session);
  return session;
}

export function roleName(role: Role) {
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

export function removeSession(sessionId?: string) {
  if (!sessionId) return;
  const state = getOperationalState();
  state.sessions = state.sessions.filter((session) => session.id !== sessionId);
}

export function touchWorkOrder(workOrder: WorkOrder) {
  workOrder.version += 1;
  workOrder.updatedAt = now();
  return workOrder;
}

export function nextWorkOrderNumber() {
  const state = getOperationalState();
  return `ЗН-${String(state.workOrders.length + 1).padStart(4, "0")}`;
}

export function reserveMaterial(
  workOrderId: string,
  materialId: string,
  warehouseId: string,
  quantity: number,
) {
  const state = getOperationalState();
  const stock = state.stock.find(
    (item) =>
      item.materialId === materialId && item.warehouseId === warehouseId,
  );
  if (!stock) throw new Error("Материал не найден на складе");
  if (stock.onHand - stock.reserved < quantity)
    throw new Error("Недостаточно доступного остатка");
  stock.reserved += quantity;
  const material = state.materials.find((item) => item.id === materialId);
  const workOrder = state.workOrders.find((item) => item.id === workOrderId);
  if (workOrder && material) {
    workOrder.materials.push({
      id: id("wol"),
      materialId,
      name: material.name,
      warehouseId,
      quantity,
      reserved: true,
      writtenOff: false,
    });
    touchWorkOrder(workOrder);
  }
  const movement: Movement = {
    id: id("mov"),
    materialId,
    warehouseId,
    workOrderId,
    type: "reservation",
    quantity,
    createdAt: now(),
  };
  state.movements.push(movement);
  return movement;
}

export function writeOffMaterial(
  workOrderId: string,
  materialId: string,
  warehouseId: string,
  quantity: number,
) {
  const state = getOperationalState();
  const stock = state.stock.find(
    (item) =>
      item.materialId === materialId && item.warehouseId === warehouseId,
  );
  if (!stock) throw new Error("Материал не найден на складе");
  if (stock.onHand < quantity)
    throw new Error("Недостаточно остатка для списания");
  stock.onHand -= quantity;
  stock.reserved = Math.max(0, stock.reserved - quantity);
  const line = state.workOrders
    .find((item) => item.id === workOrderId)
    ?.materials.find(
      (item) =>
        item.materialId === materialId && item.warehouseId === warehouseId,
    );
  if (line) line.writtenOff = true;
  const movement: Movement = {
    id: id("mov"),
    materialId,
    warehouseId,
    workOrderId,
    type: "write_off",
    quantity,
    createdAt: now(),
  };
  state.movements.push(movement);
  return movement;
}

export function notify(
  notification: Omit<Notification, "id" | "createdAt" | "read">,
) {
  const state = getOperationalState();
  const item: Notification = {
    ...notification,
    id: id("notif"),
    read: false,
    createdAt: now(),
  };
  state.notifications.unshift(item);
  return item;
}

export function createPdfBytes(workOrder: WorkOrder) {
  const text = `NeoLift Work Order ${workOrder.number} ${workOrder.title} Status ${workOrder.status}`;
  return `%PDF-1.4\n1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj\n2 0 obj <</Type/Pages/Count 1/Kids[3 0 R]>> endobj\n3 0 obj <</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R>> endobj\n4 0 obj <</Length ${text.length + 42}>> stream\nBT /F1 18 Tf 72 760 Td (${text}) Tj ET\nendstream endobj\ntrailer <</Root 1 0 R>>\n%%EOF`;
}
