# НеоЛифт ERP/PWA — production-grade frontend application architecture

## 0. Назначение документа

Документ описывает enterprise frontend architecture для ERP/PWA системы лифтовой компании «НеоЛифт». Цель — спроектировать масштабируемую frontend-платформу для десятков экранов, сотен компонентов, нескольких ролей, offline-first режима, mobile-first механиков и desktop рабочих мест диспетчеров/руководителей.

Это не landing page, не demo app, не UI concept и не admin template. Архитектура ориентирована на промышленную field-service ERP систему уровня ServiceTitan/Salesforce Field Service, где интерфейс должен работать в шахтах лифта, подвалах, на дешевых Android-устройствах, при нестабильной сети и с большим объемом фото.

Стек:

- Next.js App Router;
- React;
- TypeScript;
- Tailwind;
- shadcn/ui;
- TanStack Query / React Query;
- Zustand;
- React Hook Form;
- Zod;
- PWA;
- IndexedDB.

---

# 1. Frontend architecture principles

## 1.1 Architectural goals

Frontend должен обеспечивать:

- масштабирование на десятки бизнес-модулей без хаоса импортов;
- четкое разделение server state, local UI state, form state и offline state;
- одинаковую бизнес-логику для mobile PWA и desktop workspace;
- offline-first оформление заказ-наряда;
- безопасную работу с ролями и protected routes;
- контролируемую дизайн-систему без случайных компонентов;
- production observability и error handling;
- изоляцию feature modules;
- возможность постепенно добавлять backend API без переписывания UI.

## 1.2 Architecture style

Рекомендуемый стиль: **Feature-Sliced Design + Enterprise Modular Architecture**.

Слои:

1. `app` — маршруты Next.js App Router, layouts, providers, route groups.
2. `processes` — длинные бизнес-процессы, например offline sync или work-order lifecycle.
3. `pages` или route-level modules внутри `app` — composition layer для конкретных экранов.
4. `widgets` — крупные UI-блоки страницы.
5. `features` — пользовательские действия и сценарии.
6. `entities` — доменные модели и CRUD/API слой сущностей.
7. `shared` — дизайн-система, API client, lib, config, hooks, types.

Dependency rule:

```text
app → processes → widgets → features → entities → shared
```

Нижний слой не импортирует верхний. Например, `entities/work-order` не знает о `features/create-work-order`, а `shared/ui` не знает о домене.

## 1.3 Role-oriented application zones

- `mechanic` — mobile-first PWA, offline-first, bottom navigation, large touch controls;
- `dispatcher` — desktop-first workspace, queues, split panels, photo review;
- `manager` — dashboard, analytics, drill-down, reports;
- `admin` — users, roles, dictionaries, system configuration.

Каждая зона имеет свой route group, layout, navigation и permission boundary.

---

# 2. Production folder structure

## 2.1 Recommended root structure

```text
/app
  /(auth)
    /login
      page.tsx
    /password-recovery
      page.tsx
    /session-expired
      page.tsx
    layout.tsx
  /(mechanic)
    /objects
      page.tsx
    /objects/[buildingId]
      page.tsx
    /work-orders
      page.tsx
    /work-orders/new
      page.tsx
    /work-orders/[workOrderId]
      page.tsx
    /notifications
      page.tsx
    /profile
      page.tsx
    layout.tsx
  /(dispatcher)
    /dashboard
      page.tsx
    /work-orders
      page.tsx
    /work-orders/[workOrderId]
      page.tsx
    /photo-control
      page.tsx
    /mechanics
      page.tsx
    layout.tsx
  /(manager)
    /dashboard
      page.tsx
    /mechanics
      page.tsx
    /objects
      page.tsx
    /materials
      page.tsx
    /penalties
      page.tsx
    /reports
      page.tsx
    layout.tsx
  /api-health
    page.tsx
  layout.tsx
  error.tsx
  loading.tsx
  not-found.tsx
  globals.css

/processes
  /offline-sync
  /work-order-lifecycle
  /pwa-installation
  /session-refresh

/widgets
  /mechanic-shell
  /dispatcher-shell
  /manager-shell
  /work-order-form
  /materials-selector
  /photo-gallery
  /validation-panel
  /signature-panel
  /offline-sync-panel
  /dispatcher-review-workspace
  /manager-kpi-dashboard

/features
  /auth-by-password
  /refresh-session
  /create-work-order
  /edit-work-item
  /select-material
  /reserve-materials
  /upload-photo
  /delete-photo
  /sign-document
  /submit-work-order
  /approve-work-order
  /reject-work-order
  /generate-work-order-pdf
  /sync-offline-operations
  /resolve-sync-conflict
  /mark-notification-read

/entities
  /user
  /mechanic
  /customer
  /building
  /elevator
  /work-order
  /work-item
  /material
  /warehouse
  /photo
  /signature
  /notification
  /penalty
  /audit

/shared
  /api
  /auth
  /config
  /constants
  /design-system
  /hooks
  /indexed-db
  /lib
  /logger
  /pwa
  /query
  /stores
  /types
  /ui
  /validation
  /websocket

/services
  /api-client
  /storage-client
  /image-compression
  /background-sync
  /analytics
  /observability

/stores
  app.store.ts
  navigation.store.ts
  offline.store.ts
  sync.store.ts
  ui.store.ts

/hooks
  use-network-status.ts
  use-current-user.ts
  use-role-permissions.ts
  use-safe-area.ts
  use-before-unload-draft-warning.ts

/lib
  cn.ts
  date.ts
  ids.ts
  permissions.ts
  result.ts
  exhaustive-check.ts

/types
  api.ts
  domain.ts
  permissions.ts
  routes.ts
  sync.ts
```

## 2.2 Responsibilities by top-level directory

### `app`

- Next.js App Router route definitions;
- layouts by role;
- route-level error/loading boundaries;
- protected route composition;
- server components only where useful for shell/static metadata;
- client screen composition through widgets/features.

### `modules` vs `features/entities/widgets`

Если команда предпочитает `modules`, он должен быть compatibility wrapper, а не хаотичная папка:

```text
/modules
  /mechanic
    index.ts
    routes.ts
  /dispatcher
  /manager
```

Внутри `modules` нельзя размещать случайные компоненты. Реальная бизнес-логика живет в `features`, `entities`, `widgets`.

### `entities`

- domain types;
- API queries/mutations для сущности;
- entity-specific zod schemas;
- entity-specific UI primitives типа `WorkOrderStatusBadge`;
- selectors/adapters;
- no page-specific logic.

### `features`

- конкретные действия пользователя;
- command forms;
- mutations;
- small feature-level UI;
- optimistic update rules;
- permissions for action visibility.

### `widgets`

- композиция нескольких features/entities;
- крупные блоки экранов;
- form sections;
- workspace panels;
- no direct low-level API calls except through entities/features hooks.

### `shared`

- design system;
- API client;
- query client;
- websocket client;
- IndexedDB client;
- generic hooks;
- generic validation helpers;
- low-level infrastructure.

---

# 3. Feature-Sliced Design model

## 3.1 Entities

### `entities/work-order`

Contents:

```text
/entities/work-order
  /api
    work-order.queries.ts
    work-order.mutations.ts
    work-order.keys.ts
  /model
    work-order.types.ts
    work-order.schemas.ts
    work-order.status.ts
    work-order.selectors.ts
  /ui
    work-order-status-badge.tsx
    work-order-priority-badge.tsx
    work-order-summary-card.tsx
  index.ts
```

Responsibilities:

- WorkOrder aggregate types;
- status enum;
- query keys;
- read hooks;
- status badge;
- selectors like `isEditableWorkOrder`.

### `entities/elevator`

- elevator identity;
- elevator status;
- history query;
- compact elevator badge;
- relation to building.

### `entities/mechanic`

- mechanic profile;
- current assignment queries;
- mechanic status badges;
- shift status;
- warehouse reference.

### `entities/material`

- material catalog;
- material search;
- stock snapshot;
- material usage types;
- unit formatting.

### `entities/photo`

- photo type enum;
- upload metadata;
- AI status;
- photo preview URL query;
- photo status badge.

## 3.2 Features

### `features/create-work-order`

- create draft mutation;
- offline draft creation adapter;
- idempotency key generation;
- initial form schema;
- action button/command entry.

### `features/upload-photo`

- camera/file picker integration;
- compression pipeline;
- upload intent request;
- S3 direct upload;
- attach photo mutation;
- retry failed upload;
- local pending upload persistence.

### `features/sign-document`

- signature canvas;
- signature validation;
- signature image serialization;
- upload intent;
- attach signature mutation;
- local signature recovery.

### `features/approve-work-order`

- dispatcher-only approve mutation;
- validation of unresolved warnings;
- optimistic queue update;
- approval confirmation dialog;
- role guard.

### `features/reject-work-order`

- structured reject reason form;
- required action list;
- dispatcher comment;
- mutation and queue invalidation;
- notification trigger handling.

## 3.3 Widgets

### `widgets/work-order-form`

Composes:

- general information section;
- work items section;
- materials section;
- photo fixation section;
- signature section;
- validation summary;
- sticky bottom actions.

Does not own backend logic directly. It uses feature hooks and entity selectors.

### `widgets/materials-selector`

- material search;
- suggestions;
- stock warnings;
- quantity controls;
- offline stock snapshot warning.

### `widgets/photo-gallery`

- required slots;
- thumbnails;
- upload progress;
- AI status;
- remove/retry actions;
- full-screen viewer.

### `widgets/validation-panel`

- blocking errors;
- warnings;
- AI status;
- submit readiness;
- jump-to-section actions.

---

# 4. Design system

## 4.1 Design tokens

Design tokens must be centralized in:

```text
/shared/design-system/tokens
  colors.ts
  typography.ts
  spacing.ts
  radius.ts
  shadows.ts
  motion.ts
```

Tailwind config consumes the same token values to avoid drift.

## 4.2 Colors

### Core palette

- `dark-navy-950` — app background;
- `dark-navy-900` — deep panels;
- `graphite-950` — input surfaces;
- `graphite-900` — cards;
- `graphite-800` — elevated cards and secondary actions;
- `industrial-orange-500` — primary action;
- `industrial-orange-600` — pressed action;
- `success-500` — approved/synced;
- `warning-500` — offline/pending/warning;
- `danger-500` — blocking errors/rejects;
- `info-500` — neutral system status.

### Usage rules

- orange only for primary field action and urgency;
- red only for blocking issues;
- amber for offline/pending and non-blocking warnings;
- green for saved/synced/approved;
- color always paired with label/icon;
- no decorative gradients in operational screens except subtle background depth.

## 4.3 Typography

### Mobile mechanic UI

- screen title: 20–22 px, 700–800 weight;
- section title: 16–18 px, 700;
- field value: 16–18 px;
- secondary text: 13–14 px;
- badge text: 12 px;
- button text: 15–17 px, 700.

### Desktop workspace

- dashboard title: 24–28 px;
- table text: 13–14 px;
- table header: 12 px uppercase/semibold;
- panel title: 16–18 px;
- KPI value: 28–36 px.

## 4.4 Spacing

- mobile page padding: 12–16 px;
- mobile section gap: 12–16 px;
- card padding: 12–16 px mobile, 16–24 px desktop;
- desktop panel gap: 16–24 px;
- dense table row: 44–48 px;
- touch row: 56–64 px.

## 4.5 Border radius

- inputs/buttons: `rounded-xl`;
- cards: `rounded-2xl`;
- bottom sheets: top `rounded-2xl`;
- badges: full pill;
- photo previews: `rounded-xl`.

## 4.6 Shadows

- heavy marketing shadows are forbidden;
- use industrial elevation only for sticky bars, drawers and modals;
- cards rely mostly on border and surface contrast;
- dark UI shadows must remain subtle and functional.

## 4.7 Touch targets

- minimum: 48 × 48 px;
- recommended mechanic target: 56 × 56 px;
- primary bottom action: 56–64 px height;
- gap between destructive and primary actions: at least 12 px;
- swipe gestures cannot be the only way to perform an action.

---

# 5. UI component library

## 5.1 Component layers

### `shared/ui`

Generic primitives:

- `Button`;
- `Input`;
- `Textarea`;
- `Select`;
- `Checkbox`;
- `Switch`;
- `Card`;
- `Badge`;
- `Alert`;
- `Dialog`;
- `Drawer`;
- `Sheet`;
- `Toast`;
- `Progress`;
- `Skeleton`;
- `Table`.

### `shared/design-system/components`

Industrial extensions:

- `StatusBadge`;
- `OfflineBanner`;
- `SyncIndicator`;
- `StickyActionBar`;
- `TouchStepper`;
- `UploadZone`;
- `PhotoSlot`;
- `ValidationAlert`;
- `SectionCard`;
- `ActionRail`;
- `SplitPanel`.

### `entities/*/ui`

Domain components:

- `WorkOrderStatusBadge`;
- `MaterialStockBadge`;
- `PhotoAiStatusBadge`;
- `MechanicShiftBadge`;
- `ElevatorStatusBadge`.

## 5.2 Forms

Reusable form components:

- `FormField`;
- `FormSection`;
- `ReadonlyField`;
- `QuantityStepper`;
- `AutocompleteField`;
- `ComboboxField`;
- `FormErrorMessage`;
- `AutosaveIndicator`.

Rules:

- field-level errors are inline;
- section-level errors appear in section header;
- disabled fields explain why;
- readonly fields use separate visual style, not disabled opacity only.

## 5.3 Cards

Card variants:

- object card;
- work order card;
- material row card;
- photo card;
- validation card;
- KPI card;
- queue row card.

Rules:

- every card has a clear primary action;
- mobile cards are touch-friendly;
- desktop cards can be denser;
- no marketing feature-card patterns.

## 5.4 Uploaders

Uploader components:

- `CameraUploadButton`;
- `GalleryUploadButton`;
- `DragDropUploadZone`;
- `UploadProgressBar`;
- `RetryUploadButton`;
- `RemovePhotoButton`.

Rules:

- mobile camera-first;
- desktop drag/drop optional;
- progress per file and per work order;
- failed upload remains recoverable;
- local file is never silently discarded.

## 5.5 Drawers and dialogs

Use drawers for:

- filters;
- details;
- history;
- material search;
- photo viewer on mobile;
- conflict resolution.

Use dialogs for:

- destructive confirmations;
- approve/reject confirmation;
- session expired;
- unsaved changes.

## 5.6 Sticky actions

Sticky actions exist for high-frequency workflows:

- save draft;
- submit;
- continue later;
- approve/reject;
- retry sync.

Rules:

- sticky bar respects safe-area;
- sticky actions must not cover form fields;
- disabled state must explain blocker;
- mobile sticky actions use 1–3 buttons max.

---

# 6. State management architecture

## 6.1 State categories

| State type | Tool | Examples |
| --- | --- | --- |
| Server state | TanStack Query | work orders, assignments, materials, validation results |
| Local UI state | Zustand | drawers, active tabs, panel sizes, selected queue row |
| Form state | React Hook Form | work order draft form, reject reason, signature metadata |
| Offline durable state | IndexedDB | drafts, sync operations, photo blobs, upload queue |
| URL state | Next router/search params | filters, selected ids, dashboard period |
| Ephemeral component state | React useState | expanded card, focused input, local menu open |

## 6.2 TanStack Query

Structure:

```text
/shared/query
  query-client.ts
  query-provider.tsx
  query-persister.ts
  query-error-handler.ts

/entities/work-order/api/work-order.keys.ts
/entities/work-order/api/work-order.queries.ts
/entities/work-order/api/work-order.mutations.ts
```

Rules:

- query keys centralized per entity;
- mutations use optimistic updates only when rollback is safe;
- offline mode pauses network mutations and stores commands in IndexedDB;
- stale time differs by domain:
  - assignments: short;
  - material catalog: medium;
  - photos status: realtime/short;
  - historical work orders: long.

## 6.3 Zustand stores

Recommended stores:

```text
/stores/app.store.ts
/stores/navigation.store.ts
/stores/offline.store.ts
/stores/sync.store.ts
/stores/ui.store.ts
```

### `offline.store`

- `isOnline`;
- `lastOnlineAt`;
- `isOfflineForced` for testing/admin diagnostics;
- `pendingOperationCount`;
- `pendingUploadCount`.

### `sync.store`

- current sync phase;
- active work order sync statuses;
- conflict count;
- last sync cursor;
- retry state.

### `ui.store`

- drawers;
- active modal;
- toast queue;
- selected workspace row;
- desktop panel sizes.

Rules:

- never store server aggregates in Zustand if TanStack Query owns them;
- never store large blobs in Zustand;
- use selectors to prevent rerenders;
- persist only small safe UI preferences.

## 6.4 React Hook Form

- owns active editable form values;
- uses Zod resolver;
- autosave watches dirty fields with debounce;
- nested arrays for work items/material usage;
- field arrays for dynamic rows;
- submit pipeline calls frontend validation, then offline or online command.

## 6.5 IndexedDB

Durable offline state:

- `drafts`;
- `draft_versions`;
- `sync_operations`;
- `photo_blobs`;
- `signature_blobs`;
- `upload_intents`;
- `entity_cache`;
- `conflicts`;
- `sync_cursors`.

Use wrapper:

```text
/shared/indexed-db
  db.ts
  migrations.ts
  repositories/
    drafts.repo.ts
    operations.repo.ts
    blobs.repo.ts
    cache.repo.ts
```

Rules:

- IndexedDB schema versioned;
- migrations tested;
- all writes use transactions;
- blobs stored separately from JSON operations;
- cleanup policies for synced/old blobs.

---

# 7. Offline-first frontend architecture

## 7.1 Offline capabilities

Must work offline:

- open cached assignments;
- open cached object/elevator details;
- create work order draft;
- edit work items;
- edit materials using cached catalog;
- capture photos;
- store signature;
- run local required-field validation;
- queue submit command;
- show sync status.

Requires online:

- final server submit confirmation;
- signed upload URL creation unless pre-created;
- material stock freshness;
- server AI validation;
- dispatcher approval;
- PDF generation.

## 7.2 Local drafts

Local draft structure:

```ts
LocalWorkOrderDraft = {
  offlineClientId: string;
  serverId?: string;
  buildingId: string;
  elevatorId: string;
  status: 'local_draft' | 'server_draft' | 'queued_submit' | 'sync_conflict';
  formData: WorkOrderFormData;
  localVersion: number;
  serverVersion?: number;
  updatedAt: string;
}
```

Rules:

- draft is created immediately before server response;
- server id is mapped later;
- local draft never disappears after failed sync;
- user can recover draft after app restart;
- conflicts are attached to draft, not global generic errors.

## 7.3 Sync operations

Operation envelope:

```ts
SyncOperation = {
  id: string;
  type: SyncOperationType;
  aggregate: 'work-order';
  aggregateClientId: string;
  aggregateServerId?: string;
  payload: unknown;
  dependencies: string[];
  status: 'pending' | 'running' | 'failed' | 'done' | 'conflict';
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}
```

Rules:

- commands are idempotent;
- operations ordered by dependencies, not only timestamp;
- upload attach depends on upload success;
- submit depends on required work/photo/signature operations;
- failed operations keep error code and retry strategy.

## 7.4 Sync manager

`processes/offline-sync` contains:

- network detector;
- operation scheduler;
- upload scheduler;
- retry policy;
- conflict handler;
- query cache reconciler;
- WebSocket reconnect handler.

Sync phases:

1. idle;
2. network-restored;
3. refresh-session;
4. upload-files;
5. submit-operations;
6. reconcile-server-state;
7. resolve-conflicts;
8. done/failed.

## 7.5 Retry uploads

Retry policy:

- upload intent expired → request new intent;
- S3 upload network failure → retry with exponential backoff;
- attach failed after upload → retry attach without re-upload;
- checksum mismatch → mark as blocking and require recapture/reselect;
- user can manually retry from upload queue.

## 7.6 Optimistic updates

Safe optimistic updates:

- adding work item locally;
- changing quantity;
- adding material usage locally;
- marking photo as pending upload;
- saving signature locally.

Unsafe optimistic updates:

- final submitted status as accepted by office;
- material write-off;
- AI validation pass;
- dispatcher approval;
- PDF ready.

Unsafe states must be shown as `pending`, `queued` or `awaiting server`.

## 7.7 Local cache

Cache layers:

- TanStack Query cache for online/server state;
- persisted query cache for read-only data;
- IndexedDB entity cache for offline critical data;
- Cache Storage for static app shell;
- image/blob storage for photos/signatures.

Critical cached datasets:

- assignments for current mechanic;
- building/elevator details;
- work templates;
- material catalog subset;
- recent work orders;
- current user and permissions claims.

---

# 8. Form architecture

## 8.1 Form structure

Work order form is a nested form:

```text
WorkOrderForm
  GeneralInfoSection
  WorkItemsFieldArray
  MaterialUsageFieldArray
  PhotoRequirementsSection
  SignatureSection
  ValidationSummarySection
```

React Hook Form owns form values for active screen; IndexedDB persists autosave snapshots.

## 8.2 Zod schemas

Schema layers:

- `WorkOrderDraftSchema` — permissive for autosave;
- `WorkOrderSubmitSchema` — strict for submit;
- `WorkItemSchema`;
- `MaterialUsageSchema`;
- `SignatureMetadataSchema`;
- `PhotoAttachmentSchema`.

Rules:

- draft schema allows incomplete fields;
- submit schema blocks missing required fields;
- backend remains source of truth;
- schemas shared conceptually with backend contracts where possible.

## 8.3 Dynamic forms

Dynamic arrays:

- work items;
- materials;
- optional comments;
- photo slots configured by work type/customer policy.

Rules:

- each row has stable local id;
- deleting row marks local operation, not immediate loss if offline;
- row-level validation shown inline;
- collapsed row header shows error badge if invalid.

## 8.4 Autosave

Autosave strategy:

- debounce 500–1000 ms after field changes;
- save to IndexedDB first;
- if online, enqueue server sync;
- show states: saving, saved locally, synced, failed;
- autosave must not block typing/tapping;
- autosave must not trigger expensive full validation each keystroke.

## 8.5 Draft recovery

Recovery scenarios:

- browser closed;
- app killed by OS;
- battery died;
- session expired;
- refresh during photo upload.

Recovery UX:

- detect unfinished local draft;
- show recovery banner;
- allow continue, discard, or sync later;
- never discard photo blobs without explicit confirmation.

## 8.6 Field-level validation

- immediate validation for numeric quantities;
- on-blur validation for text fields;
- section validation on collapse;
- full strict validation on submit;
- validation panel aggregates blockers and warnings;
- each issue links to field/section.

---

# 9. Photo system frontend architecture

## 9.1 Photo pipeline

1. User selects camera/gallery/drag-drop.
2. Client validates MIME and size.
3. Client creates local preview URL.
4. Client compresses image in worker if possible.
5. Client stores original or compressed blob in IndexedDB.
6. Client creates upload operation.
7. Sync manager requests upload intent.
8. Client uploads directly to S3-compatible storage.
9. Client attaches metadata to backend.
10. Backend/AI status arrives through polling or WebSocket.
11. UI updates photo slot status.

## 9.2 Camera upload

Mobile requirements:

- `capture="environment"` for rear camera;
- large camera button;
- category-specific prompt;
- immediate preview;
- retry/retake action;
- offline local save.

## 9.3 Drag/drop

Desktop/tablet requirements:

- drag-over state;
- multi-file drop only where dispatcher/admin workflows allow;
- mechanic workflow keeps required slots explicit;
- file type validation before upload.

## 9.4 Preview

- object URL preview for local blobs;
- signed thumbnail URL for server photos;
- full-screen viewer for mobile;
- zoom/rotate in dispatcher workspace;
- object URLs revoked when component unmounts.

## 9.5 Image compression

- use Web Worker to avoid blocking low-end Android;
- max dimension configurable, e.g. 1600–2048 px;
- quality target configurable, e.g. 0.72–0.82;
- preserve enough detail for OCR;
- document photo may use higher quality than detail photo;
- compression failure falls back to original if within limits.

## 9.6 Upload queue

Upload queue item:

- local blob id;
- work order client/server id;
- photo type;
- upload intent id;
- progress;
- retry count;
- status;
- last error.

Rules:

- max concurrent uploads low on mobile, e.g. 1–2;
- pause uploads on poor network/battery policy if required;
- resume after reconnect;
- progress is persisted enough to recover status after refresh.

## 9.7 AI validation preview

Photo slot statuses:

- missing;
- saved locally;
- upload pending;
- uploading;
- uploaded;
- AI checking;
- AI warning;
- AI blocking error;
- accepted.

AI result UI:

- show short reason;
- provide retake action;
- for warning, allow comment/dispatcher note;
- for blocking, prevent submit.

---

# 10. Navigation architecture

## 10.1 Mobile mechanic navigation

Route group: `app/(mechanic)`.

Navigation elements:

- bottom nav with 4 items: Objects, Orders, Notifications, Profile;
- sticky action bar in work order form;
- floating action only for contextual high-frequency action;
- offline banner above sticky actions;
- full-screen camera/signature flows.

Rules:

- max 4 bottom nav items;
- primary action always reachable by thumb;
- no desktop sidebar on mechanic phone;
- route transitions preserve draft state.

## 10.2 Desktop dispatcher navigation

Route group: `app/(dispatcher)`.

Navigation elements:

- left sidebar;
- top filter/search bar;
- split workspace;
- right detail panel;
- queue keyboard navigation;
- drawer for filters/details.

Layout:

```text
Sidebar | Queue/List panel | Work order detail panel | Photo/AI action panel
```

## 10.3 Manager navigation

- sidebar;
- dashboard tabs;
- date range global control;
- drill-down side panels;
- report export actions.

## 10.4 Route guards

- role-based layout guards;
- feature permission checks;
- redirect unauthorized users to safe default route;
- session expired route preserves local draft metadata.

---

# 11. Realtime architecture

## 11.1 WebSocket client

Structure:

```text
/shared/websocket
  websocket-client.ts
  websocket-provider.tsx
  websocket-events.ts
  websocket-auth.ts
  websocket-reconnect.ts
```

Responsibilities:

- connect with JWT;
- refresh token on auth expiry;
- reconnect with backoff;
- resubscribe to rooms;
- dispatch events to query cache and stores.

## 11.2 Events

Client consumes:

- `workOrder.updated`;
- `workOrder.validationUpdated`;
- `photo.uploadProcessed`;
- `photo.aiValidationUpdated`;
- `sync.conflictDetected`;
- `pdf.generated`;
- `notification.created`;
- `dispatcher.queueUpdated`.

## 11.3 Live updates

Update strategy:

- small events patch query cache if safe;
- larger changes invalidate query keys;
- dispatcher queues receive inserted/updated row events;
- mechanic work order detail receives validation status changes;
- manager dashboard uses throttled aggregate refresh.

## 11.4 Upload progress

Upload progress is primarily local XHR/fetch progress if available. Server-side processing progress arrives through WebSocket:

- uploaded;
- processing thumbnail;
- AI checking;
- validation ready;
- failed.

## 11.5 Sync notifications

Sync manager emits internal events:

- sync started;
- uploading files;
- operations submitted;
- conflict detected;
- sync complete;
- sync failed.

UI consumes via Zustand sync store.

---

# 12. Error handling strategy

## 12.1 Error boundaries

- global `app/error.tsx` for fatal route errors;
- route group boundaries for auth/mechanic/dispatcher/manager;
- widget-level boundaries for photo gallery, maps, dashboards;
- query error fallback for server state;
- form-level validation errors remain inline, not boundary.

## 12.2 Error taxonomy

Frontend error categories:

- network unavailable;
- API validation failed;
- access denied;
- session expired;
- version conflict;
- upload failed;
- local storage unavailable;
- IndexedDB quota exceeded;
- AI validation failed;
- websocket disconnected;
- PWA update failed.

## 12.3 Offline errors

Offline is not a fatal error. UI should show:

- offline banner;
- saved locally status;
- pending sync count;
- unavailable online-only actions;
- clear recovery path.

## 12.4 Upload failures

Upload failure UI:

- per-photo error;
- retry button;
- remove/replace button;
- upload queue detail;
- do not lose local file;
- distinguish expired signed URL from network failure.

## 12.5 Validation failures

Validation failures:

- field-level message;
- section badge;
- validation panel summary;
- sticky action changes label to blocker count;
- tap issue scrolls to field.

## 12.6 Reconnect errors

Reconnect failure states:

- token refresh failed → session expired screen;
- sync conflict → conflict resolution screen;
- upload retry exceeded → manual retry required;
- server unavailable → remain queued;
- schema/version mismatch → force app update flow.

---

# 13. Performance strategy

## 13.1 Target devices

Frontend must support:

- low-end Android;
- small screens;
- limited memory;
- poor network;
- large camera images;
- long work order history.

## 13.2 Lazy loading

- route-level code splitting via App Router;
- lazy load dispatcher dashboards/charts;
- lazy load photo viewer zoom tools;
- lazy load PDF preview;
- lazy load manager analytics.

## 13.3 Virtualization

Use virtualization for:

- dispatcher queues;
- work order history;
- materials catalog lists;
- notifications;
- audit logs;
- manager drill-down tables.

Avoid virtualization for small mobile forms where it can break focus/keyboard behavior.

## 13.4 Image optimization

- generate local thumbnails;
- display thumbnails in lists;
- load full image only in viewer;
- revoke object URLs;
- avoid storing base64 images in React state;
- use workers for compression;
- limit concurrent uploads.

## 13.5 Caching

- app shell cached by service worker;
- static assets cached with immutable strategy;
- API data cached by React Query with domain-specific stale time;
- critical offline data persisted in IndexedDB;
- dashboard data uses short TTL and background refresh.

## 13.6 Background sync

- use service worker background sync where supported;
- fallback to foreground sync manager;
- throttle sync on repeated failures;
- pause non-critical work on low battery if detectable and policy requires.

## 13.7 Bundle control

- strict import boundaries;
- avoid importing desktop-only widgets into mechanic mobile routes;
- split chart/map libraries;
- analyze bundle regularly;
- keep shared UI lightweight;
- prefer native browser APIs for camera/file where possible.

---

# 14. Security architecture

## 14.1 Protected routes

- route group layout checks session;
- role-specific route guard;
- unauthorized redirect by role;
- forbidden screen for insufficient permission;
- no sensitive route content before auth state resolved.

## 14.2 Role permissions

Permission model exposed to frontend:

- role;
- org/team scope;
- feature flags;
- action permissions;
- object-level permissions returned by API when needed.

Frontend uses permissions to hide/disable actions, but backend remains source of truth.

## 14.3 Secure storage

Storage rules:

- access token in memory when possible;
- refresh token in secure httpOnly cookie if backend architecture allows;
- if native-like PWA token storage is required, minimize lifetime and encrypt sensitive local data where possible;
- do not store signed URLs long-term;
- do not store secrets in localStorage;
- sensitive IndexedDB data has retention cleanup.

## 14.4 Token refresh

- refresh before expiry;
- pause sync during refresh;
- resume after refresh;
- if refresh fails, preserve local drafts and route to session expired;
- WebSocket reconnects after token refresh.

## 14.5 File access security

- request signed preview URL on demand;
- short TTL;
- do not push signed URLs through general events;
- revoke object URLs locally;
- prevent accidental leakage in logs/toasts.

## 14.6 XSS and data safety

- no unsafe HTML from backend;
- sanitize rich text if ever introduced;
- CSP configured in Next middleware/headers;
- strict TypeScript and Zod parsing of API payloads;
- never trust local draft data when submitting.

---

# 15. PWA architecture

## 15.1 Service worker responsibilities

- cache app shell;
- cache static assets;
- handle offline fallback pages;
- coordinate background sync where supported;
- receive push notifications if enabled;
- manage update lifecycle.

## 15.2 Caching strategy

| Resource | Strategy |
| --- | --- |
| app shell | cache-first with versioning |
| static assets | immutable cache |
| API GET assignments | network-first, fallback IndexedDB |
| material catalog | stale-while-revalidate + IndexedDB |
| photos | explicit signed URL fetch, no broad caching |
| drafts | IndexedDB source of truth |
| sync operations | IndexedDB durable queue |

## 15.3 Install flow

- PWA install prompt only after user login or profile screen;
- no marketing onboarding;
- explain operational value: offline access, camera, faster launch;
- detect installed mode;
- show update/reload status in profile.

## 15.4 Offline mode

Offline UX:

- persistent indicator;
- local save confirmations;
- pending sync count;
- disabled online-only actions with reason;
- sync queue access;
- conflict resolution after reconnect.

## 15.5 App updates

- service worker detects new version;
- if user has active draft, do not force reload;
- show banner: update available;
- allow update after saving local draft;
- handle schema migrations before app starts;
- if app version incompatible with backend, force update with draft preservation.

## 15.6 Cache invalidation

- version static caches by build id;
- invalidate entity cache by server cursor;
- invalidate material catalog by dictionary version;
- invalidate permissions on token refresh/current-user fetch;
- clear signed URL cache on expiry.

---

# 16. API client architecture

## 16.1 API client layers

```text
/shared/api
  http-client.ts
  api-error.ts
  api-result.ts
  auth-interceptor.ts
  idempotency.ts
  retry-policy.ts
  endpoints.ts
```

Responsibilities:

- base URL;
- auth headers;
- correlation id;
- idempotency key;
- request timeout;
- typed error parsing;
- retry rules for safe requests;
- no domain logic.

## 16.2 Entity API modules

Each entity owns typed API functions:

```text
/entities/work-order/api
  work-order.api.ts
  work-order.queries.ts
  work-order.mutations.ts
  work-order.keys.ts
```

Rules:

- raw API functions return parsed DTOs;
- React Query hooks live next to entity/feature;
- Zod validates critical responses at boundaries;
- mutations map backend errors to UI-friendly error models.

## 16.3 Idempotency

All mutating feature commands generate:

- `Idempotency-Key`;
- `X-Client-Operation-Id` for offline operations;
- `offlineClientId` for local aggregate mapping.

Keys are stored with sync operation until server confirms success.

---

# 17. Scaling strategy

## 17.1 Scaling teams

Architecture supports teams by domain:

- work order team owns `entities/work-order`, related features and widgets;
- field mobile team owns mechanic shell, offline sync and photo capture;
- dispatcher team owns review workspace and queues;
- platform team owns shared UI, query, auth, PWA, IndexedDB;
- analytics team owns manager widgets.

## 17.2 Import boundaries

Use lint rules:

- `shared` cannot import app/entities/features/widgets;
- `entities` cannot import features/widgets;
- `features` can import entities/shared only;
- `widgets` can import features/entities/shared;
- `app` composes widgets/processes only.

## 17.3 Testing strategy

Recommended frontend tests:

- unit tests for schemas/selectors;
- component tests for shared UI and feature controls;
- integration tests for work order form flow;
- IndexedDB repository tests;
- Playwright E2E for create draft → add photo → sign → queued submit;
- offline mode E2E using network interception;
- accessibility checks for touch targets and labels.

## 17.4 Release strategy

- feature flags for risky modules;
- role-scoped rollout;
- PWA update monitoring;
- migrations for IndexedDB;
- rollback strategy for service worker;
- error reporting by app version/build id.

---

# 18. Production readiness checklist

1. Routes separated by role groups and guarded.
2. Server state is managed by TanStack Query, not duplicated in Zustand.
3. Local durable offline data lives in IndexedDB, not React state/localStorage.
4. Work order draft autosave survives refresh, app kill and session expiry.
5. Photo blobs are recoverable until synced or explicitly deleted.
6. Mutations are idempotent and compatible with backend offline sync.
7. Forms use React Hook Form + Zod with draft and submit schemas.
8. Design system tokens are centralized and enforced through Tailwind/shadcn/ui.
9. Mobile mechanic UI has 56 px recommended touch targets.
10. Desktop dispatcher UI supports queues, split panels and photo review.
11. WebSocket events reconcile query cache without unsafe overwrites.
12. Error boundaries exist at app, route and widget levels.
13. PWA service worker has versioning, update flow and cache invalidation.
14. Bundle splitting prevents dispatcher/manager code from bloating mechanic routes.
15. Security model includes route guards, token refresh and protected file access.
16. Offline mode is a first-class state, not a generic network error.
17. Upload queue handles retry, expired signed URLs and pending attach operations.
18. Performance strategy accounts for low-end Android and large photos.
