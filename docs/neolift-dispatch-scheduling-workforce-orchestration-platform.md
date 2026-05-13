# НеоЛифт ERP/PWA — Production Dispatch, Scheduling & Field Workforce Orchestration Platform

This document defines the enterprise dispatch platform for the НеоЛифт industrial field-service ERP/PWA. It is not a calendar page, kanban board or generic task assignment demo. It is a realtime operations system for elevator maintenance dispatchers, emergency coordinators, supervisors, mechanics and directors.

## 1. Dispatch architecture

Dispatch is a command-center domain around `DispatchQueue`, `TechnicianSchedule`, `Shift`, `Assignment`, `RoutePlan`, `SLAWindow`, `EmergencyDispatch`, `SkillMatrix`, `Availability`, `TravelEstimate`, `ScheduleConflict`, `DispatchEvent`, `Reassignment` and `GeoZone`. New work orders enter a triage queue, receive priority/SLA classification, are scored against technician availability, skills, route impact and region scope, then require dispatcher confirmation for operational assignment.

## 2. Scheduling engine

The scheduling engine maintains daily and weekly schedule snapshots with shift calendars, on-call windows, overtime limits, emergency overrides, route stops and versioned conflict records. Every schedule rebuild produces a new immutable schedule version so stale clients, websocket reconnects and manual overrides can be reconciled safely.

## 3. Workforce orchestration architecture

Workforce orchestration combines mechanic availability, current workload, shift status, active route, certifications, elevator specialization, emergency authorization and regional permissions. The platform balances assignment density while preserving SLA timers and avoiding overload, overtime violations and cross-region dispatch leakage.

## 4. Realtime dispatch architecture

Realtime streams are published by tenant, region, technician, geo zone, emergency and dispatcher presence. WebSocket events include job received, assignment suggested, assignment confirmed, mechanic accepted, mechanic delayed, schedule rebuilt, SLA breach, emergency escalated and reassignment requested. Clients use replay cursors after disconnect and resubscribe to schedule versions.

## 5. SLA orchestration engine

SLA windows track response due time, completion due time, minutes remaining, breach probability and escalation level. The dispatch engine ranks emergency and urgent jobs by SLA risk, starts emergency timers immediately, warns dispatchers before breach and escalates to supervisors/directors when thresholds are crossed.

## 6. Skill matrix system

The skill matrix models elevator types, brands, controllers, certifications, electrical permits, rescue authorization and emergency eligibility. Assignment scoring rejects or penalizes mechanics without required controller knowledge, manufacturer experience or passenger-rescue authorization.

## 7. Reassignment architecture

Reassignment supports sick leave, mechanic delay, emergency override, skill gap and manual dispatcher action. The engine unassigns affected jobs, recalculates workload and route impact, preserves SLA where possible and requires dispatcher approval for high-risk reassignments.

## 8. Workload balancing architecture

Workload balancing uses active assignment count, load percent, shift remaining time, travel estimates, upcoming emergency probability and route risk. It avoids overloading a single mechanic and spreads planned jobs while allowing emergency overrides with audit-protected justification.

## 9. Shift management system

Shift management includes day/night shifts, on-call rotations, breaks, weekends, sick leave, overtime and duty teams. Emergency coordinators can use audited override workflows to pull on-call mechanics into an emergency route plan.

## 10. Mobile dispatch UX

Mechanics receive assignments instantly via push/websocket, can accept or reject with reason, see route, SLA priority, passenger-risk flag, emergency status, required skills and offline fallback instructions. The mobile surface must show whether the assignment is confirmed, reassigned or superseded by an emergency reroute.

## 11. Desktop dispatch UX

The desktop Dispatch Operations Center is an industrial operations-room interface: left-side queues and geo zones, central timeline scheduling board with route-aware assignment candidates, and right-side mechanic load, SLA countdowns, route impact, AI recommendations and conflict warnings.

## 12. Audit architecture

Assignments, reassignments, SLA breaches, dispatch overrides, schedule rebuilds and emergency escalations are written as immutable dispatch audit logs with actor, schedule version, before/after state, route delta, SLA delta and hash chain.

## 13. Performance architecture

The platform supports hundreds of active jobs, concurrent dispatchers and rapid reassignment with virtualized queue rendering, Redis-backed dispatch queues, event batching, websocket fanout by tenant/region and indexed PostgreSQL schedule/assignment tables.

## 14. Observability architecture

Dispatch observability tracks SLA analytics, assignment latency, websocket lag, schedule rebuild duration, reassignment volume, workforce utilization, route estimation accuracy, emergency response times and operational bottlenecks.

## 15. Production field-service dispatch platform architecture

The platform is future-ready for AI dispatch, predictive workforce planning, route optimization, anomaly detection, traffic-aware rerouting and multi-tenant dispatch control. It is designed to match enterprise workforce orchestration systems such as ServiceTitan Dispatch and Salesforce Field Service rather than a simple calendar or board.
