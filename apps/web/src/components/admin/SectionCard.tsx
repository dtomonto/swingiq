// SectionCard — the standard bordered panel used across admin pages.
// Server-safe. Optional header (title/description) + actions slot.

import type { ReactNode } from 'react';

export interface SectionCardProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /**
   * Shadow hierarchy: `elevated` (L2 summary), `card` (L3 trend, default),
   * `flat` (L4 routine tile — border only).
   */
  level?: 'elevated' | 'card' | 'flat';
}

// The app exposes the theme shadows as the `shadow-theme` / `shadow-theme-lg`
// utilities (→ var(--shadow-card) / var(--shadow-elevated)); `shadow-card` is
// not a real utility.
const LEVEL_SHADOW: Record<NonNullable<SectionCardProps['level']>, string> = {
  elevated: 'shadow-theme-lg',
  card: 'shadow-theme',
  flat: '',
};

export function SectionCard({ title, description, actions, children, className, level = 'card' }: SectionCardProps) {
  return (
    <section className={`rounded-xl border border-border bg-card p-5 ${LEVEL_SHADOW[level]} ${className ?? ''}`}>
      {(title || actions) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
