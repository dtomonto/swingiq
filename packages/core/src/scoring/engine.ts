// ============================================================
// SwingIQ Scoring Engine
// Transparent 0–100 scores with clear improvement targets
// ============================================================

import type { SessionStats } from '../diagnostic/rules';
import type { SwingScores } from '../types';

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeToScore(value: number, ideal: number, maxDeviation: number): number {
  const deviation = Math.abs(value - ideal);
  return clamp(100 - (deviation / maxDeviation) * 100);
}

export function scoreFaceControl(avg_face_to_path?: number): number {
  if (avg_face_to_path === undefined) return 50;
  return clamp(normalizeToScore(avg_face_to_path, 0, 8));
}

export function scorePathControl(avg_club_path?: number, club_category?: string): number {
  if (avg_club_path === undefined) return 50;
  const ideal = club_category === 'driver' ? 1 : -1;
  return clamp(normalizeToScore(avg_club_path, ideal, 8));
}

export function scoreStrikeQuality(avg_smash_factor?: number, club_category?: string): number {
  if (avg_smash_factor === undefined) return 50;
  const idealSmash = club_category === 'driver' ? 1.50 : club_category === 'wedge' ? 1.26 : 1.37;
  return clamp(normalizeToScore(avg_smash_factor, idealSmash, 0.20));
}

export function scoreConsistency(carry_std_dev?: number, avg_carry?: number): number {
  if (carry_std_dev === undefined || avg_carry === undefined || avg_carry === 0) return 50;
  const cv = carry_std_dev / avg_carry;
  return clamp(100 - cv * 500);
}

export function scoreLaunchOptimization(
  avg_launch_angle?: number,
  avg_spin_rate?: number,
  club_category?: string,
): number {
  if (!avg_launch_angle && !avg_spin_rate) return 50;
  const launchScore = avg_launch_angle !== undefined
    ? club_category === 'driver'
      ? normalizeToScore(avg_launch_angle, 13, 5)
      : normalizeToScore(avg_launch_angle, 17, 6)
    : 50;
  const spinScore = avg_spin_rate !== undefined
    ? club_category === 'driver'
      ? normalizeToScore(avg_spin_rate, 2300, 1200)
      : normalizeToScore(avg_spin_rate, 7000, 2500)
    : 50;
  return clamp((launchScore + spinScore) / 2);
}

export function scoreDispersion(avg_lateral_offline?: number): number {
  if (avg_lateral_offline === undefined) return 50;
  const absOffset = Math.abs(avg_lateral_offline);
  return clamp(100 - absOffset * 3);
}

export function computeSwingScores(stats: SessionStats): SwingScores {
  const faceControl = scoreFaceControl(stats.avg_face_to_path);
  const pathControl = scorePathControl(stats.avg_club_path, stats.club_category);
  const strikeQuality = scoreStrikeQuality(stats.avg_smash_factor, stats.club_category);
  const consistency = scoreConsistency(stats.carry_std_dev, stats.avg_carry);
  const launchSpin = scoreLaunchOptimization(stats.avg_launch_angle, stats.avg_spin_rate, stats.club_category);
  const dispersion = scoreDispersion(stats.avg_lateral_offline);

  const overall = clamp(
    faceControl * 0.25 +
    pathControl * 0.15 +
    strikeQuality * 0.25 +
    consistency * 0.15 +
    launchSpin * 0.10 +
    dispersion * 0.10,
  );

  const isDriver = stats.club_category === 'driver';
  const isWedge = stats.club_category === 'wedge';

  return {
    overall: Math.round(overall),
    driver: isDriver ? Math.round(overall) : 50,
    iron: !isDriver && !isWedge ? Math.round(overall) : 50,
    wedge: isWedge ? Math.round(overall) : 50,
    short_game: 50,
    putting: 50,
    face_control: Math.round(faceControl),
    path_control: Math.round(pathControl),
    strike_quality: Math.round(strikeQuality),
    distance_control: Math.round(consistency),
    launch_spin_optimization: Math.round(launchSpin),
    dispersion: Math.round(dispersion),
    consistency: Math.round(consistency),
    video_mechanics: 50,
    practice_compliance: 50,
  };
}

export function getScoreLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Average';
  if (score >= 40) return 'Below Average';
  return 'Needs Work';
}

export function getScoreGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function getImprovementTarget(score: number): string {
  if (score >= 85) return 'Maintain this level. Focus on consistency under pressure.';
  if (score >= 70) return `Raise this score to 85+. ${15 - (score - 70)} points needed.`;
  if (score >= 55) return `Raise this score to 70+. Focus on the primary diagnostic issue.`;
  return 'This is the highest priority area. Address the primary diagnosis first.';
}
