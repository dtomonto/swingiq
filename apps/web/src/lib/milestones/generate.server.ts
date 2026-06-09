// ============================================================
// SwingVantage Milestones — server generation entry (SERVER-ONLY)
// ------------------------------------------------------------
// Gather the live metric snapshot, evaluate every milestone, and return a
// serializable result for the Admin Milestone Center. The snapshot is passed to
// the client too, so the client can re-run the PURE evaluator with the admin's
// localStorage overrides (admin-attested values) — settings/approvals are live.
// ============================================================

import 'server-only';

import { gatherMetricSnapshot } from './metrics-snapshot.server';
import { evaluateMilestones, summarizeMilestones, type MilestoneCounts } from './evaluate';
import type { EvaluatedMilestone, MetricSnapshot } from './types';

export interface MilestoneScanResult {
  generatedAt: string;
  snapshot: MetricSnapshot;
  evaluated: EvaluatedMilestone[];
  counts: MilestoneCounts;
}

export async function runMilestoneScan(now: Date = new Date()): Promise<MilestoneScanResult> {
  const snapshot = await gatherMetricSnapshot(now);
  const evaluated = evaluateMilestones(snapshot);
  return {
    generatedAt: snapshot.now,
    snapshot,
    evaluated,
    counts: summarizeMilestones(evaluated),
  };
}
