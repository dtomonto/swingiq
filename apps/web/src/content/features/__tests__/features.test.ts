import {
  ALL_FEATURES,
  FEATURE_GROUPS,
  GROUP_ORDER,
  getFeature,
  allFeatureSlugs,
  relatedFeatures,
  featureHref,
} from '../index';

describe('feature registry — integrity', () => {
  it('has a healthy number of features', () => {
    expect(ALL_FEATURES.length).toBeGreaterThanOrEqual(35);
  });

  it('every slug is unique', () => {
    const slugs = ALL_FEATURES.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every slug is kebab-case (url-safe, no leading slash)', () => {
    for (const f of ALL_FEATURES) {
      expect(f.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('every feature has the required, non-thin content', () => {
    for (const f of ALL_FEATURES) {
      expect(f.name.trim().length).toBeGreaterThan(0);
      expect(f.group.trim().length).toBeGreaterThan(0);
      expect(f.sports.trim().length).toBeGreaterThan(0);
      expect(f.summary.trim().length).toBeGreaterThan(20);
      // Overview must be real prose, not a stub.
      expect(f.overview.length).toBeGreaterThanOrEqual(2);
      for (const p of f.overview) expect(p.trim().length).toBeGreaterThan(40);
      // A genuine how-to guide.
      expect(f.guide.length).toBeGreaterThanOrEqual(2);
      for (const s of f.guide) {
        expect(s.title.trim().length).toBeGreaterThan(0);
        expect(s.body.trim().length).toBeGreaterThan(20);
      }
    }
  });

  it('every feature belongs to a known, ordered group', () => {
    for (const f of ALL_FEATURES) {
      expect(GROUP_ORDER).toContain(f.group);
    }
  });

  it('grouping covers every feature with no orphans', () => {
    const grouped = FEATURE_GROUPS.flatMap((g) => g.features.map((f) => f.slug)).sort();
    const all = ALL_FEATURES.map((f) => f.slug).sort();
    expect(grouped).toEqual(all);
  });

  it('related slugs all resolve to real features (no dangling links)', () => {
    const dangling: string[] = [];
    for (const f of ALL_FEATURES) {
      for (const s of f.relatedSlugs ?? []) {
        if (!getFeature(s)) dangling.push(`${f.slug} → ${s}`);
      }
    }
    expect(dangling).toEqual([]);
  });

  it('a feature never lists itself as related', () => {
    for (const f of ALL_FEATURES) {
      expect(f.relatedSlugs ?? []).not.toContain(f.slug);
    }
  });

  it('faq entries (when present) have a question and answer', () => {
    for (const f of ALL_FEATURES) {
      for (const q of f.faqs ?? []) {
        expect(q.question.trim().length).toBeGreaterThan(0);
        expect(q.answer.trim().length).toBeGreaterThan(20);
      }
    }
  });
});

describe('feature registry — helpers', () => {
  it('allFeatureSlugs matches ALL_FEATURES', () => {
    expect(allFeatureSlugs().sort()).toEqual(ALL_FEATURES.map((f) => f.slug).sort());
  });

  it('getFeature resolves and rejects', () => {
    expect(getFeature('ai-diagnostic-engine')?.name).toBe('AI Diagnostic Engine');
    expect(getFeature('not-a-real-feature')).toBeUndefined();
  });

  it('featureHref builds a /features/<slug> path', () => {
    expect(featureHref({ slug: 'fix-stack' })).toBe('/features/fix-stack');
  });

  it('relatedFeatures returns full objects and skips unknowns', () => {
    const f = getFeature('ai-diagnostic-engine')!;
    const related = relatedFeatures(f);
    expect(related.length).toBeGreaterThan(0);
    for (const r of related) expect(r.slug).toBeTruthy();
  });
});
