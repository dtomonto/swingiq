// ============================================================
// SwingVantage Admin — Practice-plan template editor (pure)
// ------------------------------------------------------------
// Practice plans are GENERATED per athlete, so there is no static plan
// registry to edit. This introduces editable plan TEMPLATES via the same
// production-safe override pattern as the Drill Editor: the base
// templates are the REAL planner's representative outputs, the operator
// edits/creates/retires them into a LOCAL-FIRST overlay for preview, then
// EXPORTS the overlay as JSON to commit globally. No destructive writes
// to live data ever happen from the browser.
//
// Pure brain: validate, merge overlay onto base templates, roll up stats,
// (de)serialize the drills field and export. Fully unit testable.
// ============================================================

export type PlanStatus = 'draft' | 'active' | 'retired';

/** One drill line in a plan template. */
export interface PlanDrillLine {
  name: string;
  detail: string;
}

/** Minimal shape of a base (planner-generated) template the editor overlays. */
export interface BasePlanTemplate {
  id: string;
  name: string;
  sport: string;
  level: string;
  focus: string;
  minutes: number;
  warmup: string;
  drills: PlanDrillLine[];
  pressureTest: string;
  successMetric: string;
}

export interface PlanEdit {
  id: string;
  kind: 'override' | 'custom';
  baseId?: string;
  name: string;
  sport: string;
  level: string;
  focus: string;
  minutes: number;
  warmup: string;
  drills: PlanDrillLine[];
  pressureTest: string;
  successMetric: string;
  status: PlanStatus;
  updatedAt: string;
  updatedBy: string;
}

export interface EffectivePlan extends BasePlanTemplate {
  status: PlanStatus;
  edited: boolean;
  custom: boolean;
}

const STATUSES: PlanStatus[] = ['draft', 'active', 'retired'];

/** Validate a plan edit. Returns human-readable errors ([] = valid). */
export function validatePlanEdit(edit: Partial<PlanEdit>): string[] {
  const errors: string[] = [];
  if (!edit.name || edit.name.trim().length < 3) errors.push('Name is required (≥ 3 characters).');
  if (!edit.sport || !edit.sport.trim()) errors.push('Sport is required.');
  if (!edit.focus || edit.focus.trim().length < 3) errors.push('Focus is required.');
  if (!edit.minutes || edit.minutes < 5 || edit.minutes > 120) errors.push('Minutes must be between 5 and 120.');
  if (!edit.warmup || edit.warmup.trim().length < 3) errors.push('Warm-up is required.');
  if (!edit.drills || edit.drills.length === 0) errors.push('At least one drill is required.');
  if (edit.status && !STATUSES.includes(edit.status)) errors.push('Invalid status.');
  return errors;
}

/** Parse a textarea (one drill per line, "Name — detail") into drill lines. */
export function parseDrillLines(text: string): PlanDrillLine[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(' — ');
      if (idx === -1) return { name: line, detail: '' };
      return { name: line.slice(0, idx).trim(), detail: line.slice(idx + 3).trim() };
    });
}

/** Format drill lines back into editable textarea text. */
export function formatDrillLines(drills: PlanDrillLine[]): string {
  return drills.map((d) => (d.detail ? `${d.name} — ${d.detail}` : d.name)).join('\n');
}

/** Merge the operator overlay onto the base templates. Pure + deterministic. */
export function applyPlanEdits(base: BasePlanTemplate[], edits: Record<string, PlanEdit>): EffectivePlan[] {
  const overrideByBase = new Map<string, PlanEdit>();
  const customs: PlanEdit[] = [];
  for (const e of Object.values(edits)) {
    if (e.kind === 'override' && e.baseId) overrideByBase.set(e.baseId, e);
    else if (e.kind === 'custom') customs.push(e);
  }

  const baseEffective: EffectivePlan[] = base.map((t) => {
    const o = overrideByBase.get(t.id);
    return {
      id: t.id,
      name: o?.name ?? t.name,
      sport: o?.sport ?? t.sport,
      level: o?.level ?? t.level,
      focus: o?.focus ?? t.focus,
      minutes: o?.minutes ?? t.minutes,
      warmup: o?.warmup ?? t.warmup,
      drills: o?.drills ?? t.drills,
      pressureTest: o?.pressureTest ?? t.pressureTest,
      successMetric: o?.successMetric ?? t.successMetric,
      status: o?.status ?? 'active',
      edited: Boolean(o),
      custom: false,
    };
  });

  const customEffective: EffectivePlan[] = customs
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => ({
      id: e.id,
      name: e.name,
      sport: e.sport,
      level: e.level,
      focus: e.focus,
      minutes: e.minutes,
      warmup: e.warmup,
      drills: e.drills,
      pressureTest: e.pressureTest,
      successMetric: e.successMetric,
      status: e.status,
      edited: true,
      custom: true,
    }));

  return [...baseEffective, ...customEffective];
}

export interface PlanEditStats {
  total: number;
  active: number;
  draft: number;
  retired: number;
  custom: number;
  edited: number;
}

export function planEditStats(effective: EffectivePlan[]): PlanEditStats {
  return {
    total: effective.length,
    active: effective.filter((p) => p.status === 'active').length,
    draft: effective.filter((p) => p.status === 'draft').length,
    retired: effective.filter((p) => p.status === 'retired').length,
    custom: effective.filter((p) => p.custom).length,
    edited: effective.filter((p) => p.edited && !p.custom).length,
  };
}

/** Serialize the overlay for committing globally. */
export function exportPlanEdits(edits: Record<string, PlanEdit>): string {
  const list = Object.values(edits).sort((a, b) => a.name.localeCompare(b.name));
  return JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), planOverrides: list }, null, 2);
}
