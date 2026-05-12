# НеоЛифт ERP/PWA — Photo, Media & Field Documentation Operations

This module is a production field-evidence platform for elevator service operations. It is not a gallery, cloud drive or uploader demo; it controls photo evidence, PDF documents, acts, media validation, offline capture, upload recovery, OCR and AI-assisted field documentation.

## 1. Media architecture

The media domain models `MediaFiles`, `PhotoSessions`, `UploadQueue`, `WorkOrderPhotos`, `ElevatorPhotos`, `NodePhotos`, `EmergencyPhotos`, `Documents`, `PdfReports`, `MediaAnnotations`, `AIValidationResults`, `OfflineMediaCache` and `MediaVersions`. Every file is attached to a business entity: work order, elevator, node, material, emergency event, inspection or object.

## 2. Upload engine

Uploads use resumable multipart transfer with chunk checkpoints, parallel queues, priority classes, signed upload URLs, retry backoff, recovery tokens and background upload continuation. Emergency media is prioritized over routine documents and low-priority archive files.

## 3. Offline media architecture

Mechanic devices persist originals, compressed previews and upload manifests in IndexedDB. The service worker owns background sync, retry scheduling, queue recovery and network-state transitions so mechanics can capture evidence in basements and machine rooms without connectivity.

## 4. AI photo validation system

AI validation checks blur, darkness, duplicates, wrong object, unreadable documents, missing required shots and serial-number mismatches. Validation results can pass, warn, fail or route media to manual review and can block work-order closure when required evidence is missing.

## 5. OCR architecture

OCR extracts elevator serial plates, document text, invoices, certificates, manuals and scanned acts. OCR output feeds ERP search, PDF report generation, object/elevator validation and supplier/material reconciliation.

## 6. Gallery system

The gallery layer is evidence-oriented: elevator gallery, timeline gallery, before/after gallery, node gallery and emergency gallery. Galleries use business grouping, AI tags, signed thumbnails and lazy loading rather than social media presentation.

## 7. PDF generation pipeline

PDF generation builds work-order acts, service reports, audit reports, inspection reports and emergency packages from validated media, annotations, OCR text, timestamps, mechanics, customer data and signatures. Reports can be exported to archive, EDO, customer email or API consumers.

## 8. Media processing pipeline

Backend processing stages include S3 intake, image compression, thumbnail generation, EXIF extraction, OCR, AI validation, watermarking, versioning, CDN publish and archival lifecycle. Processing events are emitted for realtime UI updates.

## 9. Storage architecture

Storage uses S3-compatible buckets for hot evidence, warm documents and archive tiers. Files have immutable checksums, derived thumbnails, compressed variants, watermarked versions, short-lived signed URLs, CDN distribution and lifecycle rules.

## 10. Mobile media UX

Mechanics can capture instant photos from a work order, batch multiple angles, annotate defects, retake failed shots, inspect upload status, open PDF manuals offline and see the local upload queue. Required-photo templates guide before/after/replacement/removed-part flows.

## 11. Desktop media UX

The desktop workspace is an industrial operations center with left queue/alerts, central media grid and evidence cards, plus right-side upload statistics, validation errors, storage usage and AI recommendations. Operators manage failed uploads, missing photos, document access and report generation.

## 12. Security architecture

Security includes signed upload/download URLs, document permissions, object/elevator scoping, watermarks, audit logs, immutable original retention, version lineage, restricted schematics, checksum verification and manual-review workflows for sensitive documents.

## 13. Performance architecture

The module is prepared for thousands of photos and large PDFs using virtualized/lazy media grids, thumbnail caching, progressive image loading, incremental PDF rendering, CDN thumbnails, chunked upload streams and metadata-first search.

## 14. Realtime upload architecture

Realtime events publish upload progress, chunk failures, retry scheduling, AI validation status, OCR completion, missing-photo alerts, PDF generation updates and storage processing events. The UI is designed for WebSocket/SSE updates and React Query cache refresh.

## 15. Production field media platform architecture

The implementation is ready to connect to native camera capture, IndexedDB blob storage, service-worker background sync, S3-compatible storage, media processors, OCR workers, AI validation services, PDF renderers, audit logs and future AI for defect detection, automatic classification, predictive analysis and auto-generated reports.
