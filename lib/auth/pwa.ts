import type { SyncState } from "./types";

export const DEFAULT_SYNC_STATE: SyncState = {
  network: "online",
  pendingMutations: 7,
  lastSyncedAt: "2026-05-09T08:42:00.000Z",
  backgroundSync: "running",
};

export const PWA_FOUNDATION = {
  manifest: "/manifest.webmanifest",
  serviceWorker: "/sw.js",
  installPrompt: "show only after successful authenticated session restore",
  updateFlow: "download in background, notify supervisor-safe restart, preserve drafts",
  offlineMode: "cache session envelope, permissions, navigation, assigned objects and pending mutations",
  splash: { background: "#07111f", accent: "#ff7a1a", name: "НеоЛифт ERP" },
};
