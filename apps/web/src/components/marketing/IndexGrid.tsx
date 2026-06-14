import Link from 'next/link';
import { cn } from '@/lib/utils';

export type IndexItem = {
  href: string;
  name: string;
  desc: string;
  /** Leading emoji glyph (tools-style cards). */
  emoji?: string;
  /** Small uppercase eyebrow above the name (challenges-style cards). */
  eyebrow?: string;
};

/**
 * The bordered link-card grid used by the index pages (free tools, challenges,
 * …). Supports the two existing card flavors — a leading `emoji` or a small
 * `eyebrow` label — so both pages render identically from one component (maps to
 * a single Figma "Index Grid" component).
 */
export function IndexGrid({
  items,
  columns = 2,
  className,
}: {
  items: IndexItem[];
  /** @default 2 */
  columns?: 2 | 3;
  className?: string;
}) {
  const cols = columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2';
  return (
    <div className={cn('mt-8 grid gap-4', cols, className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="block rounded-2xl border border-border p-5 transition-colors hover:border-primary/50 hover:bg-primary/10"
        >
          {item.emoji && <div className="text-2xl">{item.emoji}</div>}
          {item.eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{item.eyebrow}</p>
          )}
          <h2 className={cn('font-semibold text-foreground', item.emoji ? 'mt-2' : 'mt-1')}>{item.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
        </Link>
      ))}
    </div>
  );
}
