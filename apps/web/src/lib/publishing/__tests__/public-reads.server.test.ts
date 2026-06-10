import {
  getEffectivePublicDevUpdates,
  getEffectiveDevUpdateBySlug,
  getEffectivePublicBlogPosts,
  getEffectiveBlogPost,
  getEffectivePublishedSeoPages,
  isEffectiveSeoPagePublished,
} from '../public-updates.server';
import { setPublishOverride, __resetMemoryStore } from '../store';
import { devUpdateSlug } from '@/lib/updates/dev-detail';

// These reads merge the durable override (in-memory in tests) on top of each
// surface's base published state. We assert the ADDITIVE guarantee (no override
// = base set) and both override directions, using whatever real data exists so
// the test never hard-codes a fixture id/slug.

describe('publishing/public-reads (override-aware)', () => {
  beforeEach(() => __resetMemoryStore());
  afterAll(() => __resetMemoryStore());

  it('dev-updates: no override returns the base published set', async () => {
    const base = await getEffectivePublicDevUpdates();
    expect(base.length).toBeGreaterThan(0);
    // Sorted newest-first.
    for (let i = 1; i < base.length; i++) {
      expect(new Date(base[i - 1].date).getTime()).toBeGreaterThanOrEqual(new Date(base[i].date).getTime());
    }
  });

  it('dev-updates: a durable override hides a live item, then restores it', async () => {
    const base = await getEffectivePublicDevUpdates();
    const target = base[0];

    await setPublishOverride('dev-update', target.id, false);
    const hidden = await getEffectivePublicDevUpdates();
    expect(hidden.find((u) => u.id === target.id)).toBeUndefined();
    // Detail lookup by slug also 404s (returns undefined).
    expect(await getEffectiveDevUpdateBySlug(devUpdateSlug(target))).toBeUndefined();

    await setPublishOverride('dev-update', target.id, true);
    const restored = await getEffectivePublicDevUpdates();
    expect(restored.find((u) => u.id === target.id)).toBeDefined();
    expect(await getEffectiveDevUpdateBySlug(devUpdateSlug(target))).toBeDefined();
  });

  it('blog: no override returns the base published set, newest-first', async () => {
    const base = await getEffectivePublicBlogPosts();
    expect(base.length).toBeGreaterThan(0);
    for (let i = 1; i < base.length; i++) {
      expect(base[i - 1].publishDate >= base[i].publishDate).toBe(true);
    }
  });

  it('blog: a durable override (keyed by slug) hides then restores a post', async () => {
    const base = await getEffectivePublicBlogPosts();
    const target = base[0];

    await setPublishOverride('blog-post', target.slug, false);
    expect((await getEffectivePublicBlogPosts()).find((p) => p.slug === target.slug)).toBeUndefined();
    expect(await getEffectiveBlogPost(target.slug)).toBeUndefined();

    await setPublishOverride('blog-post', target.slug, true);
    expect((await getEffectivePublicBlogPosts()).find((p) => p.slug === target.slug)).toBeDefined();
    expect(await getEffectiveBlogPost(target.slug)).toBeDefined();
  });

  it('seo: no override returns the base published set', async () => {
    const base = await getEffectivePublishedSeoPages();
    expect(base.length).toBeGreaterThan(0);
  });

  it('seo: a durable override hides a page from the crawl set + single-check', async () => {
    const base = await getEffectivePublishedSeoPages();
    const target = base[0];
    expect(await isEffectiveSeoPagePublished(target.slug)).toBe(true);

    await setPublishOverride('seo-page', target.slug, false);
    expect((await getEffectivePublishedSeoPages()).find((p) => p.slug === target.slug)).toBeUndefined();
    expect(await isEffectiveSeoPagePublished(target.slug)).toBe(false);

    await setPublishOverride('seo-page', target.slug, true);
    expect((await getEffectivePublishedSeoPages()).find((p) => p.slug === target.slug)).toBeDefined();
    expect(await isEffectiveSeoPagePublished(target.slug)).toBe(true);
  });

  it('seo: an unknown slug is never published', async () => {
    expect(await isEffectiveSeoPagePublished('no-such-seo-slug-xyz')).toBe(false);
  });

  it('overrides are surface-scoped: a blog override never affects dev-updates', async () => {
    const devBase = await getEffectivePublicDevUpdates();
    await setPublishOverride('blog-post', 'whatever-slug', false);
    const devAfter = await getEffectivePublicDevUpdates();
    expect(devAfter.length).toBe(devBase.length);
  });
});
