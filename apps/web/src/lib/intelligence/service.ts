// ============================================================
// SwingVantage — GAI Intelligence service (public server entry)
// ------------------------------------------------------------
// The one function the rest of the server calls to run an analysis through GAI.
// It resolves the live context, then routes + executes via the router, wiring
// the EXISTING systems as executors:
//
//   • runHeuristic → the GAI heuristic engine (fault ontology + drill library)
//   • runHybrid / runFullAI → injected by callers that hold a video (e.g. the
//     existing /api/video-* routes wrap runAnalysisPipeline). When absent, AI
//     tiers degrade safely to the heuristic floor — you cannot do video AI with
//     no video, and the user still gets a usable plan.
//   • log → the analysis_logs observability sink.
//
// This adds no parallel architecture: it is the conductor over what exists.
// SECURITY: server-only.
// ============================================================

import type { TierId } from '@/lib/billing/tiers';
import { routeAnalysis } from './router';
import type { RouteAnalysisDeps } from './router';
import { resolveRouteContext } from './context';
import { runHeuristicVideoEstimate } from './heuristic-video';
import { logAnalysis } from './log';
import { tierConfig } from './tiers';
import { getCachedResult, putCachedResult, isCacheableResult } from './cache';
import type { AnalysisRequest, AnalysisResult } from './types';

export interface AnalyzeOptions {
  /** Override the resolved billing plan (e.g. when known by the caller). */
  userPlan?: TierId;
  /**
   * AI executors for callers that hold a video / richer input. These wrap the
   * existing orchestrator pipeline. Omit them and AI tiers fall back to the
   * heuristic floor.
   */
  runHybrid?: RouteAnalysisDeps['runHybrid'];
  runFullAI?: RouteAnalysisDeps['runFullAI'];
  getCached?: RouteAnalysisDeps['getCached'];
  /** Disable observability logging (e.g. in tests). */
  disableLogging?: boolean;
}

/**
 * Run an analysis request through the GAI Intelligence Router and return a
 * normalized result. Always resolves with a usable result — the heuristic engine
 * is the guaranteed floor.
 */
export async function analyze(req: AnalysisRequest, opts: AnalyzeOptions = {}): Promise<AnalysisResult> {
  const ctx = await resolveRouteContext(req, { userPlan: opts.userPlan });
  const cfg = tierConfig(req.tier);

  // Reusable cache probe (non-personalized tiers only). A single read, reused as
  // the getCached dep so the router never fetches twice. A hit flips cacheHit so
  // decideRoute can choose the CACHED route.
  let cached: AnalysisResult | null = null;
  if (cfg.usesCache && !opts.getCached) {
    cached = await getCachedResult(req).catch(() => null);
  }
  const routedCtx = cached ? { ...ctx, cacheHit: true } : ctx;

  const result = await routeAnalysis(req, routedCtx, {
    // Video-grounded heuristic floor: when the request carries on-device pose
    // proxies it COMPLETES the diagnosis from the measured motion; otherwise it
    // is identical to the self-reported Instant Estimate (safe superset).
    runHeuristic: (r, route) => runHeuristicVideoEstimate(r, route),
    runHybrid: opts.runHybrid,
    runFullAI: opts.runFullAI,
    getCached: opts.getCached ?? (cached ? () => cached : undefined),
    log: opts.disableLogging ? undefined : logAnalysis,
  });

  // Write-through: store freshly-computed, non-personalized results for reuse.
  if (cfg.usesCache && result.route !== 'CACHED' && isCacheableResult(result)) {
    await putCachedResult(req, result).catch(() => {});
  }

  return result;
}
