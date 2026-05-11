import type { NavItem } from "./types";

export const GLOBAL_NAVIGATION: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", description: "Ролевая оперативная сводка", permission: "dashboard:view", mobile: true },
  { href: "/objects", label: "Objects", description: "Договорные объекты и адреса", permission: "objects:read", mobile: false },
  { href: "/elevators", label: "Elevators", description: "Единицы оборудования", permission: "elevators:read", mobile: false },
  { href: "/work-orders", label: "Work Orders", description: "Заявки, ППР и аварии", permission: "work_orders:read", mobile: true },
  { href: "/warehouse", label: "Warehouse", description: "Запасы, выдача, резервы", permission: "warehouse:read", mobile: true },
  { href: "/dispatch", label: "Dispatch", description: "Очередь и маршрутизация", permission: "dispatch:read", mobile: true },
  { href: "/analytics", label: "Analytics", description: "KPI, SLA, надежность", permission: "analytics:read", mobile: false },
  { href: "/imports", label: "Imports", description: "Migration center и MDM", permission: "imports:read", mobile: false },
  { href: "/admin", label: "Users", description: "Пользователи, роли, аудит", permission: "users:read", mobile: false },
  { href: "/settings", label: "Settings", description: "Профиль и настройки ERP", permission: "settings:read", mobile: true },
];
