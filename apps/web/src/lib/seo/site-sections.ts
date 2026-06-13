// ============================================================
// SwingVantage — Curated Public-URL Registry (sitemap source of truth)
//
// This is the SINGLE source of truth for the *curated, static* public
// pages that belong in our search index — the ones that are not already
// enumerated from another registry. Both surfaces read from here so they
// can never drift apart:
//
//   • app/sitemap.ts            → the XML sitemap (/sitemap.xml)
//   • app/(marketing)/sitemap/  → the human HTML sitemap (/sitemap)
//
// WHAT BELONGS HERE
//   Only curated, trust-positive, indexable public pages whose URL is a
//   fixed literal (sport hubs, tools, methodology, sample reports, etc.).
//
// WHAT DOES NOT BELONG HERE (to avoid DUPLICATE sitemap entries)
//   Anything already emitted from its own registry by app/sitemap.ts:
//     • Programmatic SEO guides   → PUBLISHED_SEO_PAGES (@/content/seoPages)
//     • Blog posts + /blog        → getPublishedBlogPosts (@/data/blog-posts)
//     • Challenges + /challenges  → CHALLENGES (@/content/challenges)
//     • Library videos + /learn   → getLibraryItems (@/lib/library)
//     • Localized /es, /fr pages  → localizedRoutes (@/lib/marketing-i18n)
//   These stay dynamic so a new post/guide/challenge appears automatically.
//
// EXCLUDED ON PURPOSE (never add): login/signup, settings, dashboards,
// /admin, /api, tutorial UI, video app routes, parameterized/search/filter
// URLs, redirect-only URLs, and any noindex or auth-gated page. The
// authenticated app surface is blocked in apps/web/public/robots.txt.
//
// ── FUTURE: splitting the sitemap by type ────────────────────────────────
// The site is small enough today for ONE sitemap (well under Google's
// 50,000-URL / 50 MB per-file limit). Because every curated URL already
// carries a `section`, splitting later is mechanical and needs no data
// model change:
//   1. Add app/sitemaps/[section]/route.ts that emits the entries for one
//      section (curatedUrlsBySection()[section] + that section's dynamic
//      registry, e.g. guides for 'guides', posts for 'blog').
//   2. Turn app/sitemap.ts into a <sitemapindex> pointing at each child.
// Do this once any single section approaches a few thousand URLs or the
// combined sitemap nears the 50k limit — not before. See
// docs/seo/technical-seo-architecture.md.
// ============================================================

/** schema.org / sitemaps.org change-frequency hint. Mirrors Next's type. */
export type ChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

/**
 * Section a curated URL belongs to. Drives the HTML sitemap's grouping and
 * is the seam along which the XML sitemap can be split in the future.
 */
export type SiteSection =
  | 'main'
  | 'sports'
  | 'methodology'
  | 'sample-reports'
  | 'benchmarks'
  | 'tools'
  | 'partners'
  | 'about'
  | 'legal';

export interface CuratedUrl {
  /** Site-relative path, leading slash, NO query string and NO trailing slash. */
  path: string;
  /** Human-friendly label for the HTML sitemap (descriptive, not keyword-stuffed). */
  label: string;
  /** Grouping/section. */
  section: SiteSection;
  /** XML <priority> (0.0–1.0). Relative importance within OUR site only. */
  priority: number;
  /** XML <changefreq> hint. */
  changeFrequency: ChangeFrequency;
}

// Display order + headings for the HTML sitemap. Kept here so the page and
// any future per-section XML files share one ordering.
export const SECTION_ORDER: readonly SiteSection[] = [
  'main',
  'sports',
  'tools',
  'sample-reports',
  'methodology',
  'benchmarks',
  'partners',
  'about',
  'legal',
];

export const SECTION_LABELS: Record<SiteSection, string> = {
  main: 'Main pages',
  sports: 'Sport hubs',
  tools: 'Free tools',
  'sample-reports': 'Sample reports',
  methodology: 'How we measure & methodology',
  benchmarks: 'Benchmarks',
  partners: 'For coaches, teams & creators',
  about: 'About & updates',
  legal: 'Trust & legal',
};

// ── The curated set ─────────────────────────────────────────────────────────
// Priorities/change-frequencies carried over from the original app/sitemap.ts
// so the emitted XML is unchanged. Edit HERE, not in the sitemap route.
export const CURATED_URLS: readonly CuratedUrl[] = [
  // ── Main ──────────────────────────────────────────────────────────────
  { path: '/', label: 'Home', section: 'main', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/how-it-works', label: 'How it works', section: 'main', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/start', label: 'Get started', section: 'main', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/founding', label: 'Founding Members — free for life', section: 'main', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/features', label: 'Features', section: 'main', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/faq', label: 'Frequently asked questions', section: 'main', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/pricing', label: 'Pricing', section: 'main', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/parents', label: 'SwingVantage for parents', section: 'main', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/resources', label: 'Resources', section: 'main', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/glossary', label: 'Swing & launch-monitor glossary', section: 'main', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/sitemap', label: 'Sitemap (this page)', section: 'main', priority: 0.3, changeFrequency: 'monthly' },

  // ── Sport hubs ────────────────────────────────────────────────────────
  // Note: the pickleball & padel hubs (/pickleball, /padel) are programmatic
  // SEO pages (PUBLISHED_SEO_PAGES) so they are emitted dynamically by
  // app/sitemap.ts — do NOT duplicate them here.
  { path: '/golf-swing-analysis', label: 'Golf swing analysis', section: 'sports', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/tennis-swing-analysis', label: 'Tennis swing analysis', section: 'sports', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/baseball-swing-analysis', label: 'Baseball swing analysis', section: 'sports', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/softball-swing-analysis', label: 'Softball swing analysis', section: 'sports', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/softball-swing-analysis/slow-pitch', label: 'Slow-pitch softball swing analysis', section: 'sports', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/softball-swing-analysis/fast-pitch', label: 'Fast-pitch softball swing analysis', section: 'sports', priority: 0.9, changeFrequency: 'monthly' },

  // ── Free tools ──────────────────────────────────────────────────────────
  { path: '/tools', label: 'All free tools', section: 'tools', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/tools/golf-slice-fixer', label: 'Golf Slice Fixer', section: 'tools', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/tools/swing-mistake-quiz', label: 'Swing Mistake Quiz', section: 'tools', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/tools/at-home-swing-drill-generator', label: 'At-Home Swing Drill Generator', section: 'tools', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/tools/practice-plan-generator', label: 'Practice Plan Generator', section: 'tools', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/tools/private-lesson-savings-calculator', label: 'Private-Lesson Savings Calculator', section: 'tools', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/tools/slow-pitch-line-drive-guide', label: 'Slow-Pitch Line-Drive Guide', section: 'tools', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/tools/equipment-diagnostic', label: 'Equipment Diagnostic', section: 'tools', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/tools/swing-tempo-trainer', label: 'Swing Tempo Trainer', section: 'tools', priority: 0.6, changeFrequency: 'monthly' },

  // ── Sample reports ────────────────────────────────────────────────────
  { path: '/demo', label: 'Live sample report — pick your sport', section: 'sample-reports', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/sample-report', label: 'Sample reports (all sports)', section: 'sample-reports', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/sample-report/golf', label: 'Sample golf report', section: 'sample-reports', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/sample-report/tennis', label: 'Sample tennis report', section: 'sample-reports', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/sample-report/pickleball', label: 'Sample pickleball report', section: 'sample-reports', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/sample-report/padel', label: 'Sample padel report', section: 'sample-reports', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/sample-report/baseball', label: 'Sample baseball report', section: 'sample-reports', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/sample-report/slow-pitch', label: 'Sample slow-pitch softball report', section: 'sample-reports', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/sample-report/fast-pitch', label: 'Sample fast-pitch softball report', section: 'sample-reports', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/sample-report/softball', label: 'Sample softball report', section: 'sample-reports', priority: 0.6, changeFrequency: 'monthly' },

  // ── Methodology / explainers ──────────────────────────────────────────
  { path: '/methodology', label: 'Our methodology (measured vs. estimated)', section: 'methodology', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/athlete-general-intelligence', label: 'Athlete General Intelligence', section: 'methodology', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/learn/what-is-heuristic-data', label: 'What is heuristic data?', section: 'methodology', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/learn/ai-in-sports-performance', label: 'What is AI in sports performance?', section: 'methodology', priority: 0.6, changeFrequency: 'monthly' },

  // ── Benchmarks ────────────────────────────────────────────────────────
  { path: '/benchmarks', label: 'Benchmarks (all sports)', section: 'benchmarks', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/benchmarks/golf', label: 'Golf benchmarks', section: 'benchmarks', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/benchmarks/tennis', label: 'Tennis benchmarks', section: 'benchmarks', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/benchmarks/pickleball', label: 'Pickleball benchmarks', section: 'benchmarks', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/benchmarks/padel', label: 'Padel benchmarks', section: 'benchmarks', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/benchmarks/baseball', label: 'Baseball benchmarks', section: 'benchmarks', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/benchmarks/softball', label: 'Softball benchmarks', section: 'benchmarks', priority: 0.7, changeFrequency: 'monthly' },

  // ── Partners / audiences ──────────────────────────────────────────────
  { path: '/coaches', label: 'For coaches', section: 'partners', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/creators', label: 'For creators', section: 'partners', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/teams', label: 'For teams', section: 'partners', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/partners', label: 'Partners', section: 'partners', priority: 0.6, changeFrequency: 'monthly' },

  // ── About & updates ───────────────────────────────────────────────────
  { path: '/about', label: 'About SwingVantage', section: 'about', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact', label: 'Contact us', section: 'about', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/trust', label: 'Trust & safety', section: 'about', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/updates', label: 'Product updates', section: 'about', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/updates/milestones', label: 'Milestones', section: 'about', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/dev-updates', label: 'Engineering changelog', section: 'about', priority: 0.5, changeFrequency: 'weekly' },

  // ── Trust & legal ─────────────────────────────────────────────────────
  { path: '/privacy', label: 'Privacy policy', section: 'legal', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/terms', label: 'Terms of service', section: 'legal', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/vulnerability-disclosure', label: 'Vulnerability disclosure', section: 'legal', priority: 0.4, changeFrequency: 'yearly' },
];

/** Group the curated URLs by section, preserving SECTION_ORDER and list order. */
export function curatedUrlsBySection(): Record<SiteSection, CuratedUrl[]> {
  const out = {} as Record<SiteSection, CuratedUrl[]>;
  for (const section of SECTION_ORDER) out[section] = [];
  for (const url of CURATED_URLS) out[url.section].push(url);
  return out;
}
