// ============================================================
// SwingVantage — Agent: Churn-Risk Scoring — Unit Tests
// ============================================================

import type { SwingVantageState } from '@/store';
import type { DailyNote } from '@/lib/dailyNotes/types';
import { buildAgentContext } from '../../context-builder';
import { scoreChurnRisk, summarizeNoteSignals } from '../engine';

const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();

function makeState(o: Partial<SwingVantageState> = {}): SwingVantageState {
  return {
    profile: null,
    sportProfiles: {},
    clubs: [],
    sportEquipment: { tennis: [], baseball: [], softball_slow: [], softball_fast: [] },
    sessions: [],
    video_analyses: [],
    dailyNotes: [],
    training: {
      active_diagnosis_id: null,
      active_session_id: null,
      completed_steps: [],
      drills_completed: {},
      started_at: null,
      streak_days: 0,
      last_practice_date: null,
      milestones_earned: [],
    },
    settings: {
      units: 'yards',
      theme: 'light',
      show_estimated_warnings: true,
      coaching_style: 'balanced',
      default_club_for_diagnose: 'Driver',
      onboarding_complete: false,
      usage_category: null,
      usage_category_set_at: null,
    },
    community: {} as never,
    tutorialProgress: {} as never,
    agent: { dismissedKeys: [], welcomeBackDismissedHash: null },
    setup_step: 'profile',
    ...o,
  } as unknown as SwingVantageState;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeSession(o: Record<string, any> = {}): any {
  const created = o.created_at ?? new Date().toISOString();
  return {
    id: `s_${Math.random().toString(36).slice(2)}`,
    name: 'Session',
    date: created,
    sport: 'golf',
    club_name: 'Driver',
    club_category: 'driver',
    launch_monitor: 'manual',
    indoor_outdoor: 'outdoor',
    mat_or_grass: 'grass',
    notes: '',
    shot_count: 6,
    shots: [],
    diagnoses: [{ rule: { id: 'slice', name: 'Slice' }, confidence: 70, stats: {}, supporting_data: [] }],
    swing_score: 70,
    created_at: created,
    ...o,
  };
}

function makeNote(o: Partial<DailyNote> = {}): DailyNote {
  return {
    id: `n_${Math.random().toString(36).slice(2)}`,
    date: daysAgo(1).slice(0, 10),
    sport: 'golf',
    feel: 3,
    text: '',
    faults: [],
    context: '',
    created_at: daysAgo(1),
    ...o,
  } as DailyNote;
}

const profile = { name: 'Danny', skill_level: 'intermediate', primary_goal: 'more carry' } as never;

describe('scoreChurnRisk', () => {
  it('returns a safe activation read for a user with no sessions', () => {
    const ctx = buildAgentContext(makeState({ profile }), 'golf');
    const risk = scoreChurnRisk(ctx);
    expect(risk.score).toBe(0);
    expect(risk.band).toBe('safe');
    expect(risk.intervention.urgency).toBe(0);
    expect(risk.protectiveFactors.join(' ')).toMatch(/activation/i);
  });

  it('keeps an active, improving, frequent user safe', () => {
    const ctx = buildAgentContext(
      makeState({
        profile,
        sessions: [
          makeSession({ swing_score: 82, created_at: daysAgo(1) }),
          makeSession({ swing_score: 74, created_at: daysAgo(4) }),
          makeSession({ swing_score: 70, created_at: daysAgo(7) }),
          makeSession({ swing_score: 66, created_at: daysAgo(10) }),
        ],
      }),
      'golf',
    );
    const risk = scoreChurnRisk(ctx);
    expect(risk.band).toBe('safe');
    expect(risk.intervention.channelHint).toBe('none');
    expect(risk.protectiveFactors.length).toBeGreaterThan(0);
  });

  it('flags a long-absent single-session user as critical with drivers', () => {
    const ctx = buildAgentContext(
      makeState({ profile, sessions: [makeSession({ swing_score: 55, created_at: daysAgo(40) })] }),
      'golf',
    );
    const risk = scoreChurnRisk(ctx);
    expect(risk.score).toBeGreaterThanOrEqual(50);
    expect(['at_risk', 'critical']).toContain(risk.band);
    const ids = risk.drivers.map((d) => d.id);
    expect(ids).toContain('recency');
    expect(ids).toContain('shallow_engagement');
    expect(risk.intervention.urgency).toBeGreaterThanOrEqual(2);
    expect(risk.intervention.channelHint).toBe('email');
  });

  it('detects frequency decline against the user’s own cadence', () => {
    // Cadence ~every 3 days historically, but 12 days since last.
    const ctx = buildAgentContext(
      makeState({
        profile,
        sessions: [
          makeSession({ created_at: daysAgo(12) }),
          makeSession({ created_at: daysAgo(15) }),
          makeSession({ created_at: daysAgo(18) }),
          makeSession({ created_at: daysAgo(21) }),
        ],
      }),
      'golf',
      new Date(),
    );
    const risk = scoreChurnRisk(ctx);
    expect(risk.drivers.map((d) => d.id)).toContain('frequency_decline');
  });

  it('raises risk when recent self-reported sentiment is negative', () => {
    const state = makeState({
      profile,
      sessions: [
        makeSession({ swing_score: 70, created_at: daysAgo(2) }),
        makeSession({ swing_score: 70, created_at: daysAgo(6) }),
      ],
      dailyNotes: [makeNote({ feel: 1 }), makeNote({ feel: 2, created_at: daysAgo(3) })],
    });
    const ctx = buildAgentContext(state, 'golf');
    const signals = summarizeNoteSignals(state.dailyNotes, 'golf');
    const withSentiment = scoreChurnRisk(ctx, signals);
    const without = scoreChurnRisk(ctx);
    expect(withSentiment.score).toBeGreaterThan(without.score);
    expect(withSentiment.drivers.map((d) => d.id)).toContain('negative_sentiment');
  });

  it('summarizeNoteSignals extracts feels and counts frustration honestly', () => {
    const notes = [
      makeNote({ feel: 2, faults: [{ id: 'slice', label: 'Slice', confidence: 0.8, curated: true }] }),
      makeNote({ feel: 5, created_at: daysAgo(2) }),
      makeNote({ feel: 4, sport: 'tennis', created_at: daysAgo(2) }), // wrong sport, excluded
      makeNote({ feel: 3, created_at: daysAgo(60) }), // too old, excluded
    ];
    const signals = summarizeNoteSignals(notes, 'golf');
    expect(signals.recentFeels).toEqual([2, 5]);
    expect(signals.frustrationNotes).toBe(1);
  });
});
