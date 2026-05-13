# НеоЛифт ERP/PWA — Enterprise Authentication, Identity & Session Management Platform

This document defines a production identity platform for the НеоЛифт industrial field-service ERP/PWA. It is not a login page, Firebase demo or simple JWT sample. The platform governs users, devices, sessions, refresh-token families, offline mechanics, permissions, audit trails and operational security for elevator maintenance teams.

## 1. Authentication architecture

Authentication is a server-side command workflow: validate tenant, normalize login, check rate limits, verify Argon2id password hash, evaluate account status, register or match the device fingerprint, create a device-bound session, issue a short-lived access token and set an HttpOnly refresh cookie. Credentials never reach client storage. Successful and failed decisions write immutable security events and login attempts.

## 2. Identity architecture

Identity is modeled around `IdentityUser`, assigned `Role`, granular `Permission`, scoped `UserRoleAssignment`, trusted devices, sessions, refresh-token families, password reset requests, login attempts, security events, auth audit logs and offline sessions. Roles include Mechanic, SeniorMechanic, Dispatcher, Warehouse, Supervisor, Director and Administrator.

## 3. Session management architecture

Access tokens are short-lived and refresh tokens rotate on every use. The session store is the source of truth for user id, tenant id, device id, IP/user-agent metadata, rotation counters, last activity, forced logout reason and revocation timestamps. Refresh-token reuse detection invalidates the whole family and records a critical security event.

## 4. Offline auth architecture

Offline authentication is available only to trusted mechanic and senior mechanic devices. After online login, the server issues an encrypted offline grant with role snapshot, device fingerprint hash, assigned object scope, expiration and sync cursor. The PWA stores the grant in an IndexedDB vault encrypted with WebCrypto-derived keys. Reconnect requires proof of the offline grant, device match, refresh rotation and replay of offline operations before a new online access token is issued.

## 5. RBAC implementation

RBAC combines global role permissions with tenant, region, territory, object and warehouse scopes. Mechanics are limited to assigned work orders and objects. Senior mechanics can approve brigade work in assigned territories. Dispatchers can assign and route within regions. Warehouse users can issue and approve stock operations for linked warehouses. Directors and administrators receive organization-wide governance permissions.

## 6. Permission engine

The permission engine evaluates three layers: action permission, entity scope and command-specific constraints. A user must have the permission string, pass region/object/warehouse scope checks and satisfy workflow invariants such as approval thresholds, device trust, session risk and offline command eligibility.

## 7. Device management system

Devices are first-class identities with fingerprint hashes, platform, trust state, offline capability, last seen metadata and revocation markers. Lost-device handling revokes trusted device access, invalidates active sessions, marks offline grants as denied on reconnect and pushes realtime forced logout to online clients.

## 8. Security event architecture

Security events include login, logout, failed login, password reset, device registration, device revoke, session revoke, refresh rotation, permission change, offline reconnect and suspicious activity. Events are immutable, tenant-scoped, hash-linked and emitted to audit dashboards and anomaly detection jobs.

## 9. API security architecture

API security uses secure middleware for tenant resolution, session lookup, device trust, permission guard, scope guard, CSRF validation and command idempotency. Browser auth uses HttpOnly Secure SameSite cookies. Worker and sync APIs use signed request envelopes with tenant id, device id, timestamp, nonce, trace id and HMAC signature.

## 10. PWA authentication flow

The PWA survives reload by restoring server-authenticated state through secure cookies and `/api/auth/session`. It survives offline by opening the encrypted offline vault only when the trusted-device envelope is valid and the grant has not expired. On reconnect, it refreshes the token family, syncs revoked-device markers and revalidates permissions before sending queued mutations.

## 11. Mobile auth UX

Mechanics see session state, offline access window, pending sync count, trusted-device status and reconnect warnings. The mobile UX avoids repeated password prompts during a shift while still enforcing max offline duration, biometric-ready local unlock and forced logout on reconnect if the device was revoked.

## 12. Desktop security UX

The desktop Authentication Center is an operational identity workspace with left-side identity signals, device/session/security alert navigation, a central users grid and a right-side panel for session history, devices, permission details and immutable audit trail. It is designed for administrators and security operators, not a consumer login form.

## 13. Audit logging architecture

Auth audit logs are append-only and include actor, target user, device, session, action, before/after payload, request metadata, correlation id, hash and previous hash. High-risk changes such as role updates, device revocation and password resets are written transactionally with the command and mirrored into security analytics.

## 14. Performance architecture

The platform supports concurrent sessions, token refresh storms and mobile reconnect waves through tenant/session indexes, refresh-token family indexes, Redis-backed session authorization cache, idempotent refresh rotation, batched security-event writes and websocket authorization cache invalidation.

## 15. Production enterprise identity platform architecture

The identity platform is future-ready for WebAuthn, biometric local unlock, SSO, corporate identity providers, MFA and hardware keys. Provider credentials are modeled separately from sessions, so new authenticators can be added without weakening session management, offline auth, device trust or audit guarantees.
