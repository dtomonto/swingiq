// ============================================================
// SwingIQ — Workflow: Swing Intake Quality
// ------------------------------------------------------------
// A friendly pre-analysis quality check. Improves upload/data
// quality BEFORE analysis without blocking the user. Offers
// "continue anyway" whenever it is safe to do so.
// ============================================================

import { getSportAgentProfile } from '../sport-profiles';
import type { AgentContext, IntakeQualityResult } from '../types';

export interface IntakeSignal {
  /** Whether a video/file or shot data is actually present. */
  hasMedia?: boolean;
  /** Number of data fields / shots the user has provided so far. */
  dataPoints?: number;
}

export function assessIntakeQuality(
  ctx: AgentContext,
  signal: IntakeSignal = {},
): IntakeQualityResult {
  const sp = getSportAgentProfile(ctx.activeSport);
  const blocking: string[] = [];
  const improvements: string[] = [];

  // Profile completeness improves recommendations but never blocks.
  if (!ctx.profile.exists) {
    improvements.push('Add a quick profile so your analysis is tailored to your level and goal.');
  }
  if (!ctx.profile.skillLevel) {
    improvements.push('Set your skill level so drill difficulty matches you.');
  }
  if (!ctx.equipment.sufficientForFit) {
    improvements.push(`Adding your ${sp.equipmentNoun} details improves the recommendation.`);
  }

  // Data plausibility — only a soft prompt, never a hard block.
  if (signal.hasMedia === false) {
    improvements.push(
      ctx.activeSport === 'golf'
        ? 'Add at least a few shots so SwingIQ can find a pattern.'
        : 'Attach a video so SwingIQ has something to analyze.',
    );
  }
  if (typeof signal.dataPoints === 'number' && signal.dataPoints > 0 && signal.dataPoints < 5 && ctx.activeSport === 'golf') {
    improvements.push('5+ shots make the diagnosis much more reliable.');
  }

  const ready = blocking.length === 0;
  const headline = ready
    ? improvements.length === 0
      ? 'This is ready to analyze.'
      : 'This will work — a couple of small additions would make it even better.'
    : 'A quick fix is needed before analyzing.';

  return {
    ready,
    headline,
    blocking,
    improvements,
    filmingTips: ctx.activeSport === 'golf' ? [] : sp.filmingTips,
    allowContinueAnyway: true,
  };
}
