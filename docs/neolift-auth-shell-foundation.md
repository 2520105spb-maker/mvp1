# НеоЛифт ERP/PWA — Authentication, Authorization & App Shell Foundation

This document describes the production foundation layer implemented for the industrial ERP/PWA. It is intentionally not a marketing login page or generic admin template; it is the security and navigation substrate for dispatcher, mechanic, warehouse, supervisor, director and administrator workflows.

## 1. Auth architecture

- Login accepts login/password, a remembered terminal flag and a role-backed demo session.
- The frontend models JWT access tokens, refresh token expiry, device sessions, session restore and forced logout reasons.
- Session state is held in a Zustand store, persisted to `sessionStorage` for active tabs and mirrored to a minimal offline cache envelope in `localStorage`.
- The app registers a PWA service worker only after the authenticated shell mounts.

## 2. RBAC architecture

Roles are: Mechanic, Dispatcher, Warehouse, Supervisor, Director and Administrator. Each role receives an explicit permission list. Permissions protect pages, actions and object-scope checks. Object access follows the industrial rules:

- Mechanic: assigned objects only.
- Dispatcher: delegated region and territories.
- Warehouse: linked warehouses plus work-order material flows.
- Supervisor: delegated regions, KPIs and approvals.
- Director: organization-wide read and executive approvals.
- Administrator: organization-wide RBAC, users, audit and system settings.

## 3. Session architecture

- Access token lifetime: 12 minutes.
- Refresh token lifetime: 14 days for remembered terminals and 1 day for non-remembered sessions.
- Inactivity timeout policy: 20 minutes.
- Concurrent session limit: 5 devices.
- Forced logout channels: role change, disabled user, revoked device or security incident.
- Device tracking includes device name, IP, trust state, current marker and risk level.

## 4. App shell architecture

The shell provides a mobile-first and desktop-aware layout:

- Desktop: persistent sidebar, protected workspace, split notifications panel and top status bar.
- Mobile: sticky top bar, bottom navigation, safe-area padding, sync status and fast notification access.
- Global realtime area: emergency alerts, SLA alerts, approval notifications, online status and sync queue.

## 5. Navigation system

Navigation sections are Dashboard, Objects, Elevators, Work Orders, Warehouse, Dispatch, Analytics, Users and Settings. Each nav item is tied to a permission and is hidden when the active user lacks access.

## 6. Dashboard architecture

Dashboards are role-based:

- Mechanic: today's jobs, drafts, offline sync and urgent tasks.
- Dispatcher: new work orders, emergency requests, SLA alerts and active mechanics.
- Warehouse: reservations, shortages, returns and write-off approvals.
- Supervisor/Director: KPI, problematic objects, repeat visits and efficiency.
- Administrator: users, roles, audit and active device sessions.

## 7. Admin panel architecture

The administrator workspace covers user management, roles, permission matrix, object access scopes, audit logs and system settings. Write actions are disabled unless `users:write` is present.

## 8. User management workflows

The user workflow supports invite/create, assign role, map department, assign region/territory/object scope, activate/suspend/deactivate, edit trusted devices, revoke sessions and review audit history.

## 9. Protected routes logic

Next.js middleware checks the presence of an access token cookie and role cookie before private routes load. It then compares route requirements with the role permission matrix and redirects unauthorized users back to the dashboard with a denial marker. Client-side controls repeat the checks before showing navigation and action buttons.

## 10. Offline auth logic

The offline foundation stores a limited cache envelope with user identity, permission list and `offlineCacheUntil`. It is designed for field-service continuity when a mechanic loses network access but must complete assigned objects and sync photos, signatures and materials later.

## 11. Realtime notification architecture

The shell reserves a realtime panel for websocket/SSE channels: emergency alerts, SLA escalation, approvals, device/session events, online presence and sync-state updates. The UI separates critical emergency alerts from normal approval notifications.

## 12. Security architecture

- RBAC with explicit permission matrix.
- Route guards in middleware and repeated client-side action checks.
- Token refresh lifecycle and refresh token family model.
- Secure production recommendation: store refresh tokens in httpOnly cookies and keep access tokens short-lived.
- Audit logs for role changes, session revocation, offline restore and security events.
- Brute-force protection and device risk scoring are modeled as first-class policy requirements.

## 13. PWA foundation

The PWA layer includes manifest, service worker shell cache, install/update policy, offline mode policy, splash colors and background sync assumptions. It prioritizes draft preservation and field-service safety over decorative app behavior.

## 14. Layout system

The visual foundation uses dark navy, graphite panels and orange signal accents. Components are rugged, dense and operational: cards, badges, alerts, shell sidebars, mobile bottom nav, status pills and split panels.

## 15. Production frontend foundation

The implementation is ready to connect to a backend identity service. Replace demo token generation with the auth API, move refresh tokens to httpOnly cookies, hydrate permissions from signed claims/server session introspection and back realtime alerts with websocket or SSE infrastructure.
