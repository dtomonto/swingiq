import {
  deriveSignals,
  priorityScore,
  confidenceFrom,
  riskFrom,
  requiresApproval,
  performanceScore,
} from '../scoring';
import { OPPORTUNITY_SIGNAL_KEYS } from '../types';
import { getSurface } from '../surfaces';
import { sampleMetric } from './_factories';

const surface = (id: string) => {
  const s = getSurface(id);
  if (!s) throw new Error(id);
  return s;
};

describe('deriveSignals', () => {
  it('returns all 13 signals within 0–100', () => {
    const signals = deriveSignals(surface('home-hero'));
    for (const key of OPPORTUNITY_SIGNAL_KEYS) {
      expect(signals[key]).toBeGreaterThanOrEqual(0);
      expect(signals[key]).toBeLessThanOrEqual(100);
    }
  });

  it('rates public pages higher on SEO than private ones', () => {
    expect(deriveSignals(surface('home-hero')).seoOpportunity).toBeGreaterThan(
      deriveSignals(surface('fix-today')).seoOpportunity,
    );
  });

  it('rates first-run pages higher on onboarding friction', () => {
    expect(deriveSignals(surface('start-onboarding')).onboardingFriction).toBeGreaterThan(
      deriveSignals(surface('player-arc')).onboardingFriction,
    );
  });
});

describe('priorityScore', () => {
  it('is in 0–100', () => {
    const p = priorityScore(deriveSignals(surface('upload-record')));
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(100);
  });
});

describe('confidenceFrom', () => {
  it('maps to a level', () => {
    const { level, score } = confidenceFrom(deriveSignals(surface('upload-record')));
    expect(['high', 'medium', 'low']).toContain(level);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe('riskFrom', () => {
  it('flags trust/safety as high risk', () => {
    expect(riskFrom(surface('privacy-trust'), 'trust_safety')).toBe('high');
  });
  it('flags a private, non-sport feature tutorial as low risk', () => {
    expect(riskFrom(surface('fix-today'), 'feature_tutorial')).toBe('low');
  });
});

describe('requiresApproval', () => {
  it('auto-eligible only when low risk AND high confidence', () => {
    expect(requiresApproval('low', 'high')).toBe(false);
    expect(requiresApproval('low', 'low')).toBe(true);
    expect(requiresApproval('medium', 'high')).toBe(true);
    expect(requiresApproval('high', 'high')).toBe(true);
  });
});

describe('performanceScore', () => {
  it('produces six scores in 0–100', () => {
    const s = performanceScore(sampleMetric(), 0);
    for (const v of [s.engagement, s.conversionContribution, s.education, s.frictionReduction, s.freshness, s.recommendationPriority]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
  it('freshness decays with age', () => {
    const fresh = performanceScore(sampleMetric(), 0).freshness;
    const old = performanceScore(sampleMetric(), 400).freshness;
    expect(fresh).toBeGreaterThan(old);
    expect(fresh).toBe(100);
  });
  it('raises recommendationPriority for low-engagement videos', () => {
    const weak = performanceScore(sampleMetric({ plays: 2, completions: 0, avgCompletion: 0.05, dropOffPoint: 0.9 }), 300);
    const strong = performanceScore(sampleMetric({ plays: 90, completions: 80, avgCompletion: 0.95 }), 0);
    expect(weak.recommendationPriority).toBeGreaterThan(strong.recommendationPriority);
  });
});
