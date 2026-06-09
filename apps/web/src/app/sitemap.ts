import type { MetadataRoute } from 'next';
import { PUBLISHED_SEO_PAGES } from '@/content/seoPages';
import { SITE_URL } from '@/config/site';
import { getLearnItems } from '@/lib/library';
import { learnPath } from '@/lib/library/seo';
import { getConceptEntries, getDataPointEntries, learnPath as learnEntryPath } from '@/lib/learn';
import { localizedRoutes, currentLocalesFor } from '@/lib/marketing-i18n/expose';
import { localizedHref } from '@/lib/marketing-i18n/href';
import { getPublishedBlogPosts } from '@/data/blog-posts';
import { CHALLENGES } from '@/content/challenges';
import { CURATED_URLS } from '@/lib/seo/site-sections';
import { getAllSituationParams } from '@/lib/mental-performance/routines';
import { getPublicUpdates } from '@/data/updates';
import { getDevUpdates } from '@/data/devUpdates';
import { updatePath } from '@/lib/updates/product-detail';
import { devUpdatePath } from '@/lib/updates/dev-detail';
import { indexablePublishedMilestones } from '@/content/milestones/published';
import { milestonePath } from '@/lib/milestones/page-detail';

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

  // Programmatic SEO landing pages (only those marked 'published'). Includes
  // the pickleball & padel hubs and every published guide, so a new guide
  // appears here automatically.
  const seoPages: MetadataRoute.Sitemap = PUBLISHED_SEO_PAGES.map((p) => ({
    url: `${BASE_URL}/${p.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: p.priority === 1 ? 0.8 : 0.7,
  }));

  // Curated static pages (homepage, sport hubs, tools, partners, sample
  // reports, methodology, benchmarks, about/legal). Single source of truth is
  // lib/seo/site-sections.ts — shared with the HTML sitemap at /sitemap so the
  // two can never drift. hreflang alternates are attached for the handful of
  // pages that are translated (home, how-it-works, features, faq).
  const curatedPages: MetadataRoute.Sitemap = CURATED_URLS.map((p) => {
    const languages = languagesFor(p.path);
    return {
      url: p.path === '/' ? BASE_URL : `${BASE_URL}${p.path}`,
      lastModified: now,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
      ...(languages ? { alternates: { languages } } : {}),
    };
  });

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
    ...getLearnItems().map((item) => ({
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

  // Swing education: flagship concept pages (/learn/<slug>), the data-point
  // index, and one page per PUBLISHED data point. The registry getters only
  // return published entries, so drafts can never reach the sitemap.
  const learnConceptPages: MetadataRoute.Sitemap = [
    // Emit the static `/learn/` prefix literally (not via learnEntryPath) so the
    // sitemap-coverage gate recognises /learn as a registry-enumerated section
    // and treats its concept children (grip/swing-plane/weight-distribution) as
    // covered. learnEntryPath(e) for a concept entry is exactly `/learn/${slug}`.
    ...getConceptEntries().map((e) => ({
      url: `${BASE_URL}/learn/${e.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    { url: `${BASE_URL}/learn/data-points`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    ...getDataPointEntries().map((e) => ({
      url: `${BASE_URL}${learnEntryPath(e)}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];

  // Mental Performance pillar: the hub + one page per sport + one page per
  // seeded routine, derived from the routine library so new routines appear
  // here automatically (self-maintaining, like the guide/blog registries).
  const mentalParams = getAllSituationParams();
  const mentalSports = Array.from(new Set(mentalParams.map((p) => p.sport)));
  const mentalPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/mental-performance`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    ...mentalSports.map((s) => ({
      url: `${BASE_URL}/mental-performance/${s}`,
      lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6,
    })),
    ...mentalParams.map((p) => ({
      url: `${BASE_URL}/mental-performance/${p.sport}/${p.situation}`,
      lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5,
    })),
  ];

  // Product updates: the /updates index lives in CURATED_URLS; here we add one
  // entry per PUBLISHED, PUBLIC update detail page. getPublicUpdates() already
  // excludes drafts, private, hidden, and not-yet-public items, so draft/private
  // pages can never reach the sitemap. lastmod uses each update's own updatedAt.
  const updatePages: MetadataRoute.Sitemap = getPublicUpdates().map((u) => ({
    url: `${BASE_URL}${updatePath(u)}`,
    lastModified: u.updatedAt ? new Date(u.updatedAt).toISOString() : now,
    changeFrequency: 'monthly' as const,
    priority: u.isMajorMilestone ? 0.6 : 0.5,
  }));

  // Milestone authority pages: one entry per APPROVED + indexable published
  // milestone (committed in content/milestones/published.ts). Unapproved /
  // noindex milestones are excluded by indexablePublishedMilestones(), so a
  // draft milestone can never reach the sitemap. The /updates/milestones index
  // lives in CURATED_URLS.
  const milestonePages: MetadataRoute.Sitemap = indexablePublishedMilestones().map((mItem) => ({
    url: `${BASE_URL}${milestonePath(mItem.slug)}`,
    lastModified: mItem.achievedAt ? new Date(mItem.achievedAt).toISOString() : now,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  // Developer updates: one entry per published (non-draft) developer update
  // detail page. getDevUpdates() filters out drafts.
  const devUpdatePages: MetadataRoute.Sitemap = getDevUpdates().map((u) => ({
    url: `${BASE_URL}${devUpdatePath(u)}`,
    lastModified: u.date ? new Date(u.date).toISOString() : now,
    changeFrequency: 'monthly' as const,
    priority: 0.4,
  }));

  // ── Assembly ────────────────────────────────────────────────────────────
  // Curated static pages first, then each dynamic registry. Every group is
  // deduplicated by construction: curated literals live ONLY in site-sections.ts
  // and never overlap the dynamic registries (guides/blog/challenges/library/
  // localized). See lib/seo/site-sections.ts for what belongs where.
  //
  // Note: /swinglab is intentionally absent (admin-only while in development —
  // the public sees a noindex placeholder), as are the authenticated app routes
  // and per-sport /drills URLs (blocked in robots.txt). See the EXCLUDE list in
  // scripts/check-sitemap-coverage.mjs.
  return [
    ...curatedPages,
    ...seoPages,
    ...mentalPages,
    ...challengePages,
    ...blogPages,
    ...learnPages,
    ...learnConceptPages,
    ...updatePages,
    ...milestonePages,
    ...devUpdatePages,
    ...localizedPages,
  ];
}
