// ============================================================
// SwingVantage Milestones — public page builder (PURE, server-safe)
// ------------------------------------------------------------
// Powers /milestones/[slug]. Joins a committed PublishedMilestone with its
// catalog definition + a generated content draft, and builds the page's
// metadata + JSON-LD (Article + Breadcrumb + FAQ + SoftwareApplication). PURE:
// no node:fs / server-only — importable from the page, sitemap and tests.
// Mirrors lib/updates/product-detail.ts.
// ============================================================

import type { Metadata } from 'next';
import { SITE_URL } from '@/config/site';
import { PUBLISHED_MILESTONES, findPublishedMilestone } from '@/content/milestones/published';
import { findMilestoneBySlug, MILESTONE_CATALOG } from './catalog';
import { generateMilestoneContent } from './content';
import { recommendInternalLinks } from './internal-links';
import type { MilestoneContentDraft, MilestoneDefinition, MilestoneFaq, PublishedMilestone } from './types';

/**
 * Public dedicated-page path. Lives under /updates/ because the top-level
 * /milestones route is an authenticated in-app feature (app/(app)/milestones).
 */
export function milestonePath(slug: string): string {
  return `/updates/milestones/${slug}`;
}
export function milestoneUrl(slug: string): string {
  return `${SITE_URL}${milestonePath(slug)}`;
}

export interface PublicMilestone {
  published: PublishedMilestone;
  definition: MilestoneDefinition;
  content: MilestoneContentDraft;
}

/** Resolve a published milestone + its definition + generated content. */
export function getPublicMilestone(slug: string): PublicMilestone | undefined {
  const published = findPublishedMilestone(slug);
  if (!published) return undefined;
  const definition = findMilestoneBySlug(slug) ?? (published.definitionId ? MILESTONE_CATALOG.find((d) => d.id === published.definitionId) : undefined);
  if (!definition) return undefined;
  const content = generateMilestoneContent(definition, { verifiedMetric: published.verifiedMetric });
  // Apply committed SEO overrides.
  if (published.seoTitle) content.seoTitle = published.seoTitle;
  if (published.metaDescription) content.metaDescription = published.metaDescription;
  return { published, definition, content };
}

export function buildMilestoneFaqs(p: PublicMilestone): MilestoneFaq[] {
  return p.content.faqs;
}

export function buildMilestoneMetadata(p: PublicMilestone): Metadata {
  const { published, content } = p;
  const canonical = milestonePath(published.slug);
  return {
    title: content.seoTitle,
    description: content.metaDescription,
    keywords: [content.primaryKeyword, ...content.secondaryKeywords],
    alternates: { canonical },
    robots: published.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title: content.seoTitle,
      description: content.metaDescription,
      type: 'article',
      url: milestoneUrl(published.slug),
      publishedTime: published.achievedAt,
    },
  };
}

export function buildMilestoneJsonLd(p: PublicMilestone, faqs: MilestoneFaq[]): Record<string, unknown> {
  const { published, definition, content } = p;
  const url = milestoneUrl(published.slug);
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Updates', item: `${SITE_URL}/updates` },
        { '@type': 'ListItem', position: 3, name: 'Milestones', item: `${SITE_URL}/updates/milestones` },
        { '@type': 'ListItem', position: 4, name: definition.title, item: url },
      ],
    },
    {
      '@type': 'Article',
      headline: definition.title,
      description: content.metaDescription,
      datePublished: published.achievedAt,
      dateModified: published.achievedAt,
      url,
      mainEntityOfPage: url,
      author: { '@type': 'Organization', name: 'SwingVantage', url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'SwingVantage', url: SITE_URL },
      keywords: [content.primaryKeyword, ...content.secondaryKeywords].join(', '),
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
      mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

/** Other published milestones (for the "Related milestones" + next section). */
export function relatedPublishedMilestones(slug: string, limit = 4): PublicMilestone[] {
  const self = findPublishedMilestone(slug);
  return PUBLISHED_MILESTONES.filter((p) => p.slug !== slug)
    .map((p) => getPublicMilestone(p.slug))
    .filter((x): x is PublicMilestone => Boolean(x))
    .sort((a, b) => {
      const sameCat = (x: PublicMilestone) => (self && x.definition.category === findMilestoneBySlug(slug)?.category ? 1 : 0);
      return sameCat(b) - sameCat(a);
    })
    .slice(0, limit);
}

/** Next milestones to pursue in the same category (catalog, higher target). */
export function nextMilestones(def: MilestoneDefinition, limit = 3): MilestoneDefinition[] {
  return MILESTONE_CATALOG.filter(
    (d) => d.category === def.category && d.id !== def.id && d.trigger.value > def.trigger.value,
  )
    .sort((a, b) => a.trigger.value - b.trigger.value)
    .slice(0, limit);
}

export function resolveMilestoneLinks(def: MilestoneDefinition) {
  return recommendInternalLinks(def);
}
