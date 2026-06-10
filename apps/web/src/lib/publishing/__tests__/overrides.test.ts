import { applyOverrides, applyOverridesByKey, isEffectivelyPublished } from '../overrides';

interface Item {
  id: string;
  basePublished: boolean;
}

const items: Item[] = [
  { id: 'a', basePublished: true },
  { id: 'b', basePublished: false },
  { id: 'c', basePublished: true },
];

const isBase = (i: Item) => i.basePublished;

describe('publishing/overrides', () => {
  it('is a no-op when there are no overrides (zero behaviour change)', () => {
    const out = applyOverrides(items, {}, isBase);
    expect(out.map((i) => i.id)).toEqual(['a', 'c']);
  });

  it('promotes a base draft to published', () => {
    const out = applyOverrides(items, { b: true }, isBase);
    expect(out.map((i) => i.id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('demotes a base-published item to draft', () => {
    const out = applyOverrides(items, { a: false }, isBase);
    expect(out.map((i) => i.id)).toEqual(['c']);
  });

  it('resolves a single item effective state', () => {
    expect(isEffectivelyPublished(items[1], { b: true }, isBase)).toBe(true);
    expect(isEffectivelyPublished(items[0], { a: false }, isBase)).toBe(false);
    expect(isEffectivelyPublished(items[0], {}, isBase)).toBe(true);
  });

  it('applyOverridesByKey merges on a custom key (e.g. slug)', () => {
    const posts = [
      { slug: 'x', live: true },
      { slug: 'y', live: false },
    ];
    const isLive = (p: { live: boolean }) => p.live;
    // empty → no-op
    expect(applyOverridesByKey(posts, {}, isLive, (p) => p.slug).map((p) => p.slug)).toEqual(['x']);
    // promote y, demote x — keyed by slug, not id
    const out = applyOverridesByKey(posts, { y: true, x: false }, isLive, (p) => p.slug);
    expect(out.map((p) => p.slug)).toEqual(['y']);
  });

  it('applyOverrides delegates to the id keyer (unchanged behaviour)', () => {
    expect(applyOverrides(items, { b: true }, isBase).map((i) => i.id).sort()).toEqual(['a', 'b', 'c']);
  });
});
