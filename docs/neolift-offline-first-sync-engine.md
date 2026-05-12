# НеоЛифт ERP/PWA — Offline-first Sync Engine & Resilient Field Synchronization

This module is a production offline-first synchronization platform for elevator field service. It is not localStorage caching or a demo sync indicator; it is a local-first, sync-enabled, eventually consistent field operations engine for mechanics working in basements, machine rooms and unstable mobile networks.

## 1. Offline-first architecture

The application treats the device as an authoritative local workspace while offline. Work orders, photos, material write-offs, signatures, drafts and audit logs are committed locally first, assigned idempotency keys and then synchronized when a safe network window appears.

## 2. IndexedDB architecture

IndexedDB is modeled through Dexie tables for `workOrders`, `elevators`, `objects`, `materials`, `photos`, `documents`, `drafts`, `signatures`, `pendingOperations`, `offlineQueue`, `conflictRecords`, `syncEvents` and `auditLogs`. Indexed queries support thousands of local records without loading full stores into memory.

## 3. Sync engine

The engine supports full sync, delta sync, background sync, priority sync, emergency sync and media sync. It drains operations by priority: emergencies, work orders, signatures, materials, photos and analytics, while keeping server cursors and local snapshots consistent.

## 4. Conflict resolution system

Conflicts are detected through entity versions, timestamps, server cursors and optimistic update metadata. The resolution UI shows local/server diffs, merge policies, rollback options and supervisor review paths for dispatcher/mechanic edits.

## 5. Retry engine

Retries use exponential backoff, network-aware throttling, priority boosting and manual recovery. Failed operations keep idempotency keys, retry counts, next retry timestamps and resumable upload tokens.

## 6. Offline media system

Photos and signatures are stored locally as encrypted IndexedDB/OPFS-backed blobs with manifests, checksums, compression queue state and resumable chunk metadata. Media uploads survive reloads, restarts and crashes.

## 7. Local drafts architecture

Mechanics can save and restore local drafts for forms, checklists, materials, photos and signatures. Dirty fields, encrypted blob keys, expiry windows and completion percent are stored so work can continue later.

## 8. Background sync logic

The service worker schedules background sync after reconnect, app reopen and network improvement. Background jobs check device authorization, session TTL, network quality and priority before draining the queue.

## 9. Device management

Device state tracks authorization, websocket connection, service worker state, storage usage, battery, last seen timestamp and background sync availability. Remote logout and lost-device recovery revoke cursors and force local data wipe.

## 10. Mobile offline UX

Mechanics always see whether the system is offline, what is saved locally, what is not sent, whether sync is running and which operations require attention. Emergency actions remain available even during unstable connectivity.

## 11. Security architecture

Offline security includes encrypted local storage, device-bound keys, signed sync requests, audit hash chains, session expiration, secure cached data, authorization checks and wipe-on-revocation behavior.

## 12. Performance architecture

Performance is built around Dexie indexes, metadata-first queries, lazy sync, partial sync, snapshot cursors, storage cleanup, media compression queues and throttled background jobs for long offline periods.

## 13. Realtime/offline hybrid architecture

Online mode uses WebSockets for realtime work-order, stock and dispatch updates. When sockets degrade, the system falls back to local mutations and delta reconciliation, then seamlessly reconnects and refreshes React Query projections.

## 14. Observability system

Sync sessions, events, retry analytics, offline audit logs, conflict records, device diagnostics and queue metrics provide field observability for support teams and supervisors.

## 15. Production field synchronization platform architecture

The implementation is ready to connect to native camera/media storage, Dexie/IndexedDB, service-worker Background Sync API, WebSocket streams, conflict APIs, delta endpoints, upload workers, encryption key management, device MDM and future local AI/IoT telemetry synchronization.
