// ============================================================
// SwingVantage Milestones — evaluation composer (PURE)
// ------------------------------------------------------------
// Runs the catalog over a live metric snapshot (+ optional admin overrides) and
// returns scored, status-resolved milestones + roll-up counts. PURE — the same
// snapshot yields the same result, so the admin center and tests are stable.
// ============================================================

import { MILESTONE_CATALOG } from './catalog';
import { resolveMetric } from './metric-sources';
import { computeStatus } from './triggers';
import { computeAuthorityScore } from './authority-score';
import type {
  AuthorityBand,
  EvaluatedMilestone,
  MetricSnapshot,
  MilestoneDefinition,
  MilestoneOverrideMap,
  MilestoneStatus,
} from './types';

/** Evaluate every milestone definition against the snapshot. PURE. */
export function evaluateMilestones(
  snap: MetricSnapshot,
  overrides: MilestoneOverrideMap = {},
  catalog: MilestoneDefinition[] = MILESTONE_CATALOG,
): EvaluatedMilestone[] {
  return catalog.map((def) => {
    const resolved = resolveMetric(def, snap);
    const override = overrides[def.id];
    const status = computeStatus(def, resolved, override?.verifiedValueOverride);
    return {
      definition: def,
      status: status.status,
      dataSource: override?.verifiedValueOverride != null ? 'admin_manual' : resolved.source,
      currentValue: status.currentValue,
      targetValue: status.targetValue,
      progressPct: status.progressPct,
      authority: computeAuthorityScore(def),
      rationale: status.rationale,
    };
  });
}

export interface MilestoneCounts {
  total: number;
  byStatus: Record<MilestoneStatus, number>;
  byAuthority: Record<AuthorityBand, number>;
  /** In-progress milestones at ≥70% — "close to earning". */
  closeToEarning: number;
  needsDataSource: number;
}

export function summarizeMilestones(evaluated: EvaluatedMilestone[]): MilestoneCounts {
  const byStatus: Record<MilestoneStatus, number> = { earned: 0, in_progress: 0, needs_data_source: 0, not_started: 0 };
  const byAuthority: Record<AuthorityBand, number> = { strategic: 0, high_value: 0, supporting: 0, low_priority: 0, do_not_publish: 0 };
  let closeToEarning = 0;
  for (const e of evaluated) {
    byStatus[e.status] += 1;
    byAuthority[e.authority.band] += 1;
    if (e.status === 'in_progress' && (e.progressPct ?? 0) >= 70) closeToEarning += 1;
  }
  return {
    total: evaluated.length,
    byStatus,
    byAuthority,
    closeToEarning,
    needsDataSource: byStatus.needs_data_source,
  };
}

/** Earned milestones, highest Authority first — the publish candidates. */
export function earnedMilestones(evaluated: EvaluatedMilestone[]): EvaluatedMilestone[] {
  return evaluated
    .filter((e) => e.status === 'earned')
    .sort((a, b) => b.authority.value - a.authority.value || a.definition.id.localeCompare(b.definition.id));
}
