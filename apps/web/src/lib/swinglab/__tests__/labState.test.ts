import { actionToStation, buildGuidedPath, buildLabPersonalization, hrefToStation, type LabSignals } from '../labState';

describe('actionToStation', () => {
  it('maps known Next-Best-Action ids to their station', () => {
    expect(actionToStation({ id: 'finish_profile', href: '/profile' })).toBe('player-profile-wall');
    expect(actionToStation({ id: 'upload_baseline', href: '/video' })).toBe('motion-capture-studio');
    expect(actionToStation({ id: 'run_diagnosis', href: '/diagnose' })).toBe('motion-capture-studio');
    expect(actionToStation({ id: 'continue_plan', href: '/training' })).toBe('training-plan-lab');
    expect(actionToStation({ id: 'update_equipment', href: '/equipment' })).toBe('equipment-bay');
    expect(actionToStation({ id: 'generate_report', href: '/reports' })).toBe('film-room');
  });

  it('falls back to the href when the id is unknown', () => {
    expect(actionToStation({ id: 'mystery_action', href: '/ai-coach' })).toBe('ai-coach-console');
    expect(actionToStation({ id: 'mystery_action', href: '/bodysync' })).toBe('recovery-readiness-dock');
    expect(actionToStation({ id: 'mystery_action', href: '/somewhere-else' })).toBe('entry-atrium');
  });
});

describe('hrefToStation', () => {
  it('routes known prefixes to the right station', () => {
    expect(hrefToStation('/progress')).toBe('player-profile-wall');
    expect(hrefToStation('/recruiting')).toBe('recruiting-studio');
    expect(hrefToStation('/tutorial')).toBe('learning-academy-wing');
    expect(hrefToStation('/library')).toBe('film-room');
  });
});

describe('buildLabPersonalization', () => {
  const emptyUser: LabSignals = {
    hasProfile: false,
    captures: 0,
    planStatus: 'none',
    clubCount: 0,
    lastActivityAt: null,
  };

  it('marks a brand-new user honestly (new where absence is meaningful, neutral elsewhere)', () => {
    const p = buildLabPersonalization('player-profile-wall', emptyUser);
    expect(p.mode).toBe('personalized');
    expect(p.recommendedStationId).toBe('player-profile-wall');
    expect(p.statusById['player-profile-wall'].kind).toBe('new');
    expect(p.statusById['motion-capture-studio'].kind).toBe('new');
    // No data yet → no training/equipment/film badges (neutral = absent).
    expect(p.statusById['training-plan-lab']).toBeUndefined();
    expect(p.statusById['equipment-bay']).toBeUndefined();
    expect(p.statusById['film-room']).toBeUndefined();
    expect(p.resume).toBeNull();
  });

  it('reflects an active user from positive evidence only', () => {
    const activeUser: LabSignals = {
      hasProfile: true,
      captures: 4,
      planStatus: 'in_progress',
      clubCount: 12,
      lastActivityAt: '2026-06-06T10:00:00.000Z',
    };
    const p = buildLabPersonalization('training-plan-lab', activeUser);
    expect(p.statusById['player-profile-wall'].kind).toBe('visited');
    expect(p.statusById['motion-capture-studio'].kind).toBe('visited');
    expect(p.statusById['training-plan-lab'].kind).toBe('in_progress');
    expect(p.statusById['equipment-bay'].kind).toBe('visited');
    expect(p.statusById['film-room'].kind).toBe('visited');
    expect(p.resume).toEqual({ label: 'Pick up where you left off', href: '/dashboard' });
  });

  it('suggests a plan as "new" only once there is data to plan from', () => {
    const withCaptures = buildLabPersonalization(null, { ...emptyUser, captures: 1 });
    expect(withCaptures.statusById['training-plan-lab'].kind).toBe('new');
  });
});

describe('buildGuidedPath', () => {
  const base: LabSignals = { hasProfile: false, captures: 0, planStatus: 'none', clubCount: 0, lastActivityAt: null };
  const statuses = (s: LabSignals) => buildGuidedPath(s).map((x) => x.status);

  it('starts a brand-new user at step 1 (profile), the rest upcoming', () => {
    expect(statuses(base)).toEqual(['current', 'upcoming', 'upcoming', 'upcoming']);
  });

  it('advances the current step as evidence accrues', () => {
    expect(statuses({ ...base, hasProfile: true })).toEqual(['done', 'current', 'upcoming', 'upcoming']);
    expect(statuses({ ...base, hasProfile: true, captures: 2 })).toEqual(['done', 'done', 'current', 'upcoming']);
    expect(statuses({ ...base, hasProfile: true, captures: 2, planStatus: 'in_progress' })).toEqual(['done', 'done', 'done', 'current']);
  });

  it('marks every step done (no current) once the loop is complete', () => {
    const done = buildGuidedPath({ hasProfile: true, captures: 3, planStatus: 'completed', clubCount: 5, lastActivityAt: 'x' });
    expect(done.every((s) => s.status === 'done')).toBe(true);
  });

  it('keeps the canonical station order', () => {
    expect(buildGuidedPath(base).map((s) => s.stationId)).toEqual([
      'player-profile-wall',
      'motion-capture-studio',
      'training-plan-lab',
      'film-room',
    ]);
  });
});
