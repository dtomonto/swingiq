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
  PostHogConnection,
  PostHogCapability,
  ResolvedCapability,
} from './types';

/** The conversion funnels worth watching (also seeds PostHog funnel links). */
export const KEY_FUNNELS: { name: string; steps: string[] }[] = [
  { name: 'Acquisition', steps: ['Visitor', 'Signup', 'First upload', 'Completed analysis'] },
  { name: 'Activation', steps: ['Analysis', 'Tutorial click', 'Drill started', 'Repeat visit'] },
  { name: 'Content → tool', steps: ['Blog/SEO visit', 'Tool usage', 'Upload'] },
  { name: 'Improvement loop', steps: ['Fix page', 'Drill started', 'Retest completed'] },
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
