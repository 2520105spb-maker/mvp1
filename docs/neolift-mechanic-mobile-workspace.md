# НеоЛифт ERP/PWA — Mechanic Mobile Workspace

This module is the production mobile workspace for field mechanics. It is not a checklist, courier screen or simple mobile task list; it is an offline-first industrial PWA for receiving work orders, opening elevator cards, capturing photos, writing off materials, collecting signatures, navigating routes and syncing work under poor network conditions.

## 1. Mobile workspace architecture

The workspace is organized around `MobileWorkOrders`, `OfflineDrafts`, `UploadQueue`, `PhotoSessions`, `MechanicRoutes`, `EmergencyCalls`, `MaterialUsage`, `Signatures`, `SyncEvents` and `OfflineCache`. The UI is thumb-friendly, dark, rugged and optimized for gloves and low-light machine rooms.

## 2. Offline-first architecture

IndexedDB stores work orders, elevator cards, photos, signatures, material usage, documents, sync queue and route cache. Data is encrypted with a device-bound key, marked with stale-data indicators and conflict metadata, and retained by TTL policy.

## 3. Sync engine

The sync engine queues work-order drafts, photos, signatures and material usage, retries failed uploads, performs background sync when the network stabilizes and resolves conflicts by entity type. Assignment state is server-authoritative; work-result drafts are merged; material conflicts go to manual review.

## 4. Photo workflow

Photo capture supports instant capture, batch capture, before/after/node/inspection/document categories, local IndexedDB storage, annotation flags, GPS/work-order watermarks, WebP compression, upload progress and retry controls.

## 5. Material write-off flow

Mechanics can write off materials, see local stock, reserve parts, search SKU and scan material QR codes. Usage is saved offline and synced to warehouse with conflict checks for stock changes.

## 6. QR architecture

QR scanning is planned for elevator QR, material QR and work-order QR. The QR payload links to cached elevator cards, material SKU records or work-order drafts so scanning remains useful offline.

## 7. Signature workflow

Customer signatures are captured as touch vector paths, validated for minimum size, stored offline and synced later. Signatures are linked to work-order reports and can be retried independently of photos.

## 8. Emergency UX

Emergency calls use fullscreen alerts, vibration pattern metadata, priority UI, fast accept and navigation shortcut. The emergency flow works even if normal dashboard widgets are stale.

## 9. Elevator mobile card architecture

The elevator card exposes passport, registration number, model, controller, status, AI health score, nodes, recent repairs and offline documents so the mechanic can work in basements or machine rooms without network.

## 10. Camera system

The camera system is designed for Camera API capture, compression, watermarking, batch capture, retryable uploads and future AI validation for blurry, dark, duplicate and missing required photos.

## 11. Notification architecture

Notifications include emergency push, assignment updates, sync alerts, SLA warnings and warehouse alerts. Delivery is role- and assignment-scoped and supports mobile push after PWA install.

## 12. PWA architecture

The PWA install flow includes trusted device auth, splash screen, service-worker shell caching, offline mode, app updates and Background Sync API for uploads and signatures.

## 13. Security architecture

Security requires device auth, encrypted offline cache, session expiration, secure upload URLs, document permissions and audit logs for offline submission, signatures and material usage.

## 14. Performance architecture

The module is optimized for poor internet, large photos, background sync and hundreds of cached work orders through lazy loading, local caching, media compression and queue batching.

## 15. Production mechanic mobile platform architecture

The implementation is ready to connect to backend work-order APIs, IndexedDB persistence, Camera/Barcode APIs, service-worker Background Sync, secure media storage, push notifications and future AI for photo validation, voice notes, OCR, predictive suggestions and auto-filled work orders.
