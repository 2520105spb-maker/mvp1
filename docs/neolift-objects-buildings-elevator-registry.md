# НеоЛифт ERP/PWA — Objects, Buildings & Elevator Registry

This module is the industrial asset registry and building operations foundation for the elevator service ERP. It is not a CRM object list or equipment catalog; it is the production system of record for buildings, entrances, elevators, SLA, documents, repairs, nodes, photos, maintenance plans and realtime events.

## 1. Objects architecture

Objects are modeled as serviced buildings with address, district, coordinates, customer, service contract, entrances, elevator IDs, SLA alerts, assigned mechanics, photo/document counts, risk level and operational status. Object access is designed to be filtered by regional permissions and assigned-object scopes.

## 2. Elevator registry architecture

Elevators are first-class ERP assets with factory number, registration number, model, controller, status, installation date, modernization date, lifetime, stops, health score, emergency counters, last repair and next maintenance date. Related models, controllers, nodes, events, photos, documents and schedules are linked by IDs for lazy loading and caching.

## 3. Building workflows

The creation workflow is: create object, normalize address, add entrances, add elevators, assign customer, bind SLA/service contract and assign mechanics. The building card then exposes overview, entrances, elevators, history, emergencies, photos, documents, SLA and analytics tabs.

## 4. Elevator card architecture

The elevator card is the core entity UI. Tabs include passport, technical characteristics, controller, nodes, repair history, emergencies, work orders, photos, documents, event log and analytics. Mobile mechanics can access the same card for history, schemes, photos, nodes and latest work.

## 5. Asset management logic

The registry grid aggregates object-level status from elevator statuses, emergency counts, overdue maintenance, SLA alerts and AI health score. Rows show address, customer, elevator count, SLA, аварийность, mechanic, status, last work, overdue ТО and health status.

## 6. Maintenance schedule engine

Schedules store recurring rules, planned dates, overdue days and SLA impact. The engine is designed to create recurring jobs, track overdue maintenance, consider SLA cycles and publish notifications to dispatchers and mechanics.

## 7. Node management system

Nodes include лебедка, двери, контроллер, станция управления, частотник, канаты, кнопки and датчики. Each node stores serial number, install date, expected life, health, last repair, failure count and photo count. Node history supports repairs, replacements, failures, photos and emergency links.

## 8. Document architecture

Documents are attached to buildings or elevators and cover passports, certificates, schemes, manuals, photos, PDFs and inspection acts. Secure documents require regional/object permissions, signed media URLs and audit logging.

## 9. Search architecture

Global search indexes addresses, elevator factory numbers, registration numbers, customers, contract numbers and model/manufacturer metadata. The production backend should use incremental indexing and permission-aware search filters.

## 10. Realtime event architecture

Realtime channels publish emergencies, new works, overdue ТО, elevator status changes and emergency alerts. Events are linked to elevators, work orders and equipment nodes.

## 11. Map integration architecture

The map view is prepared for object markers, emergency objects, problem zones, mechanic routes and SLA risk layers. The frontend layer can connect to Mapbox, Yandex Maps, 2GIS or an internal GIS adapter without changing asset domain models.

## 12. Mobile UX

Mobile UX prioritizes elevator card access, recent works, photos, schemes, documents, node state and event history. Heavy media is lazy-loaded and optimized for low-bandwidth field conditions.

## 13. Desktop UX

Desktop UX is an operations center with left object/risk navigation, central virtualized registry grid/building/elevator workspace, right realtime intelligence panel and map-based operations view.

## 14. Security architecture

Security requires object permissions, regional access, mechanic assignment filters, document permissions, secure media delivery, audit logs and immutable event history. Sensitive passports and schemes must not be directly public URLs.

## 15. Production asset management architecture

The module is ready to connect to backend asset APIs, GIS services, document storage, photo optimization pipelines, realtime event streams, maintenance scheduling workers, full-text search, and future AI services for health score, predictive maintenance, anomaly detection and repeated failure analysis.
