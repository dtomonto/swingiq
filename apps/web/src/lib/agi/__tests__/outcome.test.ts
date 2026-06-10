// ============================================================
// AGI insight→outcome loop (intelligence upgrade Sprint 5, #21)
// ============================================================

import { assessCommitmentOutcome, rerankInsightsByOutcome } from '../outcome';
import type { AgiCommitment } from '../commitment';
import type { CapabilityId, Insight, ProgressReport } from '../types';

const CAP = 'sequencing' as CapabilityId;

function commitment(over: Partial<AgiCommitment> = {}): AgiCommitment {
  return {
    capability: CAP,
    name: 'Sequencing',
    committedAt: '2026-06-01T00:00:00Z',
    retestDueAt: '2026-06-15T00:00:00Z',
    drills: [],
    status: 'active',
    ...over,
  };
}

function progress(delta: number | null, capability: CapabilityId = CAP): ProgressReport {
  return {
    sinceDate: '2026-06-01T00:00:00Z',
    snapshots: 2,
    deltas: [{ capability, name: 'Sequencing', before: 50, after: delta === null ? 50 : 50 + delta, delta }],
    biggestImprover: null,
    biggestDecliner: null,
    keystoneMoved: null,
    summary: '',
  } as unknown as ProgressReport;
}

const insight = (capability: CapabilityId | null, leverage: number): Insight =>
  ({ id: capability ?? 'x', kind: 'keystone', capability, leverage } as unknown as Insight);

const NOW_BEFORE = '2026-06-10T00:00:00Z'; // before retest
const NOW_AFTER = '2026-06-20T00:00:00Z'; // after retest

describe('#21 assessCommitmentOutcome', () => {
  it('returns none with no commitment', () => {
    expect(assessCommitmentOutcome(null, progress(5)).outcome).toBe('none');
  });

  it('flags improvement and reinforces (factor > 1)', () => {
    const r = assessCommitmentOutcome(commitment(), progress(8), NOW_AFTER);
    expect(r.outcome).toBe('improving');
    expect(r.rerankFactor).toBeGreaterThan(1);
    expect(r.delta).toBe(8);
  });

  it('flags decline and demotes (factor < 1)', () => {
    const r = assessCommitmentOutcome(commitment(), progress(-8), NOW_AFTER);
    expect(r.outcome).toBe('declining');
    expect(r.rerankFactor).toBeLessThan(1);
  });

  it('treats small movement as flat (demotes only once retest is due)', () => {
    expect(assessCommitmentOutcome(commitment(), progress(1), NOW_BEFORE).outcome).toBe('flat');
    expect(assessCommitmentOutcome(commitment(), progress(1), NOW_BEFORE).rerankFactor).toBe(1);
    expect(assessCommitmentOutcome(commitment(), progress(1), NOW_AFTER).rerankFactor).toBeLessThan(1);
  });

  it('is too_early before the retest when there is no delta data, none after', () => {
    expect(assessCommitmentOutcome(commitment(), progress(null), NOW_BEFORE).outcome).toBe('too_early');
    expect(assessCommitmentOutcome(commitment(), null, NOW_AFTER).outcome).toBe('none');
  });
});

describe('#21 rerankInsightsByOutcome', () => {
  it('lifts a working focus above a competing insight and re-sorts', () => {
    const insights = [insight('rotation' as CapabilityId, 0.6), insight(CAP, 0.5)];
    const reranked = rerankInsightsByOutcome(insights, assessCommitmentOutcome(commitment(), progress(8), NOW_AFTER));
    expect(reranked[0].capability).toBe(CAP); // 0.5 * 1.25 = 0.625 > 0.6
  });

  it('is a no-op when the outcome factor is neutral', () => {
    const insights = [insight(CAP, 0.5)];
    const same = rerankInsightsByOutcome(insights, assessCommitmentOutcome(commitment(), progress(1), NOW_BEFORE));
    expect(same).toBe(insights);
  });
});
