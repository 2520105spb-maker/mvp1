# НеоЛифт ERP/PWA — Dashboard, Home Workspace & Operational Control Center

This module is the production operational home for the elevator field-service ERP. It is not an analytics landing page or admin template; it is a role-based realtime command center for mechanics, dispatchers, warehouse operators, supervisors, directors and administrators.

## 1. Dashboard architecture

The dashboard is composed from role-filtered widgets, realtime panels, operational streams, alerts, quick actions and KPI blocks. It is the default workspace after login and is designed to summarize field operations, SLA risks, warehouse constraints, emergency events, offline sync and business control signals.

## 2. Widget system

Widgets are registered with kind, role access, permission, pinned state, lazy-loading flag, density and refresh interval. The UI supports pinned modules, saved layouts, compact/comfortable/command densities and future drag-rearrange behavior.

## 3. KPI engine

KPI records are role-scoped and severity-aware. Dispatcher KPIs focus on active calls, emergency queue, delayed mechanics, returns and approvals. Warehouse KPIs focus on low stock, reservations, suspicious write-offs and deliveries. Supervisor/director KPIs include SLA %, аварии, repair time, open work orders, overdue jobs, active mechanics and future profitability.

## 4. Realtime stream architecture

The operational stream is modeled for WebSocket/SSE ingestion with batched updates. Events include new work order, emergency call, work order approved, mechanic online, overdue SLA, low stock, failed upload and route delay. Each event carries role access and unread state.

## 5. Alert system

Unified alerts cover аварии, SLA violations, overdue ТО, upload failures, warehouse risks, missing photos and AI anomalies. Alerts include severity, escalation level, optional object/work-order references and SLA countdown metadata.

## 6. Operations map architecture

The map widget is a GIS adapter surface for mechanics, objects, emergencies, routes and SLA risk layers. It is designed to connect to Mapbox, Yandex Maps, 2GIS or internal GIS and to enforce realtime permissions before publishing locations.

## 7. Role-based dashboard logic

Each dashboard role sees a different home: mechanic gets today jobs, route, urgent calls, offline sync, pending uploads, materials and SLA timer; dispatcher gets queue/emergency/SLA/mechanic/map controls; warehouse gets stock and reservation control; supervisor/director get KPI, аварийность, SLA, problem objects and productivity; administrator gets system and sync control.

## 8. Mobile dashboard UX

Mobile UX is touch-first and urgency-focused. Mechanics see compact widgets, route status, SLA timers, materials, uploads and offline state instead of dense maps/charts. Notifications and quick actions remain reachable with large tap targets.

## 9. Desktop workspace UX

Desktop UX is a three-column command center: left alert center, central operational stream/workspace, and right KPI/AI/trends panel. The design prioritizes realtime operations over decorative charts.

## 10. Notification center architecture

Notifications aggregate unread events, escalation alerts, push sync and mobile notifications. Delivery is role-filtered so users only see events and escalations they are permitted to act on.

## 11. Offline dashboard logic

Offline state stores cached dashboard snapshots, stale-data minutes, pending sync count and reconnect policy. Reconnect behavior batches events, refreshes KPI snapshots, replays uploads and preserves personalized layout state.

## 12. Personalization system

Layout profiles store role, layout ID, pinned modules, density and last save time. The production implementation should persist these profiles per user and device and support rearrange widgets, save layouts, pin modules and customize home screen.

## 13. Performance architecture

Realtime widgets use lazy loading, role-filtered subscriptions, batched WebSocket payloads, incremental updates, cache snapshots and refresh intervals. This supports hundreds of concurrent users and live widgets without flooding clients.

## 14. Security architecture

Security requirements include role-based widget visibility, secure KPI access, realtime permission checks, notification permissions, map-location scoping, audit logs for actions, and no cross-region event leakage.

## 15. Production ERP dashboard architecture

The module is ready for backend connection to WebSocket/SSE streams, KPI aggregation APIs, route/GIS services, notification push, offline cache, AI analytics, predictive maintenance, finance widgets, IoT telemetry and customer portal integration.
