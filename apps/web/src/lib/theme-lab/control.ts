// ============================================================
// Theme Lab — operator + user control surface (#3). The inputs the live
// resolver (resolveThemeForUser) reads on the client:
//
//   • forcedThemeId  — operator pin / kill-switch. Cross-device truth lives in
//     the build env (NEXT_PUBLIC_THEME_LAB_FORCE); a device-local override
//     (localStorage) lets an operator test a pin without a deploy. Local wins.
//   • allowSeasonal  — per-user opt-in to seasonal themes.
//
// PURE (no React). Reads are SSR-safe (guard `window`). Writes broadcast a
// `swingiq-theme-lab-change` event so listeners (ThemeApplicator) re-resolve
// instantly without a reload. Kept in sync with the pre-paint bootstrap in
// app/layout.tsx so a forced theme never flashes.
// ============================================================

import type { ThemeId } from '@/lib/theme/themes';
import { isThemeActive } from './registry';

export const THEME_LAB_STORAGE_KEY = 'swingiq-theme-lab';
export const THEME_LAB_CHANGE_EVENT = 'swingiq-theme-lab-change';

export interface ThemeLabControl {
  /** Operator pin / kill-switch: force ALL users to this theme. `null` = off. */
  forcedThemeId: ThemeId | null;
  /** Per-user opt-in to seasonal themes. */
  allowSeasonal: boolean;
}

export const DEFAULT_CONTROL: ThemeLabControl = { forcedThemeId: null, allowSeasonal: false };

/**
 * Operator force baked in from the build env — the cross-device seam. Only
 * honored when it names a currently-active theme (a typo'd env is ignored
 * rather than silently pinning everyone to the default).
 */
export function envForcedTheme(): ThemeId | null {
  const v = process.env.NEXT_PUBLIC_THEME_LAB_FORCE;
  if (!v) return null;
  const id = v as ThemeId;
  return isThemeActive(id) ? id : null;
}

/** Read the device-local control, normalized + guarded. SSR-safe. */
export function readThemeLabControl(): ThemeLabControl {
  if (typeof window === 'undefined') return DEFAULT_CONTROL;
  try {
    const raw = window.localStorage.getItem(THEME_LAB_STORAGE_KEY);
    if (!raw) return DEFAULT_CONTROL;
    const parsed = JSON.parse(raw) as Partial<ThemeLabControl> | null;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_CONTROL;
    const forced = parsed.forcedThemeId as ThemeId | null | undefined;
    return {
      forcedThemeId: forced && isThemeActive(forced) ? forced : null,
      allowSeasonal: !!parsed.allowSeasonal,
    };
  } catch {
    return DEFAULT_CONTROL;
  }
}

/** Merge a patch into the device-local control, persist it, and broadcast. */
export function writeThemeLabControl(patch: Partial<ThemeLabControl>): ThemeLabControl {
  const next: ThemeLabControl = { ...readThemeLabControl(), ...patch };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_LAB_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(THEME_LAB_CHANGE_EVENT));
    } catch {
      /* storage unavailable (private mode / quota) — in-memory no-op */
    }
  }
  return next;
}

/**
 * The effective operator force for the resolver: a device-local pin overrides
 * the env pin, which overrides "no force". Returns `null` when nothing is
 * forced (the common case).
 */
export function effectiveForcedTheme(control: ThemeLabControl): ThemeId | null {
  return control.forcedThemeId ?? envForcedTheme();
}
