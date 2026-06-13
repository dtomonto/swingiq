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
import { runHeuristicEstimate } from './heuristic';
import { logAnalysis } from './log';
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
  return routeAnalysis(req, ctx, {
    runHeuristic: (r, route) => runHeuristicEstimate(r, route),
    runHybrid: opts.runHybrid,
    runFullAI: opts.runFullAI,
    getCached: opts.getCached,
    log: opts.disableLogging ? undefined : logAnalysis,
  });
}
