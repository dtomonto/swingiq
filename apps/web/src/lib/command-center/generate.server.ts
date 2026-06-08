// ============================================================
// Today's Command Center — server generation entry (SERVER-ONLY)
// ------------------------------------------------------------
// Thin wiring: gather live signals → run the pure engine → return scored
// recommendations. The admin page calls this; "Run Intelligence Scan" in
// the UI simply re-renders the (force-dynamic) page, which calls this
// again with fresh signals. Owner state is applied client-side.
// ============================================================

import 'server-only';

import { gatherSignals } from './signals.server';
import { generateRecommendations, type GenerateOptions } from './engine';
import type { Recommendation } from './types';

export interface ScanResult {
  generatedAt: string;
  recommendations: Recommendation[];
  totals: { features: number; sports: number; drills: number };
  analyticsConfigured: boolean;
}

/** Gather signals and produce the scored, de-duplicated recommendation list. */
export async function runScan(opts: GenerateOptions = {}): Promise<ScanResult> {
  const bundle = await gatherSignals();
  const recommendations = generateRecommendations(bundle, opts);
  return {
    generatedAt: bundle.now,
    recommendations,
    totals: bundle.totals,
    analyticsConfigured: bundle.analyticsConfigured,
  };
}
