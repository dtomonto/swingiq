// ============================================================
// SwingVantage — Growth ↔ Re-engagement Bridge — Unit Tests
// ============================================================

import type { SwingVantageState } from '@/store';
import { DEFAULT_STATE } from '@/lib/reengage/store';
import { buildAgentContext } from '../../context-builder';
import { selectChurnAwareNudge, toActivitySignal } from '../reengage-bridge';

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
function sessionBefore(now: Date, days: number, extra: Record<string, any> = {}): any {
  const created = new Date(now.getTime() - days * DAY).toISOString();
  return {
    id: `s_${Math.random().toString(36).slice(2)}`, name: 'S', date: created, sport: 'golf',
    club_name: 'Driver', club_category: 'driver', launch_monitor: 'manual',
    indoor_outdoor: 'outdoor', mat_or_grass: 'grass', notes: '', shot_count: 6, shots: [],
    diagnoses: [{ rule: { id: 'slice', name: 'Slice' }, confidence: 70, stats: {}, supporting_data: [] }],
    swing_score: 70, created_at: created, ...extra,
  };
}

const profile = { name: 'Danny', skill_level: 'intermediate', primary_goal: 'carry' } as never;

describe('toActivitySignal', () => {
  it('maps the normalized context into reengage’s signal shape', () => {
    const now = new Date('2026-06-06T15:00:00');
    const state = makeState({
      profile,
      sessions: [sessionBefore(now, 2)],
      training: {
        active_diagnosis_id: 'slice', active_session_id: 'x', completed_steps: [],
        drills_completed: {}, started_at: new Date(now.getTime() - 3 * DAY).toISOString(),
        streak_days: 0, last_practice_date: null, milestones_earned: [],
      },
    });
    const ctx = buildAgentContext(state, 'golf', now);
    const sig = toActivitySignal(ctx);
    expect(sig.daysSinceLastActivity).toBe(2);
    expect(sig.sessionCount).toBe(1);
    expect(sig.hasPendingFix).toBe(true); // active_diagnosis_id set
    expect(sig.activated).toBe(true);
    expect(sig.sport).toBe('golf');
  });
});

describe('selectChurnAwareNudge', () => {
  it('always returns a churn read, even when no nudge applies', () => {
    const now = new Date('2026-06-06T15:00:00');
    const ctx = buildAgentContext(makeState({ profile, sessions: [sessionBefore(now, 1)] }), 'golf', now);
    const sig = toActivitySignal(ctx);
    const { nudge, churn } = selectChurnAwareNudge(ctx, sig, DEFAULT_STATE, { now: now.getTime() });
    expect(churn).toBeTruthy();
    expect(nudge).toBeNull(); // 1 day out → no trigger fires
  });

  it('does NOT suppress a comeback nudge for a genuinely at-risk user', () => {
    const now = new Date('2026-06-06T15:00:00');
    const ctx = buildAgentContext(makeState({ profile, sessions: [sessionBefore(now, 40)] }), 'golf', now);
    const sig = toActivitySignal(ctx);
    const res = selectChurnAwareNudge(ctx, sig, DEFAULT_STATE, { now: now.getTime(), suppressIfSafe: true });
    expect(['at_risk', 'critical']).toContain(res.churn.band);
    expect(res.nudge?.triggerId).toBe('comeback_14');
    expect(res.suppressedBySafe).toBe(false);
  });

  it('suppresses a low-value comeback when churn says the user is actually safe', () => {
    const now = new Date('2026-06-06T15:00:00');
    // Regular ~5-day cadence, last activity 7 days ago → reengage fires
    // comeback_7, but our churn model reads 'safe'.
    const ctx = buildAgentContext(
      makeState({
        profile,
        sessions: [
          sessionBefore(now, 7), sessionBefore(now, 12),
          sessionBefore(now, 17), sessionBefore(now, 22),
        ],
      }),
      'golf',
      now,
    );
    const sig = toActivitySignal(ctx);

    const open = selectChurnAwareNudge(ctx, sig, DEFAULT_STATE, { now: now.getTime() });
    expect(open.churn.band).toBe('safe');
    expect(open.nudge?.triggerId).toBe('comeback_7'); // reengage would fire it

    const gated = selectChurnAwareNudge(ctx, sig, DEFAULT_STATE, { now: now.getTime(), suppressIfSafe: true });
    expect(gated.nudge).toBeNull(); // churn-aware gate held it back
    expect(gated.suppressedBySafe).toBe(true);
  });
});
