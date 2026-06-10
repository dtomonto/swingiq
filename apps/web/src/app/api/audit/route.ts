// ============================================================
// GET /api/audit — read-only external auditor packet (token-gated)
// ------------------------------------------------------------
// A single request that returns the full audit packet an external auditor
// (e.g. ChatGPT's browsing tool) needs to clear the barriers a logged-out
// browser hits: the verbatim /robots.txt + /sitemap.xml (mirrored so a
// path-blocked tool still gets them), a structured map of the logged-in
// app surface, the aggregate analytics overview when PostHog is connected,
// and an honest list of what still needs a manual upload.
//
// SECURITY
//   • Fail-closed: returns 404 when AUDIT_ACCESS_TOKEN is unset (the
//     endpoint does not exist until the owner turns it on).
//   • Token-gated: 401 on a wrong/missing token (constant-time compare).
//   • Read-only & aggregate: never emits user PII, raw sessions or secrets.
//   • robots.txt already Disallows /api/, so this is never crawled — it is
//     shared only via the token URL.
// ============================================================

import { NextResponse } from 'next/server';
import { isAuditAccessConfigured, verifyAuditToken } from '@/lib/audit-access/token';
import { buildAuditBundle } from '@/lib/audit-access/bundle';
import type { AnalyticsOverview, CrawlMirror } from '@/lib/audit-access/types';
import { getServerCapabilities } from '@/lib/capabilities';
import { PUBLISHED_SEO_PAGES } from '@/content/seoPages';
import sitemap from '@/app/sitemap';
import { getReadConfig } from '@/lib/posthog/config';
import { fetchWebOverview, fetchTopNamed, type ReadClientConfig } from '@/lib/posthog/client';
import { safeDays } from '@/lib/posthog/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Fetch text from a same-origin path with a short timeout; null on failure. */
async function fetchText(origin: string, path: string): Promise<{ text: string | null; error?: string }> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${origin}${path}`, { signal: ctrl.signal, cache: 'no-store' });
    clearTimeout(timer);
    if (!res.ok) return { text: null, error: `HTTP ${res.status}` };
    return { text: await res.text() };
  } catch (e) {
    return { text: null, error: e instanceof Error ? e.message : 'fetch failed' };
  }
}

/** Parse the `Allow:` directives from robots.txt into a public-route list. */
function publicRoutesFromRobots(robotsTxt: string | null): string[] {
  if (!robotsTxt) return [];
  const out: string[] = [];
  for (const line of robotsTxt.split(/\r?\n/)) {
    const m = line.match(/^\s*Allow:\s*(\S+)/i);
    if (m) out.push(m[1]);
  }
  return out;
}

/** Read-only PostHog client config, or null when not fully configured. */
function readClient(): ReadClientConfig | null {
  const read = getReadConfig();
  if (!read.configured || !read.personalKey || !read.projectId) return null;
  return { apiBaseUrl: read.apiBaseUrl, projectId: read.projectId, personalKey: read.personalKey };
}

async function buildAnalytics(days: number): Promise<AnalyticsOverview> {
  const stillNeedsManual = [
    'Google Analytics 4 (GA4) export — events, conversions, funnels',
    'Google Search Console — queries, impressions, indexed pages',
    'Session-replay/heatmaps (Microsoft Clarity or Hotjar)',
  ];
  const cfg = readClient();
  if (!cfg) {
    return {
      configured: false,
      stillNeedsManual,
      note:
        'PostHog read key not configured, so no live aggregate analytics are included. Provide GA4 / Search Console / Clarity exports via a manual upload.',
    };
  }
  const [overview, pages, referrers, events] = await Promise.all([
    fetchWebOverview(cfg, days),
    fetchTopNamed(cfg, 'pages', days),
    fetchTopNamed(cfg, 'referrers', days),
    fetchTopNamed(cfg, 'events', days),
  ]);
  return {
    configured: true,
    overview: overview.ok ? (overview.data as unknown as Record<string, unknown>) : null,
    topPages: pages.data ?? [],
    topReferrers: referrers.data ?? [],
    topEvents: events.data ?? [],
    rangeDays: days,
    stillNeedsManual,
    note:
      'Aggregate web analytics from PostHog. GA4, Search Console and session-replay data are not in PostHog — provide those via a manual upload.',
  };
}

export async function GET(req: Request) {
  // Fail-closed: the endpoint does not exist until the owner enables it.
  if (!isAuditAccessConfigured()) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  if (!verifyAuditToken(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const origin = url.origin;
  const days = safeDays(Number(url.searchParams.get('days') ?? 30));

  const [robots, sitemapXml, llms, analytics] = await Promise.all([
    fetchText(origin, '/robots.txt'),
    fetchText(origin, '/sitemap.xml'),
    fetchText(origin, '/llms.txt'),
    buildAnalytics(days),
  ]);

  const crawlErrors: Record<string, string> = {};
  if (robots.error) crawlErrors['robots.txt'] = robots.error;
  if (sitemapXml.error) crawlErrors['sitemap.xml'] = sitemapXml.error;
  if (llms.error) crawlErrors['llms.txt'] = llms.error;

  let sitemapEntryCount: number | null = null;
  try {
    sitemapEntryCount = (await sitemap()).length;
  } catch {
    sitemapEntryCount = null;
  }

  const crawl: CrawlMirror = {
    robotsTxt: robots.text,
    sitemapXml: sitemapXml.text,
    llmsTxt: llms.text,
    sitemapEntryCount,
    errors: crawlErrors,
  };

  const publishedSeo = PUBLISHED_SEO_PAGES;

  const bundle = buildAuditBundle({
    site: origin,
    generatedAt: new Date().toISOString(),
    capabilities: getServerCapabilities(),
    crawl,
    publicRoutes: publicRoutesFromRobots(robots.text),
    seo: {
      publishedPageCount: publishedSeo.length,
      samplePaths: publishedSeo.slice(0, 20).map((p) => `/${p.slug}`),
    },
    analytics,
  });

  return NextResponse.json(bundle, {
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}
