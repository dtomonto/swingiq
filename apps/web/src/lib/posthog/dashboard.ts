// ============================================================
// Analytics OS — static dashboard assembly (server-safe, no network)
// ------------------------------------------------------------
// Builds everything the page can show WITHOUT calling PostHog: the
// sanitized connection, the capability coverage grid (with deep links and
// resolved states), the tracked-event catalog and the key funnels.
//
// Live numbers (web analytics, flags, recordings…) are fetched separately
// and on demand by the API route, so the page always loads instantly and
// never breaks when PostHog is slow or unreachable.
// ============================================================

import { ANALYTICS_EVENTS } from '@swingiq/core';
import { buildPostHogUrl, getConnection, type Env } from './config';
import { CAPABILITY_GROUPS, POSTHOG_CAPABILITIES } from './capabilities';
import type {
  AnalyticsOsDashboard,
  CapabilityState,
  KeyFunnel,
  PostHogConnection,
  PostHogCapability,
  ResolvedCapability,
} from './types';

const E = ANALYTICS_EVENTS;

/**
 * The conversion funnels worth watching. Each step names the EXACT instrumented
 * event to use when building the funnel in PostHog, so it's copy-and-build with
 * no guessing — and because every event is an ANALYTICS_EVENTS value, a step can
 * never point at an event that doesn't exist. (`event: null` = a PostHog-native
 * step, e.g. returning users, not a custom event.) All referenced events are
 * verified to fire in the app; see the funnel-integrity test.
 */
export const KEY_FUNNELS: KeyFunnel[] = [
  {
    name: 'Acquisition',
    description: 'Cold visitor → first completed analysis. The top-of-funnel growth path.',
    steps: [
      { label: 'Visited the site', event: E.PAGE_VIEW },
      { label: 'Created an account', event: E.ACCOUNT_CREATED },
      { label: 'Started first upload', event: E.VIDEO_UPLOAD_STARTED },
      { label: 'Completed an analysis', event: E.ANALYSIS_COMPLETED },
    ],
  },
  {
    name: 'Activation',
    description:
      'First analysis → engaged with the fix → started a drill → came back. The "aha + return" path that gates Phase 2.',
    steps: [
      { label: 'Completed an analysis', event: E.ANALYSIS_COMPLETED },
      { label: 'Saw their top fix', event: E.PRIORITY_FIX_VIEWED },
      { label: 'Started a drill', event: E.DRILL_STARTED },
      { label: 'Returning user', event: null }, // PostHog-native retention, not a custom event
    ],
  },
  {
    name: 'Content → tool',
    description:
      'SEO/blog visitor → free tool → first upload. Measures whether content acquisition converts to product use.',
    steps: [
      { label: 'Content / SEO visit', event: E.PAGE_VIEW },
      { label: 'Used a free tool', event: E.TOOL_RESULT_GENERATED },
      { label: 'Started an upload', event: E.VIDEO_UPLOAD_STARTED },
    ],
  },
  {
    name: 'Improvement loop',
    description: 'Built a fix → started a drill → completed a retest. The north-star retention loop.',
    steps: [
      { label: 'Built a Fix Stack', event: E.FIX_STACK_CREATED },
      { label: 'Started a drill', event: E.DRILL_STARTED },
      { label: 'Completed a retest', event: E.RETEST_COMPLETED },
    ],
  },
];

/** What the OS can actually do for a capability given the live connection. */
export function resolveCapabilityState(
  cap: PostHogCapability,
  connection: PostHogConnection,
): CapabilityState {
  if (cap.access === 'linked') return 'linked';
  if (cap.needsReadKey && !connection.readConfigured) return 'needs-key';
  return cap.access; // 'live' | 'manage'
}

function resolveHref(cap: PostHogCapability, connection: PostHogConnection): string | null {
  if (!connection.ingestConfigured) return null;
  return buildPostHogUrl(connection.appBaseUrl, cap.posthogPath);
}

/** Resolve every capability against the connection (state + deep link). */
export function resolveCoverage(connection: PostHogConnection): ResolvedCapability[] {
  return POSTHOG_CAPABILITIES.map((cap) => ({
    ...cap,
    state: resolveCapabilityState(cap, connection),
    href: resolveHref(cap, connection),
  }));
}

/** Build the full static dashboard from the environment. */
export function buildAnalyticsOsDashboard(env: Env = process.env): AnalyticsOsDashboard {
  const connection = getConnection(env);
  const coverage = resolveCoverage(connection);

  const coverageByGroup = CAPABILITY_GROUPS.map((g) => ({
    group: g.id,
    label: g.label,
    items: coverage.filter((c) => c.group === g.id),
  })).filter((g) => g.items.length > 0);

  const coverageStats = {
    live: coverage.filter((c) => c.state === 'live').length,
    manage: coverage.filter((c) => c.state === 'manage').length,
    linked: coverage.filter((c) => c.state === 'linked').length,
    needsKey: coverage.filter((c) => c.state === 'needs-key').length,
    total: coverage.length,
  };

  return {
    connection,
    coverage,
    coverageByGroup,
    coverageStats,
    trackedEvents: Object.values(ANALYTICS_EVENTS),
    funnels: KEY_FUNNELS,
    generatedAt: new Date().toISOString(),
  };
}
