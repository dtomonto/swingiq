// ============================================================
// SwingIQ — Athlete General Intelligence: engine tests
// ------------------------------------------------------------
// Pure tests against the engine (no motion-lab / browser dependency).
// Verifies cross-sport fusion, the keystone reasoner, transfer links,
// imbalance + consistency reasoners, basis-conservatism, and honest
// degradation on empty / thin input.
// ============================================================

import type { GolferProfileInput } from '@swingiq/core';
import { runAthleteGI } from '../engine';
import { buildWorldModel } from '../worldModel';
import { classifyMetric, goalToCapabilities } from '../capabilities';
import { identityFromStore } from '../adapters/profile';
import { bundleFromStore } from '../adapters/store-sessions';
import { mergeBundles } from '../adapters/merge';
import { readinessFromScore } from '../adapters/readiness-map';
import { buildProgress, snapshotFromModel } from '../progress';
import type {
  AGISnapshot,
  AthleteIdentity,
  Basis,
  CapabilityId,
  CapabilitySignal,
  ReadinessSnapshot,
  SignalBundle,
  SportId,
  SportSessionRef,
} from '../types';

function readiness(
  band: ReadinessSnapshot['band'],
  caution: string | null = null,
): ReadinessSnapshot {
  const score = { building: 30, developing: 50, solid: 70, sharp: 90 }[band];
  return { score, band, headline: `Form: ${band}.`, drivers: [], caution, basis: 'guidance' };
}

let seq = 0;
function sig(
  capability: CapabilityId,
  sport: SportId,
  score: number,
  opts: Partial<CapabilitySignal> = {},
): CapabilitySignal {
  seq += 1;
  return {
    capability,
    sport,
    score,
    confidence: opts.confidence ?? 0.8,
    basis: opts.basis ?? 'estimated',
    metricId: opts.metricId ?? `m${seq}`,
    metricName: opts.metricName ?? capability,
    at: opts.at ?? '2026-06-01T00:00:00.000Z',
    sessionId: opts.sessionId ?? `s${seq}`,
  };
}

function sessionRef(
  sport: SportId,
  overall: number,
  extra: Partial<SportSessionRef> = {},
): SportSessionRef {
  seq += 1;
  return {
    sport,
    sportLabel: extra.sportLabel ?? (sport === 'golf' ? 'Golf' : sport === 'tennis' ? 'Tennis' : sport),
    emoji: extra.emoji ?? '🏅',
    motionLabel: extra.motionLabel ?? 'Swing',
    sessionId: extra.sessionId ?? `sr${seq}`,
    at: extra.at ?? '2026-06-01T00:00:00.000Z',
    overall,
    confidence: extra.confidence ?? 0.7,
    keyFault: extra.keyFault ?? '',
    drillHints: extra.drillHints ?? [],
  };
}

describe('AGI — metric classifier', () => {
  it('maps known motion-lab metric ids to capabilities', () => {
    expect(classifyMetric('shoulder_turn')).toBe('rotation');
    expect(classifyMetric('sequencing')).toBe('sequencing');
    expect(classifyMetric('balance_finish')).toBe('balance');
    expect(classifyMetric('tempo_ratio')).toBe('tempo');
    expect(classifyMetric('hand_speed_peak')).toBe('power');
    expect(classifyMetric('repeatability')).toBe('consistency');
  });

  it('falls back to keyword classification for unknown ids', () => {
    expect(classifyMetric('lower_body_velocity', 'Lower-body speed')).toBe('power');
    expect(classifyMetric('weird_new_rotation_metric', 'Torso coil')).toBe('rotation');
  });

  it('returns null for non-capability metrics', () => {
    expect(classifyMetric('tracking', 'Body tracking')).toBeNull();
    expect(classifyMetric('totally_unrelated', 'Foo bar')).toBeNull();
  });
});

describe('AGI — world model fusion', () => {
  it('fuses the same capability across two sports into one breadth-2 state', () => {
    const bundle: SignalBundle = {
      signals: [
        sig('rotation', 'golf', 50),
        sig('rotation', 'tennis', 40),
        sig('balance', 'golf', 80),
      ],
      sportSessions: [sessionRef('golf', 60), sessionRef('tennis', 55)],
    };
    const model = buildWorldModel(bundle);
    expect(model.crossSport).toBe(true);
    const rotation = model.capabilities.find((c) => c.capability === 'rotation')!;
    expect(rotation.breadth).toBe(2);
    expect(rotation.sports.sort()).toEqual(['golf', 'tennis']);
    // confidence-weighted between 40 and 50
    expect(rotation.score!).toBeGreaterThanOrEqual(40);
    expect(rotation.score!).toBeLessThanOrEqual(50);
  });

  it('reports the most conservative basis among evidence', () => {
    const bundle: SignalBundle = {
      signals: [
        sig('rotation', 'golf', 60, { basis: 'measured' as Basis }),
        sig('rotation', 'golf', 55, { basis: 'ai_inferred' as Basis }),
      ],
      sportSessions: [sessionRef('golf', 60)],
    };
    const model = buildWorldModel(bundle);
    const rotation = model.capabilities.find((c) => c.capability === 'rotation')!;
    expect(rotation.basis).toBe('ai_inferred'); // weakest wins
  });

  it('leaves unobserved capabilities null and lists them as missing', () => {
    const bundle: SignalBundle = {
      signals: [sig('rotation', 'golf', 60)],
      sportSessions: [sessionRef('golf', 60)],
    };
    const model = buildWorldModel(bundle);
    const power = model.capabilities.find((c) => c.capability === 'power')!;
    expect(power.score).toBeNull();
    expect(model.dataMap.missing.some((m) => m.includes('Power'))).toBe(true);
  });
});

describe('AGI — keystone reasoning', () => {
  it('identifies the weak capability shared across the most sports', () => {
    const bundle: SignalBundle = {
      signals: [
        // rotation weak in both sports → should be the keystone
        sig('rotation', 'golf', 42),
        sig('rotation', 'tennis', 38),
        // balance strong in both
        sig('balance', 'golf', 82),
        sig('balance', 'tennis', 79),
      ],
      sportSessions: [sessionRef('golf', 60), sessionRef('tennis', 58)],
    };
    const result = runAthleteGI(bundle);
    const keystone = result.insights.find((i) => i.kind === 'keystone')!;
    expect(keystone).toBeTruthy();
    expect(keystone.capability).toBe('rotation');
    expect(keystone.sports.sort()).toEqual(['golf', 'tennis']);
    // keystone always leads the ranked list
    expect(result.insights[0].kind).toBe('keystone');
    // reasoning chain is populated and cites both sports
    expect(keystone.reasoning.length).toBeGreaterThanOrEqual(2);
    // plan keystone matches
    expect(result.plan.keystone?.capability).toBe('rotation');
  });

  it('does not flag a keystone when everything is strong', () => {
    const bundle: SignalBundle = {
      signals: [sig('rotation', 'golf', 85), sig('balance', 'golf', 88)],
      sportSessions: [sessionRef('golf', 86)],
    };
    const result = runAthleteGI(bundle);
    expect(result.insights.find((i) => i.kind === 'keystone')).toBeUndefined();
    expect(result.insights.find((i) => i.kind === 'strength')).toBeTruthy();
  });
});

describe('AGI — transfer + imbalance', () => {
  it('builds cross-sport transfer links grounded in shared principles', () => {
    const bundle: SignalBundle = {
      signals: [
        sig('rotation', 'golf', 60),
        sig('rotation', 'tennis', 55),
        sig('sequencing', 'golf', 50),
        sig('sequencing', 'tennis', 52),
      ],
      sportSessions: [sessionRef('golf', 60), sessionRef('tennis', 58)],
    };
    const result = runAthleteGI(bundle);
    expect(result.transfers.length).toBeGreaterThan(0);
    const t = result.transfers[0];
    expect(t.fromSport).not.toBe(t.toSport);
    expect(t.fromExpression).toBeTruthy();
    expect(t.toExpression).toBeTruthy();
    expect(t.note).toMatch(/hint|guarantee/i);
  });

  it('flags an imbalance when a capability is strong in one sport, weak in another', () => {
    const bundle: SignalBundle = {
      signals: [
        sig('rotation', 'golf', 82),
        sig('rotation', 'tennis', 45), // 37-pt gap
      ],
      sportSessions: [sessionRef('golf', 70), sessionRef('tennis', 50)],
    };
    const result = runAthleteGI(bundle);
    const imbalance = result.insights.find((i) => i.kind === 'imbalance');
    expect(imbalance).toBeTruthy();
    expect(imbalance!.capability).toBe('rotation');
    expect(imbalance!.sports).toContain('golf');
    expect(imbalance!.sports).toContain('tennis');
  });
});

describe('AGI — consistency + honest degradation', () => {
  it('flags high session-to-session variance', () => {
    const bundle: SignalBundle = {
      signals: [sig('rotation', 'golf', 60)],
      sportSessions: [
        sessionRef('golf', 40),
        sessionRef('golf', 70),
        sessionRef('golf', 55),
        sessionRef('golf', 85),
      ],
    };
    const result = runAthleteGI(bundle);
    expect(result.insights.find((i) => i.kind === 'consistency')).toBeTruthy();
  });

  it('degrades honestly on an empty bundle', () => {
    const result = runAthleteGI({ signals: [], sportSessions: [] });
    expect(result.model.coverage).toBe(0);
    expect(result.plan.keystone).toBeNull();
    expect(result.insights.find((i) => i.kind === 'coverage')).toBeTruthy();
    expect(result.enhanced).toBe(false);
    expect(result.disclaimer).toMatch(/not a claim of human-level/i);
  });

  it('honours an optional narrative enhancer without changing it being flagged', () => {
    const bundle: SignalBundle = {
      signals: [sig('rotation', 'golf', 50)],
      sportSessions: [sessionRef('golf', 55)],
    };
    const result = runAthleteGI(bundle, {
      enhanceNarrative: (r) => ({ ...r, disclaimer: r.disclaimer }),
    });
    expect(result.enhanced).toBe(true);
  });
});

describe('AGI — goal mapping + identity', () => {
  it('maps free-text goals to capabilities, and unknown goals to nothing', () => {
    expect(goalToCapabilities('I want to hit my driver farther')).toContain('power');
    expect(goalToCapabilities('be more consistent and accurate')).toContain('consistency');
    expect(goalToCapabilities('stop slicing')).toContain('rotation');
    expect(goalToCapabilities('xyzzy nonsense')).toEqual([]);
    expect(goalToCapabilities('')).toEqual([]);
  });

  it('builds an identity from a golf profile', () => {
    const profile = {
      handedness: 'right',
      primary_goal: 'hit it longer off the tee',
      skill_level: 'intermediate',
      handicap: 14,
    } as unknown as GolferProfileInput;
    const id = identityFromStore(profile, { tennis: {} });
    expect(id).toBeTruthy();
    expect(id!.declaredSports.sort()).toEqual(['golf', 'tennis']);
    expect(id!.primarySport).toBe('golf');
    expect(id!.primaryGoal).toMatch(/longer/);
    expect(id!.goalCapabilities).toContain('power');
  });

  it('returns undefined identity when nothing is declared', () => {
    expect(identityFromStore(null, {})).toBeUndefined();
  });

  it('flags declared-but-unanalysed sports in the data map', () => {
    const identity: AthleteIdentity = { declaredSports: ['golf', 'tennis'], primarySport: 'golf' };
    const bundle: SignalBundle = {
      signals: [sig('rotation', 'golf', 60)],
      sportSessions: [sessionRef('golf', 60)],
      identity,
    };
    const model = buildWorldModel(bundle);
    expect(model.identity?.declaredSports).toContain('tennis');
    expect(model.dataMap.missing.some((m) => /tennis/i.test(m))).toBe(true);
  });

  it('produces a goal insight tied to the weakest goal-relevant capability', () => {
    const identity: AthleteIdentity = {
      declaredSports: ['golf'],
      primarySport: 'golf',
      primaryGoal: 'add distance',
      goalCapabilities: ['power', 'sequencing', 'rotation'],
    };
    const bundle: SignalBundle = {
      signals: [
        sig('power', 'golf', 40),
        sig('rotation', 'golf', 75),
        sig('sequencing', 'golf', 70),
      ],
      sportSessions: [sessionRef('golf', 60)],
      identity,
    };
    const result = runAthleteGI(bundle);
    const goal = result.insights.find((i) => i.kind === 'goal');
    expect(goal).toBeTruthy();
    expect(goal!.capability).toBe('power'); // weakest of the goal capabilities
    expect(goal!.summary).toMatch(/add distance/);
  });
});

describe('AGI — store + merge adapters', () => {
  it('turns launch-monitor sessions into session refs and skips unscored ones', () => {
    const bundle = bundleFromStore(
      [
        { id: 'a', sport: 'golf', swing_score: 72, created_at: '2026-06-01', name: 'Range', diagnoses: [] },
        { id: 'b', sport: 'golf', swing_score: null, created_at: '2026-06-02', name: 'Range', diagnoses: [] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any,
      [],
    );
    expect(bundle.sportSessions).toHaveLength(1);
    expect(bundle.sportSessions[0].overall).toBe(72);
    expect(bundle.signals).toHaveLength(0); // ball data ≠ body capabilities
  });

  it('merges bundles, de-duplicates sessions by id, and carries identity', () => {
    const identity: AthleteIdentity = { declaredSports: ['golf'], primarySport: 'golf' };
    const a: SignalBundle = { signals: [sig('rotation', 'golf', 50)], sportSessions: [sessionRef('golf', 60, { sessionId: 'dup' })] };
    const b: SignalBundle = { signals: [sig('power', 'golf', 55)], sportSessions: [sessionRef('golf', 65, { sessionId: 'dup' })] };
    const merged = mergeBundles([a, b], identity);
    expect(merged.signals).toHaveLength(2);
    expect(merged.sportSessions).toHaveLength(1); // 'dup' collapsed
    expect(merged.identity).toBe(identity);
  });
});

describe('AGI — readiness ("today\'s form")', () => {
  it('maps a TransparentScore to a snapshot with top-3 drivers by magnitude', () => {
    const snap = readinessFromScore({
      score: 72,
      band: 'solid',
      headline: 'Set up to train well.',
      factors: [
        { label: 'streak', contribution: 5 },
        { label: 'rest', contribution: -18 },
        { label: 'trend', contribution: 9 },
        { label: 'tiny', contribution: 1 },
      ],
      caution: null,
      basis: 'guidance',
    });
    expect(snap.score).toBe(72);
    expect(snap.band).toBe('solid');
    expect(snap.drivers).toHaveLength(3);
    expect(snap.drivers[0].label).toBe('rest'); // largest magnitude first
  });

  it('adds a readiness insight + today note without touching capabilities', () => {
    const bundle: SignalBundle = {
      signals: [sig('rotation', 'golf', 55)],
      sportSessions: [sessionRef('golf', 60)],
      readiness: readiness('sharp'),
    };
    const result = runAthleteGI(bundle);
    expect(result.model.readiness?.band).toBe('sharp');
    expect(result.insights.find((i) => i.kind === 'readiness')).toBeTruthy();
    expect(result.plan.todayNote).toMatch(/primed|full keystone/i);
    // capabilities are unchanged by readiness
    expect(result.model.capabilities.find((c) => c.capability === 'rotation')!.score).toBe(55);
  });

  it('lets a safety caution lead every other insight', () => {
    const bundle: SignalBundle = {
      signals: [sig('rotation', 'golf', 40), sig('rotation', 'tennis', 38)], // would be a keystone
      sportSessions: [sessionRef('golf', 55), sessionRef('tennis', 52)],
      readiness: readiness('developing', 'You flagged discomfort.'),
    };
    const result = runAthleteGI(bundle);
    expect(result.insights[0].kind).toBe('readiness'); // outranks the keystone
    expect(result.plan.todayNote).toMatch(/take care|discomfort/i);
  });
});

describe('AGI — progress over time', () => {
  const bundleNow: SignalBundle = {
    signals: [sig('rotation', 'golf', 55), sig('balance', 'golf', 70)],
    sportSessions: [sessionRef('golf', 62)],
  };

  it('returns null without a prior-day baseline', () => {
    const model = buildWorldModel(bundleNow);
    expect(buildProgress(model, [])).toBeNull();
    // a snapshot from today alone is not a baseline
    expect(buildProgress(model, [snapshotFromModel(model)])).toBeNull();
  });

  it('snapshots the model with the weakest capability as the keystone', () => {
    const snap = snapshotFromModel(buildWorldModel(bundleNow));
    expect(snap.keystone).toBe('rotation'); // 55 < 70
    expect(snap.capabilities.find((c) => c.id === 'balance')!.score).toBe(70);
  });

  it('computes capability deltas vs a prior snapshot', () => {
    const model = buildWorldModel(bundleNow);
    const baseline: AGISnapshot = {
      at: '2026-05-01T08:00:00.000Z',
      coverage: 0.3,
      capabilities: [
        { id: 'rotation', score: 40, basis: 'estimated' },
        { id: 'balance', score: 72, basis: 'estimated' },
      ],
      keystone: 'rotation',
      sports: ['golf'],
    };
    const report = buildProgress(model, [baseline])!;
    expect(report).toBeTruthy();
    const rot = report.deltas.find((d) => d.capability === 'rotation')!;
    expect(rot.before).toBe(40);
    expect(rot.after).toBe(55);
    expect(rot.delta).toBe(15);
    expect(report.biggestImprover?.capability).toBe('rotation');
    expect(report.keystoneMoved?.capability).toBe('rotation'); // current weakest = focus
    expect(report.summary).toMatch(/Since 2026-05-01/);
  });

  it('surfaces progress as an insight and on result.progress', () => {
    const baseline: AGISnapshot = {
      at: '2026-05-01T08:00:00.000Z',
      coverage: 0.3,
      capabilities: [{ id: 'rotation', score: 40, basis: 'estimated' }],
      keystone: 'rotation',
      sports: ['golf'],
    };
    const result = runAthleteGI({ ...bundleNow, history: [baseline] });
    expect(result.progress).toBeTruthy();
    expect(result.insights.find((i) => i.kind === 'progress')).toBeTruthy();
  });
});
