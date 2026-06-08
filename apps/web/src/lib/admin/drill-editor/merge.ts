// ============================================================
// SwingVantage Admin — Drill editor: merge & validation (pure)
// ------------------------------------------------------------
// The product's drills are defined in CODE (data/drills-content.ts and
// the DrillMatch catalog), so they cannot be safely rewritten at runtime
// in production. This editor follows the established override pattern
// (cf. /admin/benchmarks, feature-flag overrides): operators edit/create
// drills into a LOCAL-FIRST overlay for preview, then EXPORT the overlay
// as JSON to commit for a global change. No destructive writes to live
// data ever happen from the browser.
//
// This module is the pure brain: validate an edit, merge the overlay
// onto the code drills, roll up stats, and serialize for export. Fully
// unit testable; no client/store deps.
// ============================================================

export type DrillDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type DrillStatus = 'draft' | 'active' | 'retired';

/** Minimal shape of a code-defined drill the editor overlays onto. */
export interface BaseDrillLike {
  id: string;
  sport: string;
  name: string;
  category: string;
  difficulty: DrillDifficulty;
  targetFault: string;
  duration: string;
  /** 'Content' | 'DrillMatch' — where the base drill comes from. */
  sourceLabel: string;
}

/** One operator edit — either an override of a code drill or a brand-new custom drill. */
export interface DrillEdit {
  id: string;
  kind: 'override' | 'custom';
  /** For overrides, the base drill id this patches. */
  baseId?: string;
  name: string;
  sport: string;
  category: string;
  difficulty: DrillDifficulty;
  targetFault: string;
  duration: string;
  status: DrillStatus;
  updatedAt: string;
  updatedBy: string;
}

/** A drill as it would render after applying the overlay. */
export interface EffectiveDrill {
  id: string;
  sport: string;
  name: string;
  category: string;
  difficulty: DrillDifficulty;
  targetFault: string;
  duration: string;
  sourceLabel: string;
  status: DrillStatus;
  /** True when an override changes a code drill. */
  edited: boolean;
  /** True when the drill was created in the editor. */
  custom: boolean;
}

const DIFFICULTIES: DrillDifficulty[] = ['beginner', 'intermediate', 'advanced'];
const STATUSES: DrillStatus[] = ['draft', 'active', 'retired'];

/** Validate an edit. Returns a list of human-readable errors ([] = valid). */
export function validateDrillEdit(edit: Partial<DrillEdit>): string[] {
  const errors: string[] = [];
  if (!edit.name || edit.name.trim().length < 3) errors.push('Name is required (≥ 3 characters).');
  if (!edit.sport || !edit.sport.trim()) errors.push('Sport is required.');
  if (!edit.category || !edit.category.trim()) errors.push('Category is required.');
  if (!edit.difficulty || !DIFFICULTIES.includes(edit.difficulty)) errors.push('Difficulty must be beginner, intermediate or advanced.');
  if (!edit.targetFault || edit.targetFault.trim().length < 3) errors.push('Target fault is required.');
  if (!edit.duration || !edit.duration.trim()) errors.push('Duration is required.');
  if (edit.status && !STATUSES.includes(edit.status)) errors.push('Invalid status.');
  return errors;
}

/**
 * Merge the operator overlay onto the code drills. Overrides patch the
 * matching base drill (by baseId); customs are appended; status is honored.
 * Pure and deterministic — base order preserved, customs appended after.
 */
export function applyDrillEdits(base: BaseDrillLike[], edits: Record<string, DrillEdit>): EffectiveDrill[] {
  const overrideByBase = new Map<string, DrillEdit>();
  const customs: DrillEdit[] = [];
  for (const e of Object.values(edits)) {
    if (e.kind === 'override' && e.baseId) overrideByBase.set(e.baseId, e);
    else if (e.kind === 'custom') customs.push(e);
  }

  const baseEffective: EffectiveDrill[] = base.map((d) => {
    const o = overrideByBase.get(d.id);
    return {
      id: d.id,
      sport: o?.sport ?? d.sport,
      name: o?.name ?? d.name,
      category: o?.category ?? d.category,
      difficulty: o?.difficulty ?? d.difficulty,
      targetFault: o?.targetFault ?? d.targetFault,
      duration: o?.duration ?? d.duration,
      sourceLabel: d.sourceLabel,
      status: o?.status ?? 'active',
      edited: Boolean(o),
      custom: false,
    };
  });

  const customEffective: EffectiveDrill[] = customs
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => ({
      id: e.id,
      sport: e.sport,
      name: e.name,
      category: e.category,
      difficulty: e.difficulty,
      targetFault: e.targetFault,
      duration: e.duration,
      sourceLabel: 'Custom',
      status: e.status,
      edited: true,
      custom: true,
    }));

  return [...baseEffective, ...customEffective];
}

export interface DrillEditStats {
  total: number;
  active: number;
  draft: number;
  retired: number;
  custom: number;
  edited: number;
}

export function drillEditStats(effective: EffectiveDrill[]): DrillEditStats {
  return {
    total: effective.length,
    active: effective.filter((d) => d.status === 'active').length,
    draft: effective.filter((d) => d.status === 'draft').length,
    retired: effective.filter((d) => d.status === 'retired').length,
    custom: effective.filter((d) => d.custom).length,
    edited: effective.filter((d) => d.edited && !d.custom).length,
  };
}

/**
 * Serialize the overlay for committing globally. The shape is intentionally
 * simple so it can be pasted into a `drillOverrides.json` (or applied to
 * data/drills-content.ts) — the "make it global" step a developer commits.
 */
export function exportDrillEdits(edits: Record<string, DrillEdit>): string {
  const list = Object.values(edits).sort((a, b) => a.name.localeCompare(b.name));
  return JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), drillOverrides: list }, null, 2);
}
