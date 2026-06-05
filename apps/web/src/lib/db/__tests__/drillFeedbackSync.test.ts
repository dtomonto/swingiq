// ============================================================
// SwingVantage — drill_feedback cloud merge unit tests
// ============================================================

import { mergeDrillFeedback, recordId } from '../drillFeedbackSync';
import type { DrillFeedbackRecord } from '@/lib/drillmatch/types';

const rec = (
  drillId: string, recordedAt: string, value: DrillFeedbackRecord['value'] = 'helped',
): DrillFeedbackRecord => ({ drillId, faultId: 'f1', sport: 'golf', value, recordedAt });

describe('mergeDrillFeedback', () => {
  it('unions local + cloud and dedups by derived id', () => {
    const local = [rec('d1', '2026-06-01T00:00:00.000Z')];
    const cloud = [
      rec('d1', '2026-06-01T00:00:00.000Z'), // same id → dedup
      rec('d2', '2026-06-02T00:00:00.000Z'),
    ];
    const merged = mergeDrillFeedback(local, cloud);
    expect(merged.map((r) => r.drillId).sort()).toEqual(['d1', 'd2']);
  });

  it('keeps records that differ only by recordedAt (distinct verdicts)', () => {
    const local = [rec('d1', '2026-06-01T00:00:00.000Z')];
    const cloud = [rec('d1', '2026-06-03T00:00:00.000Z')];
    const merged = mergeDrillFeedback(local, cloud);
    expect(merged).toHaveLength(2);
  });

  it('local wins on an id collision', () => {
    const at = '2026-06-01T00:00:00.000Z';
    const local = [{ ...rec('d1', at), notes: 'mine' }];
    const cloud = [{ ...rec('d1', at), notes: 'theirs' }];
    const merged = mergeDrillFeedback(local, cloud);
    expect(merged).toHaveLength(1);
    expect(merged[0].notes).toBe('mine');
  });

  it('sorts by recordedAt and caps at 200 newest', () => {
    const many: DrillFeedbackRecord[] = Array.from({ length: 250 }, (_, i) =>
      rec(`d${i}`, `2026-01-01T00:00:${String(i % 60).padStart(2, '0')}.${String(i).padStart(3, '0')}Z`),
    );
    const merged = mergeDrillFeedback(many, []);
    expect(merged).toHaveLength(200);
    // ascending by recordedAt
    for (let i = 1; i < merged.length; i++) {
      expect(merged[i].recordedAt >= merged[i - 1].recordedAt).toBe(true);
    }
  });

  it('derives a stable id from content', () => {
    const r = rec('d1', '2026-06-01T00:00:00.000Z');
    expect(recordId(r)).toBe(recordId({ ...r }));
    expect(recordId(r)).not.toBe(recordId(rec('d1', '2026-06-02T00:00:00.000Z')));
  });
});
