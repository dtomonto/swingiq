import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FeatureItem = { icon: LucideIcon; title: string; desc: string };

/**
 * The premium, icon-led feature/benefit card grid used on the homepage (the
 * "problem" and "why" sections): an accent icon tile, an uppercase display
 * heading, and a supporting line. The compact, icon-less benefit cards on the
 * audience pages live in `BenefitGrid`; this is the richer marketing variant
 * (maps to a Figma "Feature Grid"). Pass `className` for section margin.
 */
export function FeatureGrid({ items, className }: { items: FeatureItem[]; className?: string }) {
  return (
    <div className={cn('grid gap-6 md:grid-cols-3', className)}>
      {items.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="rounded-theme border border-border bg-card p-6 shadow-theme">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
            <Icon size={22} className="text-primary" aria-hidden="true" />
          </div>
          <h3 className="font-heading text-lg font-semibold uppercase tracking-tight text-foreground">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
        </div>
      ))}
    </div>
  );
}
