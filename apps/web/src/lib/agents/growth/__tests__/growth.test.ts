// ============================================================
// SwingVantage — Agent: Growth Coordinator — Unit Tests
// ============================================================

import type { SwingVantageState } from '@/store';
import { buildAgentContext } from '../../context-builder';
import { runGrowthAgents } from '../orchestrator';

const DAY = 86_400_000;

function makeState(o: Partial<SwingVantageState> = {}): SwingVantageState {
  return {
    profile: null, sportProfiles: {}, clubs: [],
    sportEquipment: { tennis: [], baseball: [], softball_slow: [], softball_fast: [] },
    sessions: [], video_analyses: [], dailyNotes: [],
    training: {
      active_diagnosis_id: null, active_session_id: null, completed_steps: [],
      drills_completed: {}, started_at: null, streak_days: 0,
      last_practice_date: null, milestones_earned: [],
    },
    settings: {
      units: 'yards', theme: 'light', show_estimated_warnings: true,
      coaching_style: 'balanced', default_club_for_diagnose: 'Driver',
      onboarding_complete: false, usage_category: null, usage_category_set_at: null,
    },
    community: {} as never, tutorialProgress: {} as never,
    agent: { dismissedKeys: [], welcomeBackDismissedHash: null },
    setup_step: 'profile', ...o,
  } as unknown as SwingVantageState;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeSession(o: Record<string, any> = {}): any {
  const created = o.created_at ?? new Date().toISOString();
  return {
    id: `s_${Math.random().toString(36).slice(2)}`, name: 'S', date: created, sport: 'golf',
    club_name: 'Driver', club_category: 'driver', launch_monitor: 'manual',
    indoor_outdoor: 'outdoor', mat_or_grass: 'grass', notes: '', shot_count: 6, shots: [],
    diagnoses: [], swing_score: 70, created_at: created,
  ...o };
}

const slice = { rule: { id: 'slice', name: 'Slice' }, confidence: 70, stats: {}, supporting_data: [] };
const profile = { name: 'Danny', skill_level: 'intermediate', primary_goal: 'carry' } as never;
const daysAgo = (now: Date, n: number) => new Date(now.getTime() - n * DAY).toISOString();

/** An "activated" golfer: diagnosed session + a follow-up after the plan began. */
function activatedSessions(now: Date, s1: number, s2: number, s1Days: number, s2Days: number) {
  return {
    profile,
    sessions: [
      makeSession({ diagnoses: [slice], swing_score: s1, created_at: daysAgo(now, s1Days) }),
      makeSession({ swing_score: s2, created_at: daysAgo(now, s2Days) }),
    ],
    training: {
      active_diagnosis_id: 'slice', active_session_id: 'x', completed_steps: [0],
      drills_completed: {}, started_at: daysAgo(now, (s1Days + s2Days) / 2),
      streak_days: 0, last_practice_date: daysAgo(now, s2Days), milestones_earned: [],
    },
  } as Partial<SwingVantageState>;
}

describe('runGrowthAgents — surface priority', () => {
  it('always returns every sub-result', () => {
    const ctx = buildAgentContext(makeState({ profile }), 'golf');
    const r = runGrowthAgents(ctx);
    expect(r.churn).toBeTruthy();
    expect(r.activation).toBeTruthy();
    expect(r.dispatch).toBeTruthy();
    expect(r.referral).toBeTruthy();
  });

  it('1) prioritizes activation for a not-yet-activated user', () => {
    const ctx = buildAgentContext(makeState({ profile }), 'golf'); // profiled, no uploads
    const r = runGrowthAgents(ctx);
    expect(r.primary.kind).toBe('activation');
    expect(r.primary.action?.href).toBeTruthy();
  });

  it('2) prioritizes re-engagement for an activated, at-risk user', () => {
    const now = new Date('2026-06-06T15:00:00');
    // Activated but lapsed 40 days with declining scores → at_risk.
    const ctx = buildAgentContext(makeState(activatedSessions(now, 70, 55, 42, 40)), 'golf', now);
    const r = runGrowthAgents(ctx, { now });
    expect(r.activation.status).toBe('activated');
    expect(['at_risk', 'critical']).toContain(r.churn.band);
    expect(r.primary.kind).toBe('reengage');
  });

  it('3) prioritizes a referral when a real win just happened', () => {
    const now = new Date('2026-06-06T15:00:00');
    // Activated, active, and a new personal best (85 > 70).
    const ctx = buildAgentContext(makeState(activatedSessions(now, 70, 85, 5, 1)), 'golf', now);
    const r = runGrowthAgents(ctx, { now, referral: { code: 'SV-ABC123' } });
    expect(r.activation.status).toBe('activated');
    expect(r.churn.band).toBe('safe');
    expect(r.primary.kind).toBe('referral');
    expect(r.primary.action?.href).toContain('ref=SV-ABC123');
  });

  it('4) stays quiet when there is nothing worth surfacing', () => {
    const now = new Date('2026-06-06T15:00:00');
    // Activated, active, flat scores — no win, no risk.
    const ctx = buildAgentContext(makeState(activatedSessions(now, 70, 70, 5, 1)), 'golf', now);
    const r = runGrowthAgents(ctx, { now, referral: { code: 'SV-ABC123' } });
    expect(r.primary.kind).toBe('none');
    expect(r.primary.action).toBeNull();
  });
});
