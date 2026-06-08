// Data Quality auditor — pure check unit tests.
// Confirms each check fires on real problems, stays quiet when clean,
// and that the report totals reconcile.

import { runDataQualityReport, type SeoPageLike } from '../data-quality/checks';

function page(overrides: Partial<SeoPageLike> = {}): SeoPageLike {
  return {
    slug: 'golf/fix-slice',
    sport: 'golf',
    keyword: 'how to fix a slice',
    title: 'How to Fix a Golf Slice (Beginner-Safe Guide)',
    metaDescription:
      'A slice is an out-to-in path with an open face. Diagnose it, fix it with three drills, and follow a 7-day plan to straighten your ball flight for good.',
    directAnswer: 'Fix the path first, then the face.',
    problemExplanation: ['Because path and face.'],
    drills: [{}],
    faqs: [{}],
    cta: { href: '/free' },
    publishStatus: 'published',
    ...overrides,
  };
}

const cat = (r: ReturnType<typeof runDataQualityReport>, id: string) =>
  r.categories.find((c) => c.id === id)!;

describe('runDataQualityReport — clean input', () => {
  it('reports no issues for well-formed pages', () => {
    const r = runDataQualityReport([
      page(),
      page({
        slug: 'tennis/forehand',
        sport: 'tennis',
        keyword: 'tennis forehand',
        title: 'Tennis Forehand Fundamentals (Simple Guide)',
        metaDescription:
          'Build a reliable tennis forehand: the grip, the unit turn and the contact point, plus three drills and a simple practice plan to groove consistent depth.',
      }),
    ]);
    expect(r.totals.issues).toBe(0);
    expect(r.totals.cleanChecks).toBe(r.categories.length);
    expect(r.scanned).toBe(2);
  });
});

describe('duplicate detection', () => {
  it('flags duplicate slugs as critical', () => {
    const r = runDataQualityReport([page(), page()]);
    expect(cat(r, 'dup-slug').issues.length).toBe(1);
    expect(r.totals.critical).toBe(1);
  });

  it('flags duplicate titles, meta and keywords', () => {
    const r = runDataQualityReport([
      page({ slug: 'golf/a' }),
      page({ slug: 'golf/b' }), // same title/meta/keyword as default
    ]);
    expect(cat(r, 'dup-title').issues.length).toBe(1);
    expect(cat(r, 'dup-meta').issues.length).toBe(1);
    expect(cat(r, 'dup-keyword').issues.length).toBe(1);
  });
});

describe('length checks', () => {
  it('flags over-long titles and short meta', () => {
    const r = runDataQualityReport([
      page({
        slug: 'golf/x',
        title: 'X'.repeat(80),
        metaDescription: 'too short',
        keyword: 'unique-kw',
      }),
    ]);
    expect(cat(r, 'title-length').issues.length).toBe(1);
    expect(cat(r, 'meta-length').issues.length).toBe(1);
  });
});

describe('content + tagging checks', () => {
  it('flags thin content', () => {
    const r = runDataQualityReport([
      page({ slug: 'golf/thin', keyword: 'kw1', title: 'A Reasonable Title Here', directAnswer: '', drills: [], faqs: [] }),
    ]);
    const thin = cat(r, 'thin-content').issues;
    expect(thin.length).toBe(1);
    expect(thin[0].detail).toContain('direct answer');
    expect(thin[0].detail).toContain('drills');
  });

  it('flags slug/sport mismatch', () => {
    const r = runDataQualityReport([
      page({ slug: 'golf/mislabeled', sport: 'tennis', keyword: 'kw2', title: 'A Reasonable Title Here' }),
    ]);
    expect(cat(r, 'sport-mismatch').issues.length).toBe(1);
  });

  it('accepts softball disciplines as valid for a softball slug', () => {
    const r = runDataQualityReport([
      page({ slug: 'softball/power', sport: 'softball_slow', keyword: 'kw3', title: 'A Reasonable Title Here' }),
    ]);
    expect(cat(r, 'sport-mismatch').issues.length).toBe(0);
  });

  it('flags a missing CTA', () => {
    const r = runDataQualityReport([
      page({ slug: 'golf/nocta', keyword: 'kw4', title: 'A Reasonable Title Here', cta: { href: '' } }),
    ]);
    expect(cat(r, 'cta-missing').issues.length).toBe(1);
  });
});

describe('totals reconcile', () => {
  it('issue counts sum across severities', () => {
    const r = runDataQualityReport([page(), page()]); // dup slug/title/meta/keyword
    const { critical, warning, info, issues } = r.totals;
    expect(critical + warning + info).toBe(issues);
    expect(critical).toBeGreaterThanOrEqual(1);
  });
});
