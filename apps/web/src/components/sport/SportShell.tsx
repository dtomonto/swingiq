// ============================================================
// SwingVantage — <SportShell>
// ------------------------------------------------------------
// A reusable wrapper that puts a sport's brand *in scope* for its
// children. It sets the local `--sport-accent` / `--sport-accent-
// foreground` custom properties (from the existing AA-validated
// per-sport tokens) and a `data-sport` attribute, and optionally
// paints the sport's subtle background motif. Children then style
// with `var(--sport-accent)` and automatically take on the active
// sport — no per-sport class permutations, no template duplication.
//
// Theme-aware by construction: because the accent comes from the CSS
// token layer, switching `[data-theme]` or sport restyles everything
// underneath for free.
// ============================================================

'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { SportId } from '@swingiq/core';
import { cn } from '@/lib/utils';
import { getSportBrand, sportAccentStyle, motifStyle } from '@/lib/sport-brand/registry';

interface SportShellProps {
  sport: SportId;
  children: ReactNode;
  /** Paint the sport's subtle accent-tinted background motif. */
  motif?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Render as a different element (e.g. `section`). Defaults to `div`. */
  as?: 'div' | 'section' | 'main' | 'article';
}

export function SportShell({
  sport,
  children,
  motif = false,
  className,
  style,
  as: Tag = 'div',
}: SportShellProps) {
  const brand = getSportBrand(sport);
  const accent = sportAccentStyle(sport);
  const motifBg = motif ? motifStyle(brand.motif) : undefined;

  return (
    <Tag
      data-sport={sport}
      data-motif={motif ? brand.motif : undefined}
      className={cn('relative isolate', className)}
      style={{ ...accent, ...motifBg, ...style }}
    >
      {children}
    </Tag>
  );
}
