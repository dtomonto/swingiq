// ============================================================
// Admin decision rollout plans — client-only localStorage helpers
// ------------------------------------------------------------
// Persists the operator's intended staged-rollout plan for a decision:
// the rollout step (50 / 75 / 100 %) and whether to auto-verify after each
// step. This is a LOCAL intent/note — the actual staged rollout always runs
// in the native tool the decision links to; nothing here executes a change.
// Pure + defensive (never throws); machine-local, no PII.
// ============================================================

const KEY = 'swingiq-admin-decision-rollout-v1';

export type RolloutStep = 50 | 75 | 100;
export const ROLLOUT_STEPS: RolloutStep[] = [50, 75, 100];

export interface RolloutPlan {
  /** Percentage of the audience this step targets. */
  step: RolloutStep;
  /** Re-run verification automatically after the step lands. */
  autoVerify: boolean;
  /** ISO timestamp of the last edit (for the "saved" hint). */
  updatedAt?: string;
}

export const DEFAULT_PLAN: RolloutPlan = { step: 50, autoVerify: true };

type PlanMap = Record<string, RolloutPlan>;

function readAll(): PlanMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as PlanMap) : {};
  } catch {
    return {};
  }
}

function writeAll(map: PlanMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* quota / unavailable — plans are best-effort */
  }
}

/** Every saved plan, keyed by decision id. */
export function getAllRolloutPlans(): PlanMap {
  return readAll();
}

/** The saved plan for one decision, or null if the operator hasn't set one. */
export function getRolloutPlan(id: string): RolloutPlan | null {
  const plan = readAll()[id];
  return plan ?? null;
}

/** Persist a plan for one decision and return it (with a fresh timestamp). */
export function setRolloutPlan(id: string, plan: RolloutPlan, nowIso: string): RolloutPlan {
  const next: RolloutPlan = { step: plan.step, autoVerify: plan.autoVerify, updatedAt: nowIso };
  const map = readAll();
  map[id] = next;
  writeAll(map);
  return next;
}

/** Forget the plan for one decision (e.g. once it's been actioned). */
export function clearRolloutPlan(id: string): void {
  const map = readAll();
  if (id in map) {
    delete map[id];
    writeAll(map);
  }
}
