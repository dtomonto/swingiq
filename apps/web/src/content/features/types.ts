// ============================================================
// SwingVantage — Public Feature Registry (model)
// ------------------------------------------------------------
// Single source of truth for the public /features hub and the per-feature
// detail pages at /features/[slug]. Each entry is a marketing+education page:
// a comprehensive description, a step-by-step guide to using the feature fully,
// honest limitations, FAQs, and related links — written to be genuinely useful
// (and to build topical/domain authority) rather than thin.
//
// Honesty rules carry over from the rest of the app: never overstate what a
// feature measures, label estimates as estimates, and prefer "what it does NOT
// do" over hype. See content/seoPages.ts for the sibling SEO registry.
// ============================================================

/** A single step in the "how to use it" guide. */
export interface FeatureGuideStep {
  /** Short imperative title, e.g. "Import or record a swing". */
  title: string;
  /** 1–3 sentences of concrete instruction. */
  body: string;
}

export interface FeatureFaq {
  question: string;
  answer: string;
}

export interface FeatureLink {
  label: string;
  href: string;
}

/** Sport coverage tag shown on cards + detail headers (free text, matches the
 *  existing copy, e.g. "All 7 sports", "Golf", "Baseball & Softball"). */
export type FeatureSports = string;

export interface Feature {
  /** URL slug WITHOUT leading slash, e.g. 'ai-diagnostic-engine'. Stable. */
  slug: string;
  /** Display name, e.g. "AI Diagnostic Engine". */
  name: string;
  /** Group heading on the hub, e.g. "Swing Diagnosis". */
  group: string;
  /** Sport coverage label. */
  sports: FeatureSports;
  /** One-line summary shown on the hub card (the original `desc`). */
  summary: string;
  /** Optional one-line "good to know" note (the original `detail`). */
  note?: string;

  /** 2–4 paragraph comprehensive description of what the feature is + why it
   *  matters. Required — the detail page is never thin. */
  overview: string[];
  /** Who it's for / when to reach for it. */
  bestFor?: string[];
  /** The step-by-step guide to taking full advantage of the feature. */
  guide: FeatureGuideStep[];
  /** Power-user tips that go beyond the basics. */
  proTips?: string[];
  /** Honest limits / what it does NOT do — trust + authority. */
  limitations?: string[];
  /** Question/answer pairs (also emitted as FAQPage schema). */
  faqs?: FeatureFaq[];
  /** Slugs of related features (cross-links + internal-link authority). */
  relatedSlugs?: string[];
  /** Related non-feature links (guides, SEO pages, sport hubs). */
  relatedLinks?: FeatureLink[];

  /** Optional SEO overrides (default derived from name/summary). */
  metaTitle?: string;
  metaDescription?: string;
}

/** A group of features as shown on the hub, derived from the registry. */
export interface FeatureGroup {
  heading: string;
  features: Feature[];
}
