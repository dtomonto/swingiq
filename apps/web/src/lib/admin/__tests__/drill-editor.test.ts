// Drill editor — pure merge/validation tests.

import {
  validateDrillEdit,
  applyDrillEdits,
  drillEditStats,
  exportDrillEdits,
  type BaseDrillLike,
  type DrillEdit,
} from '../drill-editor/merge';

const base: BaseDrillLike[] = [
  { id: 'golf-gate', sport: 'golf', name: 'Gate Drill', category: 'Club Path', difficulty: 'beginner', targetFault: 'Slice', duration: '10 min', sourceLabel: 'Content' },
  { id: 'tennis-shadow', sport: 'tennis', name: 'Shadow Swing', category: 'Form', difficulty: 'beginner', targetFault: 'Late prep', duration: '5 min', sourceLabel: 'DrillMatch' },
];

const edit = (over: Partial<DrillEdit>): DrillEdit => ({
  id: 'e1', kind: 'custom', name: 'Wall Drill', sport: 'golf', category: 'Tempo',
  difficulty: 'intermediate', targetFault: 'Casting', duration: '8 min',
  status: 'draft', updatedAt: '2026-06-08T00:00:00Z', updatedBy: 'admin', ...over,
});

describe('validateDrillEdit', () => {
  it('passes a complete edit', () => {
    expect(validateDrillEdit(edit({}))).toEqual([]);
  });
  it('flags missing/short fields', () => {
    const errs = validateDrillEdit({ name: 'x', sport: '', difficulty: 'beginner' });
    expect(errs.length).toBeGreaterThan(0);
    expect(errs.some((e) => e.includes('Name'))).toBe(true);
    expect(errs.some((e) => e.includes('Sport'))).toBe(true);
  });
});

describe('applyDrillEdits', () => {
  it('returns base drills as active when there are no edits', () => {
    const eff = applyDrillEdits(base, {});
    expect(eff.length).toBe(2);
    expect(eff.every((d) => d.status === 'active' && !d.edited && !d.custom)).toBe(true);
  });

  it('applies an override to a base drill', () => {
    const edits = { o1: edit({ id: 'o1', kind: 'override', baseId: 'golf-gate', name: 'Gate Drill v2', status: 'active' }) };
    const eff = applyDrillEdits(base, edits);
    const gate = eff.find((d) => d.id === 'golf-gate')!;
    expect(gate.name).toBe('Gate Drill v2');
    expect(gate.edited).toBe(true);
    expect(gate.custom).toBe(false);
  });

  it('appends a custom drill and honors retired status', () => {
    const edits = {
      c1: edit({ id: 'c1', kind: 'custom', name: 'Wall Drill', status: 'draft' }),
      o1: edit({ id: 'o1', kind: 'override', baseId: 'tennis-shadow', status: 'retired' }),
    };
    const eff = applyDrillEdits(base, edits);
    expect(eff.length).toBe(3); // 2 base + 1 custom
    expect(eff.find((d) => d.id === 'c1')!.custom).toBe(true);
    expect(eff.find((d) => d.id === 'tennis-shadow')!.status).toBe('retired');
  });
});

describe('drillEditStats', () => {
  it('rolls up status, custom and edited counts', () => {
    const edits = {
      c1: edit({ id: 'c1', kind: 'custom', status: 'draft' }),
      o1: edit({ id: 'o1', kind: 'override', baseId: 'golf-gate', status: 'retired' }),
    };
    const stats = drillEditStats(applyDrillEdits(base, edits));
    expect(stats.total).toBe(3);
    expect(stats.custom).toBe(1);
    expect(stats.edited).toBe(1);
    expect(stats.retired).toBe(1);
    expect(stats.draft).toBe(1);
    expect(stats.active).toBe(1); // tennis-shadow untouched
  });
});

describe('exportDrillEdits', () => {
  it('serializes a versioned, committable overlay', () => {
    const json = exportDrillEdits({ c1: edit({ id: 'c1' }) });
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(1);
    expect(Array.isArray(parsed.drillOverrides)).toBe(true);
    expect(parsed.drillOverrides[0].name).toBe('Wall Drill');
  });
});
