// ============================================================
// SwingVantage — Readiness Engine v1
// ------------------------------------------------------------
// Deterministic, transparent guidance scores. A safety flag always
// beats the number. Nothing here is a fitness, medical, or official
// performance rating — and the engine says so.
// ============================================================

import type {
  PerformanceSignals,
  ScoreBand,
  ScoreFactor,
  TransparentScore,
} from './types';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function bandFor(score: number): ScoreBand {
  if (score >= 80) return 'sharp';
  if (score >= 60) return 'solid';
  if (score >= 40) return 'developing';
  return 'building';
}

const READINESS_HEADLINES: Record<ScoreBand, string> = {
  building: 'Ease in — rebuild a base before pushing hard.',
  developing: "You're warming up — a focused session moves the needle.",
  solid: 'Good footing — make today’s reps count.',
  sharp: 'Dialed in — go get some focused practice.',
};

const GAME_READY_HEADLINES: Record<ScoreBand, string> = {
  building: 'Still building — not match-sharp yet, and that’s fine.',
  developing: 'Coming together — a few more honest reps.',
  solid: 'Holding up well under your own setup.',
  sharp: 'Looking match-ready by your own data — keep it loose.',
};

const READINESS_BASIS =
  'Guidance from your recent activity, plan and trend — not a fitness or medical assessment.';
const GAME_READY_BASIS =
  'Guidance from your practice, retests and recurring issues — directional, not an official performance rating.';

function build(
  base: number,
  factors: ScoreFactor[],
  headlines: Record<ScoreBand, string>,
  basis: string,
  caution: string | null,
): TransparentScore {
  const raw = base + factors.reduce((sum, f) => sum + f.contribution, 0);
  const score = clamp(raw);
  // A safety caution caps the band so the number never reads "sharp" over pain.
  const band = caution ? (score < 40 ? 'building' : 'developing') : bandFor(score);
  return {
    score: caution ? Math.min(score, 49) : score,
    band,
    headline: headlines[band],
    factors,
    caution,
    basis,
  };
}

// ── Readiness: are you set up to train well right now? ─────────

export function computeReadiness(s: PerformanceSignals): TransparentScore {
  const factors: ScoreFactor[] = [];
  const add = (label: string, contribution: number) => {
    if (contribution !== 0) factors.push({ label, contribution });
  };

  // Recent practice
  if (s.daysSinceLastActivity === null || s.daysSinceLastActivity > 7) {
    add("It's been a while since you trained", -8);
  } else if (s.daysSinceLastActivity <= 2) {
    add('You practised recently', 12);
  } else {
    add('Practised this week', 4);
  }

  if (s.practiceStreakDays >= 3) add(`On a ${s.practiceStreakDays}-day streak`, 10);
  else if (s.practiceStreakDays >= 1) add('Practice streak started', 4);

  if (s.hasActivePlan && !s.planCompleted) add('Active plan in progress', 8);
  else if (s.planCompleted) add('Plan completed — ready for the next focus', 6);

  if (s.trendDirection === 'improving') add('Your trend is up', 8);
  else if (s.trendDirection === 'declining') add('Recent trend dipped', -6);

  if (s.analysisConfidence === 'high') add('Recent analysis was high-confidence', 8);
  else if (s.analysisConfidence === 'medium') add('Recent analysis was medium-confidence', 3);

  if (s.recurringFaultCount >= 3) add('Several issues stacking up', -4);

  const caution = s.painFlag
    ? 'You flagged discomfort recently — keep it light and consider a qualified professional before pushing.'
    : null;
  if (s.painFlag) add('Discomfort flagged — easing the score', -25);

  return build(50, factors, READINESS_HEADLINES, READINESS_BASIS, caution);
}

// ── Game-Ready: how match-ready does the swing look? ───────────

export function computeGameReady(s: PerformanceSignals): TransparentScore {
  const factors: ScoreFactor[] = [];
  const add = (label: string, contribution: number) => {
    if (contribution !== 0) factors.push({ label, contribution });
  };

  if (s.practiceStreakDays >= 3) add('Consistent recent practice', 10);
  if (s.sessionsLogged >= 5) add('A solid history to draw on', 6);
  else if (s.sessionsLogged >= 2) add('Building a history', 3);

  if (s.latestRetestOutcome === 'improved') add('A retest showed progress', 14);
  else if (s.latestRetestOutcome === 'persisting') add('Top issue is still persisting', -4);
  else if (s.latestRetestOutcome === 'regressed') add('A retest slipped back', -10);

  if (s.recurringFaultCount === 0) add('No recurring issues flagged', 12);
  else if (s.recurringFaultCount === 1) add('Just one recurring issue', 4);
  else if (s.recurringFaultCount >= 3) add('Multiple recurring issues', -8);

  if (s.trendDirection === 'improving') add('Improving consistency', 10);
  else if (s.trendDirection === 'stable') add('Steady consistency', 4);
  else if (s.trendDirection === 'declining') add('Consistency dipped', -8);

  if (s.analysisConfidence === 'high') add('High-confidence reads', 8);
  else if (s.analysisConfidence === 'medium') add('Medium-confidence reads', 3);

  const caution = s.painFlag
    ? 'You flagged discomfort recently — readiness for competition should account for that first.'
    : null;
  if (s.painFlag) add('Discomfort flagged — easing the score', -20);

  return build(45, factors, GAME_READY_HEADLINES, GAME_READY_BASIS, caution);
}
