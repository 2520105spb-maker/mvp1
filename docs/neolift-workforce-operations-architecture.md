# НеоЛифт ERP/PWA — User Management, Employee Operations & Workforce

This module is the enterprise workforce operations foundation for an industrial elevator field-service ERP. It is not a generic users table or HR demo; it is the production control plane for mechanics, dispatchers, warehouse operators, supervisors, roles, access, skills, certifications, territories, shifts, on-call duty and performance.

## 1. Workforce architecture

The workforce model separates identity users from employee operations. Users contain login/security/session data; employees contain role, department, territory, team, status, online state, skills, object assignment, shift, work-order load and KPI data. Operational rows join users, employees, teams, territories, shifts, performance and certification risk.

## 2. User management architecture

User creation follows a governed workflow: create employee, assign role, assign region, bind objects, add skills, add certifications, assign schedule and generate access policies. MFA, session risk and audit events remain part of the user-management surface.

## 3. RBAC system

The module extends RBAC with workforce read/manage permissions and preserves granular object, region, module and action policies. Access policies support inheritance from roles and direct exceptions for temporary duty or emergency response.

## 4. Skills system

Mechanic skills include OTIS, KONE, ШУЛМ/ЩЛЗ, частотники, контроллеры, гидравлика, doors and emergency rescue. Skills are verified, leveled as basic/advanced/expert and used by dispatching recommendations.

## 5. Certification tracking

Certifications include electrical safety, height work, MGN, special systems, medical checks and industrial safety. Expired or blocking certifications prevent assignments and notify supervisors.

## 6. Shift management logic

Shifts cover day, night, on-call, vacation, sick leave and training. Shift records include start/end, overtime and can be connected to dispatch availability and mobile reminders.

## 7. Territory architecture

Territories map regions, service zones, object IDs and dispatcher ownership. Mechanics inherit object visibility from territory plus direct assignments.

## 8. Employee card architecture

The employee card contains tabs for profile, roles and permissions, skills, certifications, objects, work history, KPI, schedule, on-call duty, documents and audit actions.

## 9. KPI system

Performance metrics track work orders, returns, SLA score, average repair time, material overuse, photo quality, emergency response and repeat repairs.

## 10. AI workforce analytics

AI analytics identify overloaded mechanics, inefficient teams, burnout risk, suspicious behavior, skill gaps and assignment blockers. Recommendations are shown alongside realtime risks.

## 11. Realtime status architecture

Realtime events include online status updates, assignment changes, emergency dispatches, certification alerts and shift changes. The production backend should use websocket/SSE fan-out with role-based filtering.

## 12. Mobile UX

Mechanics should see current shift, assigned objects, schedule, KPI, notifications, certification warnings and work-order assignments on mobile.

## 13. Desktop UX

Desktop UX is an enterprise workforce center: left operations navigation, central virtualized workforce grid and full employee workspace, plus right-side realtime alerts and AI recommendations.

## 14. Security architecture

Security requires RBAC, permission inheritance, session monitoring, secure employee documents, audit logs, and document/action access controls by role, region and object.

## 15. Production workforce management architecture

The module is ready to connect to identity APIs, HRIS, dispatching, websocket presence, scheduling workers, document storage, audit pipelines and future AI services for mechanic scoring, workload prediction, burnout detection and smart dispatching.
