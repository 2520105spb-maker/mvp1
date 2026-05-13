import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { OperationalState } from "./domain";

const now = () => new Date().toISOString();

export const createId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
export const addMinutes = (minutes: number) =>
  new Date(Date.now() + minutes * 60_000).toISOString();

const defaultPath = path.join(
  process.cwd(),
  ".data",
  "neolift-operational-state.json",
);

export type OperationalPersistence = {
  read(): Promise<OperationalState>;
  write(state: OperationalState): Promise<void>;
  transaction<T>(
    operation: (state: OperationalState) => Promise<T> | T,
  ): Promise<T>;
};

export class JsonFileOperationalPersistence implements OperationalPersistence {
  private writeChain: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly filePath = process.env.NEOLIFT_STATE_FILE ?? defaultPath,
  ) {}

  async read() {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return JSON.parse(raw) as OperationalState;
    } catch (error) {
      if (isNotFound(error)) {
        const seeded = initialState();
        await this.write(seeded);
        return seeded;
      }
      throw error;
    }
  }

  async write(state: OperationalState) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tmpPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmpPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    await rename(tmpPath, this.filePath);
  }

  async transaction<T>(
    operation: (state: OperationalState) => Promise<T> | T,
  ): Promise<T> {
    const run = async () => {
      const state = await this.read();
      const result = await operation(state);
      await this.write(state);
      return result;
    };
    const next = this.writeChain.then(run, run);
    this.writeChain = next.catch(() => undefined);
    return next;
  }
}

function isNotFound(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

function initialState(): OperationalState {
  return {
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
    auditLogs: [],
    events: [],
  };
}

const singleton = new JsonFileOperationalPersistence();
export function getPersistence() {
  return singleton;
}
