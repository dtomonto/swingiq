// ============================================================
// SwingIQ — AGI: Plan commitment (the agentic "act, not just report" layer)
// ------------------------------------------------------------
// The engine PROPOSES a plan; the athlete APPROVES it; the commitment PERSISTS
// (own localStorage key) and later TRIGGERS a retest prompt — closing the loop
// the planner keeps promising. This is the one place the AGI layer writes a
// user decision, always behind an explicit approval gate, and it keeps an audit
// trail (committedAt + what was committed). Pure builders are unit-tested; the
// persistence wrappers are SSR-safe and never throw.
// ============================================================

import type { CapabilityId, GeneralPlan } from './types';

const KEY = 'swingiq-agi-commitment-v1';
/** Days until the engine prompts a retest of a committed keystone. */
const RETEST_DAYS = 14;

export interface AgiCommitment {
  capability: CapabilityId;
  name: string;
  committedAt: string; // ISO
  retestDueAt: string; // ISO
  drills: Array<{ sport: string; fix: string; drillId: string | null }>;
  status: 'active' | 'done';
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Build a commitment record from a plan (pure). Null if the plan has no keystone. */
export function buildCommitment(plan: GeneralPlan, nowIso: string): AgiCommitment | null {
  const k = plan.keystone;
  if (!k) return null;
  return {
    capability: k.capability,
    name: k.name,
    committedAt: nowIso,
    retestDueAt: addDays(nowIso, RETEST_DAYS),
    drills: k.drills.map((d) => ({ sport: d.sport, fix: d.fix, drillId: d.drillId })),
    status: 'active',
  };
}

/** True when an active commitment's retest date has passed (pure). */
export function isRetestDue(c: AgiCommitment | null, nowIso: string): boolean {
  if (!c || c.status !== 'active') return false;
  return new Date(nowIso).getTime() >= new Date(c.retestDueAt).getTime();
}

// ── persistence (SSR-safe, never throws) ──────────────────────

export function loadCommitment(): AgiCommitment | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && typeof parsed.capability === 'string') {
      return parsed as AgiCommitment;
    }
    return null;
  } catch {
    return null;
  }
}

function save(c: AgiCommitment | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (c) window.localStorage.setItem(KEY, JSON.stringify(c));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* best-effort */
  }
}

/** Approve + persist the plan (call only after the user confirms). */
export function commitPlan(plan: GeneralPlan): AgiCommitment | null {
  const c = buildCommitment(plan, new Date().toISOString());
  save(c);
  return c;
}

export function markCommitmentDone(): void {
  const c = loadCommitment();
  if (c) save({ ...c, status: 'done' });
}

export function clearCommitment(): void {
  save(null);
}
