// ============================================================
// Analytics OS — shared types (isomorphic, safe on client & server)
// ------------------------------------------------------------
// These types describe the PostHog control center the admin sees.
// NOTHING here carries a secret: the personal API key never leaves
// the server (see config.ts getReadConfig). The `PostHogConnection`
// object is the sanitized view that IS sent to the browser.
// ============================================================

/** Which PostHog cloud (or self-hosted) the keys point at. */
export type PostHogRegion = 'us' | 'eu' | 'custom';

/**
 * How fully PostHog is wired:
 *   • none   — no project key at all (events go nowhere).
 *   • ingest — public project key set: events flow TO PostHog, but we
 *              cannot read data back (no personal API key).
 *   • full   — public key + personal API key + project id: we can read
 *              analytics and manage flags/surveys from inside the OS.
 */
export type ConnectionLevel = 'none' | 'ingest' | 'full';

/** Sanitized connection status — safe to pass to client components. */
export interface PostHogConnection {
  level: ConnectionLevel;
  region: PostHogRegion;
  /** Public (browser) key, masked for display, e.g. "phc_wAwL…DDo2". */
  ingestKeyMasked: string | null;
  ingestConfigured: boolean;
  /** Where the SDK sends events (e.g. https://us.i.posthog.com). */
  ingestHost: string;
  /** Whether a server-side personal API key is configured. */
  readConfigured: boolean;
  /** Numeric/short project id used for REST + HogQL calls. */
  projectId: string | null;
  /** Base URL of the PostHog app, for deep links (e.g. https://us.posthog.com). */
  appBaseUrl: string;
}

/** What the OS can do for a given PostHog capability. */
export type CapabilityAccess =
  | 'live' // we render the data inside the OS
  | 'manage' // we can create / toggle it inside the OS
  | 'linked'; // we deep-link into PostHog for the rich UI

/** Resolved per-capability state once we know the connection. */
export type CapabilityState = 'live' | 'manage' | 'linked' | 'needs-key';

export type CapabilityGroupId = 'analyze' | 'record' | 'experiment' | 'data' | 'manage';

export interface PostHogCapability {
  id: string;
  label: string;
  description: string;
  group: CapabilityGroupId;
  /** Best thing the OS can do for this capability. */
  access: CapabilityAccess;
  /** True when the action needs the server-side personal API key. */
  needsReadKey: boolean;
  /** Path within the PostHog app for the deep link (joined to appBaseUrl). */
  posthogPath: string;
  /** Lucide icon name, mapped to a component in the UI layer. */
  icon: string;
}

/** A capability with its state resolved against the live connection. */
export interface ResolvedCapability extends PostHogCapability {
  state: CapabilityState;
  /** Fully-qualified deep link into PostHog (or null when not connected). */
  href: string | null;
}

/** The static dashboard the server hands to the client on page load. */
export interface AnalyticsOsDashboard {
  connection: PostHogConnection;
  coverage: ResolvedCapability[];
  coverageByGroup: { group: CapabilityGroupId; label: string; items: ResolvedCapability[] }[];
  /** Count of capabilities by resolved state, for the header stats. */
  coverageStats: { live: number; manage: number; linked: number; needsKey: number; total: number };
  /** The events SwingVantage is instrumented to send (from @swingiq/core). */
  trackedEvents: string[];
  /** Key conversion funnels worth watching. */
  funnels: { name: string; steps: string[] }[];
  /** ISO timestamp the dashboard was assembled (for "as of"). */
  generatedAt: string;
}

// ── Live data shapes (returned by the API route when level === 'full') ──

export interface WebOverview {
  pageviews: number;
  visitors: number;
  sessions: number;
  /** Per-day pageviews for a small sparkline, oldest → newest. */
  byDay: { date: string; pageviews: number }[];
}

export interface NamedCount {
  name: string;
  count: number;
}

export interface FeatureFlagSummary {
  id: number;
  key: string;
  name: string;
  active: boolean;
  rolloutPercentage: number | null;
}

export interface LiveSnapshot {
  webOverview: WebOverview | null;
  topPages: NamedCount[];
  topEvents: NamedCount[];
  topReferrers: NamedCount[];
  featureFlags: FeatureFlagSummary[];
  counts: {
    recordings: number | null;
    surveys: number | null;
    experiments: number | null;
    cohorts: number | null;
    dashboards: number | null;
  };
  /** Per-section errors (honest partial failure), keyed by section id. */
  errors: Record<string, string>;
  rangeDays: number;
  fetchedAt: string;
}

/** Normalized result of any PostHog API call — never throws. */
export interface PhResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}
