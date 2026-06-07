import { scanForOpportunities, topGap, assessSurface } from '../opportunity-engine';
import { getSurface } from '../surfaces';
import { VIDEO_TYPES, RISK_LEVELS } from '../types';

describe('scanForOpportunities', () => {
  const opps = scanForOpportunities();

  it('returns a non-empty, well-formed list', () => {
    expect(opps.length).toBeGreaterThan(0);
    for (const o of opps) {
      expect(o.id).toMatch(/^opp_/);
      expect(VIDEO_TYPES).toContain(o.recommendedType);
      expect(RISK_LEVELS).toContain(o.riskLevel);
      expect(o.priorityScore).toBeGreaterThanOrEqual(0);
      expect(o.priorityScore).toBeLessThanOrEqual(100);
      expect(typeof o.requiresApproval).toBe('boolean');
    }
  });

  it('produces stable ids across runs', () => {
    const a = scanForOpportunities().map((o) => o.id);
    const b = scanForOpportunities().map((o) => o.id);
    expect(a).toEqual(b);
  });

  it('ranks uncovered gaps before covered ones', () => {
    const firstCoveredIdx = opps.findIndex((o) => o.alreadyCovered);
    const lastUncoveredIdx = opps.map((o) => o.alreadyCovered).lastIndexOf(false);
    if (firstCoveredIdx !== -1) {
      expect(firstCoveredIdx).toBeGreaterThan(lastUncoveredIdx - 1);
    }
  });

  it('detects coverage from the existing tutorial video map', () => {
    // /video @ 'understand' is covered by the tutorial 'results-read' placement.
    const resultsRead = opps.find((o) => o.id === 'opp_results-read');
    expect(resultsRead?.alreadyCovered).toBe(true);
  });

  it('honors includeCovered:false and minPriority + limit', () => {
    const gaps = scanForOpportunities({ includeCovered: false });
    expect(gaps.every((o) => !o.alreadyCovered)).toBe(true);

    const limited = scanForOpportunities({ limit: 3 });
    expect(limited.length).toBe(3);

    const high = scanForOpportunities({ minPriority: 50 });
    expect(high.every((o) => o.priorityScore >= 50)).toBe(true);
  });
});

describe('topGap', () => {
  it('returns the highest-priority uncovered opportunity', () => {
    const gap = topGap();
    expect(gap).toBeDefined();
    expect(gap?.alreadyCovered).toBe(false);
  });
});

describe('assessSurface', () => {
  it('sets requiresApproval for a high-risk public trust surface', () => {
    const o = assessSurface(getSurface('privacy-trust')!, new Set(), new Date());
    expect(o.riskLevel).toBe('high');
    expect(o.requiresApproval).toBe(true);
  });
});
