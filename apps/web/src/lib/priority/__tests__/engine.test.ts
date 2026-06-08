import { computeAthletePriorities, snapshotFromResult, type DiagnosisLike, type PriorityInput } from '../engine';

const diag = (id: string, name: string, priority: string, confidence: number, sample = 12): DiagnosisLike => ({
  rule: { id, name, priority, likely_cause: `${name} cause` },
  confidence,
  sample_size: sample,
});

const NOW = '2026-03-01T00:00:00Z';

describe('computeAthletePriorities', () => {
  it('flags insufficient data with no sessions', () => {
    const r = computeAthletePriorities({ sessions: [], now: NOW });
    expect(r.insufficientData).toBe(true);
    expect(r.top).toBeNull();
  });

  it('synthesizes across sessions — a recurring fault outranks a one-off', () => {
    const input: PriorityInput = {
      now: NOW,
      hasClubFaceData: true,
      sessions: [
        { id: 's-recent', date: '2026-02-28T00:00:00Z', diagnoses: [diag('slice', 'Slice', 'critical', 80)] },
        { id: 's-old', date: '2026-01-01T00:00:00Z', diagnoses: [diag('slice', 'Slice', 'high', 60), diag('fat', 'Fat contact', 'medium', 70)] },
      ],
    };
    const r = computeAthletePriorities(input);
    expect(r.top!.id).toBe('slice');
    expect(r.top!.occurrences).toBe(2);
    expect(r.secondary!.id).toBe('fat');
    // slice rose in confidence and persists into the latest session → worsening.
    expect(r.top!.trend).toBe('worsening');
    // fat only appeared in the older session → no longer top of mind.
    expect(r.all.find((p) => p.id === 'fat')!.trend).toBe('improving');
  });

  it('does not let one stale session dominate over a fresh one', () => {
    // Same severity/confidence; the RECENT issue must outrank the old one.
    const r = computeAthletePriorities({
      now: NOW,
      hasClubFaceData: true,
      sessions: [
        { id: 'new', date: '2026-02-25T00:00:00Z', diagnoses: [diag('thin', 'Thin', 'high', 70)] },
        { id: 'old', date: '2025-10-01T00:00:00Z', diagnoses: [diag('hook', 'Hook', 'high', 70)] },
      ],
    });
    expect(r.top!.id).toBe('thin');
  });

  it('adds a club-gapping priority when the bag grade is poor', () => {
    const r = computeAthletePriorities({
      now: NOW, hasClubFaceData: true,
      sessions: [{ id: 's', date: '2026-02-28T00:00:00Z', diagnoses: [] }],
      gapping: { grade: 'D', summary: 'Big gap between 4-iron and 6-iron.' },
    });
    const gap = r.all.find((p) => p.id === 'club_gapping');
    expect(gap).toBeDefined();
    expect(gap!.severity).toBe('high');
    expect(gap!.recommendedPlanHref).toBe('/bag');
  });

  it('reports honest missing-data hints', () => {
    const r = computeAthletePriorities({
      now: NOW, hasClubFaceData: false,
      sessions: [{ id: 's', date: '2026-02-28T00:00:00Z', diagnoses: [diag('slice', 'Slice', 'high', 70, 6)] }],
    });
    expect(r.whatsMissing.join(' ')).toMatch(/club \+ face data/i);
    expect(r.whatsMissing.join(' ')).toMatch(/video/i);
    expect(r.whatsMissing.join(' ')).toMatch(/more shots/i); // sample 6 < 12
  });

  it('describes what changed vs the previous snapshot', () => {
    const base: PriorityInput = {
      now: NOW, hasClubFaceData: true,
      sessions: [{ id: 's', date: '2026-02-28T00:00:00Z', diagnoses: [diag('slice', 'Slice', 'critical', 80)] }],
    };
    expect(computeAthletePriorities({ ...base, previous: null }).whatChanged).toMatch(/top priority/i);
    expect(computeAthletePriorities({ ...base, previous: { date: '', topId: 'fat', topLabel: 'Fat contact', secondaryId: null } }).whatChanged)
      .toMatch(/changed from "Fat contact" to "Slice"/);
    expect(computeAthletePriorities({ ...base, previous: { date: '', topId: 'slice', topLabel: 'Slice', secondaryId: null } }).whatChanged)
      .toMatch(/Still your #1/);
  });

  it('snapshotFromResult captures top + secondary ids', () => {
    const r = computeAthletePriorities({
      now: NOW, hasClubFaceData: true,
      sessions: [{ id: 's', date: '2026-02-28T00:00:00Z', diagnoses: [diag('slice', 'Slice', 'critical', 80), diag('fat', 'Fat', 'medium', 60)] }],
    });
    const snap = snapshotFromResult(r);
    expect(snap.topId).toBe('slice');
    expect(snap.secondaryId).toBe('fat');
  });
});
