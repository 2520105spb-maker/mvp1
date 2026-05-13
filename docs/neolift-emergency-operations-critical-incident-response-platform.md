# НеоЛифт Emergency Operations, Аварийный Dispatch & Critical Incident Response Platform

This document defines a production emergency operations platform for an industrial elevator field-service ERP/PWA. It is a command-center architecture for life-safety incidents, аварийные заявки, critical SLA control, realtime dispatch orchestration, escalation, mobile mechanic response, audit, and recovery.

## 1. Emergency architecture

The platform is split into five production planes:

1. **Command plane** — desktop emergency command center for dispatchers, emergency coordinators, supervisors, and directors.
2. **Mobile response plane** — mechanic PWA emergency alert, accept/reject, route, status, rescue checklist, and offline-safe event capture.
3. **Realtime plane** — WebSocket fanout backed by Redis Streams for incident updates, mechanic movement, ETA drift, SLA ticks, communication delivery, and escalation acknowledgements.
4. **Decision plane** — emergency orchestration engine, critical SLA engine, escalation engine, predictive risk scoring, and smart reassignment.
5. **System-of-record plane** — PostgreSQL emergency incident, dispatch, assignment, timeline, communication, SLA timer, audit log, and compliance records.

## 2. Core emergency entities

The domain model includes `EmergencyIncident`, `EmergencyDispatch`, `IncidentPriority`, `EscalationChain`, `EmergencyResponse`, `SLAIncidentTimer`, `CriticalAlert`, `EmergencyAssignment`, `IncidentTimeline`, `IncidentStatus`, `EmergencyGeoZone`, `IncidentAuditLog`, `IncidentCommunication`, and `EmergencyQueue`.

Priorities are `Critical`, `High`, `Medium`, and `Low`. Statuses cover intake, triage, dispatching, accepted, en route, on site, stabilized, resolved, SLA risk, communication risk, and escalation.

## 3. Incident orchestration engine

The orchestration engine ranks candidate mechanics and response strategies using:

- SLA severity and remaining response window.
- Human-safety priority, including trapped passenger count.
- Mechanic proximity, live traffic ETA, and reroute availability.
- Elevator-controller certifications and rescue authorizations.
- Emergency readiness score, tools, PPE, and rescue kit availability.
- Geo availability, stale GPS state, zone risk, and nearest mechanic detection.
- Shift state, on-call coverage, overtime exposure, and fatigue policy.
- Current escalation level and emergency override constraints.

The engine outputs assignment recommendations, reassignment candidates, fallback communication plans, escalation timing, and command-owner changes.

## 4. Critical SLA engine

The SLA engine starts immediately at emergency call intake, not after assignment. It maintains countdown timers, warning thresholds, supervisor/director escalation thresholds, breach prediction, breach state, and emergency override state.

Breach prediction uses live ETA, mechanic acknowledgement latency, traffic snapshots, stale GPS confidence, route optimization state, lost contact signals, and incident zone congestion.

## 5. Escalation architecture

Escalation supports dispatcher escalation, supervisor escalation, director escalation, multi-step auto-escalation, and emergency override. Every escalation step has a due time, role owner, acknowledgement requirement, fallback channel, and audit hash.

Emergency override requires a reason, command owner, scope-limited RBAC permission, immutable audit record, and post-incident review flag.

## 6. Emergency dispatch integration

Emergency dispatch integrates with normal dispatch but runs a higher-priority queue. Redis priority queues separate critical human-safety incidents from SLA-risk and degraded-communication incidents. Emergency assignment can preempt routine jobs, trigger route rebuilds, and lock conflicting work orders until command review.

## 7. Incident timeline architecture

Timeline events include dispatch events, mechanic accept/reject, arrival events, communication delivery, failed push, fallback voice call, escalation, status changes, SLA ticks, geo events, reroutes, stale GPS, and final resolution.

The timeline is append-only and supports replay after WebSocket reconnects by stream offset.

## 8. Emergency communication system

Communication channels include push notifications, realtime WebSocket alerts, SMS-ready adapters, Telegram-ready adapters, and voice-call integration foundations. The communication engine tracks delivery, acknowledgement, failures, fallback escalation, and lost-contact risk.

## 9. Geo emergency integration

Geo integration provides nearest mechanic detection, emergency routing, traffic-aware ETA, geo SLA tracking, incident zones, stale GPS handling, route optimization, and emergency rerouting. Geo decisions include confidence and are preserved in audit logs.

## 10. Mobile emergency UX

Mechanics receive an unmistakable critical alert with priority, address, passenger-safety context, elevator identity, SLA target, fastest route, accept button, cannot-accept reason, quick status actions, and communication fallback. Offline mechanics can record status transitions locally, but command center marks those events as pending until sync.

## 11. Desktop emergency UX

Desktop UX is an industrial emergency command center, not a ticket page. It has:

- Left panel: active incidents, critical queue, SLA risks, escalation queue, offline mechanics, delayed responses.
- Center board: realtime incident stream, SLA countdowns, emergency map, mechanic status, dispatch timeline, escalation states.
- Right panel: incident timeline, escalation chain, communication status, AI emergency recommendations, and risk predictions.

## 12. Audit architecture

The audit layer logs incident lifecycle, SLA timer starts, SLA breaches, escalation decisions, emergency overrides, response times, communication events, assignment scoring inputs, route changes, and resolution outcomes. Audit records are hash-chained for tamper evidence.

## 13. Performance architecture

The platform is designed for concurrent incidents, websocket-heavy workflows, critical push delivery, and realtime rendering. Redis Streams batch high-frequency events, WebSocket topics are scoped by tenant/region/incident, SLA ticks are aggregated where possible, and React rendering is split by panels to avoid repainting the full command center.

## 14. Observability architecture

Operational metrics include incident intake rate, response-time distribution, SLA breach rate, predicted-vs-actual ETA error, escalation latency, push delivery latency, lost-contact frequency, reassignment success, command acknowledgement latency, WebSocket reconnects, and Redis queue lag.

## 15. Failure recovery architecture

The platform survives WebSocket disconnects, stale GPS, failed push delivery, offline mechanics, and partial sync failures. Recovery uses stream replay offsets, fallback channels, stale-data markers, mechanic availability degradation, idempotent timeline writes, local PWA mutation queues, and command-center reconnect banners.

## 16. Production emergency operations platform

Production deployment requires tenant/region incident isolation, emergency RBAC, secure escalation, audit protection, encrypted communication payloads, incident data retention rules, command-owner traceability, priority queue backpressure, and post-incident analytics for continuous SLA improvement.
