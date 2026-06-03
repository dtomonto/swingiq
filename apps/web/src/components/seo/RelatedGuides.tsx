import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PUBLISHED_SEO_PAGES, type Sport } from '@/content/seoPages';

/**
 * Lists the published SEO guides for a sport. Rendered on each sport hub
 * (e.g. /golf-swing-analysis) so the hub is the clear parent of its /sport/*
 * articles — the articles already breadcrumb back up to the hub. Together this
 * makes a coherent hub <-> article silo (audit finding IA-4) without changing
 * any keyword-rich URLs.
 */
export function RelatedGuides({
  sport,
  heading = 'Guides for your game',
}: {
  sport: Sport;
  heading?: string;
}) {
  const guides = PUBLISHED_SEO_PAGES.filter((p) => p.sport === sport);
  if (guides.length === 0) return null;

  return (
    <section className="bg-card py-14">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="mb-6 text-2xl font-bold text-foreground">{heading}</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {guides.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/${g.slug}`}
                className="group flex items-start justify-between gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:bg-muted"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{g.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-2">
                    {g.metaDescription}
                  </span>
                </span>
                <ArrowRight
                  size={16}
                  className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
