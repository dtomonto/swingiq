import type { ReactNode } from 'react';

/**
 * A titled, anchor-linkable content section for authority pages. The `id` is
 * used both for the in-page table of contents and as a stable deep-link target.
 */
export function AuthoritySection({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  /** Optional one-line intro shown under the heading. */
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mt-10 scroll-mt-24">
      <h2 id={id} className="text-xl font-bold text-foreground sm:text-2xl">
        {title}
      </h2>
      {intro && <p className="mt-2 text-muted-foreground">{intro}</p>}
      <div className="mt-3 space-y-3 text-foreground">{children}</div>
    </section>
  );
}

/**
 * A compact two-column "what it can / cannot do" or "benefits / limitations"
 * grid used across the authority pages to keep balance honest and scannable.
 */
export function TwoColumnList({
  left,
  right,
}: {
  left: { title: string; items: string[]; tone?: 'positive' | 'caution' };
  right: { title: string; items: string[]; tone?: 'positive' | 'caution' };
}) {
  const col = (c: { title: string; items: string[]; tone?: 'positive' | 'caution' }) => {
    const caution = c.tone === 'caution';
    return (
      <div
        className={`rounded-xl border p-4 ${
          caution ? 'border-warning/30 bg-warning/5' : 'border-success/30 bg-success/5'
        }`}
      >
        <h3 className="font-semibold text-foreground">{c.title}</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground/90">
          {c.items.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className={caution ? 'text-warning-text' : 'text-success'}>
                {caution ? '—' : '✓'}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  return <div className="mt-4 grid gap-4 sm:grid-cols-2">{col(left)}{col(right)}</div>;
}
