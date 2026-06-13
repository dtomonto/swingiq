// ============================================================
// SwingVantage — GAI gate for the live video-analysis routes (server-only)
// ------------------------------------------------------------
// The expensive video routes (/api/video-vision-analysis, /api/video-analysis)
// already enforce provider config, the operator AI feature switch, per-user
// pause, and the daily budget cap. What they did NOT consult is the platform's
// GAI Operating Mode — so a kill switch, force-heuristic, or Cost-Saving posture
// could not actually stop a paid video call.
//
// `gateVideoAnalysis` closes that gap: it runs the SAME central decideRoute() the
// rest of the layer uses, scoped to the premium video tier, and tells the route
// whether a paid AI call is permitted under the current operating mode. It also
// records the decision for observability. The route keeps its existing execution
// and response shape — this only governs WHETHER the paid path runs.
//
// SECURITY: server-only.
// ============================================================

import type { SportId } from '@swingiq/core';
import { decideRoute, buildDecisionInput } from './router';
import type { RouteContext } from './router';
import { resolveRouteContext } from './context';
import { logAnalysis } from './log';
import { estimateCostCents } from '@/lib/ai-budget';
import { TIER_OP } from './tiers';
import type { AnalysisRequest, IntelligenceTier, RouteDecision } from './types';

export interface VideoGateInput {
  sport: SportId;
  /** The selected issue / miss if known (does not affect the decision). */
  issue?: string;
  userId?: string | null;
  /** Tier this call maps onto (premium video by default). */
  tier?: IntelligenceTier;
  /**
   * Whether the route has already confirmed a usable AI provider. The route
   * owns provider resolution (incl. live-route overrides), so the gate trusts
   * it rather than re-deriving — the gate's job is operating-mode governance.
   */
  providerConfigured?: boolean;
}

export interface VideoGateResult {
  /** True when a paid AI video call is permitted under the current posture. */
  allowAI: boolean;
  decision: RouteDecision;
  /** Honest, premium, user-facing line to show when AI is gated off. */
  message?: string;
}

/** A premium, mode-aware message for a gated-off video request. */
function gateMessage(ctx: RouteContext): string {
  if (ctx.adminKillSwitch || ctx.adminForceHeuristic) {
    return 'Deep AI video analysis is paused right now. Your SwingVantage GAI Instant Estimate is still available — try the instant analysis for a fast, structured plan.';
  }
  if (ctx.operatingMode === 'COST_SAVING_MODE') {
    return 'Deep AI video analysis is not available in this mode for your plan. Your SwingVantage GAI Instant Estimate is ready now, and you can run video-backed analysis on a premium plan.';
  }
  // Default mode reaching here means a transient block (budget/provider).
  return 'We generated a SwingVantage GAI Instant Estimate so you still have a clear plan today. You can run a deeper video analysis when it is available again.';
}

/**
 * Decide whether the live video route may make a paid AI call under the current
 * GAI Operating Mode. Records the decision for the admin observability rollup.
 * Never throws — on any internal error it permits the call (the route's own
 * budget/provider guards remain the backstop), so the gate can only make the
 * platform safer, never break a working flow.
 */
export async function gateVideoAnalysis(input: VideoGateInput): Promise<VideoGateResult> {
  const tier: IntelligenceTier = input.tier ?? 'PREMIUM_RETEST_PLAN';
  const req: AnalysisRequest = {
    tier,
    sport: input.sport,
    issue: input.issue || 'swing',
    videoAvailable: true,
    userId: input.userId ?? null,
  };

  try {
    const base = await resolveRouteContext(req);
    // The route owns provider/budget resolution; scope the gate to operating-mode
    // governance by trusting those as satisfied here.
    const ctx: RouteContext = {
      ...base,
      providerConfigured: input.providerConfigured ?? true,
      providerHealthy: true,
      budgetAllows: true,
    };

    const decision = decideRoute(buildDecisionInput(req, ctx));
    const allowAI = decision.usesAI;

    // Observability: record the gate decision (best-effort).
    void logAnalysis({
      at: new Date().toISOString(),
      tier,
      route: decision.route,
      sourceMode: allowAI ? 'ai' : 'heuristic',
      sport: input.sport,
      issue: req.issue,
      operatingMode: ctx.operatingMode,
      userPlan: ctx.userPlan,
      usesAI: allowAI,
      confidence: 0,
      costEstimateCents: allowAI ? estimateCostCents(TIER_OP[tier]) : 0,
      costAvoidedCents: allowAI ? 0 : estimateCostCents(TIER_OP[tier]),
      reason: decision.reason,
      userId: input.userId ?? null,
    });

    return { allowAI, decision, message: allowAI ? undefined : gateMessage(ctx) };
  } catch {
    // Fail open — the route's own guards still protect spend.
    return {
      allowAI: true,
      decision: { route: 'FULL_AI', usesAI: true, reason: 'gate-error-fail-open', costEstimateCents: 0 },
    };
  }
}
