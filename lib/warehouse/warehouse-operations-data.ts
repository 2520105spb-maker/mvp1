import type {
  InventoryAudit,
  InventoryRow,
  Material,
  MaterialCategory,
  MaterialMovement,
  MaterialUsageHistory,
  PurchaseRequest,
  QRLabel,
  Reservation,
  StockLevel,
  Supplier,
  Transfer,
  Warehouse,
  WarehouseAiInsight,
  WarehouseAlert,
  WarehouseZone,
  WriteOff,
} from "./types";

export const WAREHOUSES: Warehouse[] = [
  { id: "wh-main", name: "Главный склад", type: "main", region: "Москва", address: "Москва, Южнопортовая 12", manager: "Олег Романов", online: true },
  { id: "wh-south", name: "Склад Юг-2", type: "regional", region: "Юг-2", address: "Москва, Кирова 18", manager: "Анна Лаврова", online: true },
  { id: "wh-van-14", name: "Мобильный склад Алексей", type: "mobile", region: "Юг-2", address: "Ford Transit · мех-014", manager: "Алексей Климов", online: false },
  { id: "wh-quarantine", name: "Карантин списаний", type: "quarantine", region: "Москва", address: "Главный склад / зона Q", manager: "СБ", online: true },
];

export const WAREHOUSE_ZONES: WarehouseZone[] = [
  { id: "zone-a1", warehouseId: "wh-main", code: "A-01", name: "Электрика", temperatureControl: false, qrPrefix: "WH-M-A01" },
  { id: "zone-b2", warehouseId: "wh-main", code: "B-02", name: "Дверные узлы", temperatureControl: false, qrPrefix: "WH-M-B02" },
  { id: "zone-v1", warehouseId: "wh-van-14", code: "VAN-14", name: "Автомобиль механика", temperatureControl: false, qrPrefix: "VAN14" },
];

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  { id: "cat-electric", name: "Электрика", criticalForSla: true, approvalRequired: false },
  { id: "cat-doors", name: "Дверные механизмы", criticalForSla: true, approvalRequired: false },
  { id: "cat-controller", name: "Контроллеры", criticalForSla: true, approvalRequired: true },
  { id: "cat-consumables", name: "Расходники", criticalForSla: false, approvalRequired: false },
];

export const SUPPLIERS: Supplier[] = [
  { id: "sup-liftkom", name: "ЛифтКомплект", leadTimeDays: 4, reliability: 94, priceIndex: 1.02, contacts: "supply@liftkom.example" },
  { id: "sup-promlift", name: "ПромЛифт", leadTimeDays: 6, reliability: 88, priceIndex: 0.97, contacts: "zakaz@promlift.example" },
  { id: "sup-oem", name: "OEM Schindler", leadTimeDays: 18, reliability: 97, priceIndex: 1.34, contacts: "oem@example" },
];

export const MATERIALS: Material[] = [
  { id: "mat-dr44", sku: "DR-44", barcode: "460700100044", name: "Ролик дверной D44", categoryId: "cat-doors", unit: "шт", manufacturer: "ПромЛифт", compatibleElevators: ["Schindler 3300", "Otis Gen2"], defaultSupplierId: "sup-promlift", highCost: false, emergencyPart: true },
  { id: "mat-lce", sku: "LCECPU-3.9", barcode: "OEM-LCECPU-39", name: "Плата контроллера LCECPU", categoryId: "cat-controller", unit: "шт", manufacturer: "Kone", compatibleElevators: ["Kone", "Schindler adapter"], defaultSupplierId: "sup-oem", highCost: true, emergencyPart: true },
  { id: "mat-kv12", sku: "KV-12-24V", barcode: "460700120024", name: "Кнопка вызова КВ-12 24В", categoryId: "cat-electric", unit: "шт", manufacturer: "ЛифтКомплект", compatibleElevators: ["ЩЛЗ", "МЛЗ", "Otis adapter"], defaultSupplierId: "sup-liftkom", highCost: false, emergencyPart: false },
  { id: "mat-lube", sku: "LUBE-02", barcode: "460700200002", name: "Смазка направляющих", categoryId: "cat-consumables", unit: "туба", manufacturer: "ЛифтКомплект", compatibleElevators: ["Все"], defaultSupplierId: "sup-liftkom", highCost: false, emergencyPart: false },
];

export const STOCK_LEVELS: StockLevel[] = [
  { id: "stock-1", materialId: "mat-dr44", warehouseId: "wh-main", zoneId: "zone-b2", onHand: 18, reserved: 14, min: 24, max: 90, lastMovementAt: "2026-05-12T08:50:00.000Z", risk: "critical" },
  { id: "stock-2", materialId: "mat-lce", warehouseId: "wh-main", zoneId: "zone-a1", onHand: 2, reserved: 2, min: 2, max: 8, lastMovementAt: "2026-05-12T07:25:00.000Z", risk: "over_reserved" },
  { id: "stock-3", materialId: "mat-kv12", warehouseId: "wh-south", zoneId: "zone-a1", onHand: 42, reserved: 9, min: 20, max: 80, lastMovementAt: "2026-05-12T08:15:00.000Z", risk: "normal" },
  { id: "stock-4", materialId: "mat-lube", warehouseId: "wh-van-14", zoneId: "zone-v1", onHand: 3, reserved: 1, min: 4, max: 12, lastMovementAt: "2026-05-12T08:44:00.000Z", risk: "low" },
];

export const RESERVATIONS: Reservation[] = [
  { id: "res-1", materialId: "mat-dr44", warehouseId: "wh-main", workOrderId: "WO-2944", mechanicId: "mech-014", quantity: 2, status: "confirmed", slaCritical: true, expiresAt: "2026-05-12T10:30:00.000Z" },
  { id: "res-2", materialId: "mat-lce", warehouseId: "wh-main", workOrderId: "WO-2949", mechanicId: "mech-031", quantity: 1, status: "pending", slaCritical: true, expiresAt: "2026-05-12T11:00:00.000Z" },
  { id: "res-3", materialId: "mat-kv12", warehouseId: "wh-south", workOrderId: "WO-2951", mechanicId: "mech-014", quantity: 4, status: "issued", slaCritical: false, expiresAt: "2026-05-12T17:00:00.000Z" },
];

export const MATERIAL_MOVEMENTS: MaterialMovement[] = [
  { id: "mov-1", materialId: "mat-dr44", warehouseId: "wh-main", type: "reservation", status: "posted", quantity: 2, actor: "Диспетчер Марина", workOrderId: "WO-2944", photoRequired: false, photoAttached: false, createdAt: "2026-05-12T08:50:00.000Z", reason: "SLA emergency reserve" },
  { id: "mov-2", materialId: "mat-dr44", warehouseId: "wh-van-14", type: "write_off", status: "pending", quantity: 3, actor: "Алексей Климов", workOrderId: "WO-2939", photoRequired: true, photoAttached: true, createdAt: "2026-05-12T08:42:00.000Z", reason: "Замена роликов двери" },
  { id: "mov-3", materialId: "mat-lce", warehouseId: "wh-main", type: "receipt", status: "posted", quantity: 2, actor: "Олег Романов", photoRequired: false, photoAttached: false, createdAt: "2026-05-12T07:25:00.000Z", reason: "Поставка OEM" },
  { id: "mov-4", materialId: "mat-lube", warehouseId: "wh-van-14", type: "audit_correction", status: "conflict", quantity: -1, actor: "Mobile audit", photoRequired: true, photoAttached: false, createdAt: "2026-05-12T08:44:00.000Z", reason: "Расхождение мобильного склада" },
];

export const WRITEOFFS: WriteOff[] = [
  { id: "wof-1", materialId: "mat-dr44", workOrderId: "WO-2939", mechanicId: "mech-014", quantity: 3, risk: "suspicious", validationMessages: ["Количество выше нормы для типа работ", "Фото присутствует", "Повторное списание за 48ч"], photoAttached: true },
  { id: "wof-2", materialId: "mat-lube", workOrderId: "WO-2944", mechanicId: "mech-014", quantity: 1, risk: "normal", validationMessages: ["Соответствует работам"], photoAttached: true, approvedBy: "Олег Романов" },
];

export const TRANSFERS: Transfer[] = [
  { id: "tr-1", materialId: "mat-dr44", fromWarehouseId: "wh-main", toWarehouseId: "wh-south", quantity: 20, eta: "2026-05-12T16:30:00.000Z", status: "approved" },
  { id: "tr-2", materialId: "mat-lube", fromWarehouseId: "wh-main", toWarehouseId: "wh-van-14", quantity: 6, eta: "2026-05-12T13:10:00.000Z", status: "pending" },
];

export const PURCHASE_REQUESTS: PurchaseRequest[] = [
  { id: "pr-1", materialId: "mat-dr44", supplierId: "sup-promlift", quantity: 120, status: "approval", expectedAt: "2026-05-18T10:00:00.000Z", reason: "Forecast shortage in 3 days" },
  { id: "pr-2", materialId: "mat-lce", supplierId: "sup-oem", quantity: 4, status: "ordered", expectedAt: "2026-05-29T10:00:00.000Z", reason: "SLA critical stock" },
];

export const INVENTORY_AUDITS: InventoryAudit[] = [
  { id: "aud-1", warehouseId: "wh-main", status: "scanning", scheduledAt: "2026-05-12T09:00:00.000Z", scanned: 1840, expected: 3200, discrepancies: 12, approvalRequired: true },
  { id: "aud-2", warehouseId: "wh-van-14", status: "recount", scheduledAt: "2026-05-12T08:00:00.000Z", scanned: 86, expected: 92, discrepancies: 3, approvalRequired: true },
];

export const QR_LABELS: QRLabel[] = [
  { id: "qr-1", materialId: "mat-dr44", payload: "NL:MAT:DR-44:WH-M-B02", labelType: "material", lastScannedAt: "2026-05-12T08:52:00.000Z" },
  { id: "qr-2", materialId: "mat-lce", payload: "NL:MAT:LCECPU-3.9:SECURE", labelType: "elevator_linked", lastScannedAt: "2026-05-12T07:25:00.000Z" },
];

export const MATERIAL_USAGE_HISTORY: MaterialUsageHistory[] = [
  { id: "hist-1", materialId: "mat-dr44", objectAddress: "БЦ Север", elevatorFactoryNumber: "SC-88420", workOrderId: "WO-2939", usedAt: "2026-05-12T08:42:00.000Z", failurePattern: "repeat door failures" },
  { id: "hist-2", materialId: "mat-kv12", objectAddress: "ул. Кирова, 18к2", elevatorFactoryNumber: "OT-441121", workOrderId: "WO-2927", usedAt: "2026-05-11T15:10:00.000Z" },
];

export const WAREHOUSE_ALERTS: WarehouseAlert[] = [
  { id: "alert-1", title: "Critical low stock", description: "DR-44 доступно 4 шт. при min 24 и SLA аварии WO-2944", severity: "critical", type: "low_stock" },
  { id: "alert-2", title: "Suspicious write-off", description: "DR-44 списан выше нормы механиком mech-014", severity: "warning", type: "suspicious_usage" },
  { id: "alert-3", title: "Audit discrepancy", description: "Мобильный склад Алексей: 3 расхождения требуют пересчета", severity: "warning", type: "audit" },
  { id: "alert-4", title: "Incoming delivery delayed", description: "OEM Schindler LCECPU задерживается на 2 дня", severity: "warning", type: "delivery" },
];

export const AI_WAREHOUSE_INSIGHTS: WarehouseAiInsight[] = [
  { id: "ai-1", title: "Forecast shortage", description: "DR-44 закончится через 3 дня с учетом аварийности дверей", confidence: 92, category: "forecast_shortage" },
  { id: "ai-2", title: "Suspicious usage", description: "Списание DR-44 выше baseline на 240% по объекту БЦ Север", confidence: 87, category: "suspicious_writeoff" },
  { id: "ai-3", title: "Dead stock", description: "KV-12 legacy adapter не двигался 94 дня на главном складе", confidence: 76, category: "dead_stock" },
  { id: "ai-4", title: "Procurement optimization", description: "Объединить закупку LCECPU с поставкой контроллеров Q3", confidence: 81, category: "procurement_optimization" },
];

export function buildInventoryRows(): InventoryRow[] {
  return STOCK_LEVELS.map((stock) => {
    const material = MATERIALS.find((candidate) => candidate.id === stock.materialId) ?? MATERIALS[0];
    const category = MATERIAL_CATEGORIES.find((candidate) => candidate.id === material.categoryId) ?? MATERIAL_CATEGORIES[0];
    const warehouse = WAREHOUSES.find((candidate) => candidate.id === stock.warehouseId) ?? WAREHOUSES[0];
    const latestMovement = MATERIAL_MOVEMENTS.filter((movement) => movement.materialId === material.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    return { material, category, stock, warehouse, available: stock.onHand - stock.reserved, latestMovement };
  });
}
