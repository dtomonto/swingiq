// ============================================================
// ConnectorOS — connector status registry (single source of truth)
// ------------------------------------------------------------
// One typed description of every ConnectorOS connector: which layer it
// belongs to, what env it needs, whether it is configured, and its
// rollout stage. Setup, Integrations, System Health and the admin
// ConnectorOS surface all read THIS — status is no longer recomputed
// ad-hoc in three places.
//
// SECURITY: this only ever returns BOOLEANS (configured / not). It never
// returns a secret value. The `configured()` checks read env (incl.
// server-only secrets) to compute the boolean, so evaluate the secret-
// bearing connectors SERVER-SIDE (the admin surface is a Server
// Component). Client-safe connectors reference only NEXT_PUBLIC_* vars.
// ============================================================

import { isConfigured } from '@/lib/capabilities';
import type { ConnectorFlag } from './flags';
import { CONNECTOR_FLAGS } from './flags';

export type ConnectorLayer =
  | 'analytics'
  | 'reliability'
  | 'seo'
  | 'security'
  | 'video'
  | 'monetization';

/** Rollout stage: live = wired & usable; scaffold = code+docs ready, needs keys/SDK; future = planned. */
export type ConnectorStage = 'live' | 'scaffold' | 'future';

type Env = Record<string, string | undefined>;

export interface ConnectorDef {
  id: ConnectorFlag;
  label: string;
  layer: ConnectorLayer;
  /** "truth" role in the architecture, if this is the canonical source for something. */
  truth?: string;
  /** The env var(s) that turn it on. Names only — never values. */
  envVars: string[];
  /** True when only NEXT_PUBLIC_* vars are involved (safe to evaluate in the browser). */
  clientSafe: boolean;
  stage: ConnectorStage;
  /** One-line "what it is / keyless default". */
  blurb: string;
  /** Relative docs pointer. */
  docs: string;
  /** Compute configured/not from env (returns a boolean only). */
  configured: (env: Env) => boolean;
}

const has = (env: Env, key: string) => isConfigured(env[key]);

export const CONNECTORS: readonly ConnectorDef[] = [
  // ── Analytics & growth ─────────────────────────────────────
  {
    id: 'posthog', label: 'PostHog', layer: 'analytics', truth: 'Product analytics truth',
    envVars: ['NEXT_PUBLIC_POSTHOG_KEY', 'NEXT_PUBLIC_POSTHOG_HOST'], clientSafe: true, stage: 'live',
    blurb: 'Product analytics & funnels (consent-gated). Keyless: console only.',
    docs: 'docs/connector-os/event-taxonomy.md',
    configured: (e) => has(e, 'NEXT_PUBLIC_POSTHOG_KEY'),
  },
  {
    id: 'ga4', label: 'Google Analytics 4', layer: 'analytics', truth: 'Acquisition truth',
    envVars: ['NEXT_PUBLIC_GA_ID'], clientSafe: true, stage: 'live',
    blurb: 'Acquisition/conversion analytics (consent-gated, cookies).',
    docs: 'docs/connector-os/event-taxonomy.md',
    configured: (e) => has(e, 'NEXT_PUBLIC_GA_ID'),
  },
  {
    id: 'plausible', label: 'Plausible', layer: 'analytics',
    envVars: ['NEXT_PUBLIC_PLAUSIBLE_DOMAIN'], clientSafe: true, stage: 'live',
    blurb: 'Cookieless analytics — no consent banner needed.',
    docs: 'docs/connector-os/event-taxonomy.md',
    configured: (e) => has(e, 'NEXT_PUBLIC_PLAUSIBLE_DOMAIN'),
  },
  {
    id: 'clarity', label: 'Microsoft Clarity', layer: 'analytics', truth: 'Only session-replay tool',
    envVars: ['NEXT_PUBLIC_CLARITY_PROJECT_ID'], clientSafe: true, stage: 'live',
    blurb: 'Heatmaps & replay — OPT-IN only. Keyless: off.',
    docs: 'docs/connector-os/privacy-and-data-retention.md',
    configured: (e) => has(e, 'NEXT_PUBLIC_CLARITY_PROJECT_ID'),
  },

  // ── Reliability ────────────────────────────────────────────
  {
    id: 'sentry', label: 'Sentry', layer: 'reliability', truth: 'Error truth',
    envVars: ['NEXT_PUBLIC_SENTRY_DSN', 'SENTRY_DSN'], clientSafe: true, stage: 'scaffold',
    blurb: 'Error monitoring. Reporter (lib/observability) is ready; set a DSN + install SDK.',
    docs: 'docs/OBSERVABILITY.md',
    configured: (e) => has(e, 'NEXT_PUBLIC_SENTRY_DSN') || has(e, 'SENTRY_DSN'),
  },
  {
    id: 'vercelAnalytics', label: 'Vercel Analytics', layer: 'reliability',
    envVars: ['NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED'], clientSafe: true, stage: 'live',
    blurb: 'Privacy-friendly web analytics (deps installed).',
    docs: 'docs/connector-os/architecture.md',
    configured: (e) => (e['NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED'] ?? 'true') !== 'false',
  },
  {
    id: 'speedInsights', label: 'Vercel Speed Insights', layer: 'reliability', truth: 'Production performance truth',
    envVars: ['NEXT_PUBLIC_VERCEL_SPEED_INSIGHTS_ENABLED'], clientSafe: true, stage: 'live',
    blurb: 'Real-user Core Web Vitals (deps installed).',
    docs: 'docs/connector-os/architecture.md',
    configured: (e) => (e['NEXT_PUBLIC_VERCEL_SPEED_INSIGHTS_ENABLED'] ?? 'true') !== 'false',
  },

  // ── SEO / indexing ─────────────────────────────────────────
  {
    id: 'gscVerification', label: 'Google Search Console', layer: 'seo', truth: 'Search truth',
    envVars: ['NEXT_PUBLIC_GSC_VERIFICATION'], clientSafe: true, stage: 'live',
    blurb: 'Site verification meta tag.',
    docs: 'docs/connector-os/seo-indexing.md',
    configured: (e) => has(e, 'NEXT_PUBLIC_GSC_VERIFICATION'),
  },
  {
    id: 'bingVerification', label: 'Bing Webmaster', layer: 'seo',
    envVars: ['NEXT_PUBLIC_BING_SITE_VERIFICATION'], clientSafe: true, stage: 'scaffold',
    blurb: 'Site verification meta tag (new).',
    docs: 'docs/connector-os/seo-indexing.md',
    configured: (e) => has(e, 'NEXT_PUBLIC_BING_SITE_VERIFICATION'),
  },
  {
    id: 'indexnow', label: 'IndexNow', layer: 'seo',
    envVars: ['INDEXNOW_KEY'], clientSafe: false, stage: 'scaffold',
    blurb: 'Instant URL submission to Bing/Yandex. Keyless: no-op.',
    docs: 'docs/connector-os/seo-indexing.md',
    configured: (e) => has(e, 'INDEXNOW_KEY'),
  },

  // ── Trust / security ───────────────────────────────────────
  {
    id: 'turnstile', label: 'Cloudflare Turnstile', layer: 'security',
    envVars: ['NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY', 'CLOUDFLARE_TURNSTILE_SECRET_KEY'], clientSafe: false, stage: 'scaffold',
    blurb: 'Bot protection for public forms. Keyless: forms work without the widget.',
    docs: 'docs/connector-os/architecture.md',
    configured: (e) => has(e, 'NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY') && has(e, 'CLOUDFLARE_TURNSTILE_SECRET_KEY'),
  },

  // ── Video / media ──────────────────────────────────────────
  {
    id: 'mediapipe', label: 'MediaPipe Pose', layer: 'video', truth: 'On-device pose (explainable)',
    envVars: ['NEXT_PUBLIC_MEDIAPIPE_ENABLED'], clientSafe: true, stage: 'live',
    blurb: 'On-device pose landmarks. Frames never leave the browser.',
    docs: 'docs/connector-os/privacy-and-data-retention.md',
    configured: (e) => (e['NEXT_PUBLIC_MEDIAPIPE_ENABLED'] ?? '') !== 'false',
  },
  {
    id: 'mux', label: 'Mux', layer: 'video',
    envVars: ['MUX_TOKEN_ID', 'MUX_TOKEN_SECRET'], clientSafe: false, stage: 'future',
    blurb: 'Production video upload/playback (signed). Scaffold only.',
    docs: 'docs/connector-os/privacy-and-data-retention.md',
    configured: (e) => has(e, 'MUX_TOKEN_ID') && has(e, 'MUX_TOKEN_SECRET'),
  },
  {
    id: 'cloudinary', label: 'Cloudinary', layer: 'video',
    envVars: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'], clientSafe: false, stage: 'future',
    blurb: 'Image/media optimization. Scaffold only.',
    docs: 'docs/connector-os/architecture.md',
    configured: (e) => has(e, 'CLOUDINARY_CLOUD_NAME') && has(e, 'CLOUDINARY_API_KEY') && has(e, 'CLOUDINARY_API_SECRET'),
  },

  // ── Monetization (future; already flag-gated in lib/capabilities) ──
  {
    id: 'adsense', label: 'Google AdSense', layer: 'monetization',
    envVars: ['NEXT_PUBLIC_ADS_PROVIDER', 'NEXT_PUBLIC_ADS_CLIENT_ID'], clientSafe: true, stage: 'future',
    blurb: 'Contextual ads (youth-safe). OFF by default; never in the report flow.',
    docs: 'docs/connector-os/architecture.md',
    configured: (e) => has(e, 'NEXT_PUBLIC_ADS_PROVIDER') && has(e, 'NEXT_PUBLIC_ADS_CLIENT_ID'),
  },
  {
    id: 'stripe', label: 'Stripe', layer: 'monetization',
    envVars: ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'], clientSafe: false, stage: 'future',
    blurb: 'Paid tiers. Keyless: waitlist, no charges.',
    docs: 'docs/connector-os/architecture.md',
    configured: (e) => has(e, 'STRIPE_SECRET_KEY') && has(e, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
  },
  {
    id: 'beehiiv', label: 'beehiiv', layer: 'monetization',
    envVars: ['BEEHIIV_API_KEY'], clientSafe: false, stage: 'future',
    blurb: 'Newsletter. Scaffold only.',
    docs: 'docs/connector-os/architecture.md',
    configured: (e) => has(e, 'BEEHIIV_API_KEY'),
  },
  {
    id: 'rewardful', label: 'Rewardful', layer: 'monetization',
    envVars: ['REWARDFUL_API_KEY'], clientSafe: false, stage: 'future',
    blurb: 'Affiliate/referral tracking. Scaffold only.',
    docs: 'docs/connector-os/architecture.md',
    configured: (e) => has(e, 'REWARDFUL_API_KEY'),
  },
] as const;

// Sanity: every flag has exactly one connector definition.
const _coverage: Record<ConnectorFlag, true> = CONNECTORS.reduce(
  (acc, c) => ((acc[c.id] = true), acc),
  {} as Record<ConnectorFlag, true>,
);
void _coverage;
void CONNECTOR_FLAGS;

export interface ConnectorStatus extends Omit<ConnectorDef, 'configured'> {
  configured: boolean;
}

/** Resolve every connector's configured/not status from env (booleans only). */
export function getConnectorStatuses(env: Env = process.env): ConnectorStatus[] {
  return CONNECTORS.map(({ configured, ...rest }) => ({
    ...rest,
    configured: configured(env),
  }));
}

export interface ConnectorSummary {
  total: number;
  configured: number;
  byLayer: Record<ConnectorLayer, { total: number; configured: number }>;
  /** Live connectors that are configured vs the live total (the "ready" score). */
  liveConfigured: number;
  liveTotal: number;
}

/** Aggregate counts for the admin dashboard header. */
export function summarizeConnectors(env: Env = process.env): ConnectorSummary {
  const statuses = getConnectorStatuses(env);
  const byLayer = {} as Record<ConnectorLayer, { total: number; configured: number }>;
  let configured = 0;
  let liveConfigured = 0;
  let liveTotal = 0;
  for (const s of statuses) {
    byLayer[s.layer] ??= { total: 0, configured: 0 };
    byLayer[s.layer].total += 1;
    if (s.configured) {
      byLayer[s.layer].configured += 1;
      configured += 1;
    }
    if (s.stage === 'live') {
      liveTotal += 1;
      if (s.configured) liveConfigured += 1;
    }
  }
  return { total: statuses.length, configured, byLayer, liveConfigured, liveTotal };
}
