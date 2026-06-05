// ============================================================
// SwingIQ — AGI: Engine orchestrator
// ------------------------------------------------------------
// The pure entry point. Give it a normalized SignalBundle (from any adapter)
// and it returns the full Athlete General Intelligence result: the unified
// world model, ranked insights with reasoning chains, cross-sport transfers,
// and a prioritised plan. No React, no browser, no network — fully testable.
// ============================================================

import { buildWorldModel } from './worldModel';
import { reason } from './reasoning';
import { buildTransfers } from './transfer';
import { buildGeneralPlan } from './planner';
import { buildProgress, progressToInsight } from './progress';
import type { AthleteGIResult, SignalBundle } from './types';

export const AGI_VERSION = 'agi-1.0.0';

const DISCLAIMER =
  'Athlete General Intelligence is a *general* reasoning layer: one engine that ' +
  'looks across all of your sports and all of your signals at once, instead of one ' +
  'narrow tool per task. "General" means breadth and cross-sport transfer — it is ' +
  'not a claim of human-level AI. Every number comes from your own analysed sessions ' +
  '(single-camera pose is an estimate, never a lab measurement), every conclusion ' +
  'shows its reasoning and confidence, and nothing here is medical or injury advice.';

export interface RunOptions {
  /**
   * Optional narrative enhancer. When provided it may only re-phrase the
   * already-computed insight text — it can never change the numbers, basis, or
   * confidence. Absent = pure deterministic output (enhanced: false).
   */
  enhanceNarrative?: (result: AthleteGIResult) => AthleteGIResult;
}

/** Run the full Athlete General Intelligence pipeline over a signal bundle. */
export function runAthleteGI(bundle: SignalBundle, opts: RunOptions = {}): AthleteGIResult {
  const model = buildWorldModel(bundle);
  const progress = buildProgress(model, bundle.history ?? []);
  const progressInsight = progress ? progressToInsight(progress) : null;
  const insights = reason(model, bundle, progressInsight ? [progressInsight] : []);
  const transfers = buildTransfers(model);
  const plan = buildGeneralPlan(model, insights, bundle);

  const base: AthleteGIResult = {
    model,
    insights,
    transfers,
    plan,
    progress,
    disclaimer: DISCLAIMER,
    version: AGI_VERSION,
    enhanced: false,
  };

  if (opts.enhanceNarrative) {
    try {
      return { ...opts.enhanceNarrative(base), enhanced: true };
    } catch {
      return base; // honest fallback — never fail because an optional LLM did
    }
  }
  return base;
}
