// ============================================================
// SwingVantage — Athletic Journey: Journey Momentum Score
// ------------------------------------------------------------
// Momentum (0–100) measures development ACTIVITY and improvement
// velocity — NOT absolute skill. A beginner can have elite momentum;
// an advanced player can have poor momentum. Pure function of the
// activity signals so it's stable and testable.
// ============================================================

import type { ActivitySignals, MomentumBand, MomentumResult } from './types';
import { JOURNEY_THRESHOLDS as T } from './config/thresholds';
import { clamp, saturate, weightedMean } from './util';

function recencyScore(lastActiveAt: string | null): number {
  if (!lastActiveAt) return 0;
  const t = Date.parse(lastActiveAt);
  if (Number.isNaN(t)) return 0;
  const days = Math.max(0, (Date.now() - t) / 86_400_000);
  const window = T.momentum.recencyWindowDays;
  return clamp((1 - days / window) * 100, 0, 100);
}

function bandFor(score: number): MomentumBand {
  const b = T.momentum.bands;
  if (score <= b.inactive) return 'inactive';
  if (score <= b.low) return 'low';
  if (score <= b.building) return 'building';
  if (score <= b.strong) return 'strong';
  return 'accelerated';
}

const BAND_NOTE: Record<MomentumBand, string> = {
  inactive: 'Your development has stalled. A single short session this week restarts it.',
  low: 'Momentum is low. Two focused sessions and one upload would move it quickly.',
  building: 'You\'re building momentum. Keep the cadence and log your next session.',
  strong: 'Strong momentum — your habits are compounding. Stay consistent.',
  accelerated: 'Accelerated development — you\'re practicing, uploading, and improving in rhythm.',
};

/** Compute the Journey Momentum Score from activity signals. */
export function calculateJourneyMomentum(activity: ActivitySignals): MomentumResult {
  const s = T.momentum.saturation;
  const drivers = [
    { label: 'Recent activity', score: recencyScore(activity.lastActiveAt), w: T.momentum.weights.recency },
    { label: 'Practice volume', score: saturate(activity.practiceSessions, s.practiceSessions), w: T.momentum.weights.practiceVolume },
    { label: 'Video uploads', score: saturate(activity.videoUploads, s.uploads), w: T.momentum.weights.uploads },
    { label: 'Drills completed', score: saturate(activity.drillsCompleted, s.drills), w: T.momentum.weights.drills },
    { label: 'Logged play', score: saturate(activity.loggedCompetitions, s.competitions), w: T.momentum.weights.competitions },
    { label: 'Practice streak', score: saturate(activity.currentStreakDays, s.streakDays), w: T.momentum.weights.streak },
    { label: 'Improvement trend', score: activity.recentTrend === null ? 50 : clamp((activity.recentTrend + 1) * 50, 0, 100), w: T.momentum.weights.trend },
    { label: 'Recommendations done', score: saturate(activity.recommendationsCompleted, s.recommendations), w: T.momentum.weights.recommendations },
  ];

  const score = Math.round(
    clamp(weightedMean(drivers.map((d) => [d.score, d.w])), 0, 100),
  );
  const band = bandFor(score);

  return {
    score,
    band,
    drivers: drivers
      .map((d) => ({ label: d.label, score: Math.round(d.score) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4),
    note: BAND_NOTE[band],
  };
}

/** True when a previously-active athlete has gone quiet (regression risk). */
export function isRegressionRisk(activity: ActivitySignals): boolean {
  const hadHistory = activity.practiceSessions + activity.videoUploads + activity.loggedCompetitions > 0;
  if (!hadHistory || !activity.lastActiveAt) return false;
  const t = Date.parse(activity.lastActiveAt);
  if (Number.isNaN(t)) return false;
  const days = (Date.now() - t) / 86_400_000;
  return days >= T.regression.inactiveDays;
}
