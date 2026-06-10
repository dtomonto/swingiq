// ============================================================
// Theme Lab — resolveThemeForUser() (#3 step 2). The single, documented
// resolution hierarchy that decides which theme a given user sees. PURE and
// deterministic (same inputs → same output, including experiment bucketing),
// and it returns the `source` so every decision is auditable.
//
// Priority (highest first):
//   1. forced-override   operator pin / kill-switch — wins everything
//   2. user-assignment   a direct per-user theme assignment
//   3. experiment        active A/B test — deterministic % bucket by userId
//   4. user-preference   the user's own saved choice
//   5. segment-default   a segment's default (e.g. coaches → coach-mode)
//   6. seasonal          opt-in + within a seasonal theme's date window
//   7. global-default    DEFAULT_THEME_ID (if active)
//   8. fallback          first active theme, else DEFAULT_THEME_ID
//
// A candidate is only chosen if it is ACTIVE in the registry — a retired or
// unknown theme is skipped and resolution falls through to the next tier.
// ============================================================

import type { ThemeId } from '@/lib/theme/themes';
import { DEFAULT_THEME_ID } from '@/lib/theme/themes';
import type { ThemeLabEntry } from './registry';
import { THEME_LAB_REGISTRY, isThemeActive } from './registry';

export type ThemeResolutionSource =
  | 'forced-override'
  | 'user-assignment'
  | 'experiment'
  | 'user-preference'
  | 'segment-default'
  | 'seasonal'
  | 'global-default'
  | 'fallback';

export interface ThemeExperiment {
  id: string;
  /** Variants with relative weights (need not sum to exactly 100). */
  variants: Array<{ themeId: ThemeId; weight: number }>;
}

export interface ThemeResolutionInput {
  /** Stable id used for deterministic experiment bucketing (user or anon id). */
  userId?: string | null;
  /** Operator force (pin / kill-switch). Highest priority. */
  forcedThemeId?: ThemeId | null;
  /** A direct per-user assignment. */
  assignedThemeId?: ThemeId | null;
  /** Active experiment to bucket the user into. */
  experiment?: ThemeExperiment | null;
  /** The user's own saved preference. */
  userPreferenceThemeId?: ThemeId | null;
  /** A segment's default theme. */
  segmentDefaultThemeId?: ThemeId | null;
  /** Whether the user opted into seasonal themes. */
  allowSeasonal?: boolean;
  /** Reference date for seasonal-window checks (defaults to now). */
  now?: Date;
  /** Registry override (tests / preview). */
  registry?: ThemeLabEntry[];
}

export interface ThemeResolution {
  themeId: ThemeId;
  source: ThemeResolutionSource;
}

/** Stable 32-bit string hash (djb2). Deterministic across runs/environments. */
export function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

/** Deterministically bucket a user into one of an experiment's variants by
 *  weight. Same (experimentId, userId) → same variant, always. */
export function bucketVariant(userId: string, exp: ThemeExperiment): ThemeId | null {
  const total = exp.variants.reduce((sum, v) => sum + Math.max(0, v.weight), 0);
  if (total <= 0) return null;
  const point = hashString(`${exp.id}:${userId}`) % total;
  let cursor = 0;
  for (const v of exp.variants) {
    cursor += Math.max(0, v.weight);
    if (point < cursor) return v.themeId;
  }
  return exp.variants[exp.variants.length - 1]?.themeId ?? null;
}

/** True when `MM-DD` falls inside the (year-agnostic, inclusive) window,
 *  handling year wrap-around (e.g. 12-15 → 01-05). */
export function isWithinSeasonalWindow(mmdd: string, start: string, end: string): boolean {
  if (start <= end) return mmdd >= start && mmdd <= end;
  // Wraps the new year.
  return mmdd >= start || mmdd <= end;
}

function activeSeasonalTheme(registry: ThemeLabEntry[], now: Date): ThemeId | null {
  const mmdd = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const hit = registry.find(
    (e) =>
      e.status === 'active' &&
      e.labCategory === 'seasonal' &&
      e.seasonal &&
      isWithinSeasonalWindow(mmdd, e.seasonal.start, e.seasonal.end),
  );
  return hit?.themeId ?? null;
}

/**
 * Resolve the effective theme for a user. See the priority list at the top.
 * Always returns a usable theme + the source tier that decided it.
 */
export function resolveThemeForUser(input: ThemeResolutionInput): ThemeResolution {
  const registry = input.registry ?? THEME_LAB_REGISTRY;
  const usable = (id: ThemeId | null | undefined): id is ThemeId => isThemeActive(id, registry);

  // 1. Forced override — operator pin / kill-switch.
  if (usable(input.forcedThemeId)) return { themeId: input.forcedThemeId, source: 'forced-override' };

  // 2. Direct per-user assignment.
  if (usable(input.assignedThemeId)) return { themeId: input.assignedThemeId, source: 'user-assignment' };

  // 3. Active experiment — deterministic bucket.
  if (input.experiment && input.experiment.variants.length > 0 && input.userId) {
    const picked = bucketVariant(input.userId, input.experiment);
    if (usable(picked)) return { themeId: picked, source: 'experiment' };
  }

  // 4. User's own saved preference.
  if (usable(input.userPreferenceThemeId)) return { themeId: input.userPreferenceThemeId, source: 'user-preference' };

  // 5. Segment default.
  if (usable(input.segmentDefaultThemeId)) return { themeId: input.segmentDefaultThemeId, source: 'segment-default' };

  // 6. Seasonal — opt-in + within window.
  if (input.allowSeasonal) {
    const seasonal = activeSeasonalTheme(registry, input.now ?? new Date());
    if (seasonal) return { themeId: seasonal, source: 'seasonal' };
  }

  // 7. Global default.
  if (usable(DEFAULT_THEME_ID)) return { themeId: DEFAULT_THEME_ID, source: 'global-default' };

  // 8. Fallback — first active theme, else the default id regardless.
  const firstActive = registry.find((e) => e.status === 'active');
  return { themeId: firstActive?.themeId ?? DEFAULT_THEME_ID, source: 'fallback' };
}
