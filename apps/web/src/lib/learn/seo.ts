// ============================================================
// SwingVantage — Learn SEO helpers: canonical paths + JSON-LD.
// Pure (no registry import) so the registry can import paths from
// here without a cycle.
// ============================================================

import {
  articleSchema,
  faqPageSchema,
  howToSchema,
  buildGraph,
} from '@/lib/seo/jsonLd';
import type { LearnEntry } from './types';

/** Flagship concept page path, e.g. /learn/grip. */
export function conceptPath(slug: string): string {
  return `/learn/${slug}`;
}

/** Data-point page path, e.g. /learn/data-points/tempo. */
export function dataPointPath(slug: string): string {
  return `/learn/data-points/${slug}`;
}

/** The canonical path for any entry, by kind. */
export function learnPath(entry: Pick<LearnEntry, 'kind' | 'slug'>): string {
  return entry.kind === 'concept' ? conceptPath(entry.slug) : dataPointPath(entry.slug);
}

/**
 * Build the JSON-LD @graph for a learn page: an Article node, an FAQPage node
 * (only when there are FAQs), and a HowTo node built from the entry's drills
 * (only when there are drills) — schema that maps to visible page content, per
 * our JSON-LD rules. Breadcrumb schema is emitted separately by <Breadcrumbs>.
 */
export function buildLearnGraph(entry: LearnEntry) {
  const path = learnPath(entry);
  const nodes = [
    articleSchema({
      headline: entry.title,
      description: entry.seoDescription || entry.descriptionShort,
      path,
      dateModified: entry.lastReviewedAt,
    }),
  ];
  if (entry.faqs.length > 0) {
    nodes.push(faqPageSchema(entry.faqs.map((f) => ({ question: f.question, answer: f.answer }))));
  }
  if (entry.drills.length > 0) {
    nodes.push(
      howToSchema(
        `Drills for ${entry.title}`,
        entry.drills.map((d) => ({ name: d.name, text: d.how })),
        `Original ${entry.title.toLowerCase()} drills from SwingVantage.`,
      ),
    );
  }
  return buildGraph(...nodes);
}
