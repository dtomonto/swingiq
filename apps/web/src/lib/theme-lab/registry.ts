// ============================================================
// Theme Lab — theme registry (#3 step 1). Wraps the EXISTING 7-theme
// `[data-theme]` engine (lib/theme/themes.ts) with the lifecycle + governance
// metadata the Theme Lab OS needs — category, status, version, visibility,
// rollout %, sport/page compatibility, and (for future seasonal themes) an
// active window. It DERIVES from THEMES, so adding a theme there flows through
// here automatically; it never replaces the engine. Pure + unit-testable.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { ThemeId } from '@/lib/theme/themes';
import { THEMES } from '@/lib/theme/themes';

/** Lifecycle bucket — distinct from a ThemeDef's light/dark `category`. */
export type ThemeLabCategory = 'core' | 'seasonal' | 'experimental';
export type ThemeLabStatus = 'active' | 'draft' | 'retired';
/** Who is eligible to receive a theme by default. */
export type ThemeVisibility = 'all' | 'opt-in' | 'admin';

/** Year-agnostic active window for seasonal themes (MM-DD, inclusive). */
export interface SeasonalWindow {
  start: string; // 'MM-DD'
  end: string; // 'MM-DD'
}

export interface ThemeLabEntry {
  themeId: ThemeId;
  /** Display name, mirrored from the ThemeDef. */
  name: string;
  labCategory: ThemeLabCategory;
  status: ThemeLabStatus;
  /** Bumped whenever the theme's tokens change (for cache-busting / audit). */
  version: number;
  visibility: ThemeVisibility;
  /** Gradual rollout: 0–100% of eligible users. `undefined` = 100. */
  rolloutPercent?: number;
  /** Sports the theme is offered for. */
  sportCompat: SportId[] | 'all';
  /** Page-path prefixes the theme applies to. */
  pageCompat: string[] | 'all';
  /** Only set for `labCategory: 'seasonal'` — the active window. */
  seasonal?: SeasonalWindow;
}

// Per-theme overrides on top of the sensible defaults below. Future seasonal /
// experimental themes set their metadata here; the 7 shipped themes are all
// live `core` themes available to everyone, so they need no overrides.
const OVERRIDES: Partial<Record<ThemeId, Partial<ThemeLabEntry>>> = {};

const DEFAULT_ENTRY: Omit<ThemeLabEntry, 'themeId' | 'name'> = {
  labCategory: 'core',
  status: 'active',
  version: 1,
  visibility: 'all',
  rolloutPercent: 100,
  sportCompat: 'all',
  pageCompat: 'all',
};

/** Every theme, wrapped with its Theme Lab metadata. Derived from THEMES. */
export const THEME_LAB_REGISTRY: ThemeLabEntry[] = THEMES.map((t) => ({
  themeId: t.id,
  name: t.name,
  ...DEFAULT_ENTRY,
  ...OVERRIDES[t.id],
}));

export function getThemeLabEntry(
  id: ThemeId,
  registry: ThemeLabEntry[] = THEME_LAB_REGISTRY,
): ThemeLabEntry | undefined {
  return registry.find((e) => e.themeId === id);
}

/** True when a theme exists in the registry AND is live (status: active). */
export function isThemeActive(
  id: ThemeId | null | undefined,
  registry: ThemeLabEntry[] = THEME_LAB_REGISTRY,
): boolean {
  if (!id) return false;
  return getThemeLabEntry(id, registry)?.status === 'active';
}

/** Active themes a given visibility tier may receive (admin sees all). */
export function themesForVisibility(
  tier: ThemeVisibility,
  registry: ThemeLabEntry[] = THEME_LAB_REGISTRY,
): ThemeLabEntry[] {
  return registry.filter((e) => {
    if (e.status !== 'active') return false;
    if (tier === 'admin') return true;
    if (tier === 'opt-in') return e.visibility === 'all' || e.visibility === 'opt-in';
    return e.visibility === 'all';
  });
}
