// ============================================================
// SwingVantage — Agent: Activation Concierge — Unit Tests
// ============================================================

import type { SwingVantageState } from '@/store';
import { buildAgentContext } from '../../context-builder';
import { buildActivation } from '../engine';

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
function makeSession(o: Record<string, any> = {}): any {
  const created = o.created_at ?? new Date().toISOString();
  return {
    id: `s_${Math.random().toString(36).slice(2)}`, name: 'S', date: created, sport: 'golf',
    club_name: 'Driver', club_category: 'driver', launch_monitor: 'manual',
    indoor_outdoor: 'outdoor', mat_or_grass: 'grass', notes: '', shot_count: 6, shots: [],
    diagnoses: [], swing_score: 70, created_at: created, ...o,
  };
}

const slice = { rule: { id: 'slice', name: 'Slice' }, confidence: 70, stats: {}, supporting_data: [] };
const profile = { name: 'Danny', skill_level: 'intermediate', primary_goal: 'carry' } as never;

describe('buildActivation', () => {
  it('starts a brand-new user on the profile step', () => {
    const ctx = buildAgentContext(makeState(), 'golf');
    const a = buildActivation(ctx);
    expect(a.status).toBe('new');
    expect(a.currentStepId).toBe('profile');
    expect(a.percent).toBe(0);
    expect(a.nudge?.action.intent).toBe('finish_profile');
    expect(a.totalCount).toBe(5); // golf includes a diagnosis step
  });

  it('moves a profiled golfer with a diagnosed session to the plan step', () => {
    const ctx = buildAgentContext(
      makeState({ profile, sessions: [makeSession({ diagnoses: [slice], created_at: daysAgo(1) })] }),
      'golf',
    );
    const a = buildActivation(ctx);
    expect(a.currentStepId).toBe('first_plan');
    expect(a.completedCount).toBe(3); // profile + upload + diagnosis
    expect(a.percent).toBe(60);
    expect(a.nudge?.action.intent).toBe('create_plan');
  });

  it('folds diagnosis into upload for non-golf sports', () => {
    const ctx = buildAgentContext(
      makeState({
        sportProfiles: { tennis: { name: 'Sam', skill_level: 'beginner' } },
        video_analyses: [{
          id: 'v1', session_id: null, sport: 'tennis', file_name: 'fh.mp4', overall_score: 70,
          camera_angle: 'side_on', phases_count: 5, issues_count: 1, primary_issue: 'Late contact',
          created_at: daysAgo(1),
        }],
      }),
      'tennis',
    );
    const a = buildActivation(ctx);
    expect(a.totalCount).toBe(4); // no separate diagnosis step
    expect(a.steps.some((s) => s.id === 'first_diagnosis')).toBe(false);
    expect(a.currentStepId).toBe('first_plan');
  });

  it('marks a user who closed the first loop as activated', () => {
    const ctx = buildAgentContext(
      makeState({
        profile,
        sessions: [
          makeSession({ diagnoses: [slice], created_at: daysAgo(5) }),
          makeSession({ created_at: daysAgo(1) }), // follow-up after plan start
        ],
        training: {
          active_diagnosis_id: 'slice', active_session_id: 'x', completed_steps: [0],
          drills_completed: {}, started_at: daysAgo(3), streak_days: 2,
          last_practice_date: daysAgo(1), milestones_earned: [],
        },
      }),
      'golf',
    );
    const a = buildActivation(ctx);
    expect(a.status).toBe('activated');
    expect(a.currentStepId).toBeNull();
    expect(a.nudge).toBeNull();
    expect(a.percent).toBe(100);
  });

  it('detects a stall from account age when there is no activity yet', () => {
    const ctx = buildAgentContext(makeState({ profile }), 'golf'); // profiled, no uploads
    const fresh = buildActivation(ctx);
    expect(fresh.stalled).toBe(false); // no signal → no false alarm

    const stalled = buildActivation(ctx, { accountAgeDays: 5 });
    expect(stalled.stalled).toBe(true);
    expect(stalled.stalledDays).toBe(5);
    expect(stalled.currentStepId).toBe('first_upload');
  });

  it('softens the nudge with reassuring, friction-reduced copy when stalled', () => {
    const ctx = buildAgentContext(makeState({ profile }), 'golf'); // profiled, no uploads
    const normal = buildActivation(ctx);
    const stalled = buildActivation(ctx, { accountAgeDays: 5 });

    // Same step + same concrete action — only the framing changes.
    expect(stalled.currentStepId).toBe(normal.currentStepId);
    expect(stalled.nudge?.action.intent).toBe(normal.nudge?.action.intent);
    expect(normal.stalled).toBe(false);
    expect(stalled.stalled).toBe(true);

    // Reassuring headline + body that foregrounds the single smallest step.
    expect(stalled.nudge?.headline).toMatch(/no rush/i);
    expect(stalled.nudge?.body).toContain(stalled.nudge!.microStep);
    expect(stalled.nudge?.body).not.toBe(normal.nudge?.body);
  });
});
