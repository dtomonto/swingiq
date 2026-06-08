// ============================================================
// SwingVantage — Developer Update detail engine (pure, server-safe)
// ------------------------------------------------------------
// Powers the dedicated /dev-updates/[slug] technical report pages from the
// existing DevUpdate model in @/data/devUpdates. Same contract as the product
// engine: a published developer update is BOTH a card and a dedicated page
// from one source of truth.
//
// DevUpdate has no slug field, so slugs are derived deterministically from the
// stable id (or, as a fallback, the title) and verified unique by a test.
// ============================================================

import type { Metadata } from 'next';
import { SITE_URL } from '@/config/site';
import { getDevUpdates, type DevUpdate } from '@/data/devUpdates';

/** Deterministic, URL-safe slug for a developer update. */
export function devUpdateSlug(update: DevUpdate): string {
  const withSlug = update as DevUpdate & { slug?: string };
  if (withSlug.slug) return withSlug.slug;
  // ids are already kebab-case and unique (e.g. "dev-seven-sports"); drop the
  // conventional "dev-" prefix for a cleaner URL. Fall back to a slugified title.
  const fromId = update.id.replace(/^dev-/, '').trim();
  if (fromId) return fromId;
  return slugify(update.title);
}

export function devUpdatePath(update: DevUpdate): string {
  return `/dev-updates/${devUpdateSlug(update)}`;
}

export function devUpdateUrl(update: DevUpdate): string {
  return `${SITE_URL}${devUpdatePath(update)}`;
}

/** A published (non-draft) developer update by slug, or undefined. */
export function getPublicDevUpdateBySlug(slug: string): DevUpdate | undefined {
  return getDevUpdates().find((u) => devUpdateSlug(u) === slug);
}

/** Slugs of every page-eligible developer update — for generateStaticParams + sitemap. */
export function publicDevUpdateSlugs(): string[] {
  return getDevUpdates().map(devUpdateSlug);
}

/** Related developer updates scored by shared category, newest first. */
export function getRelatedDevUpdates(update: DevUpdate, limit = 4): DevUpdate[] {
  const others = getDevUpdates().filter((u) => u.id !== update.id);
  const scored = others.map((u) => {
    let score = 0;
    if (u.category === update.category) score += 2;
    if (u.impact === update.impact) score += 1;
    return { u, score };
  });
  return scored
    .sort((a, b) => b.score - a.score || new Date(b.u.date).getTime() - new Date(a.u.date).getTime())
    .slice(0, limit)
    .map((s) => s.u);
}

export interface DevUpdateFaq {
  q: string;
  a: string;
}

/** AEO/GEO FAQ derived from the developer update's own fields. */
export function buildDevUpdateFaqs(update: DevUpdate): DevUpdateFaq[] {
  const faqs: DevUpdateFaq[] = [
    { q: `What changed in "${update.title}"?`, a: update.headline },
    { q: 'What was built and why does it matter?', a: update.details },
  ];
  if (update.stack && update.stack.length > 0) {
    faqs.push({
      q: 'What technologies are involved?',
      a: `This work is built with ${update.stack.join(', ')}.`,
    });
  }
  return faqs;
}

/** Short technical summary for AI answer engines. */
export function devUpdateAiAnswer(update: DevUpdate): string {
  return `${update.title}: ${update.headline}`;
}

export function buildDevUpdateMetadata(update: DevUpdate): Metadata {
  const title = `${update.title} | SwingVantage Developer Updates`;
  const description = update.headline;
  const canonical = devUpdatePath(update);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: update.title,
      description,
      type: 'article',
      url: devUpdateUrl(update),
      publishedTime: update.date,
    },
  };
}

/**
 * JSON-LD graph for a developer update detail page:
 *   BreadcrumbList + TechArticle + (FAQPage when FAQ items exist).
 * TechArticle is the correct type for a technical engineering write-up.
 */
export function buildDevUpdateJsonLd(
  update: DevUpdate,
  faqs: DevUpdateFaq[],
): Record<string, unknown> {
  const url = devUpdateUrl(update);
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Developer Updates', item: `${SITE_URL}/dev-updates` },
        { '@type': 'ListItem', position: 3, name: update.title, item: url },
      ],
    },
    {
      '@type': 'TechArticle',
      headline: update.title,
      description: update.headline,
      datePublished: update.date,
      url,
      mainEntityOfPage: url,
      author: { '@type': 'Organization', name: 'SwingVantage', url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'SwingVantage', url: SITE_URL },
      ...(update.stack && update.stack.length > 0 ? { keywords: update.stack.join(', ') } : {}),
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

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
