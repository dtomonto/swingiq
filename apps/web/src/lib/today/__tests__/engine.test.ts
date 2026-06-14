// ============================================================
// WS-01 — Today engine unit tests
// Caps by user type, urgency ordering, overflow → collapsed, new-user
// onboarding, and deterministic output.
// ============================================================

import { buildTodayView, deriveUserType, TODAY_CAPS, type TodayInput } from '../engine';

const base: TodayInput = { userType: 'intermediate' };

describe('deriveUserType', () => {
  it('is new with no sessions or an incomplete profile', () => {
    expect(deriveUserType({ totalSessions: 0, profileComplete: true, lastActiveAt: null })).toBe('new');
    expect(deriveUserType({ totalSessions: 5, profileComplete: false, lastActiveAt: null })).toBe('new');
  });
  it('is returning after a long gap', () => {
    expect(
      deriveUserType({ totalSessions: 5, profileComplete: true, lastActiveAt: '2026-05-01', now: '2026-06-13' }),
    ).toBe('returning');
  });
  it('maps skill level otherwise', () => {
    const args = { totalSessions: 5, profileComplete: true, lastActiveAt: '2026-06-12', now: '2026-06-13' };
    expect(deriveUserType({ ...args, skillLevel: 'beginner' })).toBe('beginner');
    expect(deriveUserType({ ...args, skillLevel: 'elite' })).toBe('advanced');
    expect(deriveUserType({ ...args, skillLevel: null })).toBe('intermediate');
  });
});

describe('buildTodayView', () => {
  it('orders by urgency: critical alert leads, then retest', () => {
    const v = buildTodayView({
      ...base,
      criticalAlert: { label: 'Early extension', summary: 'posture loss', severity: 'critical', href: '/x' },
      retestDue: { label: 'due', href: '/retest' },
      nextBestAction: { id: 'a', label: 'Upload', href: '/motion-lab' },
    });
    expect(v.primary[0].kind).toBe('critical_alert');
    expect(v.primary[1].kind).toBe('retest_due');
  });

  it('caps visible items by user type and pushes overflow to collapsed', () => {
    const skillFocus = Array.from({ length: 8 }, (_, i) => ({ name: `n${i}`, href: `/s${i}` }));
    const v = buildTodayView({ userType: 'beginner', skillFocus, nextBestAction: { id: 'a', label: 'go', href: '/g' } });
    expect(v.visibleCap).toBe(TODAY_CAPS.beginner);
    expect(v.primary.length).toBe(TODAY_CAPS.beginner);
    expect(v.collapsed.some((s) => s.id === 'optional')).toBe(true);
    const total = v.primary.length + v.collapsed.reduce((n, s) => n + s.items.length, 0);
    expect(total).toBe(9); // 8 skill focus + 1 nba
  });

  it('gives new users an onboarding must-do', () => {
    const v = buildTodayView({ userType: 'new', dataCoverage: 'none' });
    expect(v.primary[0].kind).toBe('must_do');
    expect(v.primary[0].actionHref).toBe('/profile');
  });

  it('routes secondary insights into the "More insights" collapsed section', () => {
    const v = buildTodayView({
      userType: 'beginner',
      criticalAlert: { label: 'x', summary: 'y', severity: 'high', href: '/x' },
      retestDue: { label: 'r', href: '/r' },
      activePlan: { label: 'p', href: '/p' },
      nextBestAction: { id: 'a', label: 'go', href: '/g' },
      secondaryInsights: [{ id: 's1', title: 'tip', body: 'do this' }],
    });
    const more = v.collapsed.find((s) => s.id === 'more');
    expect(more?.items[0].kind).toBe('secondary');
  });

  it('is deterministic for identical input', () => {
    const input: TodayInput = { ...base, nextBestAction: { id: 'a', label: 'go', href: '/g' } };
    expect(buildTodayView(input)).toEqual(buildTodayView(input));
  });
});
