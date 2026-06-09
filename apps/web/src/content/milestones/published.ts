// ============================================================
// SwingVantage Milestones — PUBLISHED registry (committed source of truth)
// ------------------------------------------------------------
// The curated list of milestones that have a LIVE public page at
// /milestones/<slug> and appear in the sitemap. This is the ONLY thing that
// makes a milestone public — the engine can mark a milestone "earned," but a
// page exists only after an admin approves it and commits an entry here (via
// the Milestone Center's "export approved milestones" action).
//
// TRUTHFULNESS: every entry below is genuinely true today (verifiable from the
// product itself — sports live, pages published, features shipped). We do NOT
// list unverified counts (visitors, analyses, backlinks); those stay in the
// admin center as "needs data source" until a real source is connected.
//
// To publish more: earn + approve a milestone in /admin/milestones, then paste
// the exported entry here and commit.
// ============================================================

import type { PublishedMilestone } from '@/lib/milestones/types';

export const PUBLISHED_MILESTONES: PublishedMilestone[] = [
  {
    slug: 'first-public-swingvantage-milestone',
    definitionId: 'm001',
    verifiedMetric: 'Milestone Authority System launched',
    achievedAt: '2026-06-08',
  },
  {
    slug: 'all-core-sports-activated',
    definitionId: 'm046',
    verifiedMetric: '7 sports live (golf, tennis, baseball, slow- & fast-pitch softball, pickleball, padel)',
    achievedAt: '2026-06-08',
  },
  {
    slug: 'first-educational-guide',
    definitionId: 'm051',
    verifiedMetric: 'Educational guide library live',
    achievedAt: '2026-06-08',
  },
  {
    slug: 'first-methodology-page',
    definitionId: 'm060',
    verifiedMetric: 'Methodology page published (measured vs. estimated)',
    achievedAt: '2026-06-08',
  },
  {
    slug: 'first-multilanguage-page',
    definitionId: 'm093',
    verifiedMetric: 'Localized pages live (Spanish & French)',
    achievedAt: '2026-06-08',
  },
  {
    slug: 'swingvantage-authority-system-activated',
    definitionId: 'm100',
    verifiedMetric: 'Milestones, updates & authority pages connected',
    achievedAt: '2026-06-08',
  },
];

/** A published milestone by slug (undefined when not published). */
export function findPublishedMilestone(slug: string): PublishedMilestone | undefined {
  return PUBLISHED_MILESTONES.find((p) => p.slug === slug);
}

/** Slugs with a public page (for generateStaticParams). */
export function publishedMilestoneSlugs(): string[] {
  return PUBLISHED_MILESTONES.map((p) => p.slug);
}

/** Published milestones eligible for the sitemap (indexable only). */
export function indexablePublishedMilestones(): PublishedMilestone[] {
  return PUBLISHED_MILESTONES.filter((p) => !p.noindex);
}
