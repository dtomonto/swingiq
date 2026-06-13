'use client';

import Link from 'next/link';
import { ANALYTICS_EVENTS, track } from '@/lib/analytics';

export interface RelatedLink {
  href: string;
  label: string;
  /** Optional one-line description for the card variant. */
  description?: string;
}

/**
 * Contextual internal-link cluster (not footer links) — the backbone of the
 * authority internal-linking graph. Two variants:
 *   • variant="cards"  — titled grid of described links (related concepts)
 *   • variant="inline" — a compact "Related: a · b · c" trail
 * Fires RESOURCE_INTERNAL_LINK_CLICKED so we can see which links actually move
 * people between authority pages.
 */
export function RelatedLinks({
  from,
  links,
  title = 'Related',
  variant = 'cards',
  className = '',
}: {
  /** The current page slug (analytics `from`). */
  from: string;
  links: RelatedLink[];
  title?: string;
  variant?: 'cards' | 'inline';
  className?: string;
}) {
  const onClick = (to: string) =>
    track(ANALYTICS_EVENTS.RESOURCE_INTERNAL_LINK_CLICKED, { from, to });

  if (variant === 'inline') {
    return (
      <nav aria-label={title} className={`border-t border-border pt-5 text-sm ${className}`}>
        <span className="font-semibold text-foreground">{title}: </span>
        {links.map((l, i) => (
          <span key={l.href}>
            {i > 0 && <span className="text-muted-foreground"> · </span>}
            <Link
              href={l.href}
              onClick={() => onClick(l.href)}
              className="text-primary hover:underline"
            >
              {l.label}
            </Link>
          </span>
        ))}
      </nav>
    );
  }

  return (
    <section aria-label={title} className={`mt-12 ${className}`}>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => onClick(l.href)}
            className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
          >
            <span className="font-semibold text-foreground group-hover:text-primary">
              {l.label}
            </span>
            {l.description && (
              <span className="mt-1 block text-sm text-muted-foreground">{l.description}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
