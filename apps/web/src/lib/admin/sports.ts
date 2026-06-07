// ============================================================
// SwingVantage Admin — sport labels (isomorphic, client-safe)
// ------------------------------------------------------------
// Pure label map usable from BOTH server adapters and client table
// components, so client components never need to import a server-only
// data module just to render a sport name.
// ============================================================

export const ADMIN_SPORT_LABELS: Record<string, string> = {
  golf: 'Golf',
  tennis: 'Tennis',
  pickleball: 'Pickleball',
  padel: 'Padel',
  baseball: 'Baseball',
  softball_slow: 'Slow-pitch Softball',
  softball_fast: 'Fast-pitch Softball',
};

export function sportLabel(id: string): string {
  return ADMIN_SPORT_LABELS[id] ?? id;
}

/** Short form for dense tables. */
export const ADMIN_SPORT_SHORT: Record<string, string> = {
  ...ADMIN_SPORT_LABELS,
  softball_slow: 'Slow-pitch',
  softball_fast: 'Fast-pitch',
};

export function sportShort(id: string): string {
  return ADMIN_SPORT_SHORT[id] ?? id;
}
