// ============================================================
// GAI Heuristic Engine — Instant Estimate builder tests
// ============================================================

import { runHeuristicEstimate } from './heuristic';
import type { AnalysisRequest } from './types';

const base: AnalysisRequest = {
  tier: 'INSTANT_ESTIMATE',
  sport: 'golf',
  issue: 'slice',
  symptoms: ['starts_straight_curves_right'],
  skillLevel: 'intermediate',
};

describe('runHeuristicEstimate', () => {
  test('returns a complete, normalized Instant Estimate', () => {
    const r = runHeuristicEstimate(base);
    expect(r.tier).toBe('INSTANT_ESTIMATE');
    expect(r.sourceMode).toBe('heuristic');
    expect(r.poweredBy).toBe('SwingVantage GAI');
    expect(r.diagnosis).toBeTruthy();
    expect(r.reasoning).toBeTruthy();
    expect(r.primaryFix).toBeTruthy();
    expect(r.costEstimateCents).toBe(0);
  });

  test('produces 2–3 drills and a 7-day plan', () => {
    const r = runHeuristicEstimate(base);
    expect(r.drills.length).toBeGreaterThanOrEqual(2);
    expect(r.drills.length).toBeLessThanOrEqual(3);
    expect(r.practicePlan.days).toHaveLength(7);
  });

  test('includes a retest protocol with an active window', () => {
    const r = runHeuristicEstimate(base);
    expect(r.retest.protocol).toBeTruthy();
    expect(r.retest.activeWindowDays).toBeGreaterThan(0);
    expect(r.retest.improvedWhen).toBeTruthy();
  });

  test('confidence is a sane 0..1 with a matching band', () => {
    const r = runHeuristicEstimate(base);
    expect(r.confidence).toBeGreaterThanOrEqual(0.4);
    expect(r.confidence).toBeLessThanOrEqual(0.9);
    expect(['low', 'moderate', 'high']).toContain(r.confidenceLabel);
  });

  test('records the route it was reached by without changing content', () => {
    const a = runHeuristicEstimate(base, 'HEURISTIC_ONLY');
    const b = runHeuristicEstimate(base, 'FALLBACK_HEURISTIC');
    expect(a.route).toBe('HEURISTIC_ONLY');
    expect(b.route).toBe('FALLBACK_HEURISTIC');
    expect(b.diagnosis).toBe(a.diagnosis);
  });

  test('works across sports and unknown issues (honest generated fallback)', () => {
    const tennis = runHeuristicEstimate({ tier: 'INSTANT_ESTIMATE', sport: 'tennis', issue: 'late contact' });
    expect(tennis.sport).toBe('tennis');
    expect(tennis.drills.length).toBeGreaterThanOrEqual(2);

    const unknown = runHeuristicEstimate({ tier: 'INSTANT_ESTIMATE', sport: 'pickleball', issue: 'zxqw nonsense fault' });
    expect(unknown.diagnosis).toBeTruthy();
    expect(unknown.practicePlan.days).toHaveLength(7);
  });
});
