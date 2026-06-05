// ============================================================
// SwingVantage — Retest Engine: Golf Derivation Tests
// ------------------------------------------------------------
// Golf uses launch-monitor sessions + each diagnosis's own
// RetestProtocol. Because the data is statistical, the comparator
// is allowed to flag regression under matched conditions.
// ============================================================

import type { LocalSession } from '@/store';
import {
  deriveGolfRetestTargets,
  deriveGolfRetestResults,
  compareGolfSessions,
} from '..';
import type { RetestStoreState } from '..';

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const EMPTY_STORE: RetestStoreState = {
  version: 1,
  dismissedTargetIds: [],
  acknowledgedResultIds: [],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function diag(id: string, name: string, confidence: number, sampleSize = 12): any {
  return {
    rule: {
      id,
      name,
      retest: {
        shot_count: 10,
        club: 'Driver',
        focus_metrics: ['face_to_path'],
        success_criteria: 'Tighter start direction',
        notes: '',
      },
    },
    confidence,
    raw_confidence: confidence,
    sample_size: sampleSize,
    stats: {},
    supporting_data: [],
  };
}

function session(o: {
  id: string;
  createdAt: string;
  diagnoses?: unknown[];
  club_category?: string;
  swing_score?: number;
}): LocalSession {
  return {
    id: o.id,
    name: 'S',
    date: o.createdAt,
    sport: 'golf',
    club_name: 'Driver',
    club_category: o.club_category ?? 'driver',
    launch_monitor: '',
    indoor_outdoor: 'indoor',
    mat_or_grass: 'mat',
    notes: '',
    shot_count: 12,
    shots: [],
    diagnoses: (o.diagnoses ?? []) as never,
    swing_score: o.swing_score ?? 70,
    created_at: o.createdAt,
  } as unknown as LocalSession;
}

describe('golf open retest targets', () => {
  it('derives a target from the latest diagnosed session, using the protocol', () => {
    const sessions = [session({ id: 'g1', createdAt: daysAgo(2), diagnoses: [diag('slice_weak_fade', 'Slice / Weak Fade', 70)] })];
    const targets = deriveGolfRetestTargets(sessions, EMPTY_STORE);
    expect(targets).toHaveLength(1);
    expect(targets[0].faultName).toBe('Slice / Weak Fade');
    expect(targets[0].sameConditions).toContain('Same club (Driver)');
    expect(targets[0].whatToReassess).toMatch(/start direction/i);
  });

  it('ignores sessions whose only diagnosis is "optimal"', () => {
    const sessions = [session({ id: 'g1', createdAt: daysAgo(1), diagnoses: [diag('optimal', 'Optimal', 90)] })];
    expect(deriveGolfRetestTargets(sessions, EMPTY_STORE)).toHaveLength(0);
  });

  it('respects dismissals', () => {
    const sessions = [session({ id: 'g1', createdAt: daysAgo(1), diagnoses: [diag('pull', 'Pull', 65)] })];
    const store: RetestStoreState = { ...EMPTY_STORE, dismissedTargetIds: ['g1'] };
    expect(deriveGolfRetestTargets(sessions, store)).toHaveLength(0);
  });
});

describe('golf comparison', () => {
  const prev = session({ id: 'p', createdAt: daysAgo(10), diagnoses: [diag('slice_weak_fade', 'Slice', 70)] });

  it('improved when the prior issue is gone (same club)', () => {
    const curr = session({ id: 'c', createdAt: daysAgo(1), diagnoses: [diag('fat_contact', 'Fat Contact', 55)] });
    expect(compareGolfSessions(prev, curr).outcome).toBe('improved');
  });

  it('persisting when the same issue is still #1', () => {
    const curr = session({ id: 'c', createdAt: daysAgo(1), diagnoses: [diag('slice_weak_fade', 'Slice', 68)] });
    expect(compareGolfSessions(prev, curr).outcome).toBe('persisting');
  });

  it('regressed when the same issue registers materially stronger (same club)', () => {
    const curr = session({ id: 'c', createdAt: daysAgo(1), diagnoses: [diag('slice_weak_fade', 'Slice', 90)] });
    expect(compareGolfSessions(prev, curr).outcome).toBe('regressed');
  });

  it('inconclusive when the club type changed', () => {
    const curr = session({
      id: 'c',
      createdAt: daysAgo(1),
      club_category: 'iron',
      diagnoses: [diag('fat_contact', 'Fat Contact', 55)],
    });
    const c = compareGolfSessions(prev, curr);
    expect(c.outcome).toBe('inconclusive');
    expect(c.sameConditionsMet).toBe(false);
    expect(c.cautions.length).toBeGreaterThan(0);
  });
});

describe('golf results derivation', () => {
  it('produces a result only with two diagnosed sessions', () => {
    const one = [session({ id: 'g1', createdAt: daysAgo(1), diagnoses: [diag('pull', 'Pull', 60)] })];
    expect(deriveGolfRetestResults(one, EMPTY_STORE)).toHaveLength(0);

    const two = [
      session({ id: 'g2', createdAt: daysAgo(1), diagnoses: [diag('push', 'Push', 50)] }),
      session({ id: 'g1', createdAt: daysAgo(12), diagnoses: [diag('pull', 'Pull', 60)] }),
    ];
    const results = deriveGolfRetestResults(two, EMPTY_STORE);
    expect(results).toHaveLength(1);
    expect(results[0].priorFocus).toBe('Pull');
  });
});
