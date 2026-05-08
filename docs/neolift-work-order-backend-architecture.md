# НеоЛифт ERP/PWA — backend architecture и data flow экрана «Создание заказ-наряда»

## 0. Назначение документа

Документ описывает production-ready backend архитектуру для ключевого процесса ERP/PWA системы «НеоЛифт»: создание, заполнение, отправка, проверка и закрытие заказ-наряда механиком и диспетчером.

Это не mock backend, не demo API и не tutorial architecture. Целевая система — enterprise field service backend для реальной лифтовой сервисной компании, сопоставимый по классу задач с промышленными FSM/ERP платформами.

Технологический стек:

- NestJS как модульный backend framework;
- PostgreSQL как основная транзакционная БД;
- Prisma ORM для схемы, миграций и typed data access;
- Redis для кеширования, rate limit, distributed locks, sync cursors и очередей;
- Queue system на BullMQ или совместимом Redis-backed решении;
- S3-compatible storage для фото, подписей, thumbnails, PDF и архивов;
- JWT auth с refresh token rotation;
- RBAC/ABAC для контроля доступа;
- WebSockets для live status, sync events и диспетчерских обновлений;
- background workers для AI validation, image processing, PDF и CRM export.

---

## 1. System context

### 1.1 Основной backend процесс

1. Механик создает локальный или серверный черновик заказ-наряда.
2. Механик добавляет выполненные работы.
3. Механик добавляет материалы и инициирует резервирование.
4. Механик загружает обязательные фото через signed URLs.
5. Система обрабатывает фото, создает thumbnails и запускает AI validation.
6. Механик добавляет электронную подпись заказчика.
7. Механик сохраняет черновик или отправляет заказ-наряд.
8. Backend проверяет полноту данных и переводит заказ-наряд на проверку.
9. Диспетчер проверяет заказ-наряд, фото, материалы, подпись и AI warnings.
10. При подтверждении происходит финальное списание материалов.
11. Генерируется PDF заказ-наряда и фотоотчет.
12. Данные экспортируются в CRM/учетную систему.
13. Все действия фиксируются в audit log и status history.

### 1.2 Backend boundaries

Backend делится на 4 контура:

1. **Transactional API**
   - REST endpoints;
   - JWT auth;
   - бизнес-валидация;
   - работа с PostgreSQL через Prisma;
   - выдача signed URLs;
   - публикация events.

2. **Realtime gateway**
   - WebSocket gateway;
   - live updates для статусов заказ-нарядов;
   - progress загрузки/AI/PDF;
   - dispatcher queue updates;
   - mechanic sync notifications.

3. **Background workers**
   - image processing;
   - AI validation;
   - PDF generation;
   - warehouse write-off finalization;
   - CRM export;
   - notification delivery;
   - cleanup temporary files.

4. **Integration layer**
   - CRM connector;
   - S3 adapter;
   - AI provider adapter;
   - PDF renderer;
   - notification providers;
   - external accounting/warehouse system connector, если появится.

---

# 2. Backend modules

## 2.1 Auth module

### Responsibility

- аутентификация пользователей;
- JWT access token;
- refresh token rotation;
- session/device management;
- RBAC claims;
- защита offline refresh сценариев;
- rate limit на login и refresh.

### Services

- `AuthService` — login, refresh, logout, revoke sessions;
- `TokenService` — выпуск и проверка JWT;
- `PasswordService` — hashing и password policy;
- `SessionService` — device sessions и refresh token rotation;
- `PermissionService` — role/permission claims.

### Repositories

- `UsersRepository`;
- `SessionsRepository`;
- `RefreshTokensRepository`;
- `AuditRepository`.

### DTO

- `LoginDto`;
- `RefreshTokenDto`;
- `LogoutDto`;
- `CurrentUserDto`;
- `DeviceFingerprintDto`.

### Validation

- login required;
- password length and policy;
- user status must be active;
- refresh token must not be reused;
- device session must not be revoked;
- account lockout после серии неуспешных попыток.

## 2.2 WorkOrder module

### Responsibility

- жизненный цикл заказ-наряда;
- создание и обновление черновиков;
- добавление/редактирование работ;
- submit на проверку;
- approve/reject flow;
- status state machine;
- business validation перед переходом статуса;
- idempotency для offline sync.

### Services

- `WorkOrderService` — commands: create, update, submit, approve, reject, close;
- `WorkItemService` — строки выполненных работ;
- `WorkOrderValidationService` — серверная проверка полноты;
- `WorkOrderStateMachine` — разрешенные переходы статусов;
- `WorkOrderSyncService` — обработка offline operations;
- `WorkOrderQueryService` — read models для mobile/dispatcher;
- `WorkOrderNumberService` — генерация номеров.

### Repositories

- `WorkOrdersRepository`;
- `WorkItemsRepository`;
- `WorkOrderStatusHistoryRepository`;
- `IdempotencyKeysRepository`;
- `AuditRepository`.

### DTO

- `CreateWorkOrderDraftDto`;
- `UpdateWorkOrderDraftDto`;
- `UpsertWorkItemDto`;
- `DeleteWorkItemDto`;
- `SubmitWorkOrderDto`;
- `ApproveWorkOrderDto`;
- `RejectWorkOrderDto`;
- `OfflineSyncBatchDto`.

### Validation

- mechanic can create only for assigned building/elevator;
- work order must belong to mechanic for mobile update;
- only editable statuses can be changed by mechanic;
- submit requires work items, photos, signature and validation pass;
- approve/reject requires dispatcher role;
- transitions must match state machine;
- idempotency key required for mutating mobile requests.

## 2.3 Photo module

### Responsibility

- signed URL generation;
- temporary upload registration;
- final photo metadata persistence;
- photo type enforcement;
- thumbnail generation dispatch;
- photo deletion policy;
- secure preview URL generation.

### Services

- `PhotoService` — create upload intent, attach photo, delete photo;
- `StorageService` — S3 adapter;
- `ImageProcessingService` — compression validation, thumbnails, metadata;
- `PhotoAccessService` — signed download URLs;
- `PhotoPolicyService` — required categories and delete rules.

### Repositories

- `PhotosRepository`;
- `PhotoUploadIntentsRepository`;
- `WorkOrdersRepository`;
- `AuditRepository`.

### DTO

- `CreatePhotoUploadIntentDto`;
- `AttachPhotoDto`;
- `DeletePhotoDto`;
- `GetPhotoPreviewDto`;
- `PhotoMetadataDto`.

### Validation

- photo type must be one of required categories;
- file MIME allowed: jpeg, png, heic if supported;
- max size before/after compression;
- checksum required;
- upload intent expires;
- cannot delete confirmed photo after approval without admin override.

## 2.4 Materials module

### Responsibility

- справочник материалов;
- поиск по SKU/name/type;
- строки использования материалов в заказ-наряде;
- валидация quantity;
- связь работ и рекомендуемых материалов;
- suspicious material usage checks.

### Services

- `MaterialsCatalogService`;
- `MaterialUsageService`;
- `MaterialSearchService`;
- `MaterialRecommendationService`;
- `MaterialUsageValidationService`.

### Repositories

- `MaterialsRepository`;
- `MaterialUsageRepository`;
- `WarehouseStocksRepository`;
- `WorkOrdersRepository`.

### DTO

- `SearchMaterialsDto`;
- `AddMaterialUsageDto`;
- `UpdateMaterialUsageDto`;
- `DeleteMaterialUsageDto`;
- `ValidateMaterialUsageDto`.

### Validation

- material must be active;
- quantity must be positive;
- unit must match catalog unit;
- material usage can be edited only before approval;
- suspicious high quantity creates warning, not always blocking.

## 2.5 Warehouse module

### Responsibility

- складские остатки;
- резервирование материалов;
- финальное списание после approval;
- rollback резерва при reject/return;
- warehouse movements ledger;
- distributed locks на stock updates.

### Services

- `WarehouseService`;
- `StockReservationService`;
- `StockWriteOffService`;
- `WarehouseMovementService`;
- `InventoryValidationService`;
- `WarehouseLockService`.

### Repositories

- `WarehousesRepository`;
- `WarehouseStocksRepository`;
- `WarehouseReservationsRepository`;
- `WarehouseMovementsRepository`;
- `MaterialUsageRepository`.

### DTO

- `ReserveMaterialsDto`;
- `ReleaseReservationDto`;
- `WriteOffMaterialsDto`;
- `ValidateInventoryDto`;
- `WarehouseMovementDto`.

### Validation

- stock must be available or policy allows negative reserve;
- write-off only once per approved work order;
- movement ledger must be append-only;
- concurrent write-off protected by DB transaction and Redis lock;
- reservation expires or releases on returned/cancelled work order.

## 2.6 Notification module

### Responsibility

- уведомления механикам, диспетчерам и руководителям;
- WebSocket push;
- persistent notification inbox;
- offline delivery status;
- notification templates.

### Services

- `NotificationService`;
- `NotificationGateway`;
- `NotificationTemplateService`;
- `NotificationDeliveryService`.

### Repositories

- `NotificationsRepository`;
- `UsersRepository`;
- `WorkOrdersRepository`.

### DTO

- `CreateNotificationDto`;
- `MarkNotificationReadDto`;
- `ListNotificationsDto`.

### Validation

- recipient must exist;
- notification scope must match role;
- sensitive data not sent in push payload;
- WebSocket channel protected by JWT.

## 2.7 AI Validation module

### Responsibility

- фото quality checks;
- OCR заказ-наряда;
- signature detection;
- object/photo category validation;
- completeness checks;
- risk scoring;
- persistence of validation results;
- blocking/warning policy.

### Services

- `AiValidationService`;
- `ImageQualityService`;
- `OcrService`;
- `SignatureDetectionService`;
- `ObjectValidationService`;
- `BusinessValidationService`;
- `ValidationResultService`.

### Repositories

- `AiValidationResultsRepository`;
- `PhotosRepository`;
- `WorkOrdersRepository`;
- `MaterialUsageRepository`;
- `SignaturesRepository`.

### DTO

- `RunAiValidationDto`;
- `PhotoValidationResultDto`;
- `WorkOrderValidationResultDto`;
- `ManualOverrideValidationDto`.

### Validation

- AI job must reference existing photo/work order;
- stale AI result invalidated after data change;
- blocking errors prevent submit unless policy allows dispatcher-only override;
- manual override requires dispatcher/manager permission and audit reason.

## 2.8 PDF module

### Responsibility

- генерация PDF заказ-наряда;
- генерация фотоотчета;
- подпись и материалы в PDF;
- хранение PDF в S3;
- versioning PDF;
- regeneration after correction.

### Services

- `PdfGenerationService`;
- `PdfTemplateService`;
- `PhotoReportPdfService`;
- `PdfStorageService`;
- `PdfVersionService`.

### Repositories

- `PdfDocumentsRepository`;
- `WorkOrdersRepository`;
- `PhotosRepository`;
- `SignaturesRepository`.

### DTO

- `GenerateWorkOrderPdfDto`;
- `GetPdfDto`;
- `RegeneratePdfDto`.

### Validation

- PDF generation only after approval or manager override;
- generated PDF version immutable;
- signed URLs for PDF download;
- PDF includes status and version metadata.

## 2.9 Audit module

### Responsibility

- immutable audit log;
- actor, action, entity, before/after snapshot;
- security events;
- state transition log;
- exportable compliance trail.

### Services

- `AuditService`;
- `AuditQueryService`;
- `SecurityAuditService`.

### Repositories

- `AuditLogsRepository`;
- `WorkOrderStatusHistoryRepository`.

### DTO

- `CreateAuditLogDto`;
- `AuditQueryDto`;
- `EntityAuditTrailDto`.

### Validation

- audit writes are append-only;
- sensitive fields redacted;
- admin access required for full audit trail;
- retention policy enforced.

---

# 3. Database schema

## 3.1 Общие правила схемы

Все бизнес-таблицы используют:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`;
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`;
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`;
- `deleted_at TIMESTAMPTZ NULL` для soft delete, где сущность может быть архивирована;
- `created_by_user_id UUID NULL`;
- `updated_by_user_id UUID NULL`;
- optimistic locking через `version INT NOT NULL DEFAULT 1` для конфликтов offline sync;
- внешние ключи с явным `ON DELETE RESTRICT` для транзакционных сущностей;
- partial indexes `WHERE deleted_at IS NULL` для активных записей.

## 3.2 Users

### Fields

- `id UUID PK`;
- `email CITEXT UNIQUE NULL`;
- `phone VARCHAR(32) UNIQUE NULL`;
- `password_hash TEXT NOT NULL`;
- `full_name VARCHAR(255) NOT NULL`;
- `role user_role NOT NULL`;
- `status user_status NOT NULL DEFAULT 'active'`;
- `last_login_at TIMESTAMPTZ NULL`;
- `created_at TIMESTAMPTZ NOT NULL`;
- `updated_at TIMESTAMPTZ NOT NULL`;
- `deleted_at TIMESTAMPTZ NULL`;
- `version INT NOT NULL DEFAULT 1`.

### Indexes

- unique index on `email WHERE deleted_at IS NULL`;
- unique index on `phone WHERE deleted_at IS NULL`;
- index on `(role, status)`;
- index on `deleted_at`.

### Relations

- `Users 1:1 Mechanics`;
- `Users 1:N WorkOrders` as dispatcher/reviewer;
- `Users 1:N AuditLogs` as actor;
- `Users 1:N Notifications`.

### Soft delete / audit

- soft delete allowed only if no active work orders;
- all role/status changes audited.

## 3.3 Mechanics

### Fields

- `id UUID PK`;
- `user_id UUID NOT NULL UNIQUE REFERENCES users(id)`;
- `employee_number VARCHAR(64) NOT NULL UNIQUE`;
- `brigade_id UUID NULL`;
- `default_warehouse_id UUID NULL`;
- `qualification_level VARCHAR(64) NULL`;
- `active_shift_status mechanic_shift_status NOT NULL DEFAULT 'off_shift'`;
- `created_at TIMESTAMPTZ NOT NULL`;
- `updated_at TIMESTAMPTZ NOT NULL`;
- `deleted_at TIMESTAMPTZ NULL`;
- `version INT NOT NULL DEFAULT 1`.

### Indexes

- unique index on `employee_number WHERE deleted_at IS NULL`;
- index on `user_id`;
- index on `default_warehouse_id`;
- index on `(active_shift_status)`.

### Relations

- `Mechanics N:1 Users`;
- `Mechanics 1:N WorkOrders`;
- `Mechanics N:M Buildings` through `mechanic_building_assignments`;
- `Mechanics 1:N Warehouses` if personal warehouse model is used.

### Soft delete / audit

- mechanic archived instead of deleted;
- assignment changes audited.

## 3.4 Buildings

### Fields

- `id UUID PK`;
- `customer_id UUID NOT NULL`;
- `address TEXT NOT NULL`;
- `normalized_address TEXT NULL`;
- `entrance VARCHAR(64) NULL`;
- `geo_lat NUMERIC(9,6) NULL`;
- `geo_lng NUMERIC(9,6) NULL`;
- `access_notes TEXT NULL`;
- `responsible_person VARCHAR(255) NULL`;
- `responsible_phone VARCHAR(32) NULL`;
- `status building_status NOT NULL DEFAULT 'active'`;
- `created_at TIMESTAMPTZ NOT NULL`;
- `updated_at TIMESTAMPTZ NOT NULL`;
- `deleted_at TIMESTAMPTZ NULL`;
- `version INT NOT NULL DEFAULT 1`.

### Indexes

- index on `customer_id`;
- GIN/trigram index on `normalized_address` for search;
- index on `(status, deleted_at)`;
- geo index if PostGIS is enabled.

### Relations

- `Buildings 1:N Elevators`;
- `Buildings 1:N WorkOrders`;
- `Buildings N:M Mechanics` assignments.

### Soft delete / audit

- soft delete only when no active elevators/work orders;
- address changes audited because they affect legal documents/PDF.

## 3.5 Elevators

### Fields

- `id UUID PK`;
- `building_id UUID NOT NULL REFERENCES buildings(id)`;
- `inventory_number VARCHAR(128) NOT NULL`;
- `factory_number VARCHAR(128) NULL`;
- `elevator_type VARCHAR(128) NOT NULL`;
- `manufacturer VARCHAR(128) NULL`;
- `model VARCHAR(128) NULL`;
- `capacity_kg INT NULL`;
- `floors_count INT NULL`;
- `commissioned_at DATE NULL`;
- `status elevator_status NOT NULL DEFAULT 'active'`;
- `created_at TIMESTAMPTZ NOT NULL`;
- `updated_at TIMESTAMPTZ NOT NULL`;
- `deleted_at TIMESTAMPTZ NULL`;
- `version INT NOT NULL DEFAULT 1`.

### Indexes

- unique index on `(building_id, inventory_number) WHERE deleted_at IS NULL`;
- index on `building_id`;
- index on `(status)`;
- index on `factory_number`.

### Relations

- `Elevators N:1 Buildings`;
- `Elevators 1:N WorkOrders`.

### Soft delete / audit

- archived elevators remain linked to historical work orders;
- technical identity fields audited.

## 3.6 WorkOrders

### Fields

- `id UUID PK`;
- `number VARCHAR(64) UNIQUE NULL` — assigned on server creation or submit;
- `offline_client_id VARCHAR(128) NULL` — stable client-side id for offline drafts;
- `idempotency_key VARCHAR(128) NULL`;
- `customer_id UUID NOT NULL`;
- `building_id UUID NOT NULL REFERENCES buildings(id)`;
- `elevator_id UUID NOT NULL REFERENCES elevators(id)`;
- `mechanic_id UUID NOT NULL REFERENCES mechanics(id)`;
- `dispatcher_id UUID NULL REFERENCES users(id)`;
- `type work_order_type NOT NULL`;
- `priority work_order_priority NOT NULL DEFAULT 'normal'`;
- `status work_order_status NOT NULL DEFAULT 'draft'`;
- `work_started_at TIMESTAMPTZ NULL`;
- `work_finished_at TIMESTAMPTZ NULL`;
- `submitted_at TIMESTAMPTZ NULL`;
- `reviewed_at TIMESTAMPTZ NULL`;
- `approved_at TIMESTAMPTZ NULL`;
- `closed_at TIMESTAMPTZ NULL`;
- `return_reason TEXT NULL`;
- `ai_validation_status validation_status NOT NULL DEFAULT 'not_started'`;
- `sync_source sync_source NOT NULL DEFAULT 'online'`;
- `created_at TIMESTAMPTZ NOT NULL`;
- `updated_at TIMESTAMPTZ NOT NULL`;
- `deleted_at TIMESTAMPTZ NULL`;
- `created_by_user_id UUID NULL`;
- `updated_by_user_id UUID NULL`;
- `version INT NOT NULL DEFAULT 1`.

### Indexes

- unique index on `number WHERE number IS NOT NULL`;
- unique index on `(mechanic_id, offline_client_id) WHERE offline_client_id IS NOT NULL`;
- index on `(mechanic_id, status, updated_at DESC)`;
- index on `(building_id, elevator_id, created_at DESC)`;
- index on `(status, priority, submitted_at)` for dispatcher queue;
- index on `ai_validation_status`;
- index on `deleted_at`.

### Relations

- `WorkOrders 1:N WorkItems`;
- `WorkOrders 1:N MaterialUsage`;
- `WorkOrders 1:N Photos`;
- `WorkOrders 1:1 Signatures`;
- `WorkOrders 1:N WorkOrderStatusHistory`;
- `WorkOrders 1:N PdfDocuments`;
- `WorkOrders 1:N AuditLogs`.

### Soft delete / audit

- soft delete only for drafts by admin policy;
- submitted/approved/closed records are never hard-deleted;
- every status change writes status history and audit log.

## 3.7 WorkItems

### Fields

- `id UUID PK`;
- `work_order_id UUID NOT NULL REFERENCES work_orders(id)`;
- `action VARCHAR(128) NOT NULL`;
- `element VARCHAR(255) NOT NULL`;
- `quantity NUMERIC(12,3) NOT NULL`;
- `unit VARCHAR(32) NOT NULL DEFAULT 'шт'`;
- `template_id UUID NULL`;
- `comment TEXT NULL`;
- `sort_order INT NOT NULL DEFAULT 0`;
- `created_at TIMESTAMPTZ NOT NULL`;
- `updated_at TIMESTAMPTZ NOT NULL`;
- `deleted_at TIMESTAMPTZ NULL`;
- `created_by_user_id UUID NULL`;
- `updated_by_user_id UUID NULL`;
- `version INT NOT NULL DEFAULT 1`.

### Indexes

- index on `work_order_id WHERE deleted_at IS NULL`;
- index on `(template_id)`;
- check constraint `quantity > 0`.

### Relations

- `WorkItems N:1 WorkOrders`;
- optional `WorkItems N:1 WorkTemplates`.

### Soft delete / audit

- soft delete for removed rows before approval;
- changes after submit require correction history.

## 3.8 Materials

### Fields

- `id UUID PK`;
- `sku VARCHAR(128) NOT NULL UNIQUE`;
- `name VARCHAR(255) NOT NULL`;
- `type VARCHAR(128) NOT NULL`;
- `unit VARCHAR(32) NOT NULL`;
- `description TEXT NULL`;
- `is_active BOOLEAN NOT NULL DEFAULT true`;
- `created_at TIMESTAMPTZ NOT NULL`;
- `updated_at TIMESTAMPTZ NOT NULL`;
- `deleted_at TIMESTAMPTZ NULL`;
- `version INT NOT NULL DEFAULT 1`.

### Indexes

- unique index on `sku WHERE deleted_at IS NULL`;
- GIN/trigram index on `name`;
- index on `(type, is_active)`;
- index on `deleted_at`.

### Relations

- `Materials 1:N MaterialUsage`;
- `Materials 1:N WarehouseStocks`;
- `Materials 1:N WarehouseMovements`.

### Soft delete / audit

- soft delete/archive if material no longer used;
- SKU/name/unit changes audited.

## 3.9 MaterialUsage

### Fields

- `id UUID PK`;
- `work_order_id UUID NOT NULL REFERENCES work_orders(id)`;
- `material_id UUID NOT NULL REFERENCES materials(id)`;
- `warehouse_id UUID NOT NULL`;
- `quantity NUMERIC(12,3) NOT NULL`;
- `reserved_quantity NUMERIC(12,3) NOT NULL DEFAULT 0`;
- `written_off_quantity NUMERIC(12,3) NOT NULL DEFAULT 0`;
- `status material_usage_status NOT NULL DEFAULT 'draft'`;
- `reservation_id UUID NULL`;
- `comment TEXT NULL`;
- `created_at TIMESTAMPTZ NOT NULL`;
- `updated_at TIMESTAMPTZ NOT NULL`;
- `deleted_at TIMESTAMPTZ NULL`;
- `created_by_user_id UUID NULL`;
- `updated_by_user_id UUID NULL`;
- `version INT NOT NULL DEFAULT 1`.

### Indexes

- index on `work_order_id WHERE deleted_at IS NULL`;
- index on `(material_id, warehouse_id)`;
- index on `(status)`;
- check constraint `quantity > 0`;
- check constraint `reserved_quantity >= 0`;
- check constraint `written_off_quantity >= 0`.

### Relations

- `MaterialUsage N:1 WorkOrders`;
- `MaterialUsage N:1 Materials`;
- `MaterialUsage N:1 Warehouses`;
- `MaterialUsage N:1 WarehouseReservations`.

### Soft delete / audit

- soft delete before approval;
- after write-off only correction movement is allowed, not deletion.

## 3.10 Photos

### Fields

- `id UUID PK`;
- `work_order_id UUID NOT NULL REFERENCES work_orders(id)`;
- `type photo_type NOT NULL`;
- `status photo_status NOT NULL DEFAULT 'upload_intent_created'`;
- `storage_bucket VARCHAR(128) NOT NULL`;
- `storage_key TEXT NOT NULL`;
- `thumbnail_key TEXT NULL`;
- `preview_key TEXT NULL`;
- `mime_type VARCHAR(128) NOT NULL`;
- `file_size_bytes BIGINT NOT NULL`;
- `width INT NULL`;
- `height INT NULL`;
- `checksum_sha256 VARCHAR(128) NOT NULL`;
- `captured_at TIMESTAMPTZ NULL`;
- `uploaded_at TIMESTAMPTZ NULL`;
- `uploaded_by_user_id UUID NOT NULL REFERENCES users(id)`;
- `ai_quality_score NUMERIC(5,2) NULL`;
- `ai_readability_score NUMERIC(5,2) NULL`;
- `ai_signature_detected BOOLEAN NULL`;
- `ai_validation_status validation_status NOT NULL DEFAULT 'not_started'`;
- `validation_errors JSONB NOT NULL DEFAULT '[]'`;
- `created_at TIMESTAMPTZ NOT NULL`;
- `updated_at TIMESTAMPTZ NOT NULL`;
- `deleted_at TIMESTAMPTZ NULL`;
- `version INT NOT NULL DEFAULT 1`.

### Indexes

- unique index on `(work_order_id, type) WHERE deleted_at IS NULL AND status <> 'deleted'` if one active photo per category;
- index on `(work_order_id, type)`;
- index on `(ai_validation_status)`;
- index on `checksum_sha256`;
- index on `uploaded_at DESC`.

### Relations

- `Photos N:1 WorkOrders`;
- `Photos N:1 Users`;
- `Photos 1:N AiValidationResults`.

### Soft delete / audit

- deleting photo sets `deleted_at` and `status='deleted'`;
- storage object retained by retention policy unless draft cleanup;
- every delete audited.

## 3.11 Signatures

### Fields

- `id UUID PK`;
- `work_order_id UUID NOT NULL UNIQUE REFERENCES work_orders(id)`;
- `signer_name VARCHAR(255) NOT NULL`;
- `signer_position VARCHAR(255) NULL`;
- `storage_bucket VARCHAR(128) NOT NULL`;
- `storage_key TEXT NOT NULL`;
- `mime_type VARCHAR(64) NOT NULL DEFAULT 'image/png'`;
- `checksum_sha256 VARCHAR(128) NOT NULL`;
- `signed_at TIMESTAMPTZ NOT NULL`;
- `geo_lat NUMERIC(9,6) NULL`;
- `geo_lng NUMERIC(9,6) NULL`;
- `device_info JSONB NULL`;
- `created_at TIMESTAMPTZ NOT NULL`;
- `updated_at TIMESTAMPTZ NOT NULL`;
- `deleted_at TIMESTAMPTZ NULL`;
- `created_by_user_id UUID NULL`;
- `version INT NOT NULL DEFAULT 1`.

### Indexes

- unique index on `work_order_id WHERE deleted_at IS NULL`;
- index on `signed_at`;
- index on `checksum_sha256`.

### Relations

- `Signatures 1:1 WorkOrders`.

### Soft delete / audit

- signature can be replaced only before submit or after return;
- approved signature immutable;
- replacement audited.

## 3.12 WorkOrderStatusHistory

### Fields

- `id UUID PK`;
- `work_order_id UUID NOT NULL REFERENCES work_orders(id)`;
- `from_status work_order_status NULL`;
- `to_status work_order_status NOT NULL`;
- `reason TEXT NULL`;
- `actor_user_id UUID NULL REFERENCES users(id)`;
- `actor_role user_role NULL`;
- `metadata JSONB NOT NULL DEFAULT '{}'`;
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

### Indexes

- index on `(work_order_id, created_at DESC)`;
- index on `(to_status, created_at DESC)`;
- index on `actor_user_id`.

### Relations

- `WorkOrderStatusHistory N:1 WorkOrders`;
- `WorkOrderStatusHistory N:1 Users`.

### Soft delete / audit

- no soft delete;
- append-only table.

---

# 4. API structure

## 4.1 API conventions

- Base path: `/api/v1`;
- All mutating requests require `Idempotency-Key` header;
- Mobile offline requests additionally include `X-Client-Operation-Id` and `offlineClientId`;
- Response includes `entityVersion` for conflict detection;
- Pagination uses cursor-based pagination for queues;
- Errors use consistent envelope with `code`, `message`, `details`, `correlationId`;
- All endpoints protected by JWT unless explicitly public auth endpoint.

## 4.2 Work Orders endpoints

### Create draft

`POST /api/v1/mobile/work-orders`

Purpose: создать серверный черновик или materialize offline draft.

Body:

- `offlineClientId`;
- `buildingId`;
- `elevatorId`;
- `type`;
- `priority`;
- `workStartedAt`.

Behavior:

- validates mechanic assignment;
- creates work order in `draft`;
- writes `work_order_created` event;
- returns full draft and server id.

### Update draft

`PATCH /api/v1/mobile/work-orders/:id`

Purpose: обновить metadata черновика.

Body:

- `workStartedAt`;
- `workFinishedAt`;
- `priority`;
- `comment`;
- `version`.

Behavior:

- optimistic lock by `version`;
- allowed only in `draft` or `returned`;
- writes audit log.

### Upsert work item

`PUT /api/v1/mobile/work-orders/:id/work-items/:clientItemId`

Body:

- `action`;
- `element`;
- `quantity`;
- `unit`;
- `templateId`;
- `sortOrder`.

Behavior:

- idempotent upsert;
- validates quantity;
- marks validation status stale.

### Delete work item

`DELETE /api/v1/mobile/work-orders/:id/work-items/:workItemId`

Behavior:

- soft delete;
- allowed in editable statuses;
- idempotent delete.

### Submit

`POST /api/v1/mobile/work-orders/:id/submit`

Body:

- `version`;
- `clientSubmittedAt`;
- `forceQueueIfOfflineSynced` boolean.

Behavior:

- transactionally validates required data;
- checks AI blocking issues;
- checks signature;
- checks photos;
- moves `draft/returned` to `submitted` or `in_review` depending state model;
- publishes `work_order_submitted`;
- notifies dispatcher.

### Approve

`POST /api/v1/dispatcher/work-orders/:id/approve`

Body:

- `comment`;
- `version`;
- optional `manualOverrides`.

Behavior:

- requires dispatcher permission;
- validates status `in_review`;
- creates stock write-off job;
- transitions to `approved` after write-off transaction succeeds;
- enqueues PDF generation;
- enqueues CRM export;
- publishes `work_order_approved`.

### Reject / return

`POST /api/v1/dispatcher/work-orders/:id/reject`

Body:

- `reasonCode`;
- `comment`;
- `problemSections`;
- `requiredActions`.

Behavior:

- requires dispatcher permission;
- transitions to `returned`;
- releases or preserves reservations by policy;
- notifies mechanic;
- writes status history.

### Generate PDF

`POST /api/v1/dispatcher/work-orders/:id/pdf`

Behavior:

- allowed for approved/closed records;
- enqueues PDF job;
- returns `jobId` and current PDF status.

### Get work order detail

`GET /api/v1/work-orders/:id`

Behavior:

- mechanic sees only own allowed work orders;
- dispatcher/manager sees based on permissions;
- returns signed preview URLs only if requested and allowed.

## 4.3 Materials endpoints

### Search materials

`GET /api/v1/materials/search?q=&type=&warehouseId=&limit=`

Behavior:

- returns active materials;
- includes stock snapshot for selected warehouse;
- cached in Redis for common queries.

### Add material usage

`PUT /api/v1/mobile/work-orders/:id/materials/:clientUsageId`

Body:

- `materialId`;
- `warehouseId`;
- `quantity`;
- `comment`.

Behavior:

- idempotent upsert;
- validates material active;
- returns inventory warning if stock insufficient.

### Reserve materials

`POST /api/v1/work-orders/:id/materials/reserve`

Behavior:

- usually called internally on submit or when policy requires reservation;
- uses DB transaction + Redis lock per `(warehouseId, materialId)`;
- publishes `materials_reserved`.

### Write-off materials

`POST /api/v1/work-orders/:id/materials/write-off`

Behavior:

- internal/admin endpoint;
- invoked after approval;
- append-only warehouse movement;
- idempotent by work order id.

### Inventory validation

`POST /api/v1/work-orders/:id/materials/validate`

Behavior:

- returns blocking/warning list;
- stale stock warning for offline submissions.

## 4.4 Photos endpoints

### Create upload intent

`POST /api/v1/mobile/work-orders/:id/photos/upload-intent`

Body:

- `type`;
- `mimeType`;
- `fileSizeBytes`;
- `checksumSha256`;
- `capturedAt`.

Behavior:

- validates photo type and editable status;
- creates temporary S3 key;
- returns signed upload URL, headers and expiration;
- stores upload intent.

### Attach uploaded photo

`POST /api/v1/mobile/work-orders/:id/photos`

Body:

- `uploadIntentId`;
- `storageKey`;
- `checksumSha256`;
- `width`;
- `height`;
- `clientCompressed` boolean.

Behavior:

- verifies upload intent;
- HEAD object in S3;
- persists `Photos` row;
- enqueues image processing and AI validation;
- publishes `photo_uploaded`.

### Delete photo

`DELETE /api/v1/mobile/work-orders/:id/photos/:photoId`

Behavior:

- soft delete;
- allowed in editable statuses;
- invalidates validation results.

### Preview photo

`GET /api/v1/work-orders/:id/photos/:photoId/preview-url`

Behavior:

- access control;
- returns short-lived signed URL for thumbnail or original.

### Run AI validation

`POST /api/v1/work-orders/:id/photos/:photoId/validate`

Behavior:

- enqueues validation job;
- returns job id.

## 4.5 Signature endpoints

### Create signature upload intent

`POST /api/v1/mobile/work-orders/:id/signature/upload-intent`

### Attach signature

`POST /api/v1/mobile/work-orders/:id/signature`

Body:

- `signerName`;
- `signerPosition`;
- `storageKey`;
- `checksumSha256`;
- `signedAt`;
- `geoLat`;
- `geoLng`;
- `deviceInfo`.

Behavior:

- creates/replaces signature in editable statuses;
- invalidates validation;
- writes audit.

---

# 5. Data flow

## 5.1 Online draft creation flow

1. Client sends `POST /mobile/work-orders` with `offlineClientId` and `Idempotency-Key`.
2. API validates JWT and mechanic assignment.
3. API creates `WorkOrders` draft in PostgreSQL.
4. API writes `WorkOrderStatusHistory(draft)`.
5. API writes audit log.
6. API publishes `work_order_created` event.
7. API returns server work order id and version.
8. WebSocket emits update to mechanic session.

## 5.2 Work items and materials flow

1. Client upserts work items and material usage using stable client item ids.
2. API validates editable status and optimistic `version`.
3. API writes rows in transaction.
4. API marks `ai_validation_status='stale'` or business validation stale.
5. API publishes lightweight `work_order_changed` event.
6. Autosave response returns new version.

## 5.3 Photo upload flow

1. Client compresses image locally if possible and calculates checksum.
2. Client requests upload intent.
3. API creates `photo_upload_intent` and returns signed URL.
4. Client uploads directly to S3.
5. Client calls attach endpoint with metadata.
6. API verifies S3 object exists and checksum matches.
7. API creates/updates `Photos` row.
8. API enqueues `image_processing` job.
9. Worker creates thumbnail and normalized preview.
10. Worker enqueues `ai_photo_validation`.
11. AI worker writes validation result.
12. WebSocket notifies client and dispatcher dashboard.

## 5.4 Submit flow

1. Client sends submit command.
2. API loads work order aggregate with work items, material usage, photos and signature.
3. API checks state machine transition.
4. API runs synchronous business validation.
5. API checks latest AI validation results.
6. API reserves materials if policy requires reservation before review.
7. API transitions status to `in_review`.
8. API writes status history and audit log.
9. API publishes `work_order_submitted`.
10. Notification worker notifies dispatcher.
11. Dispatcher queue updates over WebSocket.

## 5.5 Approve flow

1. Dispatcher sends approve command.
2. API checks RBAC and state `in_review`.
3. API locks work order row and material stock rows.
4. API validates no newer conflicting changes.
5. API writes warehouse movements and finalizes material usage.
6. API transitions work order to `approved`.
7. API publishes `work_order_approved` and `materials_written_off`.
8. Queue starts PDF generation.
9. Queue starts CRM export after PDF ready or per integration policy.
10. Notifications go to mechanic and manager dashboard.

## 5.6 Reject flow

1. Dispatcher sends reject with reason.
2. API validates reason and sections.
3. API transitions `in_review` to `returned`.
4. API releases material reservation or marks it pending by policy.
5. API writes status history and audit.
6. API publishes `work_order_rejected`.
7. Notification worker sends mechanic correction request.
8. Mechanic can edit only returned/problem sections depending policy.

---

# 6. Offline-first logic

## 6.1 Local drafts

Frontend creates local drafts with:

- `offlineClientId`;
- local `clientOperationId` per mutation;
- local version/counter;
- local blobs for photos/signature;
- pending command queue.

Backend requirements:

- accept idempotent materialization of local drafts;
- map `offlineClientId` to server `workOrderId`;
- tolerate repeated operations;
- return deterministic conflict responses.

## 6.2 Sync queue protocol

Endpoint: `POST /api/v1/mobile/sync/batch`

Body:

- `deviceId`;
- `lastServerCursor`;
- `operations[]` sorted by client timestamp and dependency order.

Operation types:

- `CREATE_WORK_ORDER`;
- `UPDATE_WORK_ORDER`;
- `UPSERT_WORK_ITEM`;
- `DELETE_WORK_ITEM`;
- `UPSERT_MATERIAL_USAGE`;
- `DELETE_MATERIAL_USAGE`;
- `CREATE_PHOTO_UPLOAD_INTENT`;
- `ATTACH_PHOTO`;
- `ATTACH_SIGNATURE`;
- `SUBMIT_WORK_ORDER`.

Backend response:

- `acceptedOperations[]`;
- `rejectedOperations[]`;
- `conflicts[]`;
- `serverCursor`;
- `entityMappings` from offline ids to server ids;
- `retryAfter` for transient failures.

## 6.3 Retry logic

- network errors: exponential backoff with jitter;
- 5xx: retry unless idempotency record says completed;
- 409 conflict: do not auto-retry, require conflict resolution;
- 422 validation: do not retry until user fixes data;
- upload intent expired: create new intent and re-upload;
- S3 upload succeeded but attach failed: retry attach with same checksum/key.

## 6.4 Conflict resolution

Conflict types:

1. `VERSION_CONFLICT` — entity changed on server.
2. `STATUS_CONFLICT` — work order moved to non-editable status.
3. `ASSIGNMENT_CONFLICT` — mechanic no longer assigned.
4. `INVENTORY_CONFLICT` — stock changed.
5. `PHOTO_CONFLICT` — required photo slot already occupied.
6. `DUPLICATE_SUBMIT` — submit command already processed.

Conflict strategy:

- preserve client data;
- return server snapshot;
- allow safe merge for work items/material rows;
- require dispatcher escalation for assignment conflicts;
- use idempotency records for duplicate submit;
- never silently discard offline photos/signature.

## 6.5 Pending uploads

Pending files are handled as a two-phase protocol:

1. metadata operation requests upload intent;
2. client uploads file to S3;
3. attach operation binds S3 object to work order.

If reconnect happens after file upload but before attach:

- client retries attach with same `uploadIntentId`;
- API verifies object and completes metadata persistence;
- cleanup job removes orphan temporary uploads after TTL.

## 6.6 Optimistic UI support

Backend supports optimistic UI by:

- returning stable versions;
- idempotent upserts by client ids;
- providing sync batch results;
- returning validation warnings without blocking draft autosave;
- using WebSocket reconciliation events.

## 6.7 Reconnect synchronization

Reconnect sequence:

1. refresh JWT if needed;
2. fetch server cursor and changed assignments;
3. upload pending files first;
4. send sync batch commands;
5. receive mappings and conflicts;
6. run submit if queued;
7. subscribe to WebSocket room for submitted work orders;
8. refresh validation/PDF statuses.

---

# 7. File storage architecture

## 7.1 Buckets

Recommended bucket separation:

- `neolift-workorder-temp` — temporary uploads;
- `neolift-workorder-private` — originals, signatures, PDF;
- `neolift-workorder-preview` — thumbnails/previews with private access or CDN signed access;
- `neolift-audit-archive` — long-term immutable exports if required.

All buckets are private. Public read is forbidden.

## 7.2 Object key structure

Temporary upload:

```text
tmp/uploads/{yyyy}/{mm}/{dd}/{uploadIntentId}/{originalFileName}
```

Original photos:

```text
work-orders/{yyyy}/{mm}/{workOrderId}/photos/{photoType}/{photoId}.jpg
```

Thumbnails:

```text
work-orders/{yyyy}/{mm}/{workOrderId}/photos/{photoType}/{photoId}_thumb.webp
```

Signatures:

```text
work-orders/{yyyy}/{mm}/{workOrderId}/signatures/{signatureId}.png
```

PDF:

```text
work-orders/{yyyy}/{mm}/{workOrderId}/pdf/{pdfDocumentId}_v{version}.pdf
```

## 7.3 Photo naming

- object key uses server `photoId`, not user filename;
- original filename stored only as metadata if needed;
- checksum stored in DB;
- photo type is part of key;
- EXIF metadata stripped or normalized according to security policy.

## 7.4 Temporary uploads

- upload intents expire after 15–60 minutes;
- temporary objects have lifecycle cleanup;
- attach endpoint promotes/copies object from temp bucket to private bucket;
- temp object removed after successful promotion;
- orphan cleanup job runs periodically.

## 7.5 Image compression and thumbnails

- client compression is accepted but not trusted;
- backend validates image dimensions, MIME and checksum;
- worker creates normalized JPEG/WebP preview;
- worker creates thumbnail for queue screens;
- original retained for audit;
- large originals may be stored in cold tier after retention window.

## 7.6 Signature storage

- signature stored as PNG/WebP in private bucket;
- checksum required;
- linked 1:1 to work order;
- signature immutable after approval;
- access only via signed URL and permission check.

## 7.7 PDF storage

- PDF stored in private bucket;
- PDF documents versioned;
- each regeneration creates a new row and object;
- signed download URL expires quickly;
- PDF includes QR/code linking to internal record if policy allows.

---

# 8. AI validation pipeline

## 8.1 Pipeline stages

1. `photo_uploaded` event emitted.
2. Image processing worker normalizes image and extracts metadata.
3. AI validation job starts.
4. Image quality checks run.
5. Category/object validation runs.
6. OCR runs for `document` photo.
7. Signature detection runs for document photo if applicable.
8. Business validation aggregates work order completeness.
9. Results persisted in `ai_validation_results` and denormalized status columns.
10. WebSocket emits validation status.
11. Submit endpoint uses latest non-stale results.

## 8.2 Photo checks

### Blurry detection

- Laplacian variance or AI model score;
- threshold configurable per photo type;
- severe blur is blocking for document photo;
- moderate blur is warning for detail photos.

### OCR заказ-наряда

- OCR extracts visible text;
- validates that order number/date/address/mechanic can be read if paper order photo is required;
- low OCR confidence creates blocking error for document category;
- OCR text stored with retention/security controls.

### Signature detection

- detects presence of handwritten signature in document photo;
- cross-checks electronic signature existence;
- absence of electronic signature is blocking;
- absence on paper document can be warning or blocking depending customer policy.

### Object validation

- photo category classifier checks whether image likely matches slot;
- installed/removed part slots must not be identical checksum;
- document photo must contain document-like layout;
- suspicious mismatch creates warning or blocking based on confidence.

## 8.3 Filling checks

- work order has customer/building/elevator/mechanic;
- work order has at least one work item;
- work items have action, element and positive quantity;
- material usage either present or explicitly empty by policy;
- required photo categories present;
- signature present;
- stock warnings calculated;
- suspicious material usage flagged;
- validation status stale if any dependent data changes.

## 8.4 Suspicious material checks

Examples:

- material quantity exceeds mechanic warehouse stock;
- material not typical for selected work template;
- repeated high usage on same object;
- material usage without related work item;
- high-value material requires dispatcher confirmation.

## 8.5 AI result model

Each result includes:

- `entityType`;
- `entityId`;
- `checkType`;
- `severity`;
- `status`;
- `score`;
- `message`;
- `rawProviderResult` stored securely or redacted;
- `modelVersion`;
- `createdAt`;
- `isStale`.

---

# 9. Workflow engine

## 9.1 Statuses

Recommended enum:

- `draft` — черновик;
- `filled` — заполнен локально/серверно, но не отправлен;
- `in_review` — на проверке диспетчера;
- `returned` — возвращен на доработку;
- `approved` — подтвержден диспетчером;
- `closed` — закрыт после PDF/CRM/учетной обработки;
- `cancelled` — отменен по административной причине.

## 9.2 Main happy path

```text
draft → filled → in_review → approved → closed
```

Rules:

- `draft → filled` when minimum local completeness achieved;
- `filled → in_review` on submit;
- `in_review → approved` on dispatcher approval;
- `approved → closed` after PDF and CRM/accounting export complete.

## 9.3 Return path

```text
draft → filled → in_review → returned → filled → in_review → approved → closed
```

Rules:

- `in_review → returned` requires structured reason;
- mechanic can edit returned order;
- corrected order returns to `filled` or directly `in_review` on resubmit;
- each return increments return counter and writes history.

## 9.4 Transition guards

- submit guard: work items, required photos, signature, no blocking AI errors;
- approve guard: dispatcher permission, status `in_review`, no unresolved blocking issue unless override;
- reject guard: reason required;
- close guard: approved, PDF ready, material write-off complete, CRM export complete or waived;
- edit guard: status in `draft` or `returned`.

## 9.5 Transactional consistency

State transition writes in one DB transaction:

- update `work_orders.status`;
- insert `work_order_status_history`;
- insert audit log;
- insert outbox event;
- increment version.

Workers consume outbox events after transaction commit.

---

# 10. Security architecture

## 10.1 RBAC / ABAC

Roles:

- `MECHANIC`;
- `DISPATCHER`;
- `MANAGER`;
- `ADMIN`;
- optional `INTEGRATION_SERVICE`.

ABAC checks:

- mechanic can access only assigned buildings and own work orders;
- dispatcher can access work orders in allowed region/team;
- manager can access aggregated data per org scope;
- admin can configure but not silently bypass audit.

## 10.2 JWT and sessions

- short-lived access token: 10–20 minutes;
- refresh token rotation;
- refresh token reuse detection;
- device session tracking;
- server-side session revocation;
- WebSocket authentication with access token and re-auth on expiry.

## 10.3 Signed URLs

- signed upload URL limited by method, content type, object key and expiration;
- signed download URL short TTL;
- no public bucket access;
- every signed URL request checks RBAC/ABAC;
- object keys never derived from user-provided paths.

## 10.4 Photo protection

- photos are private;
- preview URLs short-lived;
- EXIF stripped if it may expose sensitive data;
- original retention policy configurable;
- delete is soft delete at DB level;
- storage deletion controlled by lifecycle jobs.

## 10.5 Audit logs

Audit required for:

- login/logout/failed login;
- role changes;
- work order create/update/submit/approve/reject/close;
- photo upload/delete/override;
- signature replace;
- material reserve/write-off/correction;
- PDF generation/download if policy requires;
- CRM export.

## 10.6 Rate limits

- login: strict per IP/user;
- upload intent: per mechanic and work order;
- sync batch: per device/session;
- search materials: cached and rate limited;
- WebSocket connection count per user/device.

## 10.7 Data privacy

- sensitive data encrypted at rest where required;
- secrets in managed secret storage;
- logs redact tokens, phone numbers if policy requires, and signed URLs;
- least privilege IAM for S3 buckets;
- DB roles separated for app, migrations, read replicas and workers.

---

# 11. PDF generation

## 11.1 Trigger

PDF generation starts automatically after `work_order_approved` and material write-off completion.

Manual regeneration is allowed only for:

- dispatcher with permission;
- manager/admin;
- template/version changes;
- correction after returned order approval.

## 11.2 PDF content

PDF includes:

- work order number;
- customer;
- building address;
- elevator number;
- date/time;
- mechanic;
- dispatcher/reviewer;
- list of work items;
- list of used materials and quantities;
- warehouse write-off references;
- mandatory photos or photo appendix;
- signature image;
- status history summary;
- AI warnings/overrides if policy requires;
- QR/internal verification code.

## 11.3 PDF job flow

1. `work_order_approved` event enqueues PDF job.
2. Worker loads immutable snapshot.
3. Worker obtains signed internal read URLs or streams files from S3.
4. Worker renders PDF from versioned template.
5. Worker stores PDF in S3.
6. Worker inserts `pdf_documents` row.
7. Worker publishes `pdf_generated`.
8. CRM export waits for PDF or receives PDF URL/reference.

## 11.4 Versioning

- template version stored;
- PDF version increments per generation;
- old PDFs retained;
- latest PDF pointer stored on work order or derived by query.

---

# 12. Event-driven architecture

## 12.1 Outbox pattern

Use transactional outbox table to prevent lost events:

- API writes business changes and outbox event in one transaction;
- outbox worker publishes to Redis/BullMQ/WebSocket/integration layer;
- event delivery is at-least-once;
- consumers must be idempotent.

## 12.2 Core events

### `work_order_created`

Payload:

- `workOrderId`;
- `mechanicId`;
- `buildingId`;
- `elevatorId`;
- `offlineClientId`;
- `createdAt`.

Consumers:

- audit projection;
- mechanic WebSocket;
- assignment analytics.

### `photo_uploaded`

Payload:

- `photoId`;
- `workOrderId`;
- `photoType`;
- `storageKey`;
- `checksum`.

Consumers:

- image processing worker;
- AI validation worker;
- dispatcher photo-control projection.

### `ai_validation_failed`

Payload:

- `workOrderId`;
- `photoId` optional;
- `severity`;
- `issues[]`.

Consumers:

- mechanic notification;
- dispatcher queue flags;
- quality analytics.

### `work_order_submitted`

Payload:

- `workOrderId`;
- `mechanicId`;
- `submittedAt`;
- `validationSummary`.

Consumers:

- dispatcher notification;
- review queue projection;
- SLA timer.

### `work_order_approved`

Payload:

- `workOrderId`;
- `dispatcherId`;
- `approvedAt`.

Consumers:

- warehouse write-off worker;
- PDF worker;
- CRM export worker;
- mechanic notification.

### `materials_reserved`

Payload:

- `workOrderId`;
- `reservationIds[]`;
- `warehouseId`;
- `createdAt`.

Consumers:

- warehouse projections;
- low stock alerts;
- dispatcher warnings.

### Additional events

- `work_order_rejected`;
- `work_order_closed`;
- `materials_written_off`;
- `pdf_generated`;
- `crm_export_succeeded`;
- `crm_export_failed`;
- `sync_conflict_detected`.

---

# 13. Queue architecture

## 13.1 Queue list

- `image-processing`;
- `ai-validation`;
- `pdf-generation`;
- `warehouse-writeoff`;
- `crm-export`;
- `notifications`;
- `outbox-publisher`;
- `cleanup-temp-files`;
- `audit-archive`.

## 13.2 Queue rules

- jobs idempotent by business key;
- retries with exponential backoff;
- dead letter queue for failed jobs;
- job payload contains ids, not large blobs;
- workers load current DB state;
- long-running jobs report progress via WebSocket;
- job result persisted in DB, not only Redis.

## 13.3 Priority

High priority:

- submit validation;
- dispatcher notifications;
- photo validation for submitted orders.

Normal priority:

- thumbnails;
- PDF generation;
- CRM export.

Low priority:

- archive cleanup;
- historical analytics projections;
- cold storage transitions.

---

# 14. WebSockets architecture

## 14.1 Gateway channels

- `user:{userId}` — personal notifications;
- `mechanic:{mechanicId}` — mechanic work order updates;
- `work-order:{workOrderId}` — detailed progress;
- `dispatcher:queue:{scope}` — queue changes;
- `dashboard:{scope}` — manager aggregates.

## 14.2 Events to clients

- `workOrder.updated`;
- `workOrder.validationUpdated`;
- `photo.uploadProcessed`;
- `photo.aiValidationUpdated`;
- `sync.conflictDetected`;
- `pdf.generated`;
- `notification.created`.

## 14.3 Security

- JWT handshake;
- re-auth on token refresh;
- room join authorization;
- no signed URLs pushed automatically unless client requested and authorized;
- disconnect stale sessions.

---

# 15. Production scaling strategy

## 15.1 Expected load

Target scale:

- hundreds of mechanics;
- thousands of work orders per day/month depending region;
- tens of thousands of photos;
- dispatcher queues with near-real-time updates;
- heavy background image/AI/PDF processing.

## 15.2 API scaling

- stateless NestJS API instances;
- horizontal scaling behind load balancer;
- Redis for distributed locks and rate limit;
- PostgreSQL connection pooling through PgBouncer;
- read replicas for dashboard/reporting;
- CQRS-style read models for dispatcher queues.

## 15.3 PostgreSQL scaling

- indexes for status queues and mechanic history;
- partition `work_orders` by month/year at high volume;
- partition `photos` metadata by date if needed;
- keep warehouse movement ledger append-only and indexed;
- use materialized views for dashboard aggregates;
- move audit/archive queries to replica.

## 15.4 S3/CDN scaling

- direct-to-S3 upload avoids API file bottleneck;
- thumbnails served via signed CDN URLs if needed;
- lifecycle policies for old originals;
- multipart upload for large PDFs or high-res files if required;
- object storage metrics and alerting.

## 15.5 Queue scaling

- separate worker pools per queue;
- AI workers autoscale independently;
- PDF workers CPU/memory isolated;
- dead letter monitoring;
- rate limit external AI/CRM providers;
- backpressure for non-critical jobs.

## 15.6 Caching

Redis cache candidates:

- material search results;
- mechanic assignments snapshot;
- building/elevator lookup;
- permission claims;
- dashboard counters with short TTL;
- sync cursors.

Do not cache:

- critical stock writes without DB source of truth;
- signed URLs beyond TTL;
- mutable work order aggregate for write decisions.

---

# 16. Error handling strategy

## 16.1 Error envelope

Every API error returns:

- `code` — stable machine-readable code;
- `message` — user-safe message;
- `details` — field issues or conflict information;
- `correlationId`;
- `retryable` boolean;
- `serverTime`.

## 16.2 Error categories

- `AUTH_REQUIRED`;
- `FORBIDDEN`;
- `VALIDATION_FAILED`;
- `STATE_TRANSITION_DENIED`;
- `VERSION_CONFLICT`;
- `INVENTORY_CONFLICT`;
- `UPLOAD_INTENT_EXPIRED`;
- `PHOTO_VALIDATION_FAILED`;
- `SIGNATURE_REQUIRED`;
- `AI_VALIDATION_PENDING`;
- `QUEUE_JOB_FAILED`;
- `EXTERNAL_CRM_UNAVAILABLE`.

## 16.3 Client behavior mapping

- 400/422: show inline validation and do not retry automatically;
- 401: refresh token or session expired flow;
- 403: show access denied and stop operation;
- 409: conflict resolution screen;
- 423: locked entity, refresh state;
- 429: retry after indicated delay;
- 5xx: retry with backoff if idempotent.

## 16.4 Observability

- structured logs with correlation id;
- tracing across API → queue → storage → CRM;
- metrics for submit latency, photo validation latency, PDF time, queue depth;
- alerts for DLQ growth, S3 failures, AI provider failures, stock write-off failures;
- audit trail separate from operational logs.

---

# 17. NestJS folder structure

```text
/apps/api
  /src
    /main.ts
    /app.module.ts
    /config
      app.config.ts
      auth.config.ts
      database.config.ts
      redis.config.ts
      storage.config.ts
      queue.config.ts
    /common
      /decorators
        current-user.decorator.ts
        idempotency-key.decorator.ts
        roles.decorator.ts
      /guards
        jwt-auth.guard.ts
        roles.guard.ts
        work-order-access.guard.ts
      /filters
        http-exception.filter.ts
      /interceptors
        audit-context.interceptor.ts
        correlation-id.interceptor.ts
      /pipes
        zod-validation.pipe.ts
      /types
        request-context.type.ts
    /database
      prisma.module.ts
      prisma.service.ts
      transaction.service.ts
    /modules
      /auth
        auth.module.ts
        auth.controller.ts
        auth.service.ts
        token.service.ts
        session.service.ts
        dto/
        repositories/
      /users
        users.module.ts
        users.service.ts
        users.repository.ts
      /mechanics
        mechanics.module.ts
        mechanics.service.ts
        assignments.service.ts
      /work-orders
        work-orders.module.ts
        controllers/
          mobile-work-orders.controller.ts
          dispatcher-work-orders.controller.ts
          work-order-sync.controller.ts
        services/
          work-order.service.ts
          work-item.service.ts
          work-order-state-machine.service.ts
          work-order-validation.service.ts
          work-order-sync.service.ts
          work-order-query.service.ts
        repositories/
          work-orders.repository.ts
          work-items.repository.ts
          status-history.repository.ts
        dto/
        policies/
      /materials
        materials.module.ts
        materials.controller.ts
        materials-catalog.service.ts
        material-usage.service.ts
        material-search.service.ts
        repositories/
        dto/
      /warehouse
        warehouse.module.ts
        warehouse.service.ts
        stock-reservation.service.ts
        stock-writeoff.service.ts
        warehouse-movement.service.ts
        inventory-validation.service.ts
        repositories/
        dto/
      /photos
        photos.module.ts
        photos.controller.ts
        photo.service.ts
        storage.service.ts
        image-processing.service.ts
        photo-access.service.ts
        repositories/
        dto/
      /signatures
        signatures.module.ts
        signatures.controller.ts
        signatures.service.ts
        repositories/
        dto/
      /ai-validation
        ai-validation.module.ts
        ai-validation.service.ts
        image-quality.service.ts
        ocr.service.ts
        signature-detection.service.ts
        object-validation.service.ts
        business-validation.service.ts
        repositories/
        dto/
      /pdf
        pdf.module.ts
        pdf.controller.ts
        pdf-generation.service.ts
        pdf-template.service.ts
        pdf-storage.service.ts
        repositories/
        dto/
      /notifications
        notifications.module.ts
        notifications.controller.ts
        notifications.service.ts
        notification.gateway.ts
        repositories/
        dto/
      /audit
        audit.module.ts
        audit.service.ts
        audit-query.service.ts
        repositories/
        dto/
      /events
        events.module.ts
        outbox.service.ts
        event-publisher.service.ts
        event-handlers/
      /queues
        queues.module.ts
        processors/
          image-processing.processor.ts
          ai-validation.processor.ts
          pdf-generation.processor.ts
          warehouse-writeoff.processor.ts
          crm-export.processor.ts
          notifications.processor.ts
          cleanup-temp-files.processor.ts
    /integrations
      /s3
      /crm
      /ai-provider
      /pdf-renderer
/prisma
  schema.prisma
  migrations/
  seed/
```

---

# 18. Production readiness checklist

1. All mutating endpoints are idempotent.
2. All status transitions go through state machine.
3. Photos use direct S3 upload with signed URLs.
4. Submit uses server-side validation, not only frontend checks.
5. Material write-off is transactional and idempotent.
6. Offline sync has deterministic conflict responses.
7. AI validation results can be stale and must be invalidated on changes.
8. PDF generation uses immutable snapshots and versioning.
9. CRM export is asynchronous and retryable.
10. Audit logs are append-only and cover all critical actions.
11. WebSocket rooms are authorization-protected.
12. Redis locks are used only with DB transactions as source of truth.
13. Background jobs are idempotent and have DLQ monitoring.
14. Storage buckets are private and lifecycle-managed.
15. Dashboard/reporting reads do not overload transactional writes.
