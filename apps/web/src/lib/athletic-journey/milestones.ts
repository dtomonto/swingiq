// ============================================================
// SwingVantage — Athletic Journey: milestone evaluation
// ------------------------------------------------------------
// Milestones are stage-specific, measurable, and evidence-based —
// not cosmetic. Each one tracks real progress toward leaving the
// current stage. Completed milestones are remembered (passed in)
// and measurable ones auto-advance from the athlete's data.
// ============================================================

import type {
  JourneySignals,
  MilestoneState,
  MilestoneTemplate,
  StageDefinition,
} from './types';
import { clamp } from './util';

/** Resolve a metric value from real metrics or synthetic activity counters. */
function resolveMetricValue(name: string, signals: JourneySignals): number | null {
  switch (name) {
    case 'rounds_logged':
    case 'matches_logged':
    case 'competitions_logged':
      return signals.activity.loggedCompetitions;
    default: {
      const hits = signals.metrics.filter((m) => m.metricName === name);
      if (!hits.length) return null;
      // Most recent reading wins.
      return hits.sort((a, b) => Date.parse(b.dateRecorded) - Date.parse(a.dateRecorded))[0].value;
    }
  }
}

function progressFor(
  tpl: MilestoneTemplate,
  value: number | null,
): { progress: number | null; met: boolean } {
  if (tpl.metric == null || tpl.targetValue == null || tpl.comparator == null) {
    return { progress: null, met: false };
  }
  if (value === null) return { progress: 0, met: false };
  if (tpl.comparator === 'gte') {
    const p = clamp(value / tpl.targetValue, 0, 1);
    return { progress: p, met: value >= tpl.targetValue };
  }
  // 'lte' — lower is better (penalties, double faults, score…)
  if (value <= tpl.targetValue) return { progress: 1, met: true };
  const p = clamp(tpl.targetValue / value, 0, 1);
  return { progress: p, met: false };
}

/** Evaluate the current stage's milestones against the athlete's data. */
export function computeMilestones(
  signals: JourneySignals,
  stage: StageDefinition,
  completedIds: ReadonlySet<string> = new Set(),
): MilestoneState[] {
  return stage.milestoneTemplates.map((tpl) => {
    const value = tpl.metric ? resolveMetricValue(tpl.metric, signals) : null;
    const { progress, met } = progressFor(tpl, value);

    const manuallyDone = completedIds.has(tpl.id);
    let status: MilestoneState['status'];
    if (manuallyDone || met) status = 'completed';
    else if (progress !== null && progress > 0) status = 'in_progress';
    else status = 'available';

    return {
      id: tpl.id,
      name: tpl.name,
      description: tpl.description,
      category: tpl.category,
      status,
      progress: status === 'completed' ? 1 : progress,
      currentValue: value,
      targetValue: tpl.targetValue ?? null,
      unit: tpl.unit ?? null,
      stageCode: stage.code,
    };
  });
}
