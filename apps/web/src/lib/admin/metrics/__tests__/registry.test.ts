import {
  listMetricDefinitions,
  getMetricDefinition,
  hasMetricDefinition,
  metricHref,
  humanizeMetricId,
  metricsByCategory,
} from '..';

describe('metric registry', () => {
  const defs = listMetricDefinitions();

  it('has curated metrics', () => {
    expect(defs.length).toBeGreaterThanOrEqual(10);
  });

  it('every definition has the required explainer fields', () => {
    for (const d of defs) {
      expect(d.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)+$/); // kebab-case, category-prefixed
      expect(d.label.trim()).not.toBe('');
      expect(d.summary.trim()).not.toBe('');
      expect(d.definition.trim()).not.toBe('');
      expect(d.howComputed.trim()).not.toBe('');
      expect(d.interpretation.trim()).not.toBe('');
      expect(d.dataSource).toBeTruthy();
    }
  });

  it('ids are unique', () => {
    const ids = defs.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('related links are absolute admin/app paths', () => {
    for (const d of defs) {
      for (const link of d.related ?? []) {
        expect(link.label.trim()).not.toBe('');
        expect(link.href.startsWith('/')).toBe(true);
      }
    }
  });

  it('getMetricDefinition + hasMetricDefinition agree', () => {
    expect(getMetricDefinition('platform-accounts')).not.toBeNull();
    expect(hasMetricDefinition('platform-accounts')).toBe(true);
    expect(getMetricDefinition('does-not-exist')).toBeNull();
    expect(hasMetricDefinition('does-not-exist')).toBe(false);
  });

  it('metricHref builds clean urls with optional value passthrough', () => {
    expect(metricHref('platform-sessions')).toBe('/admin/metrics/platform-sessions');
    expect(metricHref('platform-accounts', '1,204')).toBe('/admin/metrics/platform-accounts?v=1%2C204');
  });

  it('humanizeMetricId drops the category prefix and title-cases', () => {
    expect(humanizeMetricId('platform-golf-profiles')).toBe('Golf Profiles');
    expect(humanizeMetricId('ai-spend-today')).toBe('Spend Today');
    expect(humanizeMetricId('orphans')).toBe('Orphans');
  });

  it('metricsByCategory only returns non-empty groups', () => {
    const groups = metricsByCategory();
    expect(groups.length).toBeGreaterThan(0);
    for (const g of groups) expect(g.metrics.length).toBeGreaterThan(0);
    expect(groups.some((g) => g.category === 'platform')).toBe(true);
  });
});
