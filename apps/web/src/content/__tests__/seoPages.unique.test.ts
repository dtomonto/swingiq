// Guards the programmatic-SEO registries (seoPages + wedges + racket) against
// duplicate-content liabilities. Every published landing page must have a
// unique slug, <title>, meta description, and lead "direct answer" — and none
// may be a near-duplicate of another. This is the unit-test twin of the
// build-time gate in scripts/check-duplicate-content.mjs, but it imports the
// REAL data (not a regex parse), so it can't be fooled by formatting.

import { PUBLISHED_SEO_PAGES } from '@/content/seoPages';

/** Token-set (Jaccard) similarity over normalized words. 1 = identical set. */
function similarity(a: string, b: string): number {
  const toks = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean),
    );
  const A = toks(a);
  const B = toks(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

function findDuplicates(values: string[]): string[] {
  const seen = new Map<string, number>();
  const dupes: string[] = [];
  for (const v of values) {
    const key = v.trim().toLowerCase();
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  for (const [key, count] of seen) if (count > 1) dupes.push(key);
  return dupes;
}

/** All unordered pairs whose similarity meets/exceeds the threshold. */
function nearDuplicatePairs(
  items: { slug: string; text: string }[],
  threshold: number,
): string[] {
  const hits: string[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const sim = similarity(items[i].text, items[j].text);
      if (sim >= threshold) {
        hits.push(`${items[i].slug} ↔ ${items[j].slug} (${Math.round(sim * 100)}%)`);
      }
    }
  }
  return hits;
}

describe('SEO registry — every published page is original', () => {
  it('has at least the expected catalogue of published pages', () => {
    expect(PUBLISHED_SEO_PAGES.length).toBeGreaterThanOrEqual(40);
  });

  it('has unique slugs', () => {
    expect(findDuplicates(PUBLISHED_SEO_PAGES.map((p) => p.slug))).toEqual([]);
  });

  it('has unique titles', () => {
    expect(findDuplicates(PUBLISHED_SEO_PAGES.map((p) => p.title))).toEqual([]);
  });

  it('has unique meta descriptions', () => {
    expect(findDuplicates(PUBLISHED_SEO_PAGES.map((p) => p.metaDescription))).toEqual([]);
  });

  it('has unique direct answers', () => {
    expect(findDuplicates(PUBLISHED_SEO_PAGES.map((p) => p.directAnswer))).toEqual([]);
  });

  // 0.85 is comfortably above legitimate parallel pages (e.g. slow- vs
  // fast-pitch guides share vocabulary at ~0.75) but below true duplicates.
  it('has no near-duplicate meta descriptions', () => {
    const pairs = nearDuplicatePairs(
      PUBLISHED_SEO_PAGES.map((p) => ({ slug: p.slug, text: p.metaDescription })),
      0.85,
    );
    expect(pairs).toEqual([]);
  });

  it('has no near-duplicate direct answers', () => {
    const pairs = nearDuplicatePairs(
      PUBLISHED_SEO_PAGES.map((p) => ({ slug: p.slug, text: p.directAnswer })),
      0.85,
    );
    expect(pairs).toEqual([]);
  });

  it('keeps every meta description within a healthy length window', () => {
    const tooLong = PUBLISHED_SEO_PAGES.filter((p) => p.metaDescription.length > 175).map(
      (p) => `${p.slug} (${p.metaDescription.length})`,
    );
    expect(tooLong).toEqual([]);
  });
});
