import type { GolferProfileInput } from '@swingiq/core';
import type { LocalSession, LocalVideoAnalysis, SportProfiles, TrainingProgress } from '@/store';
import { buildSignalsFromStore, type StoreInputs } from '../adapters/from-store';

const emptyTraining = (): TrainingProgress => ({
  active_diagnosis_id: null,
  active_session_id: null,
  completed_steps: [],
  drills_completed: { d1: { count: 4, last_done: '2026-06-01' } },
  started_at: null,
  streak_days: 3,
  last_practice_date: '2026-06-05',
  milestones_earned: [],
});

const base = (sport: StoreInputs['sport'], over: Partial<StoreInputs> = {}): StoreInputs => ({
  sport,
  golfProfile: null,
  sportProfiles: {} as SportProfiles,
  sessions: [],
  videos: [],
  dailyNotes: [],
  training: emptyTraining(),
  ratings: [],
  selfAssessments: [],
  profileExtra: {},
  now: Date.parse('2026-06-06T12:00:00Z'),
  ...over,
});

describe('buildSignalsFromStore — golf', () => {
  const golfProfile = {
    scoring_average: 92,
    low_round: 84,
    skill_level: 'intermediate',
    practice_frequency: 'weekly',
    injury_notes: 'sore wrist',
    primary_goal: 'break 90',
  } as unknown as GolferProfileInput;

  it('maps golf profile fields and self-reported scoring', () => {
    const sig = buildSignalsFromStore(base('golf', { golfProfile }));
    expect(sig.profile.selfRatedSkill).toBe('intermediate');
    expect(sig.profile.injuries).toBe('sore wrist');
    expect(sig.profile.typicalScore).toBe(92);
    const avg = sig.metrics.find((m) => m.metricName === 'average_score');
    expect(avg?.value).toBe(92);
    expect(avg?.basis).toBe('self_reported');
    expect(sig.metrics.find((m) => m.metricName === 'best_score')?.value).toBe(84);
  });

  it('filters sessions/videos to the active sport only', () => {
    const sessions = [
      { sport: 'golf', swing_score: 70, date: '2026-06-04', created_at: '2026-06-04' },
      { sport: 'tennis', swing_score: 90, date: '2026-06-04', created_at: '2026-06-04' },
    ] as unknown as LocalSession[];
    const videos = [
      { sport: 'golf', overall_score: 65, created_at: '2026-06-05' },
      { sport: 'tennis', overall_score: 80, created_at: '2026-06-05' },
    ] as unknown as LocalVideoAnalysis[];
    const sig = buildSignalsFromStore(base('golf', { golfProfile, sessions, videos }));
    expect(sig.activity.practiceSessions).toBe(1);
    expect(sig.activity.videoUploads).toBe(1);
    const swing = sig.metrics.find((m) => m.metricName === 'swing_quality');
    expect(swing?.value).toBe(70); // tennis session excluded
    expect(sig.activity.drillsCompleted).toBe(4);
    expect(sig.activity.currentStreakDays).toBe(3);
  });
});

describe('buildSignalsFromStore — tennis', () => {
  it('reads the tennis sport profile (level → competition band)', () => {
    const sportProfiles = {
      tennis: { playing_level: 'club', skill_level: 'advanced', practice_frequency: '2-3x/week', match_frequency: 'weekly' },
    } as unknown as SportProfiles;
    const sig = buildSignalsFromStore(base('tennis', { sportProfiles }));
    expect(sig.profile.competitionLevel).toBe('club');
    expect(sig.profile.selfRatedSkill).toBe('advanced');
    expect(sig.profile.practiceFrequency).toBe('moderate');
  });

  it('still returns a valid bundle when nothing is on file', () => {
    const sig = buildSignalsFromStore(base('tennis'));
    expect(sig.sport).toBe('tennis');
    expect(sig.metrics).toEqual([]);
    expect(sig.rating).toBeNull();
  });

  it('selects UTR over NTRP as the primary rating', () => {
    const ratings = [
      { sport: 'tennis', ratingType: 'ntrp', value: 4.0, source: 'self_reported', dateRecorded: '' },
      { sport: 'tennis', ratingType: 'utr', value: 6.5, source: 'imported', dateRecorded: '' },
    ] as const;
    const sig = buildSignalsFromStore(base('tennis', { ratings: [...ratings] }));
    expect(sig.rating?.ratingType).toBe('utr');
    expect(sig.ratings).toHaveLength(2);
  });
});
