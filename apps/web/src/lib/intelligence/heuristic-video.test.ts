// ============================================================
// GAI Heuristic Video Diagnosis — free-tier video completion tests
// ============================================================

import { runHeuristicVideoEstimate } from './heuristic-video';
import { runHeuristicEstimate } from './heuristic';
import type { AnalysisRequest } from './types';
import type { SportPoseFeatures } from '@swingiq/core';

const req = (over: Partial<AnalysisRequest> = {}): AnalysisRequest => ({
  tier: 'INSTANT_ESTIMATE',
  sport: 'tennis',
  issue: 'late contact',
  skillLevel: 'intermediate',
  ...over,
});

// Strong lateral sway → a dominant pose-detected fault for tennis.
const SWAY_POSE: SportPoseFeatures = {
  framesWithPose: 12,
  shoulderTurnRangeDeg: 9, // limited rotation
  spineAngleRangeDeg: 6,
  headSwayPct: 24,
  hipSwayPct: 30,
};

// Clean motion → no notable fault measured.
const CLEAN_POSE: SportPoseFeatures = {
  framesWithPose: 12,
  shoulderTurnRangeDeg: 45,
  spineAngleRangeDeg: 4,
  headSwayPct: 4,
  hipSwayPct: 5,
};

describe('runHeuristicVideoEstimate', () => {
  test('with no pose features it equals the self-reported Instant Estimate', () => {
    const a = runHeuristicVideoEstimate(req());
    const b = runHeuristicEstimate(req());
    expect(a.diagnosis).toBe(b.diagnosis);
    expect(a.videoGrounded).toBeUndefined();
    expect(a.measuredSignals).toBeUndefined();
  });

  test('too few posed frames is treated as not measurable (safe superset)', () => {
    const a = runHeuristicVideoEstimate(req({ poseFeatures: { ...SWAY_POSE, framesWithPose: 2 } }));
    const b = runHeuristicEstimate(req());
    expect(a.diagnosis).toBe(b.diagnosis);
    expect(a.videoGrounded).toBeUndefined();
  });

  test('drives the diagnosis from the dominant MEASURED fault', () => {
    const r = runHeuristicVideoEstimate(req({ poseFeatures: SWAY_POSE }));
    expect(r.videoGrounded).toBe(true);
    expect(r.evidenceBasis).toBe('pose');
    // The measured number is cited as evidence in the reasoning.
    expect(r.reasoning).toContain('Measured from your video');
    expect(r.reasoning).toContain('30%');
    expect(r.detectedIssues && r.detectedIssues.length).toBeGreaterThan(0);
  });

  test('surfaces honest, labeled measured signals (always estimated)', () => {
    const r = runHeuristicVideoEstimate(req({ poseFeatures: SWAY_POSE }));
    const labels = (r.measuredSignals ?? []).map((s) => s.label);
    expect(labels).toContain('Hip sway');
    expect(labels).toContain('Shoulder rotation');
    expect(r.sourceMode).toBe('heuristic'); // never claims AI
    expect(r.costEstimateCents).toBe(0); // no paid call
    expect(r.disclaimer.toLowerCase()).toContain('not an ai vision read');
  });

  test('confidence is grounded but honestly capped (single-camera estimate)', () => {
    const r = runHeuristicVideoEstimate(req({ poseFeatures: SWAY_POSE }));
    expect(r.confidence).toBeGreaterThanOrEqual(0.45);
    expect(r.confidence).toBeLessThanOrEqual(0.72);
    expect(['low', 'moderate', 'high']).toContain(r.confidenceLabel);
  });

  test('measured-but-clean motion corroborates the self-reported miss', () => {
    const r = runHeuristicVideoEstimate(req({ poseFeatures: CLEAN_POSE }));
    expect(r.videoGrounded).toBe(true);
    expect(r.evidenceBasis).toBe('self-report');
    expect(r.detectedIssues).toEqual([]);
    expect(r.measuredSignals && r.measuredSignals.length).toBeGreaterThan(0);
    // Plan still anchored to the issue the athlete described.
    expect(r.diagnosis).toBe(runHeuristicEstimate(req()).diagnosis);
  });

  test('golf (no pose rule set) degrades to a measured-but-clean estimate', () => {
    const r = runHeuristicVideoEstimate(req({ sport: 'golf', issue: 'slice', poseFeatures: SWAY_POSE }));
    expect(r.evidenceBasis).toBe('self-report');
    expect(r.practicePlan.days).toHaveLength(7);
  });

  test('still returns a complete, normalized result', () => {
    const r = runHeuristicVideoEstimate(req({ poseFeatures: SWAY_POSE }), 'FALLBACK_HEURISTIC');
    expect(r.route).toBe('FALLBACK_HEURISTIC');
    expect(r.drills.length).toBeGreaterThanOrEqual(2);
    expect(r.practicePlan.days).toHaveLength(7);
    expect(r.retest.protocol).toBeTruthy();
    expect(r.poweredBy).toBe('SwingVantage GAI');
  });
});
