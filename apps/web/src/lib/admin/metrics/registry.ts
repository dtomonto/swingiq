// ============================================================
// Admin Metric Explainers — curated registry (isomorphic, pure)
// ------------------------------------------------------------
// The hand-written explainer content for the dashboard's core numbers.
// Add an entry here and the matching tile (any MetricCard / KpiCard with a
// `metricId`) gets a rich explainer at /admin/metrics/<id>. Tiles whose id is
// NOT in this registry still open an honest generic explainer (see the route).
//
// Pure data — no DB, no env, no server imports. Live values are resolved
// separately in ./resolvers.server.ts so this stays safe to import anywhere.
// ============================================================

import type { MetricCategory, MetricDataSource, MetricDefinition } from './types';

export const METRIC_BASE_PATH = '/admin/metrics';

/** Build the explainer href for a metric id (+ optional value passthrough so
 *  the generic fallback can show the number you clicked, even uncurated). */
export function metricHref(id: string, valueText?: string): string {
  const base = `${METRIC_BASE_PATH}/${encodeURIComponent(id)}`;
  return valueText ? `${base}?v=${encodeURIComponent(valueText)}` : base;
}

/** Turn a metric id into a readable title when there's no curated entry. */
export function humanizeMetricId(id: string): string {
  return id
    .replace(/^[a-z]+-/, '') // drop a leading category prefix (platform-, ai-, …)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export const METRIC_CATEGORY_LABEL: Record<MetricCategory, string> = {
  platform: 'Platform',
  system: 'System & integrations',
  ai: 'AI cost & usage',
  growth: 'Growth & SEO',
  security: 'Security',
  content: 'Content',
  reliability: 'Reliability',
};

export const METRIC_DATA_SOURCE_LABEL: Record<MetricDataSource, string> = {
  real: 'Live data',
  derived: 'Derived',
  estimated: 'Estimated',
  placeholder: 'Placeholder',
  demo: 'Demo data',
  config: 'Configuration',
};

// ── The curated metrics ───────────────────────────────────────────────────
// Keep ids kebab-case and category-prefixed so they read well in the URL.

const DEFINITIONS: MetricDefinition[] = [
  // ── Platform (real cross-user counts on the Command Center) ──
  {
    id: 'platform-accounts',
    label: 'Authenticated accounts',
    category: 'platform',
    summary: 'How many real user accounts exist across the platform.',
    definition:
      'The total number of authenticated users — people who have created a SwingVantage account. This is the top-line "how many humans use the product" number.',
    howComputed:
      'Read live from Supabase Auth via the admin API (service-role), counting users one page at a time.',
    dataSource: 'real',
    sourceDetail: 'supabase.auth.admin.listUsers() — capped at one 1,000-user page.',
    interpretation:
      'Trending up is healthy growth. If it shows a "+", the real total is at least this many — the count hit the single-page cap and is a floor, not an exact figure.',
    caveats: [
      'Only available when the service-role key is configured; in local mode it reads as "—".',
      'Counts accounts, not active users — see Sessions / Swing analyses for activity.',
    ],
    related: [
      { label: 'Users', href: '/admin/users' },
      { label: 'Practice sessions', href: '/admin/metrics/platform-sessions' },
      { label: 'Integrations (connect service role)', href: '/admin/integrations' },
    ],
  },
  {
    id: 'platform-golf-profiles',
    label: 'Golf profiles',
    category: 'platform',
    summary: 'Accounts that have set up a golf profile.',
    definition:
      'The number of golfer profiles created. A golfer profile holds a player\'s handicap/skill band and golf-specific settings, so this is a proxy for committed golf users.',
    howComputed: 'COUNT(*) of the golfer_profiles table, read with the service-role client.',
    dataSource: 'real',
    sourceDetail: 'count on golfer_profiles (head-only, exact).',
    interpretation:
      'Compare against total accounts to gauge how many users go deep on golf specifically. A low ratio with high accounts can mean onboarding drops before profile setup.',
    caveats: ['Service-role only; "—" in local mode.'],
    related: [
      { label: 'Grading benchmarks', href: '/admin/benchmarks' },
      { label: 'Sport profiles', href: '/admin/metrics/platform-sport-profiles' },
    ],
  },
  {
    id: 'platform-sport-profiles',
    label: 'Sport profiles',
    category: 'platform',
    summary: 'Non-golf sport setups (tennis, pickleball, padel, baseball, softball).',
    definition:
      'The number of non-golf sport profiles created across tennis, pickleball, padel, baseball and softball — how much the platform is used beyond golf.',
    howComputed: 'COUNT(*) of the sport_profiles table, read with the service-role client.',
    dataSource: 'real',
    sourceDetail: 'count on sport_profiles (head-only, exact).',
    interpretation:
      'Rising sport profiles show the multi-sport bet paying off. Break down which sports via Sport usage on the Command Center.',
    caveats: ['Service-role only; "—" in local mode.'],
    related: [{ label: 'Sports admin', href: '/admin/sports' }],
  },
  {
    id: 'platform-sessions',
    label: 'Practice sessions',
    category: 'platform',
    summary: 'Total practice sessions logged across all accounts and sports.',
    definition:
      'Every practice session recorded by any athlete, across every sport. This is the core engagement/activity number for the platform.',
    howComputed: 'COUNT(*) of the sessions table, read with the service-role client.',
    dataSource: 'real',
    sourceDetail: 'count on sessions (head-only, exact). Per-sport split powers Sport usage.',
    interpretation:
      'The clearest signal of real usage. Growing sessions per account is healthier than growing accounts alone.',
    caveats: ['Service-role only; "—" in local mode.'],
    related: [{ label: 'Athletes', href: '/admin/athletes' }],
  },
  {
    id: 'platform-analyses',
    label: 'Swing analyses',
    category: 'platform',
    summary: 'AI swing analyses run across the platform.',
    definition:
      'The number of video/image swing analyses produced — the heart of the product promise ("one fix, one plan, one retest"). Each row is one analysed swing.',
    howComputed: 'COUNT(*) of the video_analyses table, read with the service-role client.',
    dataSource: 'real',
    sourceDetail: 'count on video_analyses (head-only, exact). Recent rows feed "Recent swing analyses".',
    interpretation:
      'High analyses-per-account means people get to the core value repeatedly. A stall here while sessions grow can mean the analysis flow has friction.',
    caveats: [
      'Service-role only; "—" in local mode.',
      'Videos are processed privately and never stored — only analysis metadata is counted.',
    ],
    related: [
      { label: 'AI Analyses', href: '/admin/ai-analyses' },
      { label: 'AI Output Quality', href: '/admin/ai-quality' },
    ],
  },
  {
    id: 'platform-community',
    label: 'Gamified records',
    category: 'platform',
    summary: 'Community / XP records (streaks, levels, challenges).',
    definition:
      'Rows of community/gamification state — XP, streaks, levels and challenge progress. A proxy for how much the engagement layer is being used.',
    howComputed: 'COUNT(*) of the community_state table, read with the service-role client.',
    dataSource: 'real',
    sourceDetail: 'count on community_state (head-only, exact).',
    interpretation:
      'Useful as a secondary engagement signal. Low community records with high sessions means the gamification layer is under-adopted.',
    caveats: ['Service-role only; "—" in local mode.'],
    related: [{ label: 'Lifecycle / re-engage', href: '/admin/reengage' }],
  },
  {
    id: 'platform-product-health',
    label: 'Product health score',
    category: 'platform',
    summary: 'A 0–100 read on how much needs your attention right now.',
    definition:
      'The headline score in the Command Center briefing. It is NOT an abstract quality grade — it starts at 100 and is dragged down by the same open alerts shown below it, weighted by severity. A high score means little is on fire.',
    howComputed:
      'Derived: 100 − (critical alerts × 22) − (decisions waiting × 7) − (watch items × 2), floored at 40. The exact alerts are the ones listed in the attention tiers.',
    dataSource: 'derived',
    sourceDetail: 'Computed on /admin from the live alert set (no invented inputs).',
    interpretation:
      'Treat it as "how clear is my plate", not a KPI to optimise. Work the critical tier first; the score rises as you clear alerts. Confidence is "high" only when live data is connected.',
    caveats: [
      'Floored at 40 so a very noisy day never reads as 0.',
      'It reflects open alerts, not revenue, quality or uptime directly.',
    ],
    related: [
      { label: 'Command Center', href: '/admin' },
      { label: 'Decision Center', href: '/admin/decisions' },
      { label: 'Product Health', href: '/admin/health' },
    ],
  },

  // ── System & integrations ──
  {
    id: 'system-services-connected',
    label: 'Services connected',
    category: 'system',
    summary: 'How many of the external integrations are wired up.',
    definition:
      'The count of connected integrations out of the total SwingVantage can use (Supabase, AI coaching, AI vision, OCR, email, billing, ads, …). The product is keyless-first, so most are optional.',
    howComputed:
      'Derived from the capability detector: each integration reports connected/not from its environment variables; this is the connected tally over the total.',
    dataSource: 'config',
    sourceDetail: 'getSystemStatus().connectedCount / totalCount.',
    interpretation:
      'There is no "right" number — only required integrations matter for launch. Open each from Integrations to see exactly what a connection unlocks.',
    caveats: ['Reflects configuration (env vars set), not a live health check of each provider.'],
    related: [
      { label: 'System Health', href: '/admin/system-health' },
      { label: 'Integrations', href: '/admin/integrations' },
    ],
  },
  {
    id: 'system-ai-vision',
    label: 'AI swing vision',
    category: 'system',
    summary: 'Whether real AI video/image swing analysis is connected.',
    definition:
      'Shows whether a vision provider is configured. AI vision is what turns an uploaded swing into a real analysis; without it, vision analysis is unavailable.',
    howComputed: 'Capability detector — true when a vision provider + key are set.',
    dataSource: 'config',
    sourceDetail: 'getServerCapabilities().aiVision.',
    interpretation:
      '"On" means the core product promise is fully live. "Off" is the single most consequential gap for the swing-analysis experience.',
    related: [{ label: 'Integrations', href: '/admin/integrations' }],
  },
  {
    id: 'system-environment',
    label: 'Environment',
    category: 'system',
    summary: 'Which Node environment the app is running in.',
    definition:
      'Whether the running server is in production or development mode — useful context when reading every other number on the page.',
    howComputed: 'Reads process.env.NODE_ENV on the server.',
    dataSource: 'config',
    sourceDetail: 'getSystemStatus().nodeEnv.',
    interpretation:
      'In development, metrics may reflect local/seed data. In production they reflect real usage.',
    related: [{ label: 'System Health', href: '/admin/system-health' }],
  },
];

const BY_ID: Map<string, MetricDefinition> = new Map(DEFINITIONS.map((d) => [d.id, d]));

/** All curated metric definitions. */
export function listMetricDefinitions(): MetricDefinition[] {
  return [...DEFINITIONS];
}

/** Look up one curated definition; null when not yet curated. */
export function getMetricDefinition(id: string): MetricDefinition | null {
  return BY_ID.get(id) ?? null;
}

/** True when a curated explainer exists for this id. */
export function hasMetricDefinition(id: string): boolean {
  return BY_ID.has(id);
}

/** Group curated metrics by category for the index page. */
export function metricsByCategory(): { category: MetricCategory; metrics: MetricDefinition[] }[] {
  const order: MetricCategory[] = ['platform', 'system', 'ai', 'growth', 'reliability', 'security', 'content'];
  return order
    .map((category) => ({ category, metrics: DEFINITIONS.filter((d) => d.category === category) }))
    .filter((g) => g.metrics.length > 0);
}
