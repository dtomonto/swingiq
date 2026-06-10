// ============================================================
// Sport-brand registry (Phase 4) — the single source of truth that maps each
// SportId to its accent treatment. It INVENTS NO COLORS: every value derives
// from the per-sport accent tokens already defined + AA-validated in globals.css
// (`--sport-<slug>` / `--sport-<slug>-foreground`, theme-agnostic). This powers
// `<SportShell>` (scopes `--sport-accent` for a subtree) and any surface that
// wants a sport's accent without hard-coding a token name.
// ============================================================

import type { CSSProperties } from 'react';
import type { SportId } from '@swingiq/core';

/** The CSS-var slug for a sport (matches globals.css: softball_slow → softball-slow). */
export function sportSlug(sport: SportId): string {
  return sport.replace(/_/g, '-');
}

export interface SportBrand {
  sport: SportId;
  slug: string;
  /** The accent token name, e.g. '--sport-golf'. */
  accentVar: string;
  /** Ready-to-use hsl() string for the accent fill. */
  accentColor: string;
  /** Paired AA-safe foreground for text/icon placed ON the accent fill. */
  accentForeground: string;
}

export function sportBrand(sport: SportId): SportBrand {
  const slug = sportSlug(sport);
  return {
    sport,
    slug,
    accentVar: `--sport-${slug}`,
    accentColor: `hsl(var(--sport-${slug}))`,
    accentForeground: `hsl(var(--sport-${slug}-foreground))`,
  };
}

/** Every sport the platform brands, in display order. */
export const SPORT_BRAND_ORDER: SportId[] = [
  'golf', 'tennis', 'pickleball', 'padel', 'baseball', 'softball_slow', 'softball_fast',
];

export const ALL_SPORT_BRANDS: SportBrand[] = SPORT_BRAND_ORDER.map(sportBrand);

/**
 * Inline style that scopes `--sport-accent` (and its paired foreground) for a
 * subtree, so any descendant can use `var(--sport-accent)` /
 * `var(--sport-accent-foreground)` without knowing which sport it is. This is
 * how `<SportShell>` makes a sport's accent ambient.
 */
export function sportAccentVars(sport: SportId): CSSProperties {
  const b = sportBrand(sport);
  return {
    '--sport-accent': b.accentColor,
    '--sport-accent-foreground': b.accentForeground,
  } as CSSProperties;
}
