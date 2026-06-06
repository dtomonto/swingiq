// ============================================================
// SwingVantage — Agent: Re-Engagement Dispatch — Unit Tests
// ============================================================

import type { SwingVantageState } from '@/store';
import { buildAgentContext } from '../../context-builder';
import { scoreChurnRisk } from '../../churn';
import { buildDispatch, executeDispatch } from '../engine';
import type { DispatchMessage, DispatchRecord } from '../types';

const DAY = 86_400_000;

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
      active_diagnosis_id: null, active_session_id: null, completed_steps: [],
      drills_completed: {}, started_at: null, streak_days: 0,
      last_practice_date: null, milestones_earned: [],
    },
    settings: {
      units: 'yards', theme: 'light', show_estimated_warnings: true,
      coaching_style: 'balanced', default_club_for_diagnose: 'Driver',
      onboarding_complete: false, usage_category: null, usage_category_set_at: null,
    },
    community: {} as never,
    tutorialProgress: {} as never,
    agent: { dismissedKeys: [], welcomeBackDismissedHash: null },
    setup_step: 'profile',
    ...o,
  } as unknown as SwingVantageState;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sessionBefore(now: Date, days: number, extra: Record<string, any> = {}): any {
  const created = new Date(now.getTime() - days * DAY).toISOString();
  return {
    id: `s_${Math.random().toString(36).slice(2)}`,
    name: 'Session', date: created, sport: 'golf', club_name: 'Driver',
    club_category: 'driver', launch_monitor: 'manual', indoor_outdoor: 'outdoor',
    mat_or_grass: 'grass', notes: '', shot_count: 6, shots: [],
    diagnoses: [{ rule: { id: 'slice', name: 'Slice' }, confidence: 70, stats: {}, supporting_data: [] }],
    swing_score: 60, created_at: created, ...extra,
  };
}

const profile = { name: 'Danny', skill_level: 'intermediate', primary_goal: 'more carry' } as never;

/** A lapsed, at-risk golfer context anchored at a controllable `now`. */
function atRiskCtx(now: Date) {
  const state = makeState({ profile, sessions: [sessionBefore(now, 40)] });
  return buildAgentContext(state, 'golf', now);
}

describe('buildDispatch — gating', () => {
  it('suppresses when the user is not at risk', () => {
    const now = new Date('2026-06-06T15:00:00');
    const state = makeState({
      profile,
      sessions: [sessionBefore(now, 1, { swing_score: 80 }), sessionBefore(now, 4, { swing_score: 70 })],
    });
    const ctx = buildAgentContext(state, 'golf', now);
    const decision = buildDispatch(ctx, scoreChurnRisk(ctx), { now });
    expect(decision.send).toBe(false);
    expect(decision.suppressedReason).toBe('not_at_risk');
  });

  it('suppresses entirely when re-engagement is disabled', () => {
    const now = new Date('2026-06-06T15:00:00');
    const ctx = atRiskCtx(now);
    const decision = buildDispatch(ctx, scoreChurnRisk(ctx), { now, policy: { enabled: false } });
    expect(decision.send).toBe(false);
    expect(decision.suppressedReason).toBe('opted_out');
  });
});

describe('buildDispatch — channel + consent', () => {
  it('uses email when consented and the risk warrants outbound', () => {
    const now = new Date('2026-06-06T15:00:00'); // outside quiet hours
    const ctx = atRiskCtx(now);
    const decision = buildDispatch(ctx, scoreChurnRisk(ctx), { now, policy: { allowEmail: true } });
    expect(decision.send).toBe(true);
    expect(decision.message?.channel).toBe('email');
    expect(decision.message?.subject).toContain('Danny');
    expect(decision.message?.cta.href).toBeTruthy();
    expect(decision.message?.groundedOn.length).toBeGreaterThan(0);
  });

  it('falls back to passive in_app when outbound is not consented', () => {
    const now = new Date('2026-06-06T15:00:00');
    const ctx = atRiskCtx(now);
    const decision = buildDispatch(ctx, scoreChurnRisk(ctx), { now }); // default: no consent
    expect(decision.send).toBe(true);
    expect(decision.message?.channel).toBe('in_app');
    expect(decision.message?.subject).toBe(''); // in_app uses title, not subject
  });
});

describe('buildDispatch — caps + quiet hours', () => {
  it('respects the minimum gap between outbound sends', () => {
    const now = new Date('2026-06-06T15:00:00');
    const ctx = atRiskCtx(now);
    const history: DispatchRecord[] = [{ channel: 'email', at: new Date(now.getTime() - 2 * DAY).toISOString() }];
    const decision = buildDispatch(ctx, scoreChurnRisk(ctx), { now, history, policy: { allowEmail: true } });
    expect(decision.send).toBe(false);
    expect(decision.suppressedReason).toBe('frequency_cap');
  });

  it('respects the weekly cap', () => {
    const now = new Date('2026-06-06T15:00:00');
    const ctx = atRiskCtx(now);
    const history: DispatchRecord[] = [
      { channel: 'email', at: new Date(now.getTime() - 4 * DAY).toISOString() },
      { channel: 'email', at: new Date(now.getTime() - 5 * DAY).toISOString() },
    ];
    const decision = buildDispatch(ctx, scoreChurnRisk(ctx), { now, history, policy: { allowEmail: true, maxPerWeek: 2 } });
    expect(decision.send).toBe(false);
    expect(decision.suppressedReason).toBe('weekly_cap');
  });

  it('schedules outbound past quiet hours', () => {
    const now = new Date('2026-06-06T23:00:00'); // inside default quiet window (21–8)
    const ctx = atRiskCtx(now);
    const decision = buildDispatch(ctx, scoreChurnRisk(ctx), { now, policy: { allowEmail: true } });
    expect(decision.send).toBe(true);
    const sendAt = new Date(decision.sendAt!);
    expect(sendAt.getHours()).toBe(8); // pushed to the morning window
    expect(sendAt.getTime()).toBeGreaterThan(now.getTime());
  });
});

describe('executeDispatch', () => {
  it('delivers through the matching adapter and reports it', async () => {
    const now = new Date('2026-06-06T15:00:00');
    const ctx = atRiskCtx(now);
    const decision = buildDispatch(ctx, scoreChurnRisk(ctx), { now }); // in_app
    const seen: DispatchMessage[] = [];
    const res = await executeDispatch(decision, { showInApp: (m) => { seen.push(m); } });
    expect(res.delivered).toBe(true);
    expect(res.channel).toBe('in_app');
    expect(seen).toHaveLength(1);
  });

  it('is a safe no-op for a suppressed decision', async () => {
    const now = new Date('2026-06-06T15:00:00');
    const state = makeState({ profile, sessions: [sessionBefore(now, 1, { swing_score: 80 }), sessionBefore(now, 4, { swing_score: 70 })] });
    const ctx = buildAgentContext(state, 'golf', now);
    const decision = buildDispatch(ctx, scoreChurnRisk(ctx), { now });
    const res = await executeDispatch(decision, { showInApp: () => { throw new Error('should not be called'); } });
    expect(res.delivered).toBe(false);
  });
});
