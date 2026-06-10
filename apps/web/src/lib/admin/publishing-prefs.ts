// ============================================================
// PublishingOS preferences — client-only localStorage helpers
// ------------------------------------------------------------
// Persists the operator's chosen command-center DESIGN DIRECTION (A/B/C) so the
// switch survives reloads and navigation — the admin picks a look once and it
// sticks until they change it again. Pure + defensive (never throws); only call
// from client components / effects. No PII, machine-local. Mirrors nav-prefs.ts.
// ============================================================

import { DIRECTIONS, DEFAULT_DIRECTION, type DirectionId } from '@/components/admin/publishing/directions';

const DIRECTION_KEY = 'swingiq-publishingos-direction-v1';

const VALID_IDS = new Set<string>(DIRECTIONS.map((d) => d.id));

/** Read the persisted direction, falling back to the default when unset/invalid. */
export function getPublishingDirection(): DirectionId {
  if (typeof window === 'undefined') return DEFAULT_DIRECTION;
  try {
    const raw = window.localStorage.getItem(DIRECTION_KEY);
    return raw && VALID_IDS.has(raw) ? (raw as DirectionId) : DEFAULT_DIRECTION;
  } catch {
    return DEFAULT_DIRECTION;
  }
}

/** Persist the chosen direction (best-effort). */
export function setPublishingDirection(id: DirectionId): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DIRECTION_KEY, id);
  } catch {
    /* quota / unavailable — preference is best-effort */
  }
}
