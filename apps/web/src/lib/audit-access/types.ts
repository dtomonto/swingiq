// ============================================================
// External Auditor Access — shared types (isomorphic, pure)
// ------------------------------------------------------------
// One read-only, token-gated JSON "audit packet" an external auditor
// (e.g. ChatGPT's browsing tool) can fetch in a single request to clear
// the things a normal logged-out browser cannot see: the contents of
// /sitemap.xml and /robots.txt (some browsing tools block those paths),
// a structured description of the logged-in app surface, the aggregate
// analytics overview, and an honest list of what STILL requires a manual
// upload (GA4 export, Search Console, Lighthouse, real screenshots).
//
// Everything here is structural / aggregate. The packet NEVER contains
// user PII, raw session content, or secret values — see bundle.ts.
// ============================================================

import type { CapabilitySummary } from '@/lib/capabilities';

/** How completely the audit packet addresses one of the auditor's barriers. */
export type BarrierStatus = 'cleared' | 'partial' | 'manual';

export interface AuditBarrier {
  /** Stable id. */
  id: string;
  /** The barrier as the external auditor described it. */
  barrier: string;
  status: BarrierStatus;
  /** How this packet addresses it (or why it cannot). */
  resolution: string;
  /** The bundle section(s) that carry the relevant data. */
  sections: string[];
}

/** A logged-in (auth-gated) route the auditor cannot reach without an account. */
export interface AppSurfaceRoute {
  path: string;
  label: string;
  /** Plain-English description of what a user does/sees here. */
  purpose: string;
  /** Whether the route requires authentication. */
  authRequired: boolean;
}

export interface CrawlMirror {
  /** Verbatim text of /robots.txt, or null when it could not be read. */
  robotsTxt: string | null;
  /** Verbatim text of /sitemap.xml, or null when it could not be read. */
  sitemapXml: string | null;
  /** Verbatim text of /llms.txt when present. */
  llmsTxt: string | null;
  /** Number of <url> entries the app's sitemap generator produced. */
  sitemapEntryCount: number | null;
  /** Per-resource fetch errors (honest about what failed). */
  errors: Record<string, string>;
}

export interface AnalyticsOverview {
  /** True when a PostHog read key + project id are configured server-side. */
  configured: boolean;
  /** Aggregate web overview when available (visitors, views, bounce, etc.). */
  overview?: Record<string, unknown> | null;
  /** Top pages / referrers / events when available. */
  topPages?: unknown[];
  topReferrers?: unknown[];
  topEvents?: unknown[];
  rangeDays?: number;
  /** Data sources the auditor still has to upload manually. */
  stillNeedsManual: string[];
  /** Honest per-section errors / "not configured" note. */
  note: string;
}

export interface AuditBundleMeta {
  product: string;
  site: string;
  generatedAt: string;
  /** Schema version so an auditor can detect format changes. */
  schemaVersion: number;
  readOnly: true;
  note: string;
}

export interface AuditBundle {
  meta: AuditBundleMeta;
  /** How each barrier the auditor reported is (or is not) addressed. */
  barriersAddressed: AuditBarrier[];
  /** Which optional integrations are live (booleans only — never secrets). */
  capabilities: CapabilitySummary;
  /** Mirrored crawl files so a path-blocked browsing tool still gets them. */
  crawl: CrawlMirror;
  routes: {
    /** Public, crawlable marketing/info routes. */
    public: string[];
    /** Auth-gated app routes (the "logged-in experience"). */
    authenticated: AppSurfaceRoute[];
  };
  seo: {
    publishedPageCount: number;
    samplePaths: string[];
  };
  analytics: AnalyticsOverview;
  /** Things this packet honestly cannot provide; require a manual upload. */
  stillCannotProvide: string[];
}

/** Inputs the pure bundle builder needs (the route fetches/injects them). */
export interface AuditBundleInput {
  site: string;
  generatedAt: string;
  capabilities: CapabilitySummary;
  crawl: CrawlMirror;
  publicRoutes: string[];
  seo: { publishedPageCount: number; samplePaths: string[] };
  analytics: AnalyticsOverview;
}
