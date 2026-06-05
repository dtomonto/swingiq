// ============================================================
// SwingVantage — Workflow: Parent Sharing
// ------------------------------------------------------------
// The parent-facing companion to Coach Sharing. Same underlying
// data, reframed for a parent guiding a young athlete: simple
// language, one focus, a couple of "homework" drills, an
// encouragement cue, and a safety-first note. Positions SwingVantage
// as support — not a replacement for a qualified coach.
// ============================================================

import { getSportAgentProfile } from '../sport-profiles';
import { computeProgressTrend } from './progress-memory';
import { buildDiagnosisConfidence } from './diagnosis-confidence';
import { buildPracticePlan } from './practice-planner';
import type { AgentContext, ParentShareSummary } from '../types';

export function buildParentSummary(ctx: AgentContext): ParentShareSummary {
  const sp = getSportAgentProfile(ctx.activeSport);
  const dx = buildDiagnosisConfidence(ctx);
  const trend = computeProgressTrend(ctx);
  const plan = buildPracticePlan(ctx);

  const name = ctx.profile.firstName ?? 'Your athlete';
  const issue = dx.primaryIssue ?? 'building consistent, repeatable form';

  const parentSummary =
    `${name} is working on ${sp.label.toLowerCase()}. ` +
    `Right now, the one thing to help with is ${lowerFirst(issue)}. ` +
    `${trend.trendSummary} Keep it light and positive — at this stage, encouragement helps more than pressure.`;

  // Two simple "homework" drills the parent can guide at home.
  const homeworkDrills = plan.mainDrills
    .slice(0, 2)
    .map((d) => `${d.name} — ${lowerFirst(d.why)}`);

  return {
    parentSummary,
    focusThisWeek: plan.practiceFocus,
    homeworkDrills,
    encouragement:
      'Praise effort, not just results. A few good reps that feel easy beat a long, frustrating session.',
    safetyNote:
      'Keep sessions short and fun. Stop if anything causes pain, and check with a qualified coach or professional for technique and health questions.',
  };
}

function lowerFirst(s: string): string {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}
