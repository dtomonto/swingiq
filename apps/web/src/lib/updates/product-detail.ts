// ============================================================
// SwingVantage — Product Update detail engine (pure, server-safe)
// ------------------------------------------------------------
// Powers the dedicated /updates/[slug] report pages. Every helper here is a
// pure function over the existing Update model in @/data/updates, so a
// published product update becomes BOTH a card on /updates AND a dedicated,
// SEO/AEO/GEO-optimized report page from the same single source of truth —
// no second manual publishing step, and no way to create an orphan page.
//
// Importable from server components, client components, the sitemap, and tests.
// It must stay free of node:fs / server-only imports for that reason.
// ============================================================

import type { Metadata } from 'next';
import { SITE_URL } from '@/config/site';
import { getPublicUpdates, type Update } from '@/data/updates';

/** Site-relative URL for an update's dedicated report page. */
export function updatePath(update: Pick<Update, 'slug'>): string {
  return `/updates/${update.slug}`;
}

/** Absolute canonical URL for an update's dedicated report page. */
export function updateUrl(update: Pick<Update, 'slug'>): string {
  return `${SITE_URL}${updatePath(update)}`;
}

/**
 * A published, public update by slug. Returns undefined for unknown,
 * draft, or non-public slugs — the detail route 404s on undefined so draft
 * content is never exposed and no orphan page can exist.
 */
export function getPublicUpdateBySlug(slug: string): Update | undefined {
  return getPublicUpdates().find((u) => u.slug === slug);
}

/** Slugs of every page-eligible (published + public) update — for generateStaticParams + sitemap. */
export function publicUpdateSlugs(): string[] {
  return getPublicUpdates().map((u) => u.slug);
}

/**
 * Related updates for the "Related Updates" section + internal linking.
 * Scored by shared sport and category overlap, newest first, self excluded.
 */
export function getRelatedUpdates(update: Update, limit = 4): Update[] {
  const others = getPublicUpdates().filter((u) => u.id !== update.id);
  const scored = others.map((u) => {
    let score = 0;
    if (update.sport && u.sport && update.sport === u.sport) score += 2;
    if (u.sport === 'All Sports' || update.sport === 'All Sports') score += 1;
    if (u.category === update.category) score += 2;
    if (update.relatedFeature && u.relatedFeature === update.relatedFeature) score += 3;
    return { u, score };
  });
  return scored
    .sort((a, b) => b.score - a.score || new Date(b.u.releaseDate).getTime() - new Date(a.u.releaseDate).getTime())
    .slice(0, limit)
    .map((s) => s.u);
}

export interface UpdateFaq {
  q: string;
  a: string;
}

/**
 * Deterministically derive an AEO/GEO-friendly FAQ from the update's own
 * fields. No invented claims — every answer is sourced from author-provided
 * copy. Thin fields are skipped so the FAQ never pads with empty answers.
 */
export function buildUpdateFaqs(update: Update): UpdateFaq[] {
  const faqs: UpdateFaq[] = [];

  faqs.push({ q: `What is "${update.title}"?`, a: update.summary });

  if (update.whyItMatters) {
    faqs.push({ q: 'Why does this update matter?', a: update.whyItMatters });
  }
  if (update.audience && update.audience.length > 0) {
    faqs.push({
      q: 'Who is this update for?',
      a: `This update is designed for ${formatList(update.audience)}${
        update.sport && update.sport !== 'All Sports' ? `, with ${update.sport} in mind` : ''
      }.`,
    });
  }
  if (update.whereToFindIt) {
    faqs.push({ q: 'Where do I find it in SwingVantage?', a: update.whereToFindIt });
  }
  faqs.push({
    q: 'Do I need to do anything to use it?',
    a:
      update.userActionRequired ||
      'No action is required — the improvement is already live in SwingVantage and free to use.',
  });

  return faqs;
}

/** A concise, extraction-ready answer block for AI search engines. */
export function updateAiAnswer(update: Update): string {
  return (
    update.answerEngineSummary ||
    update.generativeSearchSummary ||
    `${update.title}: ${update.summary}`
  );
}

/** Per-page Metadata: unique title/description, canonical, Open Graph. */
export function buildUpdateMetadata(update: Update): Metadata {
  const title = update.metaTitle || `${update.title} | SwingVantage Updates`;
  const description = update.metaDescription || update.summary;
  const canonical = updatePath(update);
  return {
    title,
    description,
    keywords: update.seoKeywords,
    alternates: { canonical },
    openGraph: {
      title: update.metaTitle || update.title,
      description,
      type: 'article',
      url: updateUrl(update),
      publishedTime: update.releaseDate,
      modifiedTime: update.updatedAt,
    },
  };
}

/**
 * JSON-LD graph for a product update detail page:
 *   BreadcrumbList + Article + (FAQPage when FAQ items exist).
 * Article is the right type for a plain-English, user-facing product note.
 */
export function buildUpdateJsonLd(update: Update, faqs: UpdateFaq[]): Record<string, unknown> {
  const url = updateUrl(update);
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Updates', item: `${SITE_URL}/updates` },
        { '@type': 'ListItem', position: 3, name: update.title, item: url },
      ],
    },
    {
      '@type': 'Article',
      headline: update.title,
      description: update.metaDescription || update.summary,
      datePublished: update.releaseDate,
      dateModified: update.updatedAt,
      url,
      mainEntityOfPage: url,
      author: { '@type': 'Organization', name: 'SwingVantage', url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'SwingVantage', url: SITE_URL },
      ...(update.seoKeywords && update.seoKeywords.length > 0
        ? { keywords: update.seoKeywords.join(', ') }
        : {}),
      about: {
        '@type': 'SoftwareApplication',
        name: 'SwingVantage',
        applicationCategory: 'SportsApplication',
        operatingSystem: 'Web',
      },
    },
  ];

  if (faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

// ── Internal-link resolution ───────────────────────────────────────────────

/** A human label for a known internal-link target path. */
const LINK_LABELS: Record<string, string> = {
  '/': 'SwingVantage home',
  '/features': 'All features',
  '/how-it-works': 'How it works',
  '/journey': 'Athletic Journey',
  '/agi': 'Athlete General Intelligence',
  '/athlete-general-intelligence': 'What is Athlete GI?',
  '/recruiting': 'Recruiting Hub',
  '/bodysync': 'BodySync readiness',
  '/library': 'Video Library',
  '/notes': 'Daily Notes',
  '/equipment': 'Equipment',
  '/pricing': 'Pricing',
  '/methodology': 'Our methodology',
  '/sample-report': 'See a sample report',
};

export interface InternalLink {
  href: string;
  label: string;
}

/**
 * Resolve the update's internalLinkTargets into labeled links, always
 * including the Updates index so the detail page is never a dead end and the
 * card ⇄ index relationship is bidirectional.
 */
export function resolveInternalLinks(update: Update): InternalLink[] {
  const targets = update.internalLinkTargets ?? [];
  const links = targets.map((href) => ({ href, label: LINK_LABELS[href] ?? labelFromPath(href) }));
  // De-dupe while preserving order.
  const seen = new Set<string>();
  return links.filter((l) => (seen.has(l.href) ? false : (seen.add(l.href), true)));
}

function labelFromPath(path: string): string {
  const last = path.replace(/\/$/, '').split('/').pop() || path;
  return last
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}
