import { PUBLISHABLE_AREAS, areaForType, summarizeAreas } from '../entity-registry';
import { classifyRisk } from '../risk';

describe('publishing/entity-registry', () => {
  it('has unique keys and entity types', () => {
    const keys = PUBLISHABLE_AREAS.map((a) => a.key);
    const types = PUBLISHABLE_AREAS.map((a) => a.entityType);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(types).size).toBe(types.length);
  });

  it('derives risk from the same classifier the runtime uses', () => {
    for (const a of PUBLISHABLE_AREAS) {
      expect(a.riskLevel).toBe(classifyRisk(a.entityType, 'publish'));
    }
  });

  it('only labels a surface live-connected when it truly is', () => {
    for (const a of PUBLISHABLE_AREAS) {
      if (a.source === 'live-connected') expect(a.liveConnected).toBe(true);
      if (!a.liveConnected) expect(a.source).not.toBe('live-connected');
    }
  });

  it('every area links to an admin tool and a public route', () => {
    for (const a of PUBLISHABLE_AREAS) {
      expect(a.adminHref).toMatch(/^\//);
      expect(a.publicRoutes.length).toBeGreaterThan(0);
      expect(a.recommendedAction.length).toBeGreaterThan(0);
    }
  });

  it('looks up an area by type', () => {
    expect(areaForType('update')?.key).toBe('update');
    expect(areaForType('seo-page')?.publishMode).toBe('hybrid');
  });

  it('summarizes coverage honestly', () => {
    const s = summarizeAreas();
    expect(s.total).toBe(PUBLISHABLE_AREAS.length);
    expect(s.liveConnected).toBeGreaterThanOrEqual(1);
    expect(s.liveConnected).toBeLessThanOrEqual(s.total);
  });
});
