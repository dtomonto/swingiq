// ============================================================
// SearchIntelligenceOS — Sitemap & Indexing Intelligence (§2.14)
// ------------------------------------------------------------
// Builds the canonical set of paths the XML sitemap actually emits (from the
// SAME registries app/sitemap.ts uses), then compares it to the crawl/page
// inventory to flag: pages missing from the sitemap, sitemap URLs not in the
// inventory, utility URLs that shouldn't be indexed, and noindex conflicts.
// Also produces an ordered 1..100 indexing/submission priority list.
//
// Pure + registry-derived (no network). REUSED by page-intel.ts (which reads
// `buildSitemapPathSet`) — the PageIntel type import below is type-only, so
// there is no runtime cycle.
// ============================================================

import { CURATED_URLS } from '@/lib/seo/site-sections';
import { PUBLISHED_SEO_PAGES } from '@/content/seoPages';
import { getPublishedBlogPosts } from '@/data/blog-posts';
import { getLearnItems } from '@/lib/library';
import { learnPath } from '@/lib/library/seo';
import { CHALLENGES } from '@/content/challenges';
import { normalizeUrl } from '../link-intelligence/inventory';
import type { PageIntel, SitemapEntry, SitemapFlag } from './types';

/** Patterns that should NEVER be in a sitemap (utility / private / parameterized). */
const UTILITY_PATTERNS = [
  /[?&]/, /\/(login|signup|settings|dashboard|account|admin|api|checkout)(\/|$)/i,
  /\/(search|filter|sort|tag|page\/\d+)(\/|$)/i,
];

export function isUtilityUrl(url: string): boolean {
  return UTILITY_PATTERNS.some((re) => re.test(url));
}

/**
 * The set of site-relative paths the XML sitemap emits that could plausibly
 * appear in our page inventory (curated statics + programmatic guides + the
 * blog/library/challenge registries + their index roots). Mirrors
 * app/sitemap.ts so the in/out comparison is honest, not guessed.
 */
export function buildSitemapPathSet(): Set<string> {
  const set = new Set<string>();
  const add = (p: string) => set.add(normalizeUrl(p));

  for (const c of CURATED_URLS) add(c.path);
  for (const p of PUBLISHED_SEO_PAGES) add(`/${p.slug}`);

  add('/blog');
  for (const post of getPublishedBlogPosts()) add(`/blog/${post.slug}`);

  add('/learn');
  for (const item of getLearnItems()) add(learnPath(item));

  add('/challenges');
  for (const c of Object.values(CHALLENGES)) add(`/challenges/${c.slug}`);

  return set;
}

/** True when a page's URL is emitted by the XML sitemap. */
export function isInSitemap(url: string, set: Set<string> = buildSitemapPathSet()): boolean {
  return set.has(normalizeUrl(url));
}

export interface SitemapAnalysis {
  entries: SitemapEntry[];
  /** Sitemap URLs we have no inventory record for (rare; honesty check). */
  sitemapOnly: string[];
  /** Indexable inventory pages missing from the sitemap (submit these). */
  missingFromSitemap: number;
  /** Pages flagged as utility/parameterized that slipped into the sitemap. */
  utilityInSitemap: number;
}

/**
 * Compare the page inventory to the sitemap. `pages` already carry `inSitemap`
 * + `indexable` (computed in page-intel from this same set), so this stays
 * consistent. Produces a 1..100 indexing-priority ordering (1 = submit first).
 */
export function analyzeSitemap(pages: PageIntel[]): SitemapAnalysis {
  const set = buildSitemapPathSet();
  const inventoryUrls = new Set(pages.map((p) => normalizeUrl(p.url)));

  // Submission priority: indexable pages first, weighted by their priority
  // score, with a boost for indexable pages that are MISSING from the sitemap
  // (those are the highest-value submissions to make today).
  const ranked = [...pages]
    .map((p) => ({
      p,
      rank: p.priorityScore + (p.indexable && !p.inSitemap ? 25 : 0),
    }))
    .sort((a, b) => b.rank - a.rank);

  const priorityByUrl = new Map<string, number>();
  ranked.forEach((r, i) => priorityByUrl.set(normalizeUrl(r.p.url), Math.min(100, i + 1)));

  const entries: SitemapEntry[] = pages.map((p) => {
    const url = normalizeUrl(p.url);
    let flag: SitemapFlag = 'ok';
    let note = 'Indexable and present in the sitemap.';

    if (isUtilityUrl(url)) {
      flag = 'utility-url';
      note = 'Utility/parameterized URL — should not be indexed or in the sitemap.';
    } else if (!p.indexable && p.inSitemap) {
      flag = 'noindex-conflict';
      note = 'In the sitemap but not indexable — conflicting signals.';
    } else if (p.indexable && !p.inSitemap) {
      flag = 'missing-from-sitemap';
      note = 'Indexable page missing from the sitemap — add it so Google can discover it.';
    }

    return {
      url,
      inInventory: true,
      inSitemap: p.inSitemap,
      indexable: p.indexable,
      flag,
      note,
      indexingPriority: priorityByUrl.get(url) ?? 100,
    };
  });

  const sitemapOnly = [...set].filter((u) => !inventoryUrls.has(u));

  return {
    entries: entries.sort((a, b) => a.indexingPriority - b.indexingPriority),
    sitemapOnly,
    missingFromSitemap: entries.filter((e) => e.flag === 'missing-from-sitemap').length,
    utilityInSitemap: entries.filter((e) => e.flag === 'utility-url' && e.inSitemap).length,
  };
}
