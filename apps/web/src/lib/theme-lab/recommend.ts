// ============================================================
// Theme Lab — recommendation engine (#3 step 6). PURE + privacy-safe: it reads
// only signals the caller already has locally (the athlete's active sport and
// their light/dark leaning) — no analytics, no network, no identifiers. It
// SUGGESTS a theme; it never applies one. Returns null when there is nothing
// worth suggesting (the best fit is already active, or it isn't selectable).
// ============================================================

import type { SportId } from '@swingiq/core';
import type { ThemeId } from '@/lib/theme/themes';
import type { ThemeLabEntry } from './registry';
import { THEME_LAB_REGISTRY, getThemeLabEntry, isThemeActive } from './registry';

/** Coarse sport grouping → the theme whose art-direction fits it best. */
type SportGroup = 'club' | 'racket' | 'bat';

const SPORT_GROUP: Record<SportId, SportGroup> = {
  golf: 'club',
  tennis: 'racket',
  pickleball: 'racket',
  padel: 'racket',
  baseball: 'bat',
  softball_slow: 'bat',
  softball_fast: 'bat',
};

const GROUP_THEME: Record<SportGroup, { themeId: ThemeId; reason: string }> = {
  club: { themeId: 'heritage-club', reason: 'Classic club style to match your golf focus.' },
  racket: { themeId: 'field-court', reason: 'Court-and-field energy for your racket sport.' },
  bat: { themeId: 'field-court', reason: 'Outdoor athletic look for your bat sport.' },
};

export interface RecommendSignals {
  /** The athlete's active sport, if known. */
  sport?: SportId | null;
  /** Whether the user leans dark (from the legacy theme toggle / OS setting). */
  prefersDark?: boolean;
  /** The theme currently applied — used to suppress a no-op suggestion. */
  currentThemeId: ThemeId;
  /** Registry override (tests / preview). */
  registry?: ThemeLabEntry[];
}

export interface ThemeRecommendation {
  themeId: ThemeId;
  reason: string;
}

/** The raw sport→theme fit, before eligibility / current-theme suppression. */
export function recommendForSport(sport: SportId): ThemeRecommendation {
  return GROUP_THEME[SPORT_GROUP[sport]];
}

/**
 * Suggest a theme for the user, or null when there's nothing useful to suggest.
 * A suggestion must be a different, active, user-selectable theme.
 */
export function recommendTheme(signals: RecommendSignals): ThemeRecommendation | null {
  const registry = signals.registry ?? THEME_LAB_REGISTRY;

  // A dark-leaning user is already well-served by the dark default; only make a
  // sport-led suggestion when we actually know the sport.
  let candidate: ThemeRecommendation | null = null;
  if (signals.sport) candidate = recommendForSport(signals.sport);
  else if (signals.prefersDark) candidate = { themeId: 'dark-performance', reason: 'High-intensity dark analytics.' };

  if (!candidate) return null;

  // Only suggest a theme that is different, active, and not admin-restricted.
  if (candidate.themeId === signals.currentThemeId) return null;
  if (!isThemeActive(candidate.themeId, registry)) return null;
  if (getThemeLabEntry(candidate.themeId, registry)?.visibility === 'admin') return null;

  return candidate;
}
