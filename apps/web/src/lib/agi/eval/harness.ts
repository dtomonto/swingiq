// ============================================================
// SwingIQ — AGI: Evaluation harness (golden athletes)
// ------------------------------------------------------------
// The audit's central gap: unit tests prove the code does what it says, but
// nothing proves the CONCLUSIONS are right. This harness pins the engine's
// headline outputs against hand-labeled athlete fixtures, so any rule change
// that silently degrades quality fails CI. Run repeatedly as the engine evolves
// (`npm run eval:agi`). Pure — no React/browser/network.
// ============================================================

import { runAthleteGI } from '../engine';
import type {
  AGISnapshot,
  CapabilityId,
  CapabilitySignal,
  InsightKind,
  ReadinessSnapshot,
  SignalBundle,
  SportId,
  SportSessionRef,
} from '../types';

let n = 0;
function sig(capability: CapabilityId, sport: SportId, score: number, basis: CapabilitySignal['basis'] = 'estimated'): CapabilitySignal {
  n += 1;
  return { capability, sport, score, confidence: 0.8, basis, metricId: `m${n}`, metricName: capability, at: '2026-06-20', sessionId: `s${n}` };
}
function ref(sport: SportId, overall: number, keyFault = ''): SportSessionRef {
  n += 1;
  return { sport, sportLabel: sport, emoji: '🏅', motionLabel: 'rep', sessionId: `sr${n}`, at: '2026-06-20', overall, confidence: 0.7, keyFault, drillHints: [] };
}

export interface EvalExpectation {
  /** The kind of insight expected to LEAD the ranked list. */
  leadKind?: InsightKind;
  /** The keystone insight's capability, if a keystone is expected. */
  keystoneCapability?: CapabilityId | null;
  /** Whether a keystone insight should exist at all. */
  hasKeystone?: boolean;
  crossSport?: boolean;
  hasPlanKeystone?: boolean;
  /** Allowed trust grades. */
  trustGradeIn?: Array<'A' | 'B' | 'C' | 'D'>;
  /** Insight kinds that MUST be present. */
  mustInclude?: InsightKind[];
}

export interface EvalCase {
  id: string;
  description: string;
  bundle: SignalBundle;
  expect: EvalExpectation;
}

const G: SportId = 'golf';
const T: SportId = 'tennis';

export const EVAL_CASES: EvalCase[] = [
  {
    id: 'single-sport-weak-rotation',
    description: 'One golf session, rotation weakest → an honest (thin) keystone on rotation.',
    bundle: { signals: [sig('rotation', G, 44), sig('balance', G, 76)], sportSessions: [ref(G, 58, 'Over the top')] },
    expect: { hasKeystone: true, keystoneCapability: 'rotation', crossSport: false, hasPlanKeystone: true, trustGradeIn: ['C', 'D'] },
  },
  {
    id: 'cross-sport-shared-weakness',
    description: 'Golf + tennis, rotation weak in both → cross-sport keystone on rotation.',
    bundle: { signals: [sig('rotation', G, 42), sig('rotation', T, 45), sig('balance', G, 80), sig('balance', T, 78)], sportSessions: [ref(G, 60), ref(T, 58), ref(G, 62)] },
    expect: { hasKeystone: true, keystoneCapability: 'rotation', crossSport: true, mustInclude: ['keystone'] },
  },
  {
    id: 'all-strong-no-keystone',
    description: 'Everything strong → no keystone; a strength is surfaced.',
    bundle: { signals: [sig('rotation', G, 84), sig('balance', G, 88)], sportSessions: [ref(G, 86), ref(G, 85), ref(G, 87)] },
    expect: { hasKeystone: false, mustInclude: ['strength'] },
  },
  {
    id: 'goal-distance-power-weak',
    description: 'Goal = distance, power weakest of the goal capabilities → a goal insight.',
    bundle: {
      signals: [sig('power', G, 40), sig('rotation', G, 72), sig('sequencing', G, 70)],
      sportSessions: [ref(G, 60), ref(G, 61), ref(G, 62)],
      identity: { declaredSports: [G], primarySport: G, primaryGoal: 'add distance', goalCapabilities: ['power', 'sequencing', 'rotation'] },
    },
    expect: { mustInclude: ['goal'] },
  },
  {
    id: 'readiness-caution-leads',
    description: 'Flagged discomfort → the readiness caution outranks everything.',
    bundle: {
      signals: [sig('rotation', G, 40), sig('rotation', T, 38)],
      sportSessions: [ref(G, 55), ref(T, 52)],
      readiness: { score: 45, band: 'developing', headline: 'Take it easy.', drivers: [], caution: 'You flagged discomfort.', basis: 'guidance' } as ReadinessSnapshot,
    },
    expect: { leadKind: 'readiness' },
  },
  {
    id: 'recurring-fault-cross-sport',
    description: 'Same fault recurs across golf + tennis → a recurring-fault insight.',
    bundle: {
      signals: [sig('rotation', G, 50), sig('rotation', T, 52)],
      sportSessions: [ref(G, 60, 'Early shoulder rotation'), ref(T, 58, 'Early shoulder rotation')],
    },
    expect: { mustInclude: ['recurring'] },
  },
  {
    id: 'plateau-on-focus',
    description: 'Focus capability flat across 3 check-ins → a plateau insight.',
    bundle: {
      signals: [sig('rotation', G, 45), sig('balance', G, 72)],
      sportSessions: [ref(G, 58), ref(G, 59), ref(G, 58)],
      history: [
        { at: '2026-05-01T00:00:00.000Z', coverage: 0.3, keystone: 'rotation', sports: [G], capabilities: [{ id: 'rotation', score: 45, basis: 'estimated' }] },
        { at: '2026-05-15T00:00:00.000Z', coverage: 0.3, keystone: 'rotation', sports: [G], capabilities: [{ id: 'rotation', score: 46, basis: 'estimated' }] },
      ] as AGISnapshot[],
    },
    expect: { mustInclude: ['plateau'] },
  },
  {
    id: 'empty-blank-slate',
    description: 'No data → coverage insight, trust D, no keystone.',
    bundle: { signals: [], sportSessions: [] },
    expect: { hasKeystone: false, mustInclude: ['coverage'], trustGradeIn: ['D'] },
  },
];

export interface EvalResult {
  id: string;
  pass: boolean;
  failures: string[];
}

/** Run one golden case and return pass/fail + human-readable failures. */
export function runEvalCase(c: EvalCase): EvalResult {
  const r = runAthleteGI(c.bundle);
  const e = c.expect;
  const failures: string[] = [];
  const keystone = r.insights.find((i) => i.kind === 'keystone');

  if (e.leadKind && r.insights[0]?.kind !== e.leadKind) {
    failures.push(`lead insight should be "${e.leadKind}", got "${r.insights[0]?.kind ?? 'none'}"`);
  }
  if (e.hasKeystone === true && !keystone) failures.push('expected a keystone insight, none found');
  if (e.hasKeystone === false && keystone) failures.push(`expected no keystone, got one on "${keystone.capability}"`);
  if (e.keystoneCapability !== undefined && keystone && keystone.capability !== e.keystoneCapability) {
    failures.push(`keystone capability should be "${e.keystoneCapability}", got "${keystone.capability}"`);
  }
  if (e.crossSport !== undefined && r.model.crossSport !== e.crossSport) {
    failures.push(`crossSport should be ${e.crossSport}, got ${r.model.crossSport}`);
  }
  if (e.hasPlanKeystone && !r.plan.keystone) failures.push('expected a plan keystone, none found');
  if (e.trustGradeIn && !e.trustGradeIn.includes(r.trust.grade)) {
    failures.push(`trust grade ${r.trust.grade} not in [${e.trustGradeIn.join(', ')}]`);
  }
  for (const kind of e.mustInclude ?? []) {
    if (!r.insights.some((i) => i.kind === kind)) failures.push(`expected an insight of kind "${kind}"`);
  }

  return { id: c.id, pass: failures.length === 0, failures };
}

/** Run all cases. Returns the per-case results + overall pass. */
export function runAllEvals(): { pass: boolean; results: EvalResult[] } {
  const results = EVAL_CASES.map(runEvalCase);
  return { pass: results.every((r) => r.pass), results };
}
