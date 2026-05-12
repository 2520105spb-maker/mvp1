# НеоЛифт ERP/PWA — Import, Migration & Master Data Management

This module is the enterprise data onboarding and migration foundation for the industrial ERP. It is not a simple Excel uploader; it is a governed data operations platform for mass loading elevators, objects, warehouse balances, customers, users, contracts and MDM reference data.

## 1. Import architecture

The import center is built around `ImportJobs`, `ImportTemplates`, `ImportMappings`, `ValidationErrors`, `ImportHistory`, `DataSources`, `MasterData`, `DuplicateCandidates`, `RollbackSnapshots` and `FileUploads`. Every file enters a quarantined upload state, is parsed into row groups, validated asynchronously, previewed, imported transactionally and stored with a signed report.

## 2. Migration workflows

Core workflows are:

- Elevator import: analyze Excel, detect sheets, map columns, validate passport/object/contract fields, detect duplicate factory numbers and addresses, preview changes, run batch import and generate report.
- Warehouse import: import materials, balances, warehouses, SKU aliases, categories and suppliers from XLSX/CSV/ZIP.
- Object import: import addresses, entrances, customers, SLA categories, service types and dispatcher zones.
- User/customer/contract import: create or update identity, organization and contractual master records under RBAC control.

## 3. Mapping engine

The mapping engine combines column names, sample values, saved templates, MDM aliases and AI suggestions. It stores confidence scores, required-field flags, transforms and review states. Mappings can be saved as versioned templates and reused for recurring legacy exports.

## 4. Validation engine

Validation covers required fields, data types, duplicate checks, missing references, address quality, SKU existence, broken relationships and MDM alias resolution. Rules are designed to run asynchronously on row groups so large files can be validated without blocking the UI.

## 5. Duplicate detection logic

AI-assisted duplicate detection compares factory numbers, normalized addresses, customer names, material names, SKU aliases and users. Candidates are assigned confidence levels and resolutions: merge, skip, create new or manual review.

## 6. Rollback architecture

Before transactional import, the system creates rollback snapshots for affected records. Rollback can be full or partial, is protected by permission checks, and is stored with audit events and expiry policy. Rollback workers restore previous values in batches.

## 7. MDM architecture

The MDM workspace governs reference tables: elevator types, manufacturers, work types, materials, nodes, emergency categories, SLA categories and object types. Each reference has versioning, dependency warnings, usage statistics and alias management.

## 8. File processing pipeline

Pipeline stages are chunked upload, virus scanning, streaming parse, AI mapping, async validation, duplicate detection, normalization, transactional import and report generation. XLSX, CSV, ZIP archives and multi-sheet imports are first-class inputs.

## 9. Batch processing architecture

Background queues are split by parse, validate, deduplicate, normalize, transactional import and rollback. Jobs support retries, partial success, resumable processing and progress reporting. Large files are chunked and row groups are committed at safe transaction boundaries.

## 10. Import UX

The workspace is operational: left panel for import types, templates, recent jobs and queues; central workspace for Upload, Mapping, Validation, Preview, Import and Report; right panel for validation errors, duplicate warnings, AI recommendations, statistics and affected records.

## 11. Realtime processing architecture

Realtime channels publish upload progress, parser status, validation counters, duplicate candidates, queue worker health, import notifications and report availability. Mobile users can inspect status, review errors, approve imports and view reports.

## 12. Queue architecture

Workers are specialized by queue type. Parser workers stream large Excel sheets, validation workers evaluate rules, AI dedupe workers compare similarity signatures, normalization workers canonicalize values, importer workers commit transactions and rollback workers restore snapshots.

## 13. Security architecture

Security requirements include import permissions, rollback permissions, audit logs, secure uploads, checksum verification, virus scanning, quarantined files, immutable reports, RBAC-protected MDM writes and transactional safety.

## 14. Data normalization strategy

Normalization canonicalizes addresses, phone numbers, manufacturer names, SKU aliases, material categories, SLA names and customer legal entities. Changes are traceable and can be promoted into MDM aliases after approval.

## 15. Production ERP migration architecture

The module is ready to connect to backend services for object storage, antivirus, queue workers, streaming parsers, validation APIs, duplicate-matching services, transactional import APIs, audit logging and rollback orchestration.
