// ============================================================
// SwingVantage — GAI analysis observability (server-only)
// ------------------------------------------------------------
// Best-effort route-decision logging + the admin observability rollup. Writes
// to the additive `analysis_logs` table (supabase-intelligence.sql) via the
// service-role client. Degrades to a no-op when Supabase isn't configured, so
// nothing breaks in keyless / local mode and a logging failure never affects a
// user's analysis.
//
// SECURITY: server-only (service-role client). Never import from a client.
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import type { AnalysisLog, AnalysisRoute } from './types';

/** Record one route decision. Never throws — observability is best-effort. */
export async function logAnalysis(entry: AnalysisLog): Promise<void> {
  const admin = createSupabaseAdminClient();
  if (!admin) return;
  try {
    await admin.from('analysis_logs').insert({
      at: entry.at,
      tier: entry.tier,
      route: entry.route,
      source_mode: entry.sourceMode,
      sport: entry.sport,
      issue: entry.issue,
      operating_mode: entry.operatingMode,
      user_plan: entry.userPlan,
      uses_ai: entry.usesAI,
      confidence: entry.confidence,
      cost_estimate_cents: entry.costEstimateCents,
      cost_avoided_cents: entry.costAvoidedCents,
      reason: entry.reason,
      user_id: entry.userId ?? null,
    });
  } catch {
    /* best-effort */
  }
}

export interface IntelligenceObservability {
  /** True when a durable log store (Supabase) is available. */
  available: boolean;
  windowDays: number;
  total: number;
  routeSplit: Record<AnalysisRoute, number>;
  /** Share of requests served from the reusable cache (0..1). */
  cacheHitRate: number;
  /** Share of requests that fell back to a heuristic after an AI route (0..1). */
  fallbackRate: number;
  estimatedSpendCents: number;
  estimatedAvoidedCents: number;
  averageConfidence: number;
  topSports: Array<{ key: string; count: number }>;
  topIssues: Array<{ key: string; count: number }>;
}

const EMPTY_SPLIT: Record<AnalysisRoute, number> = {
  HEURISTIC_ONLY: 0,
  HYBRID: 0,
  FULL_AI: 0,
  CACHED: 0,
  FALLBACK_HEURISTIC: 0,
  ADMIN_FORCED_HEURISTIC: 0,
};

interface LogRow {
  route: AnalysisRoute;
  source_mode: string;
  sport: string;
  issue: string;
  confidence: number | null;
  cost_estimate_cents: number | null;
  cost_avoided_cents: number | null;
}

function topN(counts: Map<string, number>, n: number): Array<{ key: string; count: number }> {
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/** Aggregate the analysis log over a trailing window for the admin dashboard. */
export async function getIntelligenceObservability(days = 14): Promise<IntelligenceObservability> {
  const base: IntelligenceObservability = {
    available: false,
    windowDays: days,
    total: 0,
    routeSplit: { ...EMPTY_SPLIT },
    cacheHitRate: 0,
    fallbackRate: 0,
    estimatedSpendCents: 0,
    estimatedAvoidedCents: 0,
    averageConfidence: 0,
    topSports: [],
    topIssues: [],
  };

  const admin = createSupabaseAdminClient();
  if (!admin) return base;

  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  try {
    const { data, error } = await admin
      .from('analysis_logs')
      .select('route,source_mode,sport,issue,confidence,cost_estimate_cents,cost_avoided_cents')
      .gte('at', since)
      .limit(5000);
    if (error || !data) return base;

    const rows = data as LogRow[];
    const split = { ...EMPTY_SPLIT };
    const sports = new Map<string, number>();
    const issues = new Map<string, number>();
    let spend = 0;
    let avoided = 0;
    let confSum = 0;
    let cached = 0;
    let fallback = 0;

    for (const r of rows) {
      if (r.route in split) split[r.route] += 1;
      if (r.route === 'CACHED') cached += 1;
      if (r.route === 'FALLBACK_HEURISTIC') fallback += 1;
      spend += r.cost_estimate_cents ?? 0;
      avoided += r.cost_avoided_cents ?? 0;
      confSum += r.confidence ?? 0;
      sports.set(r.sport, (sports.get(r.sport) ?? 0) + 1);
      issues.set(r.issue, (issues.get(r.issue) ?? 0) + 1);
    }

    const total = rows.length;
    return {
      available: true,
      windowDays: days,
      total,
      routeSplit: split,
      cacheHitRate: total ? cached / total : 0,
      fallbackRate: total ? fallback / total : 0,
      estimatedSpendCents: spend,
      estimatedAvoidedCents: avoided,
      averageConfidence: total ? Number((confSum / total).toFixed(2)) : 0,
      topSports: topN(sports, 5),
      topIssues: topN(issues, 5),
    };
  } catch {
    return base;
  }
}
