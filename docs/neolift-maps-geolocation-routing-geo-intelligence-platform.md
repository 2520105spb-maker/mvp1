# НеоЛифт ERP/PWA — Production Maps, Geolocation, Routing & Geo-Intelligence Platform

This document defines the enterprise geo-operations platform for the НеоЛифт industrial field-service ERP/PWA. It is not a Google Maps embed, map widget or delivery tracker demo. It is a realtime geospatial command system for elevator service objects, mechanics, dispatchers, emergency coordinators, supervisors and directors.

## 1. Geo architecture

Geo operations are modeled around `GeoObject`, `ElevatorLocation`, `TechnicianLocation`, `GeoRoutePlan`, `GeoRouteStop`, `GeoTravelEstimate`, `GeoZone`, `EmergencyZone`, `TrafficSnapshot`, `LocationEvent`, `ArrivalPrediction`, `GeoAssignment`, `RouteHistory` and `GeoAuditLog`. PostgreSQL/PostGIS stores points, lines and polygons with GiST indexes, while Redis batches live GPS streams and route recalculation jobs.

## 2. Routing engine

The routing engine supports Mapbox vector routes, OpenStreetMap fallback and internal cached vector tiles. It builds multi-stop routes, emergency reroutes, traffic-aware routes, SLA-aware route ordering, dynamic dispatch routing and offline movement replay with provider failover.

## 3. ETA architecture

The ETA engine combines current GPS, heading, speed, traffic snapshots, route history, mechanic availability, elevator specialization and emergency priority. It continuously recalculates standard ETA, traffic-adjusted ETA, emergency ETA and SLA breach probability.

## 4. Realtime tracking architecture

Realtime tracking uses websocket channels by tenant, technician, route and geo zone. Location updates are batched, validated for freshness/spoofing, written to time-series history and streamed to dispatchers with replay cursors after reconnect.

## 5. Geofencing system

Geofencing supports service regions, restricted zones, emergency zones, arrival detection and departure detection. Geofence events can trigger status updates, arrival logs, SLA timers, dispatcher warnings and security audit entries.

## 6. Dispatch geo integration

Dispatch assignment uses nearby mechanics, ETA, SLA timers, route impact, region permissions, traffic state and skill requirements. Emergency dispatch can override planned routing but must write an audited geo override with route and SLA deltas.

## 7. Route optimization foundation

Route optimization evaluates distance, traffic, multi-stop ordering, emergency priority, SLA windows, mechanic workload, warehouse stops and route history. It is designed for future AI route ranking and traffic anomaly detection.

## 8. SLA geo orchestration

SLA orchestration includes travel time in breach prediction. Dispatchers see countdowns on map layers, critical zones, delayed arrivals and AI warnings before SLA breach. Emergency routes start SLA countdown immediately.

## 9. Mobile map UX

Mechanics see current route, next stop, ETA, emergency priority, traffic warnings, offline navigation fallback and quick launch into native navigation. Mobile tracking continues offline and replays signed movement events on reconnect.

## 10. Desktop map UX

The desktop Geo Operations Center is an industrial operations map: left-side route/geo-risk panels, central operational map with mechanic tracking, objects, elevator locations, emergency overlays, SLA visualization, clustering and route layers, and right-side ETA/route/traffic/AI analytics.

## 11. Geo analytics architecture

Geo analytics measures route efficiency, travel time variance, mechanic utilization, emergency response metrics, ETA accuracy, traffic impact, GPS freshness and route deviation by region, mechanic and object.

## 12. Audit architecture

Geo audit logs record location movements, route changes, ETA changes, dispatch geo overrides, arrival/departure detection and emergency route decisions with actor, target, before/after geometry metadata, correlation id and hash chain.

## 13. Performance architecture

The platform supports hundreds of realtime GPS streams, concurrent dispatchers, active route recalculations and live map rendering through PostGIS indexes, vector tile caching, websocket fanout by region, location batching, viewport clustering and map virtualization.

## 14. Security architecture

Security enforces regional geo access, location privacy, device-bound GPS submission, spoofing checks, signed movement envelopes, restricted-zone permissions and audit-protected emergency overrides.

## 15. Production geo-operations platform architecture

The platform is future-ready for predictive ETA, smart routing, traffic anomaly detection, geo anomaly analysis, intelligent dispatch and multi-provider map failover. It is designed as an enterprise field-service geo-intelligence platform, not a simple map page.
