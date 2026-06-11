// ============================================================
// Admin nav preferences — client-only localStorage helpers
// ------------------------------------------------------------
// Persists per-admin sidebar UX: collapsed groups, pinned favorites, and
// recently-visited sections. Pure + defensive (never throws); only call from
// client components / effects. No PII, machine-local.
// ============================================================

const FAVORITES_KEY = 'swingiq-admin-favorites-v1';
const RECENT_KEY = 'swingiq-admin-recent-v1';
const COLLAPSED_KEY = 'swingiq-admin-collapsed-groups-v1';
const RECENT_MAX = 6;

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / unavailable — preferences are best-effort */
  }
}

// ── Favorites (pinned nav item ids) ─────────────────────────
export function getFavorites(): string[] {
  return read<string[]>(FAVORITES_KEY, []);
}

export function toggleFavorite(id: string): string[] {
  const cur = getFavorites();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  write(FAVORITES_KEY, next);
  return next;
}

// ── Recently visited (most-recent-first nav item ids) ───────
export function getRecent(): string[] {
  return read<string[]>(RECENT_KEY, []);
}

export function pushRecent(id: string): string[] {
  const next = [id, ...getRecent().filter((x) => x !== id)].slice(0, RECENT_MAX);
  write(RECENT_KEY, next);
  return next;
}

// ── Collapsed groups (group ids the admin has collapsed) ────
export function getCollapsedGroups(): string[] {
  return read<string[]>(COLLAPSED_KEY, []);
}

export function toggleGroupCollapsed(id: string): string[] {
  const cur = getCollapsedGroups();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  write(COLLAPSED_KEY, next);
  return next;
}

// ── Admin chrome theme (Coach Mode light / Coach Night dark) ─
const THEME_KEY = 'swingiq-admin-theme-v1';
export type AdminTheme = 'coach-mode' | 'coach-night';

export function getAdminTheme(): AdminTheme {
  if (typeof window === 'undefined') return 'coach-mode';
  try {
    const raw = window.localStorage.getItem(THEME_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed === 'coach-night' ? 'coach-night' : 'coach-mode';
  } catch {
    return 'coach-mode';
  }
}

export function setAdminTheme(theme: AdminTheme): AdminTheme {
  write(THEME_KEY, theme);
  return theme;
}
