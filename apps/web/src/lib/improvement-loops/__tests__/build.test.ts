import { buildImprovementLoops, aggregateDrillEffectiveness, drillFaultTrackRecord } from '../build';
import type { DrillFeedbackRecord, DrillFeedbackValue } from '@/lib/drillmatch';
import type { RetestResult, RetestOutcome } from '@/lib/retest';
import type { SportId } from '@swingiq/core';

// Deterministic, ontology-independent fault names so assertions are stable.
const NAMES: Record<string, string> = {
  fault_a: 'Slicing',
  fault_b: 'Chunking',
};
const resolveFaultName = (id: string): string => NAMES[id] ?? id;

function fb(o: {
  value: DrillFeedbackValue;
  drillId?: string;
  faultId?: string;
  sport?: SportId;
  recordedAt?: string;
  notes?: string;
}): DrillFeedbackRecord {
  return {
    drillId: o.drillId ?? 'drill_x',
    faultId: o.faultId ?? 'fault_a',
    sport: o.sport ?? 'golf',
    value: o.value,
    notes: o.notes,
    recordedAt: o.recordedAt ?? '2026-06-01T00:00:00.000Z',
  };
}

function retest(o: { sport?: SportId; priorFocus: string; outcome: RetestOutcome; currentDate?: string }): RetestResult {
  return {
    id: `r-${o.priorFocus}`,
    sport: o.sport ?? 'golf',
    sportLabel: 'Golf',
    priorFocus: o.priorFocus,
    priorDate: '2026-05-01T00:00:00.000Z',
    currentDate: o.currentDate ?? '2026-06-05T00:00:00.000Z',
    comparison: {
      outcome: o.outcome,
      headline: 'h',
      detail: 'd',
      sameConditionsMet: true,
      cautions: [],
      confidenceNote: 'directional',
    },
  };
}

describe('buildImprovementLoops', () => {
  it('groups feedback into one loop per (sport, fault), newest activity first', () => {
    const loops = buildImprovementLoops({
      resolveFaultName,
      retests: [],
      feedback: [
        fb({ faultId: 'fault_a', value: 'helped', recordedAt: '2026-06-01T00:00:00.000Z' }),
        fb({ faultId: 'fault_b', value: 'no_change', recordedAt: '2026-06-03T00:00:00.000Z' }),
      ],
    });
    expect(loops).toHaveLength(2);
    // fault_b updated more recently → first.
    expect(loops[0].faultId).toBe('fault_b');
    expect(loops[0].faultName).toBe('Chunking');
    expect(loops[1].id).toBe('golf:fault_a');
  });

  it('dedupes a drill across attempts, keeping the latest verdict + count', () => {
    const [loop] = buildImprovementLoops({
      resolveFaultName,
      retests: [],
      feedback: [
        fb({ drillId: 'd1', value: 'no_change', recordedAt: '2026-06-01T00:00:00.000Z' }),
        fb({ drillId: 'd1', value: 'helped', recordedAt: '2026-06-04T00:00:00.000Z' }),
      ],
    });
    expect(loop.drills).toHaveLength(1);
    expect(loop.drills[0].attempts).toBe(2);
    expect(loop.drills[0].verdict).toBe('helped'); // latest wins
    expect(loop.startedAt).toBe('2026-06-01T00:00:00.000Z');
    expect(loop.updatedAt).toBe('2026-06-04T00:00:00.000Z');
  });

  it('attaches a matching retest outcome and flips the stage to retested', () => {
    const [loop] = buildImprovementLoops({
      resolveFaultName,
      feedback: [fb({ faultId: 'fault_a', value: 'helped' })],
      retests: [retest({ priorFocus: 'Slicing off the tee', outcome: 'improved' })],
    });
    expect(loop.stage).toBe('retested');
    expect(loop.retestOutcome).toBe('improved');
    expect(loop.outcomeLabel).toMatch(/improved/i);
  });

  it('does not cross-match a retest from a different sport', () => {
    const [loop] = buildImprovementLoops({
      resolveFaultName,
      feedback: [fb({ faultId: 'fault_a', sport: 'golf', value: 'helped' })],
      retests: [retest({ sport: 'tennis', priorFocus: 'Slicing', outcome: 'improved' })],
    });
    expect(loop.retestOutcome).toBeNull();
    expect(loop.stage).toBe('practicing');
  });

  it('summarizes the practicing outcome honestly when no retest exists', () => {
    const helped = buildImprovementLoops({ resolveFaultName, retests: [], feedback: [fb({ value: 'helped' })] });
    expect(helped[0].outcomeLabel).toMatch(/helped/i);

    const flat = buildImprovementLoops({ resolveFaultName, retests: [], feedback: [fb({ value: 'no_change' })] });
    expect(flat[0].outcomeLabel).toMatch(/no change/i);

    const hurt = buildImprovementLoops({ resolveFaultName, retests: [], feedback: [fb({ value: 'hurt' })] });
    expect(hurt[0].outcomeLabel).toMatch(/gentler/i);
  });

  it('returns nothing when there is no feedback', () => {
    expect(buildImprovementLoops({ resolveFaultName, retests: [], feedback: [] })).toEqual([]);
  });
});

describe('aggregateDrillEffectiveness', () => {
  it('counts verdicts per (sport, fault, drill) and computes a help rate', () => {
    const rows = aggregateDrillEffectiveness(
      [
        fb({ drillId: 'd1', faultId: 'fault_a', value: 'helped' }),
        fb({ drillId: 'd1', faultId: 'fault_a', value: 'helped' }),
        fb({ drillId: 'd1', faultId: 'fault_a', value: 'no_change' }),
        fb({ drillId: 'd2', faultId: 'fault_a', value: 'hurt' }),
      ],
      resolveFaultName,
    );
    expect(rows).toHaveLength(2);
    const d1 = rows.find((r) => r.drillId === 'd1')!;
    expect(d1.total).toBe(3);
    expect(d1.helped).toBe(2);
    expect(d1.noChange).toBe(1);
    expect(d1.helpRate).toBeCloseTo(2 / 3);
    expect(d1.faultName).toBe('Slicing');
    // Most-tried drill sorts first.
    expect(rows[0].drillId).toBe('d1');
  });
});

describe('drillFaultTrackRecord', () => {
  it('returns null when there is no history with this drill+fault', () => {
    expect(drillFaultTrackRecord([], 'golf', 'fault_a', 'd1')).toBeNull();
    expect(
      drillFaultTrackRecord([fb({ drillId: 'd1', faultId: 'fault_a', value: 'helped' })], 'golf', 'fault_a', 'd2'),
    ).toBeNull();
  });

  it("summarizes the athlete's verdicts for a drill+fault, newest verdict last", () => {
    const rec = drillFaultTrackRecord(
      [
        fb({ drillId: 'd1', faultId: 'fault_a', value: 'helped', recordedAt: '2026-06-01T00:00:00.000Z' }),
        fb({ drillId: 'd1', faultId: 'fault_a', value: 'no_change', recordedAt: '2026-06-02T00:00:00.000Z' }),
        fb({ drillId: 'd1', faultId: 'fault_a', value: 'helped', recordedAt: '2026-06-03T00:00:00.000Z' }),
      ],
      'golf',
      'fault_a',
      'd1',
    );
    expect(rec).not.toBeNull();
    expect(rec!.total).toBe(3);
    expect(rec!.helped).toBe(2);
    expect(rec!.noChange).toBe(1);
    expect(rec!.helpRate).toBeCloseTo(2 / 3);
    expect(rec!.latestVerdict).toBe('helped');
  });

  it('does not mix other sports, faults, or drills', () => {
    const feedback = [
      fb({ drillId: 'd1', faultId: 'fault_a', sport: 'golf', value: 'helped' }),
      fb({ drillId: 'd1', faultId: 'fault_a', sport: 'tennis', value: 'hurt' }),
      fb({ drillId: 'd1', faultId: 'fault_b', sport: 'golf', value: 'hurt' }),
      fb({ drillId: 'd2', faultId: 'fault_a', sport: 'golf', value: 'hurt' }),
    ];
    const rec = drillFaultTrackRecord(feedback, 'golf', 'fault_a', 'd1');
    expect(rec!.total).toBe(1);
    expect(rec!.helped).toBe(1);
    expect(rec!.hurt).toBe(0);
  });
});
