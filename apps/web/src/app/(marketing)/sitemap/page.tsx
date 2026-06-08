import Link from 'next/link';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import {
  curatedUrlsBySection,
  SECTION_ORDER,
  SECTION_LABELS,
  type CuratedUrl,
} from '@/lib/seo/site-sections';
import { PUBLISHED_SEO_PAGES, type Sport } from '@/content/seoPages';
import { getPublishedBlogPosts } from '@/data/blog-posts';
import { CHALLENGES } from '@/content/challenges';
import { getLibraryItems } from '@/lib/library';
import { learnPath } from '@/lib/library/seo';

// Human-friendly HTML sitemap. Crawlable, indexable, and built from the SAME
// source of truth as the XML sitemap (lib/seo/site-sections.ts) plus the live
// content registries (guides, blog, challenges, library). Linked from the
// footer so crawlers always have a flat path to every public page.

export const metadata: Metadata = buildMetadata({
  title: 'Sitemap',
  description:
    'Browse every public SwingVantage page in one place — sport hubs, free tools, sample reports, guides, benchmarks, and articles for golf, tennis, pickleball, padel, baseball, and softball.',
  path: '/sitemap',
});

type LinkItem = { href: string; label: string };

const SPORT_ORDER: Sport[] = ['golf', 'baseball', 'softball', 'tennis', 'pickleball', 'padel', 'multi'];
const SPORT_LABELS: Record<Sport, string> = {
  golf: 'Golf guides',
  baseball: 'Baseball guides',
  softball: 'Softball guides',
  tennis: 'Tennis guides',
  pickleball: 'Pickleball guides',
  padel: 'Padel guides',
  multi: 'Multi-sport guides',
};

// The pickleball & padel hubs are programmatic SEO pages; surface them in the
// "Sport hubs" group (not under "Guides") so the sports section is complete.
const RACKET_HUB_SLUGS = ['pickleball', 'padel'];

function curatedToLinks(urls: CuratedUrl[]): LinkItem[] {
  // Don't link the sitemap to itself within its own lists.
  return urls.filter((u) => u.path !== '/sitemap').map((u) => ({ href: u.path, label: u.label }));
}

function LinkList({ items }: { items: LinkItem[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="block rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted hover:text-primary"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, items }: { title: string; items: LinkItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-10" aria-labelledby={`sec-${title.replace(/\s+/g, '-').toLowerCase()}`}>
      <h2
        id={`sec-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className="mb-3 border-b border-border pb-2 text-lg font-bold text-foreground"
      >
        {title}
      </h2>
      <LinkList items={items} />
    </section>
  );
}

export default function HtmlSitemapPage() {
  const bySection = curatedUrlsBySection();

  // Sport hubs = curated sport entries + the racket hubs (from PUBLISHED_SEO_PAGES).
  const racketHubs: LinkItem[] = RACKET_HUB_SLUGS.flatMap((slug) => {
    const page = PUBLISHED_SEO_PAGES.find((p) => p.slug === slug);
    return page ? [{ href: `/${page.slug}`, label: `${page.sport[0].toUpperCase()}${page.sport.slice(1)} swing analysis` }] : [];
  });
  const sportHubs = [...curatedToLinks(bySection.sports), ...racketHubs];

  // Guides = every published programmatic page that isn't a top-level hub,
  // grouped by sport. (Excludes the racket hubs, surfaced above.)
  const guidePages = PUBLISHED_SEO_PAGES.filter((p) => !RACKET_HUB_SLUGS.includes(p.slug));
  const guidesBySport = SPORT_ORDER.map((sport) => ({
    sport,
    items: guidePages
      .filter((p) => p.sport === sport)
      .map((p) => ({ href: `/${p.slug}`, label: p.title })),
  })).filter((g) => g.items.length > 0);

  const blogItems: LinkItem[] = getPublishedBlogPosts().map((post) => ({
    href: `/blog/${post.slug}`,
    label: post.title,
  }));

  const challengeItems: LinkItem[] = Object.values(CHALLENGES).map((c) => ({
    href: `/challenges/${c.slug}`,
    label: c.title,
  }));

  const libraryItems: LinkItem[] = getLibraryItems().map((item) => ({
    href: learnPath(item),
    label: item.title,
  }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: 'Sitemap', path: '/sitemap' }]} className="mb-6" />

      <header className="mb-10">
        <h1 className="text-3xl font-bold text-foreground">Sitemap</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every public SwingVantage page, organized by section. Looking for the machine-readable
          version? It&apos;s at{' '}
          <Link href="/sitemap.xml" className="font-medium text-primary hover:underline">
            /sitemap.xml
          </Link>
          .
        </p>
      </header>

      {/* Curated sections, in the shared section order. */}
      {SECTION_ORDER.map((section) => {
        // The sports section is rendered specially below (adds the racket hubs).
        if (section === 'sports') return null;
        return <Section key={section} title={SECTION_LABELS[section]} items={curatedToLinks(bySection[section])} />;
      })}

      {/* Sport hubs (curated + racket hubs). */}
      <Section title={SECTION_LABELS.sports} items={sportHubs} />

      {/* Guides, grouped by sport. */}
      {guidesBySport.length > 0 && (
        <section className="mb-10" aria-labelledby="sec-guides">
          <h2 id="sec-guides" className="mb-3 border-b border-border pb-2 text-lg font-bold text-foreground">
            Guides
          </h2>
          {guidesBySport.map((g) => (
            <div key={g.sport} className="mb-5">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {SPORT_LABELS[g.sport]}
              </h3>
              <LinkList items={g.items} />
            </div>
          ))}
        </section>
      )}

      <Section title="Articles" items={blogItems} />
      <Section title="Challenges" items={challengeItems} />
      <Section title="Video library" items={libraryItems} />
    </main>
  );
}
