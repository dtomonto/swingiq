// ============================================================
// SwingIQ — Motion Lab: coach/team roster aggregation tests
// ------------------------------------------------------------
// Pure logic only (no localStorage): summarizeAthlete + buildCoachView.
// ============================================================

import { summarizeAthlete, buildCoachView, type Athlete } from '../roster';
import type { MotionSession } from '../types';

const NOW = Date.parse('2026-06-04T00:00:00Z');
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();

function session(athleteId: string | null, overall: number, keyFault: string, createdAt: string): MotionSession {
  return {
    id: Math.random().toString(36).slice(2),
    createdAt,
    capture: { sport: 'golf' },
    sportLabel: 'Golf',
    motionLabel: 'Driver',
    emoji: '⛳',
    scoreboard: { overall, confidence: 0.6 },
    keyFault,
    athleteId,
  } as unknown as MotionSession;
}

const ath = (id: string, name: string): Athlete => ({ id, name, createdAt: daysAgo(30) });

describe('summarizeAthlete', () => {
  it('flags an athlete with no sessions as needing attention', () => {
    const s = summarizeAthlete(ath('a', 'Sam'), [], NOW);
    expect(s.sessionCount).toBe(0);
    expect(s.averageOverall).toBeNull();
    expect(s.needsAttention).toBe(true);
  });

  it('aggregates average, best, improvement, and recurring faults', () => {
    const s = summarizeAthlete(
      ath('a', 'Sam'),
      [
        session('a', 60, 'Early extension', daysAgo(10)),
        session('a', 70, 'Early extension', daysAgo(5)),
        session('a', 80, 'Over the top', daysAgo(1)),
      ],
      NOW,
    );
    expect(s.sessionCount).toBe(3);
    expect(s.averageOverall).toBe(70);
    expect(s.bestOverall).toBe(80);
    expect(s.improvement).toBe(20); // latest 80 − first 60
    expect(s.trend.map((t) => t.overall)).toEqual([60, 70, 80]); // oldest → newest
    expect(s.recurringFaults[0]).toEqual({ fault: 'Early extension', count: 2 });
    expect(s.daysSinceActive).toBe(1);
    expect(s.needsAttention).toBe(false);
  });

  it('flags a stale athlete (no recent upload)', () => {
    const s = summarizeAthlete(ath('a', 'Sam'), [session('a', 75, 'Sway', daysAgo(20))], NOW);
    expect(s.needsAttention).toBe(true);
  });

  it('flags a clearly declining athlete even if recent', () => {
    const s = summarizeAthlete(
      ath('a', 'Sam'),
      [session('a', 82, 'Sway', daysAgo(4)), session('a', 70, 'Sway', daysAgo(1))],
      NOW,
    );
    expect(s.improvement).toBe(-12);
    expect(s.needsAttention).toBe(true);
  });
});

describe('buildCoachView', () => {
  const athletes = [ath('a', 'Sam'), ath('b', 'Riley')];
  const sessions = [
    session('a', 60, 'Early extension', daysAgo(6)),
    session('a', 72, 'Early extension', daysAgo(2)),
    session('b', 55, 'Early extension', daysAgo(3)),
    session(null, 40, 'Casting', daysAgo(1)), // unassigned
  ];

  it('groups sessions by athlete and separates unassigned', () => {
    const view = buildCoachView(athletes, sessions, NOW);
    expect(view.athletes).toHaveLength(2);
    expect(view.unassigned).toHaveLength(1);
    expect(view.team.totalSessions).toBe(3); // unassigned not counted toward athletes
  });

  it('aggregates the most common weakness from each athlete latest session', () => {
    const view = buildCoachView(athletes, sessions, NOW);
    // Sam latest = Early extension, Riley latest = Early extension → count 2
    expect(view.team.aggregateWeaknesses[0]).toEqual({ fault: 'Early extension', count: 2 });
  });

  it('counts recently-active athletes and overall team average', () => {
    const view = buildCoachView(athletes, sessions, NOW);
    expect(view.team.recentlyActiveCount).toBe(2); // both uploaded within 7 days
    expect(view.team.averageOverall).not.toBeNull();
  });
});
