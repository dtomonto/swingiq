// ============================================================
// SwingIQ — Workflow: Coach Sharing
// ------------------------------------------------------------
// Builds a coach-ready summary: profile, goal, latest issue,
// evidence, trend, practice focus, and good questions to ask a
// coach. Positions SwingIQ as preparation — not a replacement
// for a human coach. Copy/share-friendly plain text.
// ============================================================

import { getSportAgentProfile } from '../sport-profiles';
import { computeProgressTrend } from './progress-memory';
import { buildDiagnosisConfidence } from './diagnosis-confidence';
import { buildPracticePlan } from './practice-planner';
import type { AgentContext, CoachShareSummary } from '../types';

export function buildCoachShareSummary(ctx: AgentContext): CoachShareSummary {
  const sp = getSportAgentProfile(ctx.activeSport);
  const dx = buildDiagnosisConfidence(ctx);
  const trend = computeProgressTrend(ctx);
  const plan = buildPracticePlan(ctx);

  const name = ctx.profile.firstName ?? 'This athlete';
  const goal = ctx.profile.goal ?? 'general improvement';
  const issue = dx.primaryIssue ?? 'not yet identified';

  const coachSummary =
    `${name} is working on ${sp.label.toLowerCase()} with the goal of ${lowerFirst(goal)}. ` +
    `Current focus: ${lowerFirst(issue)} (${dx.confidence.level} confidence — ${dx.confidence.reason}). ` +
    `${trend.trendSummary}`;

  return {
    coachSummary,
    keyEvidence: dx.evidence,
    recentTrend: trend.trendSummary,
    suggestedCoachQuestions: [
      `Does my ${lowerFirst(issue)} match what you see in person?`,
      'Which one cue would you have me focus on first?',
      `Is my practice plan (${lowerFirst(plan.practiceFocus)}) the right priority right now?`,
    ],
    nextPracticeFocus: plan.practiceFocus,
  };
}

function lowerFirst(s: string): string {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}
