// ============================================================
// SwingIQ Agent Layer — Unit Tests
// ------------------------------------------------------------
// Protects the deterministic decision ladder behind the
// dashboard's "next best step", the Welcome Back experience,
// and the orchestrator's insight assembly.
// ============================================================

import type { SwingIQState } from '@/store';
import { buildAgentContext } from '../contextBuilder';
import { getNextBestAction } from '../scoring';
import { buildResumeState } from '../workflows/resume';
import { runOrchestrator } from '../orchestrator';

// ── Builders ──────────────────────────────────────────────────

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

function makeState(o: Partial<SwingIQState> = {}): SwingIQState {
  return {
    profile: null,
    sportProfiles: {},
    clubs: [],
    sportEquipment: { tennis: [], baseball: [], softball_slow: [], softball_fast: [] },
    sessions: [],
    video_analyses: [],
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
    setup_step: 'profile',
    ...o,
  } as unknown as SwingIQState;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeSession(o: Record<string, any> = {}): any {
  const created = o.created_at ?? new Date().toISOString();
  return {
    id: `session_${Math.random().toString(36).slice(2)}`,
    name: 'Test Session',
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
    diagnoses: [],
    swing_score: null,
    created_at: created,
    ...o,
  };
}

const slice = { rule: { id: 'slice_weak_fade', name: 'Open Face / Slice' }, confidence: 72, stats: {}, supporting_data: [] };

const golfProfile = { name: 'Danny Test', skill_level: 'intermediate', primary_goal: 'more carry' } as never;

// ── Next Best Action ladder ───────────────────────────────────

describe('getNextBestAction ladder', () => {
  it('1) no profile → finish profile', () => {
    const ctx = buildAgentContext(makeState(), 'golf');
    expect(getNextBestAction(ctx).intent).toBe('finish_profile');
  });

  it('2) profile but no sessions → upload baseline', () => {
    const ctx = buildAgentContext(makeState({ profile: golfProfile }), 'golf');
    const nba = getNextBestAction(ctx);
    expect(nba.intent).toBe('upload_session');
    expect(nba.id).toBe('upload_baseline');
  });

  it('3) golf session without a diagnosis → run diagnosis', () => {
    const ctx = buildAgentContext(
      makeState({ profile: golfProfile, sessions: [makeSession({ diagnoses: [] })] }),
      'golf',
    );
    expect(getNextBestAction(ctx).intent).toBe('run_diagnosis');
  });

  it('4) diagnosed session, no plan → create plan', () => {
    const ctx = buildAgentContext(
      makeState({ profile: golfProfile, sessions: [makeSession({ diagnoses: [slice] })] }),
      'golf',
    );
    expect(getNextBestAction(ctx).intent).toBe('create_plan');
  });

  it('5) plan in progress → continue plan', () => {
    const ctx = buildAgentContext(
      makeState({
        profile: golfProfile,
        sessions: [makeSession({ diagnoses: [slice], created_at: daysAgo(2) })],
        training: {
          active_diagnosis_id: 'slice_weak_fade',
          active_session_id: 'x',
          completed_steps: [0],
          drills_completed: {},
          started_at: new Date().toISOString(),
          streak_days: 1,
          last_practice_date: new Date().toISOString(),
          milestones_earned: [],
        },
      }),
      'golf',
    );
    expect(getNextBestAction(ctx).intent).toBe('continue_plan');
  });

  it('9) stale (35+ days) with data → refresh baseline first', () => {
    const ctx = buildAgentContext(
      makeState({ profile: golfProfile, sessions: [makeSession({ diagnoses: [slice], created_at: daysAgo(40) })] }),
      'golf',
    );
    const nba = getNextBestAction(ctx);
    expect(nba.id).toBe('refresh_baseline');
    expect(nba.intent).toBe('upload_session');
  });
});

// ── Welcome Back / Resume ─────────────────────────────────────

describe('buildResumeState', () => {
  it('greets a returning user by name and surfaces a next step', () => {
    const ctx = buildAgentContext(
      makeState({
        profile: golfProfile,
        sessions: [makeSession({ diagnoses: [slice], swing_score: 70, created_at: daysAgo(3) })],
      }),
      'golf',
    );
    const resume = buildResumeState(ctx);
    expect(resume.headline).toContain('Danny');
    expect(resume.status).toBe('continue');
    expect(resume.lastFocus).toBe('Open Face / Slice');
    expect(resume.nextBestAction).toBeTruthy();
    expect(resume.summary.length).toBeGreaterThan(0);
  });

  it('marks a long-absent user as stale', () => {
    const ctx = buildAgentContext(
      makeState({ profile: golfProfile, sessions: [makeSession({ diagnoses: [slice], created_at: daysAgo(60) })] }),
      'golf',
    );
    expect(buildResumeState(ctx).status).toBe('stale');
  });

  it('treats a brand-new user with no data as first_time', () => {
    const ctx = buildAgentContext(makeState(), 'golf');
    expect(buildResumeState(ctx).status).toBe('first_time');
  });
});

// ── Orchestrator ──────────────────────────────────────────────

describe('runOrchestrator', () => {
  it('surfaces a progress insight when scores are trending up', () => {
    const ctx = buildAgentContext(
      makeState({
        profile: golfProfile,
        sessions: [
          makeSession({ diagnoses: [slice], swing_score: 80, created_at: daysAgo(1) }),
          makeSession({ diagnoses: [slice], swing_score: 65, created_at: daysAgo(10) }),
        ],
      }),
      'golf',
    );
    const result = runOrchestrator(ctx);
    expect(result.resume).toBeTruthy();
    expect(result.nextBestAction).toBeTruthy();
    const ids = result.insights.map((i) => i.id);
    expect(ids).toContain('progress');
  });

  it('raises a stop-severity safety flag when pain is mentioned', () => {
    const ctx = buildAgentContext(
      makeState({ profile: { ...(golfProfile as object), injury_notes: 'sharp pain in my wrist' } as never }),
      'golf',
    );
    const result = runOrchestrator(ctx);
    expect(result.safetyFlags.some((f) => f.type === 'pain_injury' && f.severity === 'stop')).toBe(true);
    // and it should be shown first as a safety insight
    expect(result.insights[0]?.tone).toBe('safety');
  });

  it('works for a non-golf sport (tennis video analysis)', () => {
    const ctx = buildAgentContext(
      makeState({
        sportProfiles: { tennis: { name: 'Sam', skill_level: 'beginner' } },
        video_analyses: [
          {
            id: 'v1',
            session_id: null,
            sport: 'tennis',
            file_name: 'forehand.mp4',
            overall_score: 68,
            camera_angle: 'side_on',
            phases_count: 5,
            issues_count: 1,
            primary_issue: 'Late contact',
            created_at: daysAgo(2),
          },
        ],
      }),
      'tennis',
    );
    const resume = buildResumeState(ctx);
    expect(resume.sport).toBe('tennis');
    expect(resume.headline).toContain('Sam');
    expect(getNextBestAction(ctx).intent).toBeTruthy();
  });
});
