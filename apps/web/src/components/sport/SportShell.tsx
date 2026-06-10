import type { CSSProperties, ReactNode } from 'react';
import type { SportId } from '@swingiq/core';
import { cn } from '@/lib/utils';
import { sportAccentVars } from '@/lib/sport-brand/registry';

// ============================================================
// SportShell (Phase 4) — the reusable per-sport branded wrapper. It scopes the
// sport's accent as `--sport-accent` (+ paired `--sport-accent-foreground`) for
// everything inside, so any child can pick up the brand with
// `style={{ borderColor: 'var(--sport-accent)' }}` etc. — no per-sport template
// duplication, and the accent comes from the AA-validated `--sport-*` tokens.
//
// `motif` paints a faint corner wash in the sport's accent for a subtle branded
// texture (decorative, aria-hidden, reduced-motion-safe — it's static).
// ============================================================

export function SportShell({
  sport,
  motif = false,
  className,
  style,
  children,
}: {
  sport: SportId;
  /** Faint accent corner wash for a branded texture. */
  motif?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      className={cn('relative', motif && 'overflow-hidden', className)}
      style={{ ...sportAccentVars(sport), ...style }}
    >
      {motif && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ background: 'radial-gradient(60% 80% at 92% 0%, var(--sport-accent), transparent 70%)' }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
