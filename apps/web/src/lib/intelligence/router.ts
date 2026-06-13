// ============================================================
// SwingVantage — GAI Intelligence Router
// ------------------------------------------------------------
// The single server-side place that decides HOW an analysis request is served.
// No frontend component decides whether to call AI, and no component calls a
// provider directly — everything flows through here:
//
//   request → resolve context → decideRoute() → execute via deps → log → result
//
// `decideRoute` is a PURE function (no I/O) so the routing contract is fully
// unit-testable. `routeAnalysis` is the async orchestration that resolves live
// signals (operating mode, capabilities, budget) and executes the chosen route
// through INJECTED executors — which in production wrap the EXISTING heuristic
// engine, orchestrator pipeline, and cache. This layer adds no parallel
// architecture; it routes across what already exists.
//
// SECURITY: server-only (touches operating-mode store, capabilities, budget).
// ============================================================

import type {
  AnalysisLog,
  AnalysisRequest,
  AnalysisResult,
  OperatingMode,
  RouteDecision,
  RouteDecisionInput,
} from './types';
import { tierConfig, TIER_OP } from './tiers';
import { estimateCostCents } from '@/lib/ai-budget';

// ── Pure decision function ──────────────────────────────────

/**
 * Decide the route for a request from fully-resolved inputs. Pure + synchronous
 * so every branch is testable without a network. Mirrors the documented routing
 * pseudocode (see docs/intelligence-routing.md).
 */
export function decideRoute(input: RouteDecisionInput): RouteDecision {
  const cost = input.estimatedCostCents;

  // 1. Hard admin overrides win over everything.
  if (input.adminKillSwitch || input.adminForceHeuristic) {
    return {
      route: 'ADMIN_FORCED_HEURISTIC',
      usesAI: false,
      reason: input.adminKillSwitch ? 'Admin kill switch active' : 'Admin force-heuristic active',
      costEstimateCents: 0,
    };
  }

  // 2. Reusable cache (cheapest, non-personalized) before any compute.
  if (input.cacheHit && input.cacheAllowed) {
    return { route: 'CACHED', usesAI: false, reason: 'Reusable cache hit', costEstimateCents: 0 };
  }

  // Whether a paid AI call is even possible right now.
  const withinCap = input.maxCostCents <= 0 || cost <= input.maxCostCents;
  const aiPossible =
    input.providerConfigured && input.providerHealthy && input.budgetAllows && withinCap;

  const aiBlockedReason = !input.providerConfigured
    ? 'No AI provider configured'
    : !input.providerHealthy
      ? 'AI provider unhealthy'
      : !input.budgetAllows
        ? 'Budget / per-user cap reached'
        : !withinCap
          ? 'Per-analysis cost cap exceeded'
          : '';

  if (input.operatingMode === 'COST_SAVING_MODE') {
    // Free + Instant Estimate are NEVER routed to paid AI in Cost-Saving Mode.
    if (input.tier === 'INSTANT_ESTIMATE' || input.userPlan === 'free') {
      return {
        route: 'HEURISTIC_ONLY',
        usesAI: false,
        reason: 'Cost-Saving Mode: deterministic GAI for free / Instant Estimate',
        costEstimateCents: 0,
      };
    }
    // Other tiers run AI only with an explicit admin override AND when possible.
    if (input.adminAllowsAIOverrideForTier && aiPossible) {
      return routeByTier(input.tier, cost, 'Cost-Saving Mode: admin-allowed AI for this tier');
    }
    return {
      route: 'HEURISTIC_ONLY',
      usesAI: false,
      reason: input.adminAllowsAIOverrideForTier
        ? `Cost-Saving Mode: ${aiBlockedReason || 'AI unavailable'}`
        : 'Cost-Saving Mode: AI not enabled for this tier',
      costEstimateCents: 0,
    };
  }

  // DEFAULT_AI_MODE
  if (input.tier === 'INSTANT_ESTIMATE') {
    return {
      route: 'HEURISTIC_ONLY',
      usesAI: false,
      reason: 'Instant Estimate is heuristic by design',
      costEstimateCents: 0,
    };
  }

  if (input.tier === 'AI_SWING_REPORT') {
    if (aiPossible) {
      return { route: 'HYBRID', usesAI: true, reason: 'Default AI Mode: hybrid synthesis', costEstimateCents: cost };
    }
    return {
      route: 'FALLBACK_HEURISTIC',
      usesAI: false,
      reason: `Default AI Mode: ${aiBlockedReason || 'AI unavailable'} — serving GAI estimate`,
      costEstimateCents: 0,
    };
  }

  // PREMIUM_RETEST_PLAN
  if (input.videoAvailable && aiPossible) {
    return { route: 'FULL_AI', usesAI: true, reason: 'Default AI Mode: full video-backed analysis', costEstimateCents: cost };
  }
  return {
    route: 'FALLBACK_HEURISTIC',
    usesAI: false,
    reason: !input.videoAvailable
      ? 'No video available — serving GAI estimate'
      : `${aiBlockedReason || 'AI unavailable'} — serving GAI estimate`,
    costEstimateCents: 0,
  };
}

function routeByTier(tier: RouteDecisionInput['tier'], cost: number, reason: string): RouteDecision {
  const route = tier === 'PREMIUM_RETEST_PLAN' ? 'FULL_AI' : 'HYBRID';
  return { route, usesAI: true, reason, costEstimateCents: cost };
}

// ── Live context resolution ─────────────────────────────────

/** The live signals the router resolves before deciding (overridable in tests). */
export interface RouteContext {
  operatingMode: OperatingMode;
  userPlan: RouteDecisionInput['userPlan'];
  providerConfigured: boolean;
  providerHealthy: boolean;
  budgetAllows: boolean;
  adminForceHeuristic: boolean;
  adminKillSwitch: boolean;
  adminAllowsAIOverrideForTier: boolean;
  cacheHit: boolean;
  cacheAllowed: boolean;
}

/** Build the pure decision input from a request + resolved context. */
export function buildDecisionInput(req: AnalysisRequest, ctx: RouteContext): RouteDecisionInput {
  const cfg = tierConfig(req.tier);
  return {
    operatingMode: ctx.operatingMode,
    tier: req.tier,
    userPlan: ctx.userPlan,
    videoAvailable: Boolean(req.videoAvailable),
    cacheHit: ctx.cacheHit,
    cacheAllowed: ctx.cacheAllowed && cfg.usesCache,
    providerConfigured: ctx.providerConfigured,
    providerHealthy: ctx.providerHealthy,
    budgetAllows: ctx.budgetAllows,
    estimatedCostCents: estimateCostCents(TIER_OP[req.tier]),
    maxCostCents: cfg.maxCostCents,
    adminForceHeuristic: ctx.adminForceHeuristic,
    adminKillSwitch: ctx.adminKillSwitch,
    adminAllowsAIOverrideForTier: ctx.adminAllowsAIOverrideForTier,
  };
}

// ── Orchestration ───────────────────────────────────────────

/**
 * Executors that bridge the router to the EXISTING systems. Production wires:
 *   runHeuristic → lib/intelligence/heuristic (fault ontology + drill library)
 *   runHybrid / runFullAI → lib/ai/ai-ops/orchestrator runAnalysisPipeline
 *   getCached → recommendation cache
 * Tests inject fakes. All are optional except the heuristic floor.
 */
export interface RouteAnalysisDeps {
  runHeuristic: (req: AnalysisRequest, route: AnalysisResult['route']) => Promise<AnalysisResult> | AnalysisResult;
  runHybrid?: (req: AnalysisRequest) => Promise<AnalysisResult>;
  runFullAI?: (req: AnalysisRequest) => Promise<AnalysisResult>;
  getCached?: (req: AnalysisRequest) => Promise<AnalysisResult | null> | AnalysisResult | null;
  log?: (entry: AnalysisLog) => Promise<void> | void;
}

/**
 * Route + execute a single analysis request. AI executors are guarded: any
 * failure (provider error, timeout) degrades to the heuristic floor and is
 * recorded as FALLBACK_HEURISTIC, so a user always gets a usable plan and never
 * sees a raw provider error.
 */
export async function routeAnalysis(
  req: AnalysisRequest,
  ctx: RouteContext,
  deps: RouteAnalysisDeps,
): Promise<AnalysisResult> {
  const input = buildDecisionInput(req, ctx);
  const decision = decideRoute(input);
  const cfg = tierConfig(req.tier);

  let result: AnalysisResult;
  let finalRoute = decision.route;

  try {
    switch (decision.route) {
      case 'CACHED': {
        const cached = deps.getCached ? await deps.getCached(req) : null;
        if (cached) {
          result = { ...cached, route: 'CACHED', sourceMode: 'cached' };
          break;
        }
        // Cache miss after deciding CACHED → fall through to heuristic floor.
        finalRoute = 'HEURISTIC_ONLY';
        result = await deps.runHeuristic(req, finalRoute);
        break;
      }
      case 'HYBRID': {
        if (!deps.runHybrid) throw new Error('no hybrid executor');
        result = await deps.runHybrid(req);
        break;
      }
      case 'FULL_AI': {
        if (!deps.runFullAI) throw new Error('no full-ai executor');
        result = await deps.runFullAI(req);
        break;
      }
      default: {
        result = await deps.runHeuristic(req, decision.route);
        break;
      }
    }
  } catch {
    // Any AI/cache executor failure → safe heuristic fallback.
    finalRoute = 'FALLBACK_HEURISTIC';
    result = await deps.runHeuristic(req, 'FALLBACK_HEURISTIC');
  }

  result = { ...result, route: finalRoute };

  // Best-effort observability — never blocks or throws.
  if (deps.log) {
    const usesAI = result.sourceMode === 'ai' || result.sourceMode === 'hybrid';
    const costAvoided = !usesAI ? estimateCostCents(TIER_OP[req.tier]) : 0;
    try {
      await deps.log({
        at: new Date().toISOString(),
        tier: req.tier,
        route: finalRoute,
        sourceMode: result.sourceMode,
        sport: req.sport,
        issue: req.issue,
        operatingMode: ctx.operatingMode,
        userPlan: ctx.userPlan,
        usesAI,
        confidence: result.confidence,
        costEstimateCents: result.costEstimateCents,
        costAvoidedCents: costAvoided,
        reason: decision.reason,
        userId: req.userId ?? null,
      });
    } catch {
      /* observability must never break the request */
    }
  }

  // Surface the per-tier upgrade CTA when AI was not used and one exists.
  if (!result.upgradeCTA && cfg.upgradeCTA && result.sourceMode !== 'ai') {
    result = { ...result, upgradeCTA: cfg.upgradeCTA };
  }

  return result;
}
