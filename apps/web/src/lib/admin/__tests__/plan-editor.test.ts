// Practice-plan template editor — pure merge/validation tests.

import {
  validatePlanEdit, applyPlanEdits, planEditStats, exportPlanEdits,
  parseDrillLines, formatDrillLines,
  type BasePlanTemplate, type PlanEdit,
} from '../plan-editor/merge';

const base: BasePlanTemplate[] = [
  {
    id: 'golf-beginner', name: 'Golf — Beginner', sport: 'golf', level: 'Beginner', focus: 'Club path',
    minutes: 20, warmup: 'Easy reps.', drills: [{ name: 'Gate drill', detail: '12 reps — feel the path' }],
    pressureTest: 'Call your target.', successMetric: '6 of 10 match.',
  },
];

const edit = (over: Partial<PlanEdit>): PlanEdit => ({
  id: 'e1', kind: 'custom', name: 'Putting Lab', sport: 'golf', level: 'Custom', focus: 'Lag putting',
  minutes: 25, warmup: 'Roll 10 easy putts.', drills: [{ name: 'Ladder drill', detail: '3 sets' }],
  pressureTest: 'Make 5 in a row.', successMetric: 'No 3-putts.', status: 'draft',
  updatedAt: '2026-06-08T00:00:00Z', updatedBy: 'admin', ...over,
});

describe('validatePlanEdit', () => {
  it('passes a complete edit', () => { expect(validatePlanEdit(edit({}))).toEqual([]); });
  it('flags missing fields and bad minutes', () => {
    const errs = validatePlanEdit({ name: 'ok name', sport: '', minutes: 999, drills: [] });
    expect(errs.some((e) => e.includes('Sport'))).toBe(true);
    expect(errs.some((e) => e.includes('Minutes'))).toBe(true);
    expect(errs.some((e) => e.includes('drill'))).toBe(true);
  });
});

describe('drill line parse/format round-trip', () => {
  it('parses "Name — detail" and reformats', () => {
    const lines = parseDrillLines('Gate drill — 12 reps\nShadow swing');
    expect(lines).toEqual([{ name: 'Gate drill', detail: '12 reps' }, { name: 'Shadow swing', detail: '' }]);
    expect(formatDrillLines(lines)).toBe('Gate drill — 12 reps\nShadow swing');
  });
});

describe('applyPlanEdits', () => {
  it('base templates are active with no edits', () => {
    const eff = applyPlanEdits(base, {});
    expect(eff.length).toBe(1);
    expect(eff[0].status).toBe('active');
    expect(eff[0].edited).toBe(false);
  });
  it('overrides a base template', () => {
    const edits = { o1: edit({ id: 'o1', kind: 'override', baseId: 'golf-beginner', focus: 'Tempo', status: 'active' }) };
    const eff = applyPlanEdits(base, edits);
    expect(eff[0].focus).toBe('Tempo');
    expect(eff[0].edited).toBe(true);
  });
  it('appends a custom plan and honors retired', () => {
    const edits = {
      c1: edit({ id: 'c1', kind: 'custom', status: 'draft' }),
      o1: edit({ id: 'o1', kind: 'override', baseId: 'golf-beginner', status: 'retired' }),
    };
    const eff = applyPlanEdits(base, edits);
    expect(eff.length).toBe(2);
    expect(eff.find((p) => p.id === 'golf-beginner')!.status).toBe('retired');
    expect(eff.find((p) => p.id === 'c1')!.custom).toBe(true);
  });
});

describe('planEditStats & export', () => {
  it('rolls up counts', () => {
    const stats = planEditStats(applyPlanEdits(base, { c1: edit({ id: 'c1', kind: 'custom', status: 'draft' }) }));
    expect(stats.total).toBe(2);
    expect(stats.custom).toBe(1);
    expect(stats.active).toBe(1);
    expect(stats.draft).toBe(1);
  });
  it('exports a versioned overlay', () => {
    const parsed = JSON.parse(exportPlanEdits({ c1: edit({ id: 'c1' }) }));
    expect(parsed.version).toBe(1);
    expect(parsed.planOverrides[0].name).toBe('Putting Lab');
  });
});
