# НеоЛифт ERP/PWA — Notification Center, Realtime Alerts & Operational Escalation

This module is a production operational alerting platform for elevator field service. It is not a bell dropdown, toast list or simple push demo; it is a PagerDuty/Opsgenie-style command center for emergency, SLA, sync, approval, warehouse, security and AI anomaly events.

## 1. Notification architecture

The domain models `Notifications`, `Alerts`, `AlertRules`, `EscalationPolicies`, `NotificationChannels`, `PushSubscriptions`, `NotificationQueue`, `AlertHistory`, `DeliveryAttempts`, `SLAEvents`, `EmergencyEvents`, `ApprovalRequests` and `UserPreferences`. Notifications are permission-filtered and tied to work orders, elevators, objects, media, sync state, warehouse stock or approvals.

## 2. Alert engine

The alert engine evaluates event streams, dedupe keys, throttling windows, alert rules and severity mappings. It creates operational alerts for emergencies, SLA risk, overdue jobs, sync failures, missing photos, low stock, approvals, system issues, security events and AI anomalies.

## 3. Escalation system

Escalation policies define role ladders, time thresholds and channel fan-out. Example: an unaccepted emergency triggers mechanic push immediately, dispatcher escalation after 5 minutes, supervisor after 10 minutes and director/SMS after SLA breach.

## 4. Push notification architecture

PWA Push API subscriptions are device-scoped, endpoint-hashed and action-enabled. Emergency push can bypass quiet hours, show fullscreen UX, vibrate, play sound and expose quick actions such as accept, open route or call dispatcher.

## 5. SLA alert engine

SLA timers track warn, due and breach timestamps with realtime countdowns. The engine emits pre-breach warnings, breach alerts, dispatcher reroute recommendations and escalation events.

## 6. Approval workflow alerts

Approval alerts support high-cost material write-offs, unsafe closures, overtime, document access and manager chains. Approval, rejection and escalation events notify requesters and supervisors.

## 7. Multi-channel delivery architecture

Delivery supports in-app WebSocket stream, Push API, email and future SMS/Telegram channels. Queue workers handle delivery attempts, retries, throttling, batching, deduplication and provider failover.

## 8. Mobile notification UX

Mechanics see priority, saved/offline state, emergency fullscreen alerts, vibration/sound, quick action buttons and direct deep links to work orders, route shortcuts, photo recovery or approval status.

## 9. Desktop alert center UX

Desktop UX is an industrial command center: left counters and queues, central alert stream with source/object/elevator/user/status, and right-side escalation timeline, delivery status, retry diagnostics and AI risk assessment.

## 10. Realtime event system

WebSockets and event streams deliver live alert creation, status changes, read receipts, delivery updates, escalation transitions and SLA countdown changes. The UI refreshes through React Query and event replay after reconnect.

## 11. Notification history architecture

History stores alert creation, delivery, read receipts, acknowledgements, escalations, suppression and resolution logs. Delivery attempts include channel, latency, status and error reason.

## 12. Failure handling architecture

Failed push, offline devices, stale alerts and provider errors remain in the notification queue with retry windows, attempts, next retry times and escalation fallback channels.

## 13. Performance architecture

The platform is designed for thousands of alerts and concurrent users using queue batching, dedupe keys, throttling, indexed streams, event replay cursors, lazy loading and grouped notifications.

## 14. Security architecture

Sensitive alerts are permission-scoped, filtered by role/object/region, protected from leaking private details in push payloads and audited through delivery/read/escalation history.

## 15. Production operational notification platform architecture

The implementation is ready to connect to backend event buses, WebSocket gateways, Push API service workers, email/SMS providers, escalation workers, SLA timers, approval APIs, delivery analytics and future AI prioritization, predictive alerts and smart escalation.
