// ============================================================
// SwingVantage — Athletic Journey: store → signals adapter
// ------------------------------------------------------------
// Reads the MAIN app store (read-only) plus the journey-local store
// and normalizes everything into a JourneySignals bundle the engine
// can classify. Pure function (now injectable) so it's unit-testable.
// Honest by construction: we only emit signals we actually have, and
// label self-reported vs analyzed data correctly.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { GolferProfileInput } from '@swingiq/core';
import type {
  LocalSession,
  LocalVideoAnalysis,
  SportProfiles,
  TrainingProgress,
} from '@/store';
import type { DailyNote } from '@/lib/dailyNotes/types';
import type {
  ActivitySignals,
  CompetitionBand,
  FrequencyBand,
  JourneyProfileExtra,
  JourneyProfileSignals,
  JourneySignals,
  PerformanceMetric,
  PlayerRating,
  SelfAssessment,
  SkillBand,
} from '../types';
import { clamp } from '../util';

export interface StoreInputs {
  sport: SportId;
  golfProfile: GolferProfileInput | null;
  sportProfiles: SportProfiles;
  sessions: LocalSession[];
  videos: LocalVideoAnalysis[];
  dailyNotes: DailyNote[];
  training: TrainingProgress;
  ratings: PlayerRating[];
  selfAssessments: SelfAssessment[];
  profileExtra: JourneyProfileExtra;
  now?: number;
}

// ── small helpers ─────────────────────────────────────────────

function freqBand(raw: unknown): FrequencyBand | null {
  if (typeof raw !== 'string') return null;
  const s = raw.toLowerCase();
  if (s.includes('daily') || s.includes('every day')) return 'daily';
  if (s.includes('4-6') || s.includes('4–6') || s.includes('5') || s.includes('most days')) return 'high';
  if (s.includes('2-3') || s.includes('2–3') || s.includes('few')) return 'moderate';
  if (s.includes('week')) return 'weekly';
  if (s.includes('occasional') || s.includes('rare') || s.includes('month')) return 'occasional';
  return null;
}

const SKILL_VALUES: SkillBand[] = ['beginner', 'intermediate', 'advanced', 'elite'];
function skillBand(raw: unknown): SkillBand | null {
  return typeof raw === 'string' && (SKILL_VALUES as string[]).includes(raw) ? (raw as SkillBand) : null;
}

function tennisCompetition(level: unknown): CompetitionBand | null {
  switch (level) {
    case 'recreational': return 'recreational';
    case 'club': return 'club';
    case 'competitive': return 'league';
    case 'tournament': return 'tournament';
    case 'professional': return 'professional';
    default: return null;
  }
}

function str(obj: Record<string, unknown> | undefined, key: string): unknown {
  return obj ? obj[key] : undefined;
}

function golfScoringQuality(avg: number): number {
  // 120 → ~10, 90 → ~60, 72 → ~96. Lower score = higher quality.
  return clamp(((120 - avg) / (120 - 70)) * 100, 0, 100);
}

function pickPrimaryRating(sport: SportId, ratings: PlayerRating[]): PlayerRating | null {
  const forSport = ratings.filter((r) => r.sport === sport);
  if (!forSport.length) return null;
  if (sport === 'tennis') {
    return forSport.find((r) => r.ratingType === 'utr') ?? forSport.find((r) => r.ratingType === 'ntrp') ?? forSport[0];
  }
  return forSport.find((r) => r.ratingType === 'golf_handicap') ?? forSport[0];
}

// ── profile ───────────────────────────────────────────────────

function buildProfile(input: StoreInputs): JourneyProfileSignals {
  const { sport, golfProfile, sportProfiles, profileExtra } = input;

  if (sport === 'golf') {
    return {
      experienceYears: null,
      practiceFrequency: freqBand(golfProfile?.practice_frequency),
      playFrequency: null,
      competitionLevel: null,
      selfRatedSkill: skillBand(golfProfile?.skill_level),
      goals: golfProfile?.primary_goal ? [golfProfile.primary_goal] : [],
      injuries: golfProfile?.injury_notes?.trim() ? golfProfile.injury_notes : null,
      typicalScore: profileExtra.typicalScore ?? golfProfile?.scoring_average ?? null,
    };
  }

  const p = (sportProfiles as Record<string, Record<string, unknown> | undefined>)[sport];
  const injury = str(p, 'injury_notes');
  const goal = str(p, 'primary_goal');
  return {
    experienceYears: null,
    practiceFrequency: freqBand(str(p, 'practice_frequency')),
    playFrequency: freqBand(str(p, 'match_frequency')),
    competitionLevel: tennisCompetition(str(p, 'playing_level')),
    selfRatedSkill: skillBand(str(p, 'skill_level')),
    goals: typeof goal === 'string' && goal ? [goal] : [],
    injuries: typeof injury === 'string' && injury.trim() ? injury : null,
    typicalScore: null,
  };
}

// ── metrics ───────────────────────────────────────────────────

function buildMetrics(input: StoreInputs, sessions: LocalSession[], videos: LocalVideoAnalysis[]): PerformanceMetric[] {
  const { sport, golfProfile, profileExtra } = input;
  const metrics: PerformanceMetric[] = [];
  const nowIso = new Date(input.now ?? Date.now()).toISOString();

  // Technique from saved video analyses (analyzed basis).
  const vidScores = videos.map((v) => v.overall_score).filter((s): s is number => typeof s === 'number');
  if (vidScores.length) {
    const avg = vidScores.reduce((a, b) => a + b, 0) / vidScores.length;
    metrics.push({
      metricName: 'video_overall', label: 'Video analysis score', value: Math.round(avg), unit: '/100',
      category: 'technique', basis: 'analyzed', confidence: 0.65, dateRecorded: nowIso, score: clamp(avg, 0, 100),
    });
  }

  // Technique from launch-monitor / session swing scores (analyzed basis).
  const swingScores = sessions.map((s) => s.swing_score).filter((s): s is number => typeof s === 'number');
  if (swingScores.length) {
    const avg = swingScores.reduce((a, b) => a + b, 0) / swingScores.length;
    metrics.push({
      metricName: 'swing_quality', label: 'Swing quality', value: Math.round(avg), unit: '/100',
      category: 'technique', basis: 'analyzed', confidence: 0.6, dateRecorded: nowIso, score: clamp(avg, 0, 100),
    });
  }

  // Golf scoring from self-reported averages.
  if (sport === 'golf') {
    const avgScore = profileExtra.typicalScore ?? golfProfile?.scoring_average ?? null;
    if (typeof avgScore === 'number') {
      metrics.push({
        metricName: 'average_score', label: 'Average score', value: avgScore, unit: 'strokes',
        category: 'scoring', basis: 'self_reported', confidence: 0.5, dateRecorded: nowIso,
        score: golfScoringQuality(avgScore),
      });
    }
    if (typeof golfProfile?.low_round === 'number') {
      // Evidence only (no score) — one round shouldn't move the category.
      metrics.push({
        metricName: 'best_score', label: 'Best score', value: golfProfile.low_round, unit: 'strokes',
        category: 'scoring', basis: 'self_reported', confidence: 0.4, dateRecorded: nowIso,
      });
    }
  }

  return metrics;
}

// ── activity ──────────────────────────────────────────────────

function buildActivity(input: StoreInputs, sessions: LocalSession[], videos: LocalVideoAnalysis[], notes: DailyNote[]): ActivitySignals {
  const { training, profileExtra } = input;

  const drillsCompleted = Object.values(training.drills_completed ?? {}).reduce(
    (sum, d) => sum + (d?.count ?? 0), 0,
  );

  // Time series of "quality" points for a recent-trend read.
  const points: Array<{ t: number; q: number }> = [];
  for (const s of sessions) {
    if (typeof s.swing_score === 'number') points.push({ t: Date.parse(s.date || s.created_at), q: s.swing_score });
  }
  for (const n of notes) {
    points.push({ t: Date.parse(n.created_at || n.date), q: n.feel * 20 });
  }
  points.sort((a, b) => a.t - b.t);
  let recentTrend: number | null = null;
  if (points.length >= 4) {
    const third = Math.max(1, Math.floor(points.length / 3));
    const first = points.slice(0, third);
    const last = points.slice(-third);
    const mean = (xs: typeof points) => xs.reduce((a, b) => a + b.q, 0) / xs.length;
    recentTrend = clamp((mean(last) - mean(first)) / 30, -1, 1);
  }

  const dates: number[] = [
    ...sessions.map((s) => Date.parse(s.created_at || s.date)),
    ...videos.map((v) => Date.parse(v.created_at)),
    ...notes.map((n) => Date.parse(n.created_at || n.date)),
    training.last_practice_date ? Date.parse(training.last_practice_date) : NaN,
  ].filter((t) => !Number.isNaN(t));
  const lastActiveAt = dates.length ? new Date(Math.max(...dates)).toISOString() : null;

  return {
    videoUploads: videos.length,
    videoUploadsByBranch: {},
    practiceSessions: sessions.length,
    drillsCompleted,
    loggedCompetitions: profileExtra.loggedCompetitions ?? 0,
    dailyNotes: notes.length,
    retests: 0,
    recommendationsCompleted: 0,
    currentStreakDays: training.streak_days ?? 0,
    lastActiveAt,
    recentTrend,
  };
}

/** Assemble a normalized JourneySignals bundle from store state. */
export function buildSignalsFromStore(input: StoreInputs): JourneySignals {
  const { sport } = input;
  const sessions = input.sessions.filter((s) => s.sport === sport);
  const videos = input.videos.filter((v) => v.sport === sport);
  const notes = input.dailyNotes.filter((n) => n.sport === sport);

  return {
    sport,
    profile: buildProfile(input),
    rating: pickPrimaryRating(sport, input.ratings),
    ratings: input.ratings.filter((r) => r.sport === sport),
    metrics: buildMetrics(input, sessions, videos),
    selfAssessments: input.selfAssessments,
    activity: buildActivity(input, sessions, videos, notes),
    generatedAt: new Date(input.now ?? Date.now()).toISOString(),
  };
}
