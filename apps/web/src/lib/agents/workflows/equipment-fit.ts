// ============================================================
// SwingIQ — Workflow: Equipment Fit
// ------------------------------------------------------------
// Modest, non-pushy equipment guidance for all 5 sports. Never
// forces product links and never over-claims. Recommends fit
// considerations and "worth testing" categories first, and asks
// for more data before recommending changes.
// ============================================================

import { getSportAgentProfile } from '../sport-profiles';
import type { AgentConfidence, AgentContext, EquipmentFit } from '../types';

export function buildEquipmentFit(ctx: AgentContext): EquipmentFit {
  const sp = getSportAgentProfile(ctx.activeSport);
  const eq = ctx.equipment;

  // Not enough data to say anything responsible.
  if (eq.itemCount === 0 || eq.completeness < 30) {
    return {
      sport: ctx.activeSport,
      fitScore: null,
      fitConfidence: { level: 'low', score: 25, reason: 'we need your equipment details first' },
      equipmentStrengths: [],
      equipmentConcerns: [],
      testSuggestions: [],
      noChangeNeededReason: null,
      dataNeeded: [
        `Add your ${sp.equipmentNoun} details so SwingIQ can check fit.`,
        ctx.sessionCount === 0
          ? `Log a ${sp.inputNoun} so fit can be tied to how you actually ${sp.motion}.`
          : 'Keep logging sessions to tie fit to real performance.',
      ],
    };
  }

  const goal = (ctx.profile.goal ?? '').toLowerCase();
  const wantsDistance = /distance|power|carry|farther|further|exit/.test(goal);
  const wantsControl = /control|accuracy|consistency|contact|spin|placement/.test(goal);

  const fitConfidence: AgentConfidence = {
    level: eq.completeness >= 70 && ctx.sessionCount >= 2 ? 'medium' : 'low',
    score: Math.min(eq.completeness, ctx.sessionCount >= 2 ? 70 : 50),
    reason:
      ctx.sessionCount < 2
        ? 'fit is most reliable once we have a couple of sessions'
        : 'based on your equipment details and recent sessions',
  };

  const strengths: string[] = [];
  const concerns: string[] = [];
  const tests: string[] = [];

  strengths.push(`Your ${sp.equipmentNoun} profile is ${eq.completeness}% complete — a good base for fit checks.`);

  if (wantsDistance) {
    tests.push(`If more ${ctx.activeSport === 'golf' ? 'carry' : 'distance'} is the goal, it may be worth testing a slightly different weighting/length profile.`);
  }
  if (wantsControl) {
    tests.push('If control is the goal, a setup that favors stability over raw power may be worth a test.');
  }
  if (!wantsDistance && !wantsControl) {
    tests.push(`Once you have a clear goal, SwingIQ can suggest a ${sp.equipmentNoun} profile worth testing.`);
  }

  if (eq.completeness < 70) {
    concerns.push(`A few ${sp.equipmentNoun} fields are missing — completing them sharpens this guidance.`);
  }

  const noChangeNeededReason =
    ctx.sessionCount < 2
      ? `No change recommended yet — let's confirm your patterns over a couple of sessions before touching your ${sp.equipmentNoun}.`
      : null;

  return {
    sport: ctx.activeSport,
    fitScore: eq.completeness >= 70 ? Math.round(50 + eq.completeness * 0.3) : null,
    fitConfidence,
    equipmentStrengths: strengths,
    equipmentConcerns: concerns,
    testSuggestions: tests,
    noChangeNeededReason,
    dataNeeded: eq.completeness < 70 ? [`Complete the remaining ${sp.equipmentNoun} fields.`] : [],
  };
}
