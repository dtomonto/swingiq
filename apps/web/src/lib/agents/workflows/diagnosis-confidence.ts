// ============================================================
// SwingIQ — Workflow: Diagnosis Confidence + Evidence
// ------------------------------------------------------------
// Sits ON TOP of the deterministic diagnosis engine (which
// remains the source of truth). It does not invent findings —
// it rates confidence, lists supporting evidence, explains
// missing data, and tells the user what to focus on next (and
// what to ignore for now).
// ============================================================

import { getSportAgentProfile } from '../sport-profiles';
import { findRecurringPatterns } from './progress-memory';
import type { AgentConfidence, AgentContext, DiagnosisResult } from '../types';

export function buildDiagnosisConfidence(ctx: AgentContext): DiagnosisResult {
  const sp = getSportAgentProfile(ctx.activeSport);
  const diagnosed = ctx.latestDiagnosedSession;

  if (!diagnosed || !diagnosed.primaryFocus) {
    return {
      primaryIssue: null,
      confidence: { level: 'low', score: 0, reason: 'no analysis yet' },
      evidence: [],
      missingData: [
        ctx.activeSport === 'golf'
          ? 'Import a session and run the diagnostic engine.'
          : 'Upload a video so SwingIQ can analyze your swing.',
      ],
      recommendedNextStep:
        ctx.activeSport === 'golf'
          ? 'Import your first session to find your top priority.'
          : 'Upload your first video to find your top priority.',
      avoidForNow: [],
      plainEnglishSummary: 'SwingIQ has not found a priority yet — add some data to get started.',
      sportSpecificCue: sp.defaultCue,
    };
  }

  const engineConfidence = diagnosed.focusConfidence; // 0–100 from the engine, or null
  const recurring = findRecurringPatterns(ctx.sportSessions);
  const isRecurring = recurring.includes(diagnosed.primaryFocus);

  const confidence = rateConfidence(engineConfidence, ctx.sessionCount, isRecurring);

  const evidence: string[] = [];
  evidence.push(
    `Detected in your most recent ${sp.label.toLowerCase()} ${diagnosed.source === 'video' ? 'video' : 'session'}.`,
  );
  if (typeof engineConfidence === 'number') {
    evidence.push(`The analysis flagged this with ${Math.round(engineConfidence)}% confidence.`);
  }
  if (isRecurring) {
    const count = ctx.sportSessions.filter((s) => s.primaryFocus === diagnosed.primaryFocus).length;
    evidence.push(`This has shown up in ${count} of your sessions — a real pattern, not a one-off.`);
  }
  if (typeof diagnosed.score === 'number') {
    evidence.push(`Latest swing score: ${diagnosed.score}.`);
  }

  const missingData: string[] = [];
  if (ctx.sessionCount < 2) {
    missingData.push(`Only one ${sp.inputNoun} so far — add another to confirm this is a pattern.`);
  }
  if (!ctx.equipment.sufficientForFit) {
    missingData.push(`Your ${sp.equipmentNoun} details are incomplete, which limits fit-related guidance.`);
  }

  const avoidForNow = buildAvoidList(ctx, isRecurring);

  return {
    primaryIssue: diagnosed.primaryFocus,
    confidence,
    evidence,
    missingData,
    recommendedNextStep: isRecurring
      ? `Work this with a short practice plan, then re-test with the same setup.`
      : `Add one more ${sp.inputNoun} to confirm this before committing a lot of practice to it.`,
    avoidForNow,
    plainEnglishSummary: `Your top priority appears to be ${lowerFirst(diagnosed.primaryFocus)}. ${confidence.level === 'low' ? 'Confidence is still building — treat it as a lead, not a verdict.' : 'Focus here for the biggest gain.'}`,
    sportSpecificCue: sp.defaultCue,
  };
}

function rateConfidence(
  engine: number | null,
  sessionCount: number,
  isRecurring: boolean,
): AgentConfidence {
  let score = engine ?? 50;
  // Single session caps confidence; recurrence and volume raise it.
  if (sessionCount < 2) score = Math.min(score, 60);
  if (sessionCount >= 3) score = Math.min(score + 10, 95);
  if (isRecurring) score = Math.min(score + 10, 95);

  let level: AgentConfidence['level'] = 'low';
  if (score >= 70) level = 'high';
  else if (score >= 50) level = 'medium';

  const reason =
    sessionCount < 2
      ? 'we only have one session'
      : isRecurring
        ? 'it keeps showing up across sessions'
        : 'based on your recent sessions';

  return { level, score: Math.round(score), reason };
}

function buildAvoidList(ctx: AgentContext, isRecurring: boolean): string[] {
  const out: string[] = [];
  if (ctx.sessionCount < 2 || !isRecurring) {
    out.push('Do not overhaul your whole technique off one reading.');
  }
  out.push('Skip chasing secondary issues until your top priority improves.');
  return out;
}

function lowerFirst(s: string): string {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}
