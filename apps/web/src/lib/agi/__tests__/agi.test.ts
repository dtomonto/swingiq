// ============================================================
// SwingIQ — Athlete General Intelligence: engine tests
// ------------------------------------------------------------
// Pure tests against the engine (no motion-lab / browser dependency).
// Verifies cross-sport fusion, the keystone reasoner, transfer links,
// imbalance + consistency reasoners, basis-conservatism, and honest
// degradation on empty / thin input.
// ============================================================

import { runAthleteGI } from '../engine';
import { buildWorldModel } from '../worldModel';
import { classifyMetric } from '../capabilities';
import type {
  Basis,
  CapabilityId,
  CapabilitySignal,
  SignalBundle,
  SportId,
  SportSessionRef,
} from '../types';

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
