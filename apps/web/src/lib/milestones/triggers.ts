// ============================================================
// SwingVantage Milestones — trigger status (PURE / deterministic)
// ------------------------------------------------------------
// Turns a resolved metric (+ optional admin override) into a milestone status,
// current value and progress. Honest by construction: a metric with no source
// and no admin override resolves to `needs_data_source` and never earns.
// ============================================================

import type { MilestoneDefinition, MilestoneStatus, TriggerOperator } from './types';
import type { ResolvedMetric } from './metric-sources';

function meets(current: number, op: TriggerOperator, target: number): boolean {
  switch (op) {
    case 'gte': return current >= target;
    case 'gt': return current > target;
    case 'eq': return current === target;
    case 'lte': return current <= target;
    default: return false;
  }
}

export interface StatusResult {
  status: MilestoneStatus;
  currentValue: number | null;
  targetValue: number;
  progressPct: number | null;
  rationale: string;
}

/**
 * Compute status. `overrideValue` (admin-attested) supersedes the resolved
 * metric — this is how admin_manual milestones and metric overrides become
 * earned, with a clear "admin-entered" rationale.
 */
export function computeStatus(
  def: MilestoneDefinition,
  resolved: ResolvedMetric,
  overrideValue?: number,
): StatusResult {
  const target = def.trigger.value;
  const hasOverride = typeof overrideValue === 'number';
  const value = hasOverride ? overrideValue! : resolved.value;

  // No readable metric and no admin attestation → honest "needs data source".
  if (value === null) {
    return {
      status: 'needs_data_source',
      currentValue: null,
      targetValue: target,
      progressPct: null,
      rationale:
        resolved.source === 'admin_manual'
          ? 'Awaiting admin verification — no automatic data source.'
          : `No in-app data source for "${def.trigger.type}". Connect a source or verify manually.`,
    };
  }

  const earned = meets(value, def.trigger.operator, target);
  const progressPct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : earned ? 100 : 0;
  const sourceWord = hasOverride ? 'admin-entered' : resolved.source;

  if (earned) {
    return {
      status: 'earned',
      currentValue: value,
      targetValue: target,
      progressPct: 100,
      rationale: `Earned: ${value} ${operatorWord(def.trigger.operator)} ${target} (${sourceWord}).`,
    };
  }
  return {
    status: value > 0 ? 'in_progress' : 'not_started',
    currentValue: value,
    targetValue: target,
    progressPct,
    rationale: `${value} of ${target} (${progressPct}% — ${sourceWord}).`,
  };
}

function operatorWord(op: TriggerOperator): string {
  return op === 'gte' ? '≥' : op === 'gt' ? '>' : op === 'lte' ? '≤' : '=';
}
