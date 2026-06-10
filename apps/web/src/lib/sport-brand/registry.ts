// ============================================================
// SwingVantage — Sport Brand Registry (pure, framework-agnostic)
// ------------------------------------------------------------
// The single source of truth for how a sport *brands* a surface:
// which AA-validated accent token it owns, its emoji/name, a short
// hero tagline, and a subtle background motif. This powers the
// reusable <SportShell> / <SportHero> wrappers so every sport page
// is a distinct-but-unified branded experience WITHOUT per-sport
// template duplication.
//
// Why a registry (not new colors): the per-sport accent colors
// already live in globals.css as `--color-sport-<slug>` /
// `--color-sport-<slug>-foreground`, each tuned to clear WCAG AA and
// validated by theme-contrast.test.ts. This file only *maps* a
// SportId to that existing token (handling the underscore→hyphen slug
// difference) and adds presentation metadata — it never invents a
// color. Reserved status palette (emerald/amber/red/sky/violet) is
// untouched; brand accents sit outside it.
// ============================================================

import type { CSSProperties } from 'react';
import type { SportId } from '@swingiq/core';

/** A distinguishing background texture, all tinted by the sport accent. */
export type SportMotif = 'arc' | 'grid' | 'dots' | 'diamond';

export interface SportBrand {
  /** CSS token slug — note softball_slow → 'softball-slow' (tokens use hyphens). */
  tokenSlug: string;
  emoji: string;
  name: string;
  /** Short, energetic hero line. */
  tagline: string;
  motif: SportMotif;
}

// One entry per SportId. Names/emoji intentionally mirror SPORT_DISPLAY;
// taglines mirror the /sports hub copy so the brand voice stays consistent.
export const SPORT_BRANDS: Record<SportId, SportBrand> = {
  golf: { tokenSlug: 'golf', emoji: '⛳', name: 'Golf', tagline: 'Dial in your ball striking', motif: 'arc' },
  tennis: { tokenSlug: 'tennis', emoji: '🎾', name: 'Tennis', tagline: 'Sharpen every stroke', motif: 'grid' },
  pickleball: { tokenSlug: 'pickleball', emoji: '🏓', name: 'Pickleball', tagline: 'Win the kitchen', motif: 'dots' },
  padel: { tokenSlug: 'padel', emoji: '🎾', name: 'Padel', tagline: 'Read the glass, hold the net', motif: 'grid' },
  baseball: { tokenSlug: 'baseball', emoji: '⚾', name: 'Baseball', tagline: 'Build a repeatable swing', motif: 'diamond' },
  softball_slow: { tokenSlug: 'softball-slow', emoji: '🥎', name: 'Slow Pitch Softball', tagline: 'Drive line-drive contact', motif: 'arc' },
  softball_fast: { tokenSlug: 'softball-fast', emoji: '🥎', name: 'Fast Pitch Softball', tagline: 'Quicken your launch', motif: 'dots' },
};

export function getSportBrand(sport: SportId): SportBrand {
  return SPORT_BRANDS[sport] ?? SPORT_BRANDS.golf;
}

/**
 * The local CSS custom properties a branded surface exposes to its
 * children. Children style themselves with `var(--sport-accent)` /
 * `var(--sport-accent-foreground)` and inherit whichever sport is in
 * scope — no Tailwind class permutation per sport.
 *
 * These reference the existing AA-validated tokens, so theme switches
 * and contrast guarantees carry through for free.
 */
export function sportAccentStyle(sport: SportId): CSSProperties {
  const { tokenSlug } = getSportBrand(sport);
  return {
    ['--sport-accent' as string]: `var(--color-sport-${tokenSlug})`,
    ['--sport-accent-foreground' as string]: `var(--color-sport-${tokenSlug}-foreground)`,
  };
}

/**
 * A subtle, accent-tinted background texture for hero/section
 * backdrops. Pure CSS (no image assets), driven entirely by the
 * in-scope `--sport-accent`, so it restyles with the sport and theme.
 * `color-mix` keeps the tint faint (reads behind text at AA).
 */
export function motifStyle(motif: SportMotif): CSSProperties {
  const tint = `color-mix(in srgb, var(--sport-accent) 9%, transparent)`;
  const tintStrong = `color-mix(in srgb, var(--sport-accent) 14%, transparent)`;
  switch (motif) {
    case 'grid':
      // court-line grid
      return {
        backgroundImage: `linear-gradient(${tint} 1px, transparent 1px), linear-gradient(90deg, ${tint} 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      };
    case 'dots':
      // perforated-paddle dots
      return {
        backgroundImage: `radial-gradient(${tintStrong} 1.5px, transparent 1.6px)`,
        backgroundSize: '20px 20px',
      };
    case 'diamond':
      // ball-field diamond lattice
      return {
        backgroundImage: `linear-gradient(45deg, ${tint} 1px, transparent 1px), linear-gradient(-45deg, ${tint} 1px, transparent 1px)`,
        backgroundSize: '34px 34px',
      };
    case 'arc':
    default:
      // soft fairway/horizon glow
      return {
        backgroundImage: `radial-gradient(120% 80% at 50% -20%, ${tintStrong}, transparent 60%)`,
      };
  }
}
