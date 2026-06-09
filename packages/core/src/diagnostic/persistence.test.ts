// ============================================================
// Cross-session fault persistence (intelligence upgrade Sprint 1, #15)
// ============================================================

import {
  assessFaultPersistence,
  persistenceWeightedConfidence,
  type PersistentFault,
} from './persistence';
import type { DiagnosticResult } from './engine';
import type { DiagnosisCategory } from '../types';

// Minimal DiagnosticResult for the pure persistence layer — it only reads
// `diagnoses[].rule.{id,name}`.
function result(ids: DiagnosisCategory[]): DiagnosticResult {
  const diagnoses = ids.map((id) => ({ rule: { id, name: `${id} fault` } }));
  return {
    stats: {} as DiagnosticResult['stats'],
    diagnoses: diagnoses as unknown as DiagnosticResult['diagnoses'],
    primary: (diagnoses[0] ?? null) as DiagnosticResult['primary'],
    secondary: [],
  };
}

const find = (a: { faults: PersistentFault[] }, id: DiagnosisCategory) =>
  a.faults.find((f) => f.id === id)!;

describe('#15 assessFaultPersistence', () => {
  it('labels a fault present in every session as chronic (boost ≥1.3)', () => {
    const a = assessFaultPersistence(result(['slice_weak_fade']), [
      ['slice_weak_fade'], ['slice_weak_fade'], ['slice_weak_fade'], ['slice_weak_fade'],
    ]);
    const f = find(a, 'slice_weak_fade');
    expect(f.persistence).toBe('chronic');
    expect(f.persistenceFactor).toBeGreaterThanOrEqual(1.3);
    expect(f.occurrences).toBe(5);
    expect(a.chronic.map((x) => x.id)).toContain('slice_weak_fade');
  });

  it('labels ≥60% recurrence as persistent', () => {
    const a = assessFaultPersistence(result(['slice_weak_fade']), [
      ['slice_weak_fade'], ['slice_weak_fade'], ['pull'], ['pull'],
    ]);
    expect(find(a, 'slice_weak_fade').persistence).toBe('persistent');
  });

  it('labels occasional recurrence as intermittent', () => {
    const a = assessFaultPersistence(result(['slice_weak_fade']), [
      ['slice_weak_fade'], ['pull'], ['pull'], ['pull'],
    ]);
    expect(find(a, 'slice_weak_fade').persistence).toBe('intermittent');
    expect(find(a, 'slice_weak_fade').persistenceFactor).toBe(1.0);
  });

  it('labels a today-only fault as new (slightly discounted) and lists it as emerging', () => {
    const a = assessFaultPersistence(result(['slice_weak_fade']), [
      ['pull'], ['pull'], ['pull'], ['pull'],
    ]);
    const f = find(a, 'slice_weak_fade');
    expect(f.persistence).toBe('new');
    expect(f.persistenceFactor).toBeLessThan(1);
    expect(f.inCurrent).toBe(true);
    expect(a.emerging.map((x) => x.id)).toContain('slice_weak_fade');
  });

  it('tracks faults that recur in priors but are absent today (inCurrent=false)', () => {
    const a = assessFaultPersistence(result(['slice_weak_fade']), [
      ['hook_strong_draw'], ['hook_strong_draw'], ['hook_strong_draw'],
    ]);
    const hook = find(a, 'hook_strong_draw');
    expect(hook.inCurrent).toBe(false);
    expect(a.emerging.map((x) => x.id)).not.toContain('hook_strong_draw');
  });

  it('respects the window option', () => {
    const a = assessFaultPersistence(result(['slice_weak_fade']), [
      ['slice_weak_fade'], ['slice_weak_fade'], ['slice_weak_fade'], ['slice_weak_fade'],
    ], { window: 3 });
    expect(a.windowSize).toBe(3);
    expect(find(a, 'slice_weak_fade').totalSessions).toBe(3);
  });

  it('de-dupes a fault repeated within a single session', () => {
    const a = assessFaultPersistence(result(['slice_weak_fade', 'slice_weak_fade']), []);
    expect(find(a, 'slice_weak_fade').occurrences).toBe(1);
  });

  it('sorts most-persistent first', () => {
    const a = assessFaultPersistence(result(['slice_weak_fade', 'pull']), [
      ['slice_weak_fade'], ['slice_weak_fade'], ['slice_weak_fade'],
    ]);
    expect(a.faults[0].id).toBe('slice_weak_fade'); // chronic ranks ahead of new
  });
});

describe('#15 persistenceWeightedConfidence', () => {
  it('boosts chronic and clamps at 100', () => {
    const chronic = { persistenceFactor: 1.3 } as PersistentFault;
    expect(persistenceWeightedConfidence(90, chronic)).toBe(100);
    expect(persistenceWeightedConfidence(60, chronic)).toBe(78);
  });
  it('discounts a brand-new fault', () => {
    const fresh = { persistenceFactor: 0.95 } as PersistentFault;
    expect(persistenceWeightedConfidence(80, fresh)).toBe(76);
  });
});
