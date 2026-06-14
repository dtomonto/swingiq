import { cn } from '@/lib/utils';

export type SimpleBenefit = { title: string; desc: string };

/**
 * The compact, bordered benefit-card grid used on the audience landing pages
 * (coaches / creators / parents) — title + supporting line, no icon. One
 * component so the cards stay consistent and map to a Figma "Benefit Grid".
 * (The richer icon-led benefit cards on the homepage are a separate, heavier
 * pattern — a future variant, tracked in the design-system audit backlog.)
 */
export function BenefitGrid({
  items,
  columns = 3,
  headingAs: Heading = 'h2',
  className,
}: {
  items: SimpleBenefit[];
  /** @default 3 */
  columns?: 2 | 3;
  /** Heading level for each card title — keep document order correct. @default 'h2' */
  headingAs?: 'h2' | 'h3';
  className?: string;
}) {
  const cols = columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3';
  return (
    <div className={cn('grid gap-6', cols, className)}>
      {items.map((b) => (
        <div key={b.title} className="rounded-2xl border border-border p-5">
          <Heading className="font-semibold text-foreground">{b.title}</Heading>
          <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
        </div>
      ))}
    </div>
  );
}
