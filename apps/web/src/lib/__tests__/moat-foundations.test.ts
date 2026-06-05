// ============================================================
// SwingVantage — Moat Foundations: Unit Tests
// ------------------------------------------------------------
// Readiness/Game-Ready scoring · Player Model (Training Twin) ·
// Skill Transfer Map · Performance Graph · Benchmark Mirror.
// Guarantees they're deterministic, honest, and never overclaim.
// ============================================================

import { computeReadiness, computeGameReady, type PerformanceSignals } from '@/lib/readiness';
import { buildPlayerModel } from '@/lib/playerModel';
import { getSkillTransfers, SKILL_TRANSFER_MAP } from '@/lib/skillTransfer';
import { buildPerformanceGraph, summarizeGraph, neighbors } from '@/lib/performanceGraph';
import { buildBenchmarkMirror } from '@/lib/benchmarkMirror';

const goodSignals: PerformanceSignals = {
  practiceStreakDays: 4,
  sessionsLogged: 6,
  hasActivePlan: true,
  planCompleted: false,
  daysSinceLastActivity: 1,
  analysisConfidence: 'high',
  trendDirection: 'improving',
  latestRetestOutcome: 'improved',
  painFlag: false,
  recurringFaultCount: 0,
};

describe('Readiness Engine', () => {
  it('produces a transparent, banded score with factors and an honest basis', () => {
    const r = computeReadiness(goodSignals);
    expect(r.score).toBeGreaterThan(60);
    expect(['building', 'developing', 'solid', 'sharp']).toContain(r.band);
    expect(r.factors.length).toBeGreaterThan(0);
    expect(r.caution).toBeNull();
    expect(r.basis).toMatch(/not a fitness or medical/i);
  });

  it('lets a pain flag override the number and band', () => {
    const r = computeReadiness({ ...goodSignals, painFlag: true });
    expect(r.caution).toMatch(/discomfort/i);
    expect(r.score).toBeLessThanOrEqual(49);
    expect(['building', 'developing']).toContain(r.band);
  });

  it('Game-Ready rewards progress and penalizes recurring issues + regression', () => {
    const strong = computeGameReady(goodSignals);
    const weak = computeGameReady({
      ...goodSignals,
      latestRetestOutcome: 'regressed',
      trendDirection: 'declining',
      recurringFaultCount: 3,
    });
    expect(strong.score).toBeGreaterThan(weak.score);
  });
});

describe('Player Model (Training Twin foundation)', () => {
  it('summarizes a player from their own data and labels itself honestly', () => {
    const pm = buildPlayerModel({
      sport: 'golf',
      sportLabel: 'Golf',
      skillLevel: 'intermediate',
      goal: 'Stop slicing my driver',
      constraints: ['low back'],
      equipmentCompleteness: 80,
      sessionsLogged: 5,
      trendDirection: 'improving',
      recurringFaults: ['over the top'],
      drillsThatHelped: ['Headcover Outside Ball Drill'],
      nextBestAction: 'Retest your over-the-top move.',
    });
    expect(pm.hasData).toBe(true);
    expect(pm.tendencies.length).toBeGreaterThan(0);
    expect(pm.summaryText).toContain('Stop slicing my driver');
    expect(pm.summaryText).toContain('over the top');
    expect(pm.whatWorks).toContain('Headcover Outside Ball Drill');
    expect(pm.disclaimer).toMatch(/Training Twin/i);
  });

  it('is honest and empty with no sessions', () => {
    const pm = buildPlayerModel({
      sport: 'tennis',
      sportLabel: 'Tennis',
      equipmentCompleteness: 0,
      sessionsLogged: 0,
      trendDirection: 'unknown',
      recurringFaults: [],
      drillsThatHelped: [],
      nextBestAction: 'Run your first analysis.',
    });
    expect(pm.hasData).toBe(false);
    expect(pm.summaryText.toLowerCase()).toContain('no sessions');
  });
});

describe('Skill Transfer Map', () => {
  it('links a primary sport to another for shared principles (incl. early shoulder rotation)', () => {
    const transfers = getSkillTransfers('golf', ['tennis']);
    expect(transfers.length).toBeGreaterThan(0);
    const earlyRot = transfers.find((t) => t.principleId === 'early_shoulder_rotation');
    expect(earlyRot).toBeDefined();
    expect(earlyRot!.fromExpression.toLowerCase()).toContain('slice');
    expect(earlyRot!.toExpression.toLowerCase()).toContain('late contact');
    expect(earlyRot!.note).toMatch(/not a guarantee/i);
  });

  it('returns no cross-sport patterns for a single sport', () => {
    expect(getSkillTransfers('golf', [])).toHaveLength(0);
    expect(SKILL_TRANSFER_MAP.length).toBeGreaterThanOrEqual(5);
  });
});

describe('Performance Graph foundation', () => {
  it('builds a connected graph and summarizes it', () => {
    const graph = buildPerformanceGraph({
      userId: 'u1',
      sports: ['golf'],
      sessions: [
        { id: 's1', sport: 'golf', focus: 'over the top' },
        { id: 's2', sport: 'golf', focus: 'over the top' },
      ],
      helpedDrills: [
        { drillId: 'drill_ott_headcover', drillName: 'Headcover Drill', faultId: 'over_the_top', faultName: 'over the top', sport: 'golf' },
      ],
      retests: [{ id: 'r1', sport: 'golf', focus: 'over the top' }],
    });
    const summary = summarizeGraph(graph);
    expect(summary.nodeCount).toBeGreaterThan(0);
    expect(summary.edgeCount).toBeGreaterThan(0);
    expect(summary.countsByType.fault).toBeGreaterThanOrEqual(1);
    expect(summary.mostConnectedFault).not.toBeNull();
    // the over-the-top fault node should connect to sessions + drill + retest
    expect(neighbors(graph, summary.mostConnectedFault!.id).length).toBeGreaterThan(1);
  });
});

describe('Benchmark Mirror', () => {
  it('surfaces real per-sport windows with an honest framing', () => {
    const mirror = buildBenchmarkMirror('baseball', 'intermediate');
    expect(mirror.available).toBe(true);
    expect(mirror.metrics.length).toBeGreaterThan(0);
    expect(mirror.framing).toMatch(/not your measured percentile/i);
    expect(mirror.metrics[0].unit.length).toBeGreaterThan(0);
  });

  it('is honest when a sport has no benchmark windows yet (golf)', () => {
    const mirror = buildBenchmarkMirror('golf', 'beginner');
    expect(mirror.available).toBe(false);
    expect(mirror.note?.toLowerCase()).toContain('launch-monitor');
  });
});
