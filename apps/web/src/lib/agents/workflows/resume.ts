// ============================================================
// SwingVantage — Workflow: Resume / "Pick Up Where You Left Off"
// ------------------------------------------------------------
// The centerpiece returning-user experience. Builds a structured
// ResumeState and a warm, plain-English Welcome Back summary that
// helps the athlete continue improving immediately.
//
// Fully deterministic. Fast. Mobile-friendly. Easy to dismiss.
// No AI call required — the summary is composed from structured
// local data the user already has.
// ============================================================

import { format } from 'date-fns';
import { getSportAgentProfile } from '../sport-profiles';
import { getNextBestAction, buildResumeOptions } from '../scoring';
import { computeProgressTrend } from './progress-memory';
import type {
  AgentConfidence,
  AgentContext,
  AgentMetadata,
  AgentTrigger,
  PlanStatus,
  ResumeState,
  ResumeStatus,
} from '../types';

function resolveStatus(ctx: AgentContext): ResumeStatus {
  if (!ctx.profile.exists && ctx.sessionCount === 0) return 'first_time';
  if (ctx.sessionCount === 0) return 'minimal_data';
  if (ctx.daysSinceLastActivity !== null && ctx.daysSinceLastActivity >= 30) return 'stale';
  return 'continue';
}

function resumeConfidence(ctx: AgentContext): AgentConfidence {
  if (ctx.sessionCount >= 3) {
    return { level: 'high', score: 85, reason: 'based on several of your sessions' };
  }
  if (ctx.sessionCount >= 1) {
    return { level: 'medium', score: 60, reason: 'based on your recent activity' };
  }
  return { level: 'low', score: 35, reason: 'we need one session to personalize this' };
}

function planLine(status: PlanStatus, sportInputNoun: string): string | null {
  switch (status) {
    case 'in_progress':
      return 'You had a practice plan in progress';
    case 'completed':
      return `You finished your last plan — the next step is a fresh ${sportInputNoun} to measure progress`;
    default:
      return null;
  }
}

function relativeDays(days: number | null): string {
  if (days === null) return '';
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'about a week ago';
  if (days < 45) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

function buildSummary(ctx: AgentContext, status: ResumeStatus): string {
  const sp = getSportAgentProfile(ctx.activeSport);
  const name = ctx.profile.firstName;
  const nba = getNextBestAction(ctx);
  const trend = computeProgressTrend(ctx);
  const lastFocus = ctx.latestDiagnosedSession?.primaryFocus ?? ctx.latestSession?.primaryFocus ?? null;

  // Minimal / first-time states get a short, encouraging restart message.
  if (status === 'first_time' || status === 'minimal_data') {
    return (
      `Your profile is set${name ? `, ${name}` : ''}, but SwingVantage needs one ${sp.inputNoun} to build a useful ` +
      `improvement plan. Start with a quick baseline so we can find your top priority.`
    );
  }

  const parts: string[] = [];

  if (status === 'stale') {
    parts.push(
      `It has been ${relativeDays(ctx.daysSinceLastActivity)} since your last ${sp.inputNoun}.`,
    );
  }

  if (lastFocus) {
    parts.push(`Last time, your focus was ${lowerFirst(lastFocus)} in ${sp.label.toLowerCase()}.`);
  } else if (ctx.profile.goal) {
    parts.push(`Your goal has been ${lowerFirst(ctx.profile.goal)}.`);
  }

  const pl = planLine(ctx.planStatus, sp.inputNoun);
  if (pl) parts.push(`${pl}.`);

  if (trend.direction === 'improving') {
    parts.push('Your scores have been trending up — nice work.');
  } else if (trend.direction === 'declining') {
    parts.push('Your last score dipped a little, which is normal.');
  }

  // The fastest next step.
  parts.push(`The fastest next step is to ${lowerFirst(nba.label)}.`);

  return parts.join(' ');
}

function lowerFirst(s: string): string {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

export function buildResumeState(
  ctx: AgentContext,
  trigger: AgentTrigger = 'returning_visit',
): ResumeState {
  const sp = getSportAgentProfile(ctx.activeSport);
  const status = resolveStatus(ctx);
  const confidence = resumeConfidence(ctx);
  const nextBestAction = getNextBestAction(ctx);
  const options = buildResumeOptions(ctx, nextBestAction);
  const trend = computeProgressTrend(ctx);

  const name = ctx.profile.firstName;
  const headline = name ? `Welcome back, ${name}.` : 'Welcome back.';

  const meta: AgentMetadata = {
    agentId: 'resume',
    workflowId: 'resume.v1',
    triggerSource: trigger,
    confidence: confidence.level,
    dataUsed: [
      'profile',
      `${ctx.sessionCount} ${ctx.activeSport} sessions`,
      'training plan status',
      'equipment completeness',
    ],
    createdAt: ctx.now,
    fallbackUsed: true, // deterministic, no LLM
    userVisible: true,
  };

  return {
    status,
    userFirstName: name,
    sport: ctx.activeSport,
    sportLabel: sp.label,
    lastGoal: ctx.profile.goal,
    lastSessionDate: ctx.latestSession
      ? safeDate(ctx.latestSession.date)
      : null,
    daysSinceLastActivity: ctx.daysSinceLastActivity,
    lastFocus: ctx.latestDiagnosedSession?.primaryFocus ?? ctx.latestSession?.primaryFocus ?? null,
    practicePlanStatus: ctx.planStatus,
    progressTrend: trend.direction,
    equipmentCompleteness: ctx.equipment.completeness,
    sessionCount: ctx.sessionCount,
    headline,
    summary: buildSummary(ctx, status),
    nextBestAction,
    options,
    confidence,
    meta,
  };
}

function safeDate(iso: string): string | null {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return format(new Date(t), 'MMM d, yyyy');
}
