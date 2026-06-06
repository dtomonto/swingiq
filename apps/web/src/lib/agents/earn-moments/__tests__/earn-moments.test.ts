// ============================================================
// SwingVantage — Agent: Earn-Moment Referral — Unit Tests
// ============================================================

import type { SwingVantageState } from '@/store';
import { buildAgentContext } from '../../context-builder';
import { detectEarnMoment, buildReferralPrompt } from '../engine';

const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();

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
function makeSession(score: number | null, created: string): any {
  return {
    id: `s_${Math.random().toString(36).slice(2)}`, name: 'S', date: created, sport: 'golf',
    club_name: 'Driver', club_category: 'driver', launch_monitor: 'manual',
    indoor_outdoor: 'outdoor', mat_or_grass: 'grass', notes: '', shot_count: 6, shots: [],
    diagnoses: [{ rule: { id: 'x', name: 'X' }, confidence: 70, stats: {}, supporting_data: [] }],
    swing_score: score, created_at: created,
  };
}

const profile = { name: 'Danny', skill_level: 'intermediate', primary_goal: 'carry' } as never;

describe('detectEarnMoment', () => {
  it('detects a personal best when the latest score beats all prior', () => {
    const ctx = buildAgentContext(
      makeState({ profile, sessions: [makeSession(85, daysAgo(1)), makeSession(70, daysAgo(5))] }),
      'golf',
    );
    const m = detectEarnMoment(ctx);
    expect(m?.kind).toBe('personal_best');
    expect(m?.groundedOn.join(' ')).toContain('85');
  });

  it('returns null when nothing celebratory happened', () => {
    const ctx = buildAgentContext(
      makeState({ profile, sessions: [makeSession(70, daysAgo(1)), makeSession(70, daysAgo(5))] }),
      'golf',
    );
    expect(detectEarnMoment(ctx)).toBeNull();
  });

  it('ranks a reward-tier unlock above a personal best', () => {
    const ctx = buildAgentContext(
      makeState({ profile, sessions: [makeSession(85, daysAgo(1)), makeSession(70, daysAgo(5))] }),
      'golf',
    );
    const m = detectEarnMoment(ctx, { pendingTierTitles: ['Connector'] });
    expect(m?.kind).toBe('tier_unlocked');
  });

  it('detects a streak milestone', () => {
    const ctx = buildAgentContext(
      makeState({
        profile,
        sessions: [makeSession(70, daysAgo(1)), makeSession(70, daysAgo(3))],
        training: {
          active_diagnosis_id: null, active_session_id: null, completed_steps: [],
          drills_completed: {}, started_at: null, streak_days: 7,
          last_practice_date: daysAgo(1), milestones_earned: [],
        },
      }),
      'golf',
    );
    expect(detectEarnMoment(ctx)?.kind).toBe('streak_milestone');
  });
});

describe('buildReferralPrompt', () => {
  const ctxPB = () =>
    buildAgentContext(
      makeState({ profile, sessions: [makeSession(85, daysAgo(1)), makeSession(70, daysAgo(5))] }),
      'golf',
    );

  it('builds a grounded invite with a real link when a code is supplied', () => {
    const prompt = buildReferralPrompt(ctxPB(), { code: 'SV-TEST12', origin: 'https://swingvantage.com' });
    expect(prompt.show).toBe(true);
    expect(prompt.moment?.kind).toBe('personal_best');
    expect(prompt.inviteUrl).toContain('ref=SV-TEST12');
    expect(prompt.shareText).toContain('https://swingvantage.com');
    expect(prompt.cta.href).toBe(prompt.inviteUrl);
  });

  it('falls back to the hub when there is no invite code yet', () => {
    const prompt = buildReferralPrompt(ctxPB(), { hubHref: '/refer' });
    expect(prompt.show).toBe(true);
    expect(prompt.inviteUrl).toBeNull();
    expect(prompt.cta.href).toBe('/refer');
  });

  it('suppresses when prompted too recently', () => {
    const prompt = buildReferralPrompt(ctxPB(), {
      recentlyPromptedAt: new Date(Date.now() - 3600_000).toISOString(),
      minHoursBetweenPrompts: 120,
    });
    expect(prompt.show).toBe(false);
    expect(prompt.suppressedReason).toBe('recently_prompted');
  });

  it('suppresses when the program is opted out', () => {
    const prompt = buildReferralPrompt(ctxPB(), { enabled: false });
    expect(prompt.show).toBe(false);
    expect(prompt.suppressedReason).toBe('opted_out');
  });

  it('suppresses with no_moment when nothing happened', () => {
    const ctx = buildAgentContext(
      makeState({ profile, sessions: [makeSession(70, daysAgo(1)), makeSession(70, daysAgo(5))] }),
      'golf',
    );
    const prompt = buildReferralPrompt(ctx, { code: 'SV-X' });
    expect(prompt.show).toBe(false);
    expect(prompt.suppressedReason).toBe('no_moment');
  });
});
