// Shared test factory — builds a minimal JourneySignals with overrides.
import type {
  ActivitySignals,
  JourneyProfileSignals,
  JourneySignals,
  PerformanceMetric,
  PlayerRating,
  SelfAssessment,
  SportId,
} from '../types';

export const emptyActivity = (): ActivitySignals => ({
  videoUploads: 0,
  videoUploadsByBranch: {},
  practiceSessions: 0,
  drillsCompleted: 0,
  loggedCompetitions: 0,
  dailyNotes: 0,
  retests: 0,
  recommendationsCompleted: 0,
  currentStreakDays: 0,
  lastActiveAt: null,
  recentTrend: null,
});

export const emptyProfile = (): JourneyProfileSignals => ({
  experienceYears: null,
  practiceFrequency: null,
  playFrequency: null,
  competitionLevel: null,
  selfRatedSkill: null,
  goals: [],
  injuries: null,
  typicalScore: null,
});

export function makeSignals(
  sport: SportId,
  overrides: Partial<{
    profile: Partial<JourneyProfileSignals>;
    rating: PlayerRating | null;
    ratings: PlayerRating[];
    metrics: PerformanceMetric[];
    selfAssessments: SelfAssessment[];
    activity: Partial<ActivitySignals>;
  }> = {},
): JourneySignals {
  const rating = overrides.rating ?? null;
  return {
    sport,
    profile: { ...emptyProfile(), ...(overrides.profile ?? {}) },
    rating,
    ratings: overrides.ratings ?? (rating ? [rating] : []),
    metrics: overrides.metrics ?? [],
    selfAssessments: overrides.selfAssessments ?? [],
    activity: { ...emptyActivity(), ...(overrides.activity ?? {}) },
    generatedAt: new Date('2026-06-06T12:00:00Z').toISOString(),
  };
}

export const recentIso = (daysAgo = 1): string =>
  new Date(Date.now() - daysAgo * 86_400_000).toISOString();

export function metric(
  partial: Partial<PerformanceMetric> & Pick<PerformanceMetric, 'metricName' | 'category' | 'value'>,
): PerformanceMetric {
  return {
    label: partial.label ?? partial.metricName,
    unit: partial.unit ?? '',
    basis: partial.basis ?? 'analyzed',
    confidence: partial.confidence ?? 0.7,
    dateRecorded: partial.dateRecorded ?? new Date().toISOString(),
    score: partial.score,
    ...partial,
  };
}
