// ============================================================
// Clarity OS — static dashboard assembly (server-safe, no network)
// ------------------------------------------------------------
// Builds everything the page can show WITHOUT calling Clarity: the
// sanitized connection, the capability coverage grid (with deep links and
// resolved states), the signal catalog and the breakdown dimensions.
//
// Live numbers (traffic, engagement, quality signals…) are fetched
// separately and on demand by the API route, so the page always loads
// instantly and never breaks when Clarity is slow or unreachable.
// ============================================================

import { buildClarityUrl, getConnection, type Env } from './config';
import {
  CAPABILITY_GROUPS,
  CLARITY_CAPABILITIES,
  CLARITY_DIMENSIONS,
  SIGNAL_CATALOG,
} from './capabilities';
import type {
  CapabilityState,
  ClarityCapability,
  ClarityConnection,
  ClarityOsDashboard,
  ResolvedCapability,
} from './types';

/** What the OS can actually do for a capability given the live connection. */
export function resolveCapabilityState(
  cap: ClarityCapability,
  connection: ClarityConnection,
): CapabilityState {
  if (cap.access === 'linked') return 'linked';
  if (cap.needsReadKey && !connection.readConfigured) return 'needs-key';
  return cap.access; // 'live'
}

function resolveHref(cap: ClarityCapability, connection: ClarityConnection): string | null {
  return buildClarityUrl(connection.appBaseUrl, connection.projectId, cap.clarityPath);
}

/** Resolve every capability against the connection (state + deep link). */
export function resolveCoverage(connection: ClarityConnection): ResolvedCapability[] {
  return CLARITY_CAPABILITIES.map((cap) => ({
    ...cap,
    state: resolveCapabilityState(cap, connection),
    href: resolveHref(cap, connection),
  }));
}

/** Build the full static dashboard from the environment. */
export function buildClarityOsDashboard(env: Env = process.env): ClarityOsDashboard {
  const connection = getConnection(env);
  const coverage = resolveCoverage(connection);

  const coverageByGroup = CAPABILITY_GROUPS.map((g) => ({
    group: g.id,
    label: g.label,
    items: coverage.filter((c) => c.group === g.id),
  })).filter((g) => g.items.length > 0);

  const coverageStats = {
    live: coverage.filter((c) => c.state === 'live').length,
    linked: coverage.filter((c) => c.state === 'linked').length,
    needsKey: coverage.filter((c) => c.state === 'needs-key').length,
    total: coverage.length,
  };

  return {
    connection,
    coverage,
    coverageByGroup,
    coverageStats,
    signalCatalog: SIGNAL_CATALOG,
    dimensions: CLARITY_DIMENSIONS,
    generatedAt: new Date().toISOString(),
  };
}
