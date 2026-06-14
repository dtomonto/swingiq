// SectionCard — the standard bordered panel used across admin pages.
// Server-safe. Optional header (title/description) + actions slot.
//
// Built on the shared <Card> surface (rendered as <section>) so it inherits the
// theme radius/border/shadow tokens instead of re-declaring them.

import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

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

export function SectionCard({ title, description, actions, children, className, level = 'card' }: SectionCardProps) {
  return (
    <Card
      as="section"
      elevated={level === 'elevated'}
      className={cn('p-5', level === 'flat' && 'shadow-none', className)}
    >
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
    </Card>
  );
}
