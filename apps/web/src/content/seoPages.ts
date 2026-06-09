// ============================================================
// SwingVantage — SEO Content Registry
//
// Single source of truth for programmatic SEO landing pages.
// Each entry is rendered by components/seo/SeoArticle.tsx using
// the AEO/GEO format (direct answer → explanation → diagnosis →
// drills → mistakes → coach → FAQ → CTA → schema).
//
// QUALITY RULE: only entries with publishStatus 'published' are
// routed and indexed. 'draft' entries are backlog content that is
// NOT yet good enough to ship — never publish thin pages.
// ============================================================

import { WEDGE_PAGES } from './seoPagesWedges';
import { RACKET_PAGES } from './seoPagesRacket';
import { GOLF_GAP_PAGES } from './seoPagesGolf';
import { SOFTBALL_GAP_PAGES } from './seoPagesSoftball';
import { MULTI_SPORT_GAP_PAGES } from './seoPagesGaps';
// Hand-written core pages, size-sharded out of this file (roadmap #20) so every
// SEO registry file stays under ~600 lines. Spread back into SEO_PAGES in order
// below — no behavior change. New pages may go in any shard or a new sibling.
import { SEO_CORE_A } from './seoPagesCoreA';
import { SEO_CORE_B } from './seoPagesCoreB';
import { SEO_CORE_C } from './seoPagesCoreC';
// Admin publish overrides (slug → status), set from /admin/updates. Committed,
// merged at read time so a published page can be pulled — or a draft pushed
// live — without hand-editing this registry. Empty `{}` = use each page's own
// publishStatus. See lib/admin/content-publish-store.ts.
import seoPublishOverrides from '@/data/seo-publish-overrides.json';

export type Sport = 'golf' | 'tennis' | 'pickleball' | 'padel' | 'baseball' | 'softball' | 'multi';
export type Audience = 'player' | 'parent' | 'coach' | 'creator' | 'team';
export type Intent = 'informational' | 'commercial' | 'transactional';
export type FunnelStage = 'awareness' | 'consideration' | 'conversion';
export type SchemaType = 'Article' | 'HowTo' | 'FAQPage' | 'Service';
export type PublishStatus = 'published' | 'draft';

export interface SeoFaq {
  question: string;
  answer: string;
}

export interface SeoDrill {
  name: string;
  /** Plain-English how-to, beginner-safe. */
  how: string;
}

export interface RelatedLink {
  label: string;
  href: string;
}

export interface SeoPage {
  /** URL path WITHOUT leading slash, e.g. 'golf/fix-slice'. */
  slug: string;
  sport: Sport;
  /**
   * Optional softball discipline. Lets the slow-pitch / fast-pitch hubs
   * filter their guide silo (RelatedGuides). Pages with no discipline are
   * treated as general softball and show on both hubs.
   */
  discipline?: 'slow_pitch' | 'fast_pitch';
  audience: Audience;
  keyword: string;
  intent: Intent;
  funnelStage: FunnelStage;
  /** 1 (highest) – 5 (lowest) build/SEO priority. */
  priority: 1 | 2 | 3 | 4 | 5;
  title: string;
  metaDescription: string;
  /** One-paragraph direct answer shown at the very top (AEO/GEO). */
  directAnswer: string;
  /** 1–3 paragraphs explaining the problem. */
  problemExplanation: string[];
  /** Self-check / diagnosis checklist. */
  diagnosisSteps: string[];
  /** What SwingVantage specifically looks for / measures. */
  whatSwingVantageLooksFor: string[];
  /** Optional one-line worked example of a diagnosis SwingVantage might give. */
  exampleDiagnosis?: string;
  drills: SeoDrill[];
  mistakesToAvoid: string[];
  whenToWorkWithCoach: string;
  faqs: SeoFaq[];
  relatedLinks: RelatedLink[];
  cta: { label: string; href: string };
  schemaType: SchemaType;
  /** Youth/safety reminders rendered in a notice block. */
  safetyNotes: string;
  publishStatus: PublishStatus;
}

// ── Draft backlog (NOT routed/indexed until fully written) ──────
const DRAFTS: SeoPage[] = [
  {
    slug: 'parents/youth-baseball-hitting',
    sport: 'baseball', audience: 'parent', keyword: 'youth baseball hitting for parents', intent: 'informational',
    funnelStage: 'consideration', priority: 3,
    title: 'Youth Baseball Hitting for Parents', metaDescription: 'Draft — see /baseball/youth-hitting for the published version.',
    directAnswer: '', problemExplanation: [], diagnosisSteps: [], whatSwingVantageLooksFor: [], drills: [], mistakesToAvoid: [],
    whenToWorkWithCoach: '', faqs: [], relatedLinks: [], cta: { label: 'See how SwingVantage helps parents', href: '/parents' },
    schemaType: 'Article', safetyNotes: '', publishStatus: 'draft',
  },
  {
    slug: 'compare/private-lessons',
    sport: 'multi', audience: 'player', keyword: 'swing app vs private lessons', intent: 'commercial',
    funnelStage: 'consideration', priority: 3,
    title: 'SwingVantage vs Private Lessons', metaDescription: 'Draft — needs a dedicated comparison template (not the problem/HowTo format).',
    directAnswer: '', problemExplanation: [], diagnosisSteps: [], whatSwingVantageLooksFor: [], drills: [], mistakesToAvoid: [],
    whenToWorkWithCoach: '', faqs: [], relatedLinks: [], cta: { label: 'Try SwingVantage free', href: '/dashboard' },
    schemaType: 'Article', safetyNotes: '', publishStatus: 'draft',
  },
  {
    slug: 'compare/youtube-swing-tips',
    sport: 'multi', audience: 'player', keyword: 'youtube swing tips vs analysis', intent: 'commercial',
    funnelStage: 'consideration', priority: 3,
    title: 'SwingVantage vs YouTube Swing Tips', metaDescription: 'Draft — pending full content.',
    directAnswer: '', problemExplanation: [], diagnosisSteps: [], whatSwingVantageLooksFor: [], drills: [], mistakesToAvoid: [],
    whenToWorkWithCoach: '', faqs: [], relatedLinks: [], cta: { label: 'Try SwingVantage free', href: '/dashboard' },
    schemaType: 'Article', safetyNotes: '', publishStatus: 'draft',
  },
];

export const SEO_PAGES: SeoPage[] = [
  // Hand-written core pages — size-sharded (A→B→C) but spread in the original
  // order, so this list is byte-for-byte equivalent to the pre-split registry.
  ...SEO_CORE_A,
  ...SEO_CORE_B,
  ...SEO_CORE_C,
  // Phase 3 SEO growth wedges (slow-pitch + fast-pitch + baseball) —
  // kept in a sibling file to keep this registry edit minimal.
  ...WEDGE_PAGES,
  ...RACKET_PAGES,
  // Golf scoring-gap pages (break 90, iron consistency, wedge distance) —
  // sibling file, same rationale as the wedges above.
  ...GOLF_GAP_PAGES,
  // Slow-pitch softball gap pages (practice plan, hitting drills).
  ...SOFTBALL_GAP_PAGES,
  // Cross-sport technique gaps (tennis serve/volley, baseball launch/inside,
  // pickleball serve, padel serve).
  ...MULTI_SPORT_GAP_PAGES,
  ...DRAFTS,
];

const SEO_PUBLISH_OVERRIDES = seoPublishOverrides as Record<string, PublishStatus>;

/** A page's effective status, applying any admin publish override by slug. */
export function effectiveSeoStatus(p: SeoPage): PublishStatus {
  return SEO_PUBLISH_OVERRIDES[p.slug] ?? p.publishStatus;
}

/** All published pages (routed + indexed + in sitemap), overrides applied. */
export const PUBLISHED_SEO_PAGES: SeoPage[] = SEO_PAGES.filter(
  (p) => effectiveSeoStatus(p) === 'published',
);

/** Look up a published page by slug (without leading slash). */
export function getPublishedSeoPage(slug: string): SeoPage | undefined {
  return PUBLISHED_SEO_PAGES.find((p) => p.slug === slug);
}
