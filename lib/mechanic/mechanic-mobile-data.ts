import type { ElevatorMobileCard, EmergencyCall, MaterialUsage, MechanicRouteStop, MobileWorkOrder, OfflineCachePolicy, OfflineDraft, PhotoSession, Signature, SyncEvent, UploadQueueItem } from "./types";

export const MOBILE_WORK_ORDERS: MobileWorkOrder[] = [
  { id: "mwo-1", number: "WO-2944", title: "Аварийное открытие дверей", objectAddress: "БЦ Север, 12 этаж", elevatorId: "elv-88420", elevatorFactoryNumber: "SC-88420", priority: "emergency", status: "accepted", slaDueAt: "2026-05-12T09:18:00.000Z", plannedStart: "2026-05-12T09:00:00.000Z", estimatedMinutes: 45, requiredPhotos: ["before", "after", "node"], requiredMaterials: ["DR-44", "LUBE-02"], offlineReady: true },
  { id: "mwo-2", number: "WO-2943", title: "Просроченное ТО", objectAddress: "Москва, ул. Кирова, 18к2", elevatorId: "elv-441121", elevatorFactoryNumber: "OT-441121", priority: "high", status: "assigned", slaDueAt: "2026-05-12T11:30:00.000Z", plannedStart: "2026-05-12T10:20:00.000Z", estimatedMinutes: 60, requiredPhotos: ["inspection", "document"], requiredMaterials: ["FILTER-10"], offlineReady: true },
  { id: "mwo-3", number: "WO-2939", title: "Плановая диагностика канатов", objectAddress: "Городская больница №7, корпус 3", elevatorId: "elv-332918", elevatorFactoryNumber: "ЩЛЗ-332918", priority: "normal", status: "completed_offline", slaDueAt: "2026-05-12T15:00:00.000Z", plannedStart: "2026-05-12T13:00:00.000Z", estimatedMinutes: 50, requiredPhotos: ["before", "after"], requiredMaterials: [], offlineReady: true },
];

export const OFFLINE_DRAFTS: OfflineDraft[] = [
  { id: "draft-1", workOrderId: "mwo-3", entity: "work_order", updatedAt: "2026-05-12T08:40:00.000Z", encrypted: true, conflictRisk: "low", sizeKb: 148 },
  { id: "draft-2", workOrderId: "mwo-3", entity: "signature", updatedAt: "2026-05-12T08:41:00.000Z", encrypted: true, conflictRisk: "none", sizeKb: 42 },
  { id: "draft-3", workOrderId: "mwo-1", entity: "elevator_card", updatedAt: "2026-05-12T08:35:00.000Z", encrypted: true, conflictRisk: "none", sizeKb: 910 },
];

export const UPLOAD_QUEUE: UploadQueueItem[] = [
  { id: "up-1", workOrderId: "mwo-3", type: "photo", fileName: "WO-2939_after_001.webp", progress: 74, status: "uploading", retryCount: 1, compressed: true },
  { id: "up-2", workOrderId: "mwo-3", type: "signature", fileName: "WO-2939_customer_signature.svg", progress: 0, status: "queued", retryCount: 0, compressed: false },
  { id: "up-3", workOrderId: "mwo-1", type: "photo", fileName: "WO-2944_before_dark.webp", progress: 0, status: "failed", retryCount: 2, compressed: true },
];

export const PHOTO_SESSIONS: PhotoSession[] = [
  { id: "phs-1", workOrderId: "mwo-1", kind: "before", title: "Дверной привод до работ", capturedAt: "2026-05-12T08:50:00.000Z", localUri: "indexeddb://photos/phs-1", validation: "dark", annotated: true, watermark: "WO-2944 · SC-88420 · GPS" },
  { id: "phs-2", workOrderId: "mwo-3", kind: "after", title: "Канаты после проверки", capturedAt: "2026-05-12T08:38:00.000Z", localUri: "indexeddb://photos/phs-2", validation: "valid", annotated: false, watermark: "WO-2939 · ЩЛЗ-332918 · GPS" },
  { id: "phs-3", workOrderId: "mwo-1", kind: "node", title: "Маркировка контроллера", capturedAt: "2026-05-12T08:54:00.000Z", localUri: "indexeddb://photos/phs-3", validation: "pending_ai", annotated: false, watermark: "WO-2944 · node" },
];

export const ROUTE_STOPS: MechanicRouteStop[] = [
  { id: "route-1", workOrderId: "mwo-1", address: "БЦ Север, пр. Обуховской Обороны, 70", etaMinutes: 11, traffic: "heavy", distanceKm: 3.8, current: true },
  { id: "route-2", workOrderId: "mwo-2", address: "Москва, ул. Кирова, 18к2", etaMinutes: 28, traffic: "normal", distanceKm: 8.4, current: false },
  { id: "route-3", workOrderId: "mwo-3", address: "Городская больница №7, корпус 3", etaMinutes: 42, traffic: "normal", distanceKm: 13.7, current: false },
];

export const EMERGENCY_CALLS: EmergencyCall[] = [
  { id: "em-1", workOrderId: "mwo-1", title: "Пассажир внутри", address: "БЦ Север, 12 этаж", receivedAt: "2026-05-12T08:42:10.000Z", vibrationPattern: "200-100-200-100-600", accepted: true, etaMinutes: 11 },
];

export const MATERIAL_USAGE: MaterialUsage[] = [
  { id: "mat-1", workOrderId: "mwo-1", sku: "DR-44", name: "Ролик дверной", quantity: 2, unit: "шт", localStock: 4, reserved: true, qr: "MAT:DR-44" },
  { id: "mat-2", workOrderId: "mwo-1", sku: "LUBE-02", name: "Смазка направляющих", quantity: 1, unit: "туба", localStock: 2, reserved: false, qr: "MAT:LUBE-02" },
  { id: "mat-3", workOrderId: "mwo-2", sku: "FILTER-10", name: "Фильтр шкафа управления", quantity: 1, unit: "шт", localStock: 0, reserved: true, qr: "MAT:FILTER-10" },
];

export const SIGNATURES: Signature[] = [
  { id: "sig-1", workOrderId: "mwo-1", signer: "Олег Миронов", localVectorPath: "indexeddb://signatures/sig-1", validation: "missing" },
  { id: "sig-2", workOrderId: "mwo-3", signer: "Сергей Беляев", signedAt: "2026-05-12T08:44:00.000Z", localVectorPath: "indexeddb://signatures/sig-2", validation: "offline_pending" },
];

export const SYNC_EVENTS: SyncEvent[] = [
  { id: "sync-1", title: "Фото WO-2939", entity: "photo", status: "uploading", lastAttemptAt: "2026-05-12T08:58:00.000Z", message: "Background Sync uploading compressed WebP" },
  { id: "sync-2", title: "Подпись клиента", entity: "signature", status: "queued", lastAttemptAt: "2026-05-12T08:55:00.000Z", nextRetryAt: "2026-05-12T09:05:00.000Z", message: "Waiting for stable network" },
  { id: "sync-3", title: "Фото темное", entity: "photo", status: "failed", lastAttemptAt: "2026-05-12T08:51:00.000Z", nextRetryAt: "2026-05-12T09:01:00.000Z", message: "AI validation: dark photo, retake requested" },
];

export const OFFLINE_CACHE_POLICY: OfflineCachePolicy = {
  indexedDbName: "neolift-mechanic-offline-v1",
  stores: ["workOrders", "elevatorCards", "photos", "signatures", "materialUsage", "documents", "syncQueue", "routeCache"],
  encryption: "device_bound_key",
  ttlHours: 24,
  staleDataStrategy: "show stale badge, lock conflicting fields, allow emergency report draft",
  conflictResolution: "server-wins for assignments, mechanic-draft merge for work results, manual review for materials",
};

export const ELEVATOR_MOBILE_CARD: ElevatorMobileCard = {
  id: "elv-88420",
  factoryNumber: "SC-88420",
  registrationNumber: "78-ЛФ-008420",
  model: "Schindler 3300",
  controller: "Kone LCECPU / GSM telemetry",
  address: "БЦ Север, пр. Обуховской Обороны, 70",
  status: "emergency",
  healthScore: 41,
  lastRepairs: ["2026-05-09: регулировка дверей", "2026-04-28: замена ролика", "2026-04-02: проверка контроллера"],
  nodes: [
    { name: "Двери", health: 39, lastIssue: "повторное неоткрытие" },
    { name: "Контроллер", health: 64, lastIssue: "ошибка LCE-14" },
    { name: "Канаты", health: 82 },
  ],
  documents: [
    { title: "Электрическая схема", type: "scheme", offlineReady: true },
    { title: "Паспорт лифта", type: "passport", offlineReady: true },
    { title: "Инструкция контроллера", type: "manual", offlineReady: false },
    { title: "Акт последнего ремонта", type: "act", offlineReady: true },
  ],
};
