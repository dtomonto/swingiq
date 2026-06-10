// ============================================================
// CentralIntelligenceOS — brain unit tests
// ============================================================

import {
  // profile completion
  calculateProfileCompletion,
  getNextProfilePrompt,
  type ProfileSnapshot,
  // sessions
  isValidSession,
  isValidVideoAnalysis,
  getValidSessionCount,
  getValidSessionBreakdown,
  type SessionLike,
  type VideoAnalysisLike,
  // founding
  evaluateFoundingFathersStatus,
  shouldUnlockMembershipTiers,
  buildCampaignProgress,
  // memory
  buildUserMemory,
  getUserMemoryContext,
  updateCoachingMemoryFromSession,
  generateNextBestAction,
  // aggregate
  buildDistribution,
  buildFunnel,
  biggestDropOff,
  // recommendations
  generateRecommendations,
  type IntelligenceSignals,
  // achievements / config
  earnedSessionMilestones,
  buildFoundingMemberBadge,
  formatMemberNumber,
  FOUNDING_REQUIRED_COUNT,
  FOUNDING_REQUIRED_SESSIONS,
  // snapshot
  buildProfileSnapshot,
  derivePrimarySport,
  type StoreStateLike,
} from '..';
import type { UserMemory } from '../types';

// ── Profile completion ────────────────────────────────────────

const golfComplete: ProfileSnapshot = {
  primarySport: 'golf',
  hasEquipment: true,
  fields: {
    skill_level: 'intermediate',
    primary_goal: 'break 90',
    current_miss: 'slice',
    performance_baseline: 92,
    desired_shot_shape: 'draw',
    handedness: 'right',
    practice_environment: 'range',
  },
};

describe('profile completion', () => {
  it('marks a fully filled golf profile complete at 100%', () => {
    const c = calculateProfileCompletion(golfComplete);
    expect(c.completed).toBe(true);
    expect(c.completionPercent).toBe(100);
    expect(c.missingRequiredFields).toHaveLength(0);
  });

  it('is incomplete when required fields are missing and reports them', () => {
    const snap: ProfileSnapshot = {
      ...golfComplete,
      fields: { ...golfComplete.fields, primary_goal: '', current_miss: '   ', performance_baseline: null },
    };
    const c = calculateProfileCompletion(snap);
    expect(c.completed).toBe(false);
    expect(c.completionPercent).toBeLessThan(100);
    const keys = c.missingRequiredFields.map((f) => f.key);
    expect(keys).toEqual(expect.arrayContaining(['primary_goal', 'current_miss', 'performance_baseline']));
  });

  it('treats equipment requirement via hasEquipment', () => {
    const c = calculateProfileCompletion({ ...golfComplete, hasEquipment: false });
    expect(c.missingRequiredFields.map((f) => f.key)).toContain('equipment');
  });

  it('returns the highest-value missing field as the next prompt', () => {
    const snap: ProfileSnapshot = { ...golfComplete, fields: { ...golfComplete.fields, skill_level: '' } };
    expect(getNextProfilePrompt(snap)?.key).toBe('skill_level');
  });

  it('handles a non-golf sport (tennis) against its own keys', () => {
    const tennis: ProfileSnapshot = {
      primarySport: 'tennis',
      hasEquipment: false,
      fields: {
        skill_level: 'advanced',
        primary_goal: 'win league',
        common_miss: 'netting backhand',
        dominant_hand: 'right',
        backhand_style: 'one_handed',
        playing_level: 'competitive',
      },
    };
    const c = calculateProfileCompletion(tennis);
    expect(c.completed).toBe(true);
  });

  it('returns 0% and no sport when primary sport is null', () => {
    const c = calculateProfileCompletion({ primarySport: null, hasEquipment: false, fields: {} });
    expect(c.completionPercent).toBe(0);
    expect(c.sport).toBeNull();
  });
});

// ── Sessions ──────────────────────────────────────────────────

const validSession = (over: Partial<SessionLike> = {}): SessionLike => ({
  id: 's1', sport: 'golf', shot_count: 12, ...over,
});

describe('valid sessions', () => {
  it('counts a session with shots', () => {
    expect(isValidSession(validSession()).valid).toBe(true);
  });
  it('counts a session with only a diagnosis or score', () => {
    expect(isValidSession({ id: 'a', sport: 'golf', shot_count: 0, diagnoses: [{}] }).valid).toBe(true);
    expect(isValidSession({ id: 'b', sport: 'golf', shot_count: 0, swing_score: 70 }).valid).toBe(true);
  });
  it('does not count an empty/abandoned session', () => {
    expect(isValidSession({ id: 'c', sport: 'golf', shot_count: 0 }).valid).toBe(false);
  });
  it('counts a completed video analysis, not a failed one', () => {
    expect(isValidVideoAnalysis({ id: 'v', sport: 'golf', overall_score: 80 }).valid).toBe(true);
    expect(isValidVideoAnalysis({ id: 'v2', sport: 'golf', overall_score: 0, phases_count: 0 }).valid).toBe(false);
  });
  it('totals valid sessions + standalone videos without double-counting linked ones', () => {
    const sessions: SessionLike[] = [validSession({ id: 's1' }), validSession({ id: 's2' }), { id: 's3', sport: 'golf', shot_count: 0 }];
    const videoAnalyses: VideoAnalysisLike[] = [
      { id: 'v1', sport: 'golf', overall_score: 90, session_id: null },
      { id: 'v2', sport: 'golf', overall_score: 90, session_id: 's1' }, // linked → not counted
      { id: 'v3', sport: 'golf', overall_score: 0, session_id: null }, // failed → not counted
    ];
    expect(getValidSessionCount({ sessions, videoAnalyses })).toBe(3); // s1 + s2 + v1
  });
  it('breaks down by source', () => {
    const breakdown = getValidSessionBreakdown({
      sessions: [validSession({ id: 's1', launch_monitor: 'trackman' }), validSession({ id: 's2' })],
      videoAnalyses: [{ id: 'v1', sport: 'golf', overall_score: 80, session_id: null }],
    });
    expect(breakdown.launch_monitor).toBe(1);
    expect(breakdown.manual).toBe(1);
    expect(breakdown.video).toBe(1);
  });
});

// ── Founding qualification ────────────────────────────────────

describe('founding fathers qualification', () => {
  it('qualifies with complete profile and 10 valid sessions', () => {
    const r = evaluateFoundingFathersStatus({ profileCompleted: true, profileCompletionPercent: 100, validSessionCount: 10 });
    expect(r.eligible).toBe(true);
    expect(r.status).toBe('qualified');
  });
  it('does not qualify with 9 valid sessions', () => {
    const r = evaluateFoundingFathersStatus({ profileCompleted: true, profileCompletionPercent: 100, validSessionCount: 9 });
    expect(r.eligible).toBe(false);
    expect(r.status).toBe('profile_complete_sessions_needed');
  });
  it('does not qualify with 10 sessions but incomplete profile', () => {
    const r = evaluateFoundingFathersStatus({ profileCompleted: false, profileCompletionPercent: 80, validSessionCount: 12 });
    expect(r.eligible).toBe(false);
    expect(r.status).toBe('profile_incomplete');
  });
  it('is not_started with nothing done', () => {
    const r = evaluateFoundingFathersStatus({ profileCompleted: false, profileCompletionPercent: 0, validSessionCount: 0 });
    expect(r.status).toBe('not_started');
  });
  it('waitlists an eligible user once the campaign is full', () => {
    const r = evaluateFoundingFathersStatus({ profileCompleted: true, profileCompletionPercent: 100, validSessionCount: 10, campaignFull: true });
    expect(r.status).toBe('waitlisted_after_cap');
  });
  it('reports the server member number when present', () => {
    const r = evaluateFoundingFathersStatus({ profileCompleted: true, profileCompletionPercent: 100, validSessionCount: 10, memberNumber: 42 });
    expect(r.memberNumber).toBe(42);
    expect(r.status).toBe('qualified');
  });
});

describe('membership tier gate', () => {
  it('stays locked below the required count', () => {
    expect(shouldUnlockMembershipTiers({ qualifiedCount: FOUNDING_REQUIRED_COUNT - 1 })).toBe(false);
  });
  it('unlocks at the required count', () => {
    expect(shouldUnlockMembershipTiers({ qualifiedCount: FOUNDING_REQUIRED_COUNT })).toBe(true);
  });
  it('respects an admin override either way', () => {
    expect(shouldUnlockMembershipTiers({ qualifiedCount: 0, manualOverride: true })).toBe(true);
    expect(shouldUnlockMembershipTiers({ qualifiedCount: 5000, manualOverride: false })).toBe(false);
  });
  it('builds privacy-safe campaign progress (raw, baseline 0)', () => {
    const p = buildCampaignProgress({ qualifiedCount: 30, baseline: 0 });
    expect(p.remaining).toBe(FOUNDING_REQUIRED_COUNT - 30);
    expect(p.full).toBe(false);
    expect(p.membershipTiersEnabled).toBe(false);
  });
  it('applies the public launch baseline to the displayed count', () => {
    const p = buildCampaignProgress({ qualifiedCount: 0, baseline: 55, requiredCount: 100 });
    expect(p.qualifiedCount).toBe(55);
    expect(p.remaining).toBe(45);
  });
});

// ── Memory + coaching continuity ──────────────────────────────

describe('coaching memory', () => {
  it('builds a private memory with safe defaults', () => {
    const m = buildUserMemory({ userId: 'u1', layer: 'session', memoryType: 'session', title: 't', summary: 's' });
    expect(m.visibility).toBe('private');
    expect(m.consentBasis).toBe('personalization');
    expect(m.confidence).toBeGreaterThan(0);
  });
  it('detects a recurring issue across sessions', () => {
    const mk = (issue: string): UserMemory =>
      buildUserMemory({ userId: 'u1', layer: 'session', memoryType: 'session', sport: 'golf', title: 'x', summary: 'x', data: { issue } });
    const memories = [mk('open clubface'), mk('open clubface'), mk('early extension')];
    const ctx = getUserMemoryContext(memories, 'u1', 'golf');
    expect(ctx.highestPriorityIssue).toBe('open clubface');
    expect(ctx.recurringIssues[0]).toEqual({ issue: 'open clubface', occurrences: 2 });
  });
  it('escalates a repeated issue to a recurring-issue memory', () => {
    const prior = getUserMemoryContext(
      [buildUserMemory({ userId: 'u1', layer: 'session', memoryType: 'session', sport: 'golf', title: 'x', summary: 'x', data: { issue: 'slice' } })],
      'u1', 'golf',
    );
    // prior context has highestPriorityIssue 'slice' (single, importance fallback)
    const added = updateCoachingMemoryFromSession('u1', {
      id: 's2', sport: 'golf', source: 'manual', date: '2026-06-07', headline: 'h', primaryIssue: 'slice', score: null, shotCount: 10,
    }, prior);
    expect(added.some((m) => m.memoryType === 'recurring_issue')).toBe(true);
  });
  it('recommends finishing the profile first', () => {
    const ctx = getUserMemoryContext([], 'u1', 'golf');
    const nba = generateNextBestAction({ profileCompleted: false, profileCompletionPercent: 40, validSessionCount: 0, requiredSessions: FOUNDING_REQUIRED_SESSIONS, context: ctx });
    expect(nba.cta.href).toBe('/profile');
  });
});

// ── Aggregate (anonymized) ────────────────────────────────────

describe('anonymized aggregates', () => {
  it('suppresses distributions below the cohort threshold', () => {
    const d = buildDistribution('skill', ['a', 'b', 'a']);
    expect(d.suppressed).toBe(true);
    expect(d.buckets).toHaveLength(0);
  });
  it('returns buckets for a large-enough cohort', () => {
    const values = Array.from({ length: 12 }, (_, i) => (i % 2 === 0 ? 'beginner' : 'intermediate'));
    const d = buildDistribution('skill', values);
    expect(d.suppressed).toBe(false);
    expect(d.buckets.reduce((s, b) => s + b.count, 0)).toBe(12);
  });
  it('finds the biggest funnel drop-off', () => {
    const funnel = buildFunnel([
      { label: 'registered', count: 100 },
      { label: 'profile', count: 80 },
      { label: 'first session', count: 30 },
      { label: 'qualified', count: 10 },
    ]);
    // Biggest PERCENT drop is the last step (10/30 = 67% lost) over profile→session (62% lost).
    const drop = biggestDropOff(funnel);
    expect(drop?.from).toBe('first session');
    expect(drop?.to).toBe('qualified');
  });
});

// ── Recommendations ───────────────────────────────────────────

describe('recommendations engine', () => {
  const baseSignals: IntelligenceSignals = {
    totalUsers: 100,
    profilesComplete: 30,
    profileCompletionRate: 30,
    totalSessions: 120,
    avgSessionsPerUser: 1.2,
    retestRate: 5,
    uploadFailureRate: 30,
    inactiveUsers7d: 40,
    founding: buildCampaignProgress({ qualifiedCount: 950 }),
    topMissingFields: [{ label: 'Average score or handicap', count: 50 }],
    sessionsBySport: [{ sport: 'golf', sessions: 110 }, { sport: 'padel', sessions: 2 }],
    topRecurringIssues: [{ issue: 'early extension', count: 20 }],
  };

  it('produces prioritized recommendations from weak signals', () => {
    const recs = generateRecommendations(baseSignals);
    expect(recs.length).toBeGreaterThan(3);
    // critical items sort first
    expect(recs[0].priority).toBe('critical');
    const areas = recs.map((r) => r.area);
    expect(areas).toEqual(expect.arrayContaining(['profile', 'sessions', 'retention']));
  });

  it('produces little/nothing for a healthy platform', () => {
    const healthy: IntelligenceSignals = {
      ...baseSignals,
      profileCompletionRate: 85,
      avgSessionsPerUser: 6,
      retestRate: 60,
      uploadFailureRate: 1,
      inactiveUsers7d: 2,
      topMissingFields: [],
      sessionsBySport: [{ sport: 'golf', sessions: 50 }, { sport: 'tennis', sessions: 40 }],
      topRecurringIssues: [],
      founding: buildCampaignProgress({ qualifiedCount: 100 }),
    };
    const recs = generateRecommendations(healthy);
    expect(recs.length).toBe(0);
  });
});

// ── Achievements ──────────────────────────────────────────────

describe('achievements', () => {
  it('earns milestones at the right thresholds', () => {
    expect(earnedSessionMilestones(0)).toHaveLength(0);
    expect(earnedSessionMilestones(1).map((m) => m.id)).toContain('session-1');
    expect(earnedSessionMilestones(10).map((m) => m.id)).toContain(`session-${FOUNDING_REQUIRED_SESSIONS}`);
  });
  it('formats member numbers as zero-padded badges', () => {
    expect(formatMemberNumber(7)).toBe('#007');
    expect(formatMemberNumber(248)).toBe('#248');
    expect(formatMemberNumber(0)).toBe('');
  });
  it('builds a founding badge with its number', () => {
    const badge = buildFoundingMemberBadge(42);
    expect(badge.numberLabel).toBe('#042');
    expect(badge.headline).toContain('#042');
  });
});

// ── Snapshot adapter ──────────────────────────────────────────

describe('snapshot adapter', () => {
  const baseState: StoreStateLike = {
    profile: null,
    sportProfiles: {},
    clubs: [],
    sportEquipment: {},
    sessions: [],
    video_analyses: [],
  };

  it('derives primary sport from the most valid sessions', () => {
    const state: StoreStateLike = {
      ...baseState,
      sessions: [
        { id: 's1', sport: 'tennis', shot_count: 5 },
        { id: 's2', sport: 'tennis', shot_count: 5 },
        { id: 's3', sport: 'golf', shot_count: 5 },
      ],
    };
    expect(derivePrimarySport(state)).toBe('tennis');
  });

  it('falls back to golf when a golf profile exists and no sessions', () => {
    const state: StoreStateLike = { ...baseState, profile: { skill_level: 'beginner' } as never };
    expect(derivePrimarySport(state)).toBe('golf');
  });

  it('respects an explicit override', () => {
    expect(derivePrimarySport(baseState, 'padel')).toBe('padel');
  });

  it('builds a golf snapshot with a derived performance baseline', () => {
    const state: StoreStateLike = {
      ...baseState,
      profile: { scoring_average: 95, handicap: null, low_round: null } as never,
      clubs: [{ id: 'c1' }],
    };
    const snap = buildProfileSnapshot(state, 'golf');
    expect(snap.fields.performance_baseline).toBe(95);
    expect(snap.hasEquipment).toBe(true);
  });
});
