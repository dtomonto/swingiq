// ============================================================
// SwingVantage — Learn registry: getters, publish-gating, and
// relationship resolution. The ONLY place pages read content from,
// so the publish gate (status === 'published') is enforced once.
// ============================================================

import { getFault } from '@/lib/faults';
import { USER_COACHING_STYLES } from '@/lib/central-intelligence/coach-mix/user-styles';
import { CONCEPT_ENTRIES } from './concepts';
import { DATA_POINT_ENTRIES } from './data-points';
import type { LearnEntry } from './types';
import { conceptPath, dataPointPath, learnPath } from './seo';

const ALL_ENTRIES: LearnEntry[] = [...CONCEPT_ENTRIES, ...DATA_POINT_ENTRIES];

/** A learn entry never shows publicly unless it is published. */
function isPublic(e: LearnEntry): boolean {
  return e.status === 'published';
}

/** All published entries (concepts + data points). */
export function getPublishedLearnEntries(): LearnEntry[] {
  return ALL_ENTRIES.filter(isPublic);
}

/** Published flagship concept pages (grip / weight distribution / swing plane). */
export function getConceptEntries(): LearnEntry[] {
  return getPublishedLearnEntries().filter((e) => e.kind === 'concept');
}

/** Published data-point pages. */
export function getDataPointEntries(): LearnEntry[] {
  return getPublishedLearnEntries().filter((e) => e.kind === 'data-point');
}

/** Look up any entry by slug (published only). Unpublished → undefined → 404. */
export function getLearnEntry(slug: string): LearnEntry | undefined {
  return getPublishedLearnEntries().find((e) => e.slug === slug);
}

export function getConceptEntry(slug: string): LearnEntry | undefined {
  return getConceptEntries().find((e) => e.slug === slug);
}

export function getDataPointEntry(slug: string): LearnEntry | undefined {
  return getDataPointEntries().find((e) => e.slug === slug);
}

/** Data points grouped by category, for the index page. */
export function getDataPointsByCategory(): { category: LearnEntry['category']; entries: LearnEntry[] }[] {
  const order: LearnEntry['category'][] = ['setup', 'motion', 'sequencing', 'contact', 'release', 'result', 'mind'];
  return order
    .map((category) => ({ category, entries: getDataPointEntries().filter((e) => e.category === category) }))
    .filter((g) => g.entries.length > 0);
}

// ── Relationship resolution (ids → renderable links) ────────────

export interface ResolvedLink {
  label: string;
  href: string;
}

/** Resolve related concept + data-point slugs into links (skips unpublished/missing). */
export function resolveRelatedPages(entry: LearnEntry): { concepts: ResolvedLink[]; dataPoints: ResolvedLink[] } {
  const concepts = (entry.relatedConceptSlugs ?? [])
    .map((slug) => getConceptEntry(slug))
    .filter((e): e is LearnEntry => Boolean(e))
    .map((e) => ({ label: e.title, href: learnPath(e) }));
  const dataPoints = (entry.relatedDataPointSlugs ?? [])
    .map((slug) => getDataPointEntry(slug))
    .filter((e): e is LearnEntry => Boolean(e))
    .map((e) => ({ label: e.title, href: learnPath(e) }));
  return { concepts, dataPoints };
}

/**
 * The page that best explains a fault: the canonical explainer first (a page
 * that is ABOUT the fault), then any published page that lists it as related.
 * Prefers data points over concepts (more specific). Order-independent.
 */
function pageForFault(faultId: string): LearnEntry | undefined {
  const published = getPublishedLearnEntries();
  const canonical = published.find((e) => e.canonicalForFaultIds?.includes(faultId));
  if (canonical) return canonical;
  const dp = getDataPointEntries().find((e) => e.relatedFaultIds?.includes(faultId));
  if (dp) return dp;
  return getConceptEntries().find((e) => e.relatedFaultIds?.includes(faultId));
}

/** Resolve related fault ids into names via the existing ontology (skips unknown ids). */
export function resolveRelatedFaults(entry: LearnEntry): { name: string; href?: string }[] {
  return (entry.relatedFaultIds ?? [])
    .map((id) => {
      const fault = getFault(id);
      if (!fault) return null;
      const page = pageForFault(id);
      return { name: fault.name, ...(page ? { href: learnPath(page) } : {}) };
    })
    .filter((x): x is { name: string; href?: string } => Boolean(x));
}

/** Resolve coach-style ids into user-facing labels via the coach-mix user styles. */
export function resolveRelatedCoachStyles(entry: LearnEntry): { id: string; label: string }[] {
  return (entry.relatedCoachStyleIds ?? [])
    .map((id) => {
      const style = USER_COACHING_STYLES.find((s) => s.id === id);
      return style ? { id: style.id, label: style.label } : null;
    })
    .filter((x): x is { id: string; label: string } => Boolean(x));
}

/**
 * Find the learn page that best explains a detected fault id — for wiring a
 * "Learn this concept" link into the swing-analysis report. Returns a
 * data-point page first (most specific), else a concept page that lists the fault.
 */
export function learnPageForFault(faultId: string): ResolvedLink | undefined {
  const page = pageForFault(faultId);
  return page ? { label: page.title, href: learnPath(page) } : undefined;
}

export { conceptPath, dataPointPath, learnPath };
