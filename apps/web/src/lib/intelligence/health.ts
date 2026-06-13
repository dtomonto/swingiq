// ============================================================
// SwingVantage — GAI provider health (server-only)
// ------------------------------------------------------------
// Runtime liveness for the router's `providerHealthy` signal, derived from the
// EXISTING recent-call telemetry (lib/ai/ai-ops/call-log). This is distinct from
// `providerConfigured` (is a key set?) — it answers "are recent real calls
// actually succeeding?". The router uses it to route proactively to the
// heuristic floor during a provider outage instead of paying for calls that are
// currently failing.
//
// Conservative + fail-open: it only reports UNHEALTHY when there is a confident
// signal (enough recent samples for the relevant providers, and none of them
// succeeding). With no samples, on any error, or with mixed results, it reports
// healthy — the execution-time try/catch remains the real backstop.
//
// SECURITY: server-only (reads the shared call-log store).
// ============================================================

import { getAiCallStats } from '@/lib/ai/ai-ops/call-log';
import type { IntelligenceTier } from './types';

/** Minimum recent calls for a provider before its rate is trusted as a signal. */
const MIN_SAMPLES = 5;
/** A provider is unhealthy below this recent success rate. */
const OK_THRESHOLD = 0.5;

// Provider ids that can serve each tier's AI work (call-log records provider ids
// like 'gemini' | 'google' | 'openai' | 'anthropic'; match loosely).
const VISION_PROVIDERS = ['gemini', 'google', 'openai', 'anthropic'];
const COACH_PROVIDERS = ['openai', 'anthropic'];

/**
 * Whether the providers that could serve `tier` are currently healthy. Returns
 * `false` only when every relevant provider with enough recent samples is
 * failing; otherwise `true`. Never throws.
 */
export async function resolveProviderHealth(tier: IntelligenceTier): Promise<boolean> {
  try {
    const stats = await getAiCallStats();
    if (stats.total === 0) return true; // no signal → assume healthy

    const relevant = tier === 'PREMIUM_RETEST_PLAN' ? VISION_PROVIDERS : COACH_PROVIDERS;
    const sampled = stats.byProvider.filter(
      (p) => p.calls >= MIN_SAMPLES && relevant.some((r) => p.provider.toLowerCase().includes(r)),
    );
    if (sampled.length === 0) return true; // not enough data to call it unhealthy

    // Healthy if at least one relevant, well-sampled provider is succeeding.
    return sampled.some((p) => p.okCalls / p.calls >= OK_THRESHOLD);
  } catch {
    return true; // fail open
  }
}
