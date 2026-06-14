// ============================================================
// Tests for the Motion Lab video-quality profiler (preflight).
// Covers the tier ladder, structured issues, dynamic fixes, and the
// "never fail silently" invariants the product depends on.
// ============================================================

import { profileVideoQuality, type PreflightInput } from '../preflight';
import type { GrayLumaStats } from '@/lib/frame-enhance';

const goodStats: GrayLumaStats = { brightness: 0.55, contrast: 0.28, sharpness: 0.5 };

const base = (over: Partial<PreflightInput> = {}): PreflightInput => ({
  frameStats: Array.from({ length: 10 }, () => ({ ...goodStats })),
  subjectCoverage: 0.95,
  fullBodyVisible: true,
  trackingConfidence: 0.85,
  multiplePeople: false,
  resolution: '1080x1920',
  estimatedFps: 60,
  durationSeconds: 3,
  swingWindowDetected: true,
  sport: 'golf',
  view: 'face_on',
  ...over,
});

describe('profileVideoQuality — tiers', () => {
  it('rates a clean capture good or excellent and supports a deep analysis', () => {
    const p = profileVideoQuality(base());
    expect(['good', 'excellent']).toContain(p.tier);
    expect(p.recommendedAnalysisLevel).toBeGreaterThanOrEqual(4);
    expect(p.issues.filter((i) => i.severity === 'critical')).toHaveLength(0);
    expect(p.score).toBeGreaterThanOrEqual(70);
  });

  it('marks a clip with no trackable athlete as not_defensible (level 1)', () => {
    const p = profileVideoQuality(base({ subjectCoverage: 0.05, trackingConfidence: 0.1 }));
    expect(p.tier).toBe('not_defensible');
    expect(p.recommendedAnalysisLevel).toBe(1);
    expect(p.issues.some((i) => i.code === 'NO_ATHLETE_VISIBLE' && i.severity === 'critical')).toBe(true);
  });

  it('still produces capture guidance (never blank) for a terrible clip', () => {
    const p = profileVideoQuality(
      base({
        subjectCoverage: 0.25,
        trackingConfidence: 0.2,
        frameStats: Array.from({ length: 8 }, () => ({ brightness: 0.12, contrast: 0.06, sharpness: 0.05 })),
        resolution: '240x320',
        estimatedFps: 24,
        fullBodyVisible: false,
      }),
    );
    expect(['terrible', 'not_defensible', 'poor']).toContain(p.tier);
    expect(p.recommendedFixes.length).toBeGreaterThan(0);
  });
});

describe('profileVideoQuality — issue detection', () => {
  it('detects low light and flat contrast and recommends a lighting fix', () => {
    const p = profileVideoQuality(
      base({ frameStats: Array.from({ length: 10 }, () => ({ brightness: 0.18, contrast: 0.08, sharpness: 0.4 })) }),
    );
    expect(p.issues.some((i) => i.code === 'LOW_LIGHT')).toBe(true);
    expect(p.issues.some((i) => i.code === 'LOW_CONTRAST')).toBe(true);
    expect(p.recommendedFixes.join(' ')).toMatch(/light/i);
  });

  it('detects soft/blur and a low frame rate and recommends 60 fps', () => {
    const p = profileVideoQuality(
      base({
        frameStats: Array.from({ length: 10 }, () => ({ brightness: 0.5, contrast: 0.25, sharpness: 0.05 })),
        estimatedFps: 24,
      }),
    );
    expect(p.issues.some((i) => i.code === 'SOFT_OR_BLURRED')).toBe(true);
    expect(p.issues.some((i) => i.code === 'LOW_FPS')).toBe(true);
    expect(p.recommendedFixes.join(' ')).toMatch(/60\s*fps/i);
  });

  it('flags a cropped body and recommends framing the feet', () => {
    const p = profileVideoQuality(base({ fullBodyVisible: false }));
    expect(p.issues.some((i) => i.code === 'BODY_CROPPED')).toBe(true);
    expect(p.recommendedFixes.join(' ')).toMatch(/feet/i);
  });

  it('flags multiple people in frame', () => {
    const p = profileVideoQuality(base({ multiplePeople: true }));
    expect(p.issues.some((i) => i.code === 'MULTIPLE_PEOPLE')).toBe(true);
  });

  it('does NOT invent pixel issues when no luma signals were measured', () => {
    const p = profileVideoQuality(base({ frameStats: [] }));
    expect(p.pixelSignalsAvailable).toBe(false);
    expect(p.issues.some((i) => ['LOW_LIGHT', 'LOW_CONTRAST', 'SOFT_OR_BLURRED'].includes(i.code))).toBe(false);
  });
});

describe('profileVideoQuality — honesty invariants', () => {
  // A matrix of pathological inputs — none may crash, return a blank tier,
  // or leave the user without a recommendation.
  const matrix: PreflightInput[] = [
    base(),
    base({ subjectCoverage: 0 }),
    base({ subjectCoverage: 0, frameStats: [] }),
    base({ trackingConfidence: 0, fullBodyVisible: false, multiplePeople: true }),
    base({ resolution: 'garbage', estimatedFps: null, durationSeconds: 0.3 }),
    base({ swingWindowDetected: false }),
  ];

  it.each(matrix.map((m, i) => [i, m] as const))('case %i: always returns a usable profile', (_i, input) => {
    const p = profileVideoQuality(input);
    expect(p.tier).toBeDefined();
    expect(p.score).toBeGreaterThanOrEqual(0);
    expect(p.score).toBeLessThanOrEqual(100);
    expect([1, 2, 3, 4, 5]).toContain(p.recommendedAnalysisLevel);
    expect(Array.isArray(p.issues)).toBe(true);
    expect(p.recommendedFixes.length).toBeGreaterThan(0);
    expect(typeof p.headline).toBe('string');
    expect(p.headline.length).toBeGreaterThan(0);
    // No banned defeatist language in user-facing copy.
    const copy = [p.headline, ...p.recommendedFixes, ...p.issues.map((i) => i.userMessage)].join(' ');
    expect(copy).not.toMatch(/\bfailed\b|\bbad video\b|couldn’t analyze|couldn't analyze/i);
  });
});
