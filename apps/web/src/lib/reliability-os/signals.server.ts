// ============================================================
// ReliabilityOS — server signal gatherer (SERVER-ONLY)
// ------------------------------------------------------------
// Reads REAL, keyless posture from the environment + existing connector
// registry so the dashboard shows honest health even with zero captured
// events. Returns booleans/counts ONLY — never secrets. Mirrors the securityOS
// posture.server pattern.
// ============================================================

import 'server-only';

import { isSupabaseConfigured } from '@/lib/capabilities';
import { isObservabilityConfigured } from '@/lib/observability/report';
import { getConnectorStatuses } from '@/lib/connector-os/feature-flags/connector-status';
import type { ReliabilitySignals } from './types';

export function gatherReliabilitySignals(env: Record<string, string | undefined> = process.env): ReliabilitySignals {
  const statuses = getConnectorStatuses(env);
  const byLayer = new Map<string, { configured: number; total: number }>();
  for (const s of statuses) {
    const row = byLayer.get(s.layer) ?? { configured: 0, total: 0 };
    row.total += 1;
    if (s.configured) row.configured += 1;
    byLayer.set(s.layer, row);
  }

  return {
    crossUserCaptureEnabled: isSupabaseConfigured,
    observabilityConfigured: isObservabilityConfigured(env),
    connectors: [...byLayer.entries()].map(([layer, v]) => ({ layer, configured: v.configured, total: v.total })),
    environment: env.VERCEL_ENV || env.NODE_ENV || 'development',
    gatheredAt: new Date().toISOString(),
  };
}
