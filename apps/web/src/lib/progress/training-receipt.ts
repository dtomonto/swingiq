// ============================================================
// SwingVantage — Training Receipt
// ------------------------------------------------------------
// Proof of a practice→retest cycle: what was diagnosed, what was
// practised, what changed, whether the drill appears to be working,
// and the next move. Built from a completed retest result + the
// drill feedback tied to that fault. Stays honest: a video retest
// is directional, never a measured guarantee.
// ============================================================

import type { TrainingReceipt, TrainingReceiptInput } from './types';

export function buildTrainingReceipt(input: TrainingReceiptInput): TrainingReceipt {
  const { latestResult, drillsTried, drillFeedbackForFault } = input;

  if (!latestResult) {
    return {
      available: false,
      diagnosed: '',
      practiced: '',
      whatChanged: '',
      drillEffectiveness: '',
      outcome: null,
      nextRecommendation:
        'Finish a practice block and run a retest under the same conditions — your Training Receipt appears here once there is a before and an after to compare.',
      confidenceNote: 'A video retest shows direction, not a measured number.',
    };
  }

  const { comparison, priorFocus } = latestResult;

  const helped = drillFeedbackForFault.filter((r) => r.value === 'helped').length;
  const hurt = drillFeedbackForFault.filter((r) => r.value === 'hurt').length;

  const practiced =
    drillsTried.length > 0
      ? `You worked ${drillsTried.length} drill${drillsTried.length > 1 ? 's' : ''} for this — including "${drillsTried[0].name}".`
      : 'No drills were logged for this fault — logging them makes the next receipt sharper.';

  let drillEffectiveness: string;
  if (helped > 0 && comparison.outcome === 'improved') {
    drillEffectiveness = `The drill${helped > 1 ? 's' : ''} you marked "helped" line up with the improvement — that's a good sign it's working.`;
  } else if (helped > 0) {
    drillEffectiveness = `You felt the drill helped, but the retest didn't clearly confirm it yet. Give it another cycle before judging.`;
  } else if (hurt > 0) {
    drillEffectiveness = `You flagged a drill as unhelpful — SwingVantage has stopped recommending it and will suggest a different approach.`;
  } else {
    drillEffectiveness = 'No drill verdicts logged yet, so effectiveness is unconfirmed.';
  }

  const nextRecommendation =
    comparison.outcome === 'improved'
      ? 'Lock in the gain with one more session, then move to your next priority.'
      : comparison.outcome === 'persisting'
        ? 'Same issue is still top — try the alternative drill in your Fix Stack and retest again.'
        : 'Conditions made this hard to judge — retest with the same angle, distance and setup for a fair read.';

  return {
    available: true,
    diagnosed: priorFocus,
    practiced,
    whatChanged: `${comparison.headline} — ${comparison.detail}`,
    drillEffectiveness,
    outcome: comparison.outcome,
    nextRecommendation,
    confidenceNote: comparison.confidenceNote,
  };
}
