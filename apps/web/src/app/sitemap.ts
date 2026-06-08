import type { MetadataRoute } from 'next';
import { PUBLISHED_SEO_PAGES } from '@/content/seoPages';
import { SITE_URL } from '@/config/site';
import { getLibraryItems } from '@/lib/library';
import { learnPath } from '@/lib/library/seo';
import { localizedRoutes, currentLocalesFor } from '@/lib/marketing-i18n/expose';
import { localizedHref } from '@/lib/marketing-i18n/href';
import { getPublishedBlogPosts } from '@/data/blog-posts';
import { CHALLENGES } from '@/content/challenges';

// Sitemap URLs MUST be on the same host the sitemap is served from, or
// Google rejects them ("URL not allowed for a Sitemap at this location").
// Always derive the host from the central site config (overridable via
// NEXT_PUBLIC_SITE_URL) — never hardcode a domain here.
const BASE_URL = SITE_URL;

// Next.js writes sitemap field values verbatim — its serializer does NOT
// XML-escape them (see node_modules/next/dist/build/webpack/loaders/metadata/
// resolve-route-data.js). So a '&', '<' or '>' in a free-text field — e.g. a
// video title like "Upload & analyze a swing video" — produces invalid XML and
// Google reports a parsing error. Escape the five XML metacharacters here.
// There is no risk of double-escaping because Next escapes nothing itself.
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// hreflang alternates for a base path: English (root) + every locale the page
// is currently fully translated into, plus x-default. Undefined when the page
// has no translations, so untranslated pages stay single-language in the sitemap.
function languagesFor(path: string): Record<string, string> | undefined {
  const locales = currentLocalesFor(path);
  if (locales.length === 0) return undefined;
  const enUrl = `${BASE_URL}${path === '/' ? '' : path}`;
  const languages: Record<string, string> = { en: enUrl, 'x-default': enUrl };
  for (const loc of locales) languages[loc] = `${BASE_URL}${localizedHref(path, loc)}`;
  return languages;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // One entry per localized (e.g. /es) page, each carrying its hreflang group.
  const localizedPages: MetadataRoute.Sitemap = localizedRoutes().map(({ locale, path }) => ({
    url: `${BASE_URL}${localizedHref(path, locale)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 0.9 : 0.6,
    alternates: { languages: languagesFor(path) },
  }));

  // Programmatic SEO landing pages (only those marked 'published').
  const seoPages: MetadataRoute.Sitemap = PUBLISHED_SEO_PAGES.map((p) => ({
    url: `${BASE_URL}/${p.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: p.priority === 1 ? 0.8 : 0.7,
  }));

  // Free growth tools (index + individual tools).
  const toolPages: MetadataRoute.Sitemap = [
    '/tools',
    '/tools/golf-slice-fixer',
    '/tools/swing-mistake-quiz',
    '/tools/at-home-swing-drill-generator',
    '/tools/practice-plan-generator',
    '/tools/private-lesson-savings-calculator',
    '/tools/slow-pitch-line-drive-guide',
    '/tools/equipment-diagnostic',
  ].map((path) => ({ url: `${BASE_URL}${path}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 }));

  // Partner / audience pages.
  const partnerPages: MetadataRoute.Sitemap = ['/coaches', '/creators', '/teams', '/partners'].map(
    (path) => ({ url: `${BASE_URL}${path}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 }),
  );

  // Challenge pages: the index + one entry per challenge, derived from the
  // CHALLENGES registry so a new challenge appears here automatically.
  const challengePages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/challenges`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 },
    ...Object.values(CHALLENGES).map((c) => ({
      url: `${BASE_URL}/challenges/${c.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];

  // Blog: the index + one entry per post, derived from the BLOG_POSTS registry
  // so a new post appears here automatically. lastModified uses each post's own
  // publishDate (a real signal) rather than the build time.
  const blogPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
    ...getPublishedBlogPosts().map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.publishDate ? new Date(post.publishDate).toISOString() : now,
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    })),
  ];

  // Public video library: the index + one crawlable page per video, with
  // video-sitemap metadata for recorded videos (SEO/AEO/GEO discovery).
  const learnPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/learn`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    ...getLibraryItems().map((item) => ({
      url: `${BASE_URL}${learnPath(item)}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      ...(item.hasRecording && item.poster && item.mp4Src
        ? {
            videos: [
              {
                title: xmlEscape(item.title),
                thumbnail_loc: `${BASE_URL}${item.poster}`,
                description: xmlEscape(item.description),
                content_loc: `${BASE_URL}${item.mp4Src}`,
              },
            ],
          }
        : {}),
    })),
  ];

  return [
    ...seoPages,
    ...toolPages,
    ...partnerPages,
    ...challengePages,
    ...learnPages,
    ...localizedPages,
    // ── Homepage ────────────────────────────────────────────────
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
      ...(languagesFor('/') ? { alternates: { languages: languagesFor('/') } } : {}),
    },

    // ── Sport swing analysis pages ──────────────────────────────
    {
      url: `${BASE_URL}/golf-swing-analysis`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/tennis-swing-analysis`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/baseball-swing-analysis`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/softball-swing-analysis`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/softball-swing-analysis/slow-pitch`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/softball-swing-analysis/fast-pitch`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },

    // ── Feature & informational pages ───────────────────────────
    {
      url: `${BASE_URL}/how-it-works`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      // Onboarding entry point (public, indexable conversion page).
      url: `${BASE_URL}/start`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      // Transparency page: what SwingVantage measures vs. estimates.
      url: `${BASE_URL}/methodology`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      // Explainer: Athlete General Intelligence (cross-sport reasoning).
      url: `${BASE_URL}/athlete-general-intelligence`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      // Public worked example of a swing report (index of the five).
      url: `${BASE_URL}/sample-report`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...['golf', 'baseball', 'slow-pitch', 'fast-pitch', 'softball'].map((s) => ({
      url: `${BASE_URL}/sample-report/${s}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/features`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Note: /swinglab is intentionally NOT in the sitemap. It is admin-only
    // while in development (the public sees a noindex "in development" page),
    // so it is not a public, indexable surface. See its page.tsx + the
    // documented EXCLUDE entry in scripts/check-sitemap-coverage.mjs.
    {
      url: `${BASE_URL}/faq`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/resources`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/glossary`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/updates`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      // Engineering changelog (transparency / active-development signal).
      url: `${BASE_URL}/dev-updates`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/parents`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // ── About & trust ───────────────────────────────────────────
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      // Contact page (E-E-A-T / reachability trust signal; sets index:true).
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/trust`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/vulnerability-disclosure`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },

    // ── Blog (index + one entry per post, derived from BLOG_POSTS) ──
    ...blogPages,

    // ── Benchmarks ──────────────────────────────────────────────
    {
      url: `${BASE_URL}/benchmarks`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/benchmarks/golf`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/benchmarks/tennis`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/benchmarks/pickleball`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/benchmarks/padel`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/benchmarks/baseball`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/benchmarks/softball`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Note: /drills is an authenticated app route (blocked in robots.txt),
    // and per-sport drill URLs (/drills/golf, etc.) are not standalone
    // routes — so they are intentionally NOT listed in the sitemap.
  ];
}
