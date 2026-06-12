// ============================================================
// Admin Metric Explainers — live value resolvers (SERVER-ONLY)
// ------------------------------------------------------------
// Given a metric id, fetch its CURRENT value so the explainer page can show
// the real number, honestly labelled. Only the metrics with a known live
// source are resolved here; everything else returns null and the page renders
// the curated definition (or generic fallback) without a live value.
//
// Server-only: imports service-role data helpers. Never import from a client
// component — the /admin/metrics/[id] route is a server component.
// ============================================================

import { getPlatformMetrics } from '@/lib/admin/data/metrics';
import { getSystemStatus } from '@/lib/admin/data/system';
import { formatNumber } from '@/lib/admin/format';
import type { ResolvedMetricValue } from './types';

const PLATFORM_COUNT_KEYS = {
  'platform-accounts': 'authUsers',
  'platform-golf-profiles': 'golfProfiles',
  'platform-sport-profiles': 'sportProfiles',
  'platform-sessions': 'sessions',
  'platform-analyses': 'analyses',
  'platform-community': 'community',
} as const;

type PlatformMetricId = keyof typeof PLATFORM_COUNT_KEYS;

function isPlatformMetric(id: string): id is PlatformMetricId {
  return id in PLATFORM_COUNT_KEYS;
}

/** Resolve the current value of a metric, or null if it has no live source. */
export async function resolveMetricValue(id: string): Promise<ResolvedMetricValue | null> {
  const asOf = new Date().toISOString();

  if (isPlatformMetric(id)) {
    const m = await getPlatformMetrics();
    if (!m.connected) {
      return {
        value: '—',
        source: 'placeholder',
        asOf,
        note: m.reason ?? 'Live cross-user data is off — connect the Supabase service role.',
      };
    }
    const key = PLATFORM_COUNT_KEYS[id];
    const raw = m.counts[key];
    if (raw === null || raw === undefined) {
      return { value: '—', source: 'placeholder', asOf, note: 'Not available from the current schema.' };
    }
    const capped = id === 'platform-accounts' && m.authUsersCapped;
    return {
      value: `${formatNumber(raw)}${capped ? '+' : ''}`,
      source: 'real',
      asOf,
      note: capped ? 'Hit the 1,000-user page cap — this is a floor, not the exact total.' : undefined,
    };
  }

  if (id === 'system-services-connected') {
    const s = getSystemStatus();
    return { value: `${s.connectedCount}/${s.totalCount}`, source: 'config', asOf };
  }

  if (id === 'system-ai-vision') {
    const s = getSystemStatus();
    return {
      value: s.capabilities.aiVision ? 'On' : 'Off',
      source: 'config',
      asOf,
      note: s.capabilities.aiVision ? undefined : 'No vision provider configured.',
    };
  }

  if (id === 'system-environment') {
    const s = getSystemStatus();
    return { value: s.nodeEnv, source: 'config', asOf };
  }

  return null;
}
