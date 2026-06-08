import { getPublicUpdates, type Update } from '@/data/updates';
import { getDevUpdates } from '@/data/devUpdates';
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld';
import {
  updatePath,
  updateUrl,
  getPublicUpdateBySlug,
  publicUpdateSlugs,
  getRelatedUpdates,
  buildUpdateFaqs,
  buildUpdateMetadata,
  buildUpdateJsonLd,
  resolveInternalLinks,
  updateAiAnswer,
} from '../product-detail';
import {
  devUpdateSlug,
  devUpdatePath,
  getPublicDevUpdateBySlug,
  publicDevUpdateSlugs,
  getRelatedDevUpdates,
  buildDevUpdateFaqs,
  buildDevUpdateMetadata,
  buildDevUpdateJsonLd,
} from '../dev-detail';
import { validateUpdate, scoreUpdateQuality } from '../validation';

const sampleUpdate = (): Update => getPublicUpdates()[0];

// ── Product update detail engine ──────────────────────────────────────────

describe('product update detail', () => {
  it('every published update has a unique slug (no collisions / cannibalization)', () => {
    const slugs = publicUpdateSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('builds the correct dedicated path + absolute url', () => {
    const u = sampleUpdate();
    expect(updatePath(u)).toBe(`/updates/${u.slug}`);
    expect(updateUrl(u)).toMatch(new RegExp(`/updates/${u.slug}$`));
  });

  it('resolves a published update by slug — no orphan pages', () => {
    for (const slug of publicUpdateSlugs()) {
      expect(getPublicUpdateBySlug(slug)).toBeDefined();
    }
  });

  it('returns undefined for an unknown or non-public slug', () => {
    expect(getPublicUpdateBySlug('does-not-exist-xyz')).toBeUndefined();
  });

  it('related updates exclude self and respect the limit', () => {
    const u = sampleUpdate();
    const related = getRelatedUpdates(u, 3);
    expect(related.length).toBeLessThanOrEqual(3);
    expect(related.some((r) => r.id === u.id)).toBe(false);
  });

  it('derives an FAQ sourced from the update fields', () => {
    const u = sampleUpdate();
    const faqs = buildUpdateFaqs(u);
    expect(faqs.length).toBeGreaterThanOrEqual(2);
    expect(faqs[0].a).toBe(u.summary);
    faqs.forEach((f) => {
      expect(f.q.length).toBeGreaterThan(0);
      expect(f.a.length).toBeGreaterThan(0);
    });
  });

  it('builds unique metadata with a canonical to its own slug', () => {
    const u = sampleUpdate();
    const meta = buildUpdateMetadata(u);
    expect(meta.title).toBeTruthy();
    expect(meta.description).toBeTruthy();
    expect(meta.alternates?.canonical).toBe(`/updates/${u.slug}`);
  });

  it('builds a valid JSON-LD graph (Breadcrumb + Article + FAQ) that serializes safely', () => {
    const u = sampleUpdate();
    const faqs = buildUpdateFaqs(u);
    const jsonLd = buildUpdateJsonLd(u, faqs) as { '@graph': Array<{ '@type': string }> };
    const types = jsonLd['@graph'].map((g) => g['@type']);
    expect(types).toContain('BreadcrumbList');
    expect(types).toContain('Article');
    expect(types).toContain('FAQPage');
    // Serializes through the shared safe serializer and round-trips as valid JSON.
    expect(() => JSON.parse(serializeJsonLd(jsonLd))).not.toThrow();
  });

  it('always provides an AI answer summary', () => {
    expect(updateAiAnswer(sampleUpdate()).length).toBeGreaterThan(0);
  });

  it('resolves internal links and de-dupes them', () => {
    const u = getPublicUpdates().find((x) => (x.internalLinkTargets?.length ?? 0) > 0)!;
    const links = resolveInternalLinks(u);
    expect(links.length).toBeGreaterThan(0);
    expect(new Set(links.map((l) => l.href)).size).toBe(links.length);
    links.forEach((l) => expect(l.label).toBeTruthy());
  });
});

// ── Validation + quality gate ─────────────────────────────────────────────

describe('update validation', () => {
  it('passes for a real published seed update', () => {
    const result = validateUpdate(sampleUpdate());
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('flags a duplicate slug', () => {
    const a = sampleUpdate();
    const clone: Update = { ...a, id: 'dupe-test', title: 'Dupe' };
    const result = validateUpdate(clone, [...getPublicUpdates(), clone]);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === 'slug')).toBe(true);
  });

  it('rejects an invalid slug shape', () => {
    const bad: Update = { ...sampleUpdate(), id: 'bad', slug: 'Not A Slug!' };
    const result = validateUpdate(bad);
    expect(result.errors.some((e) => e.field === 'slug')).toBe(true);
  });

  it('scores a rich published update above the human-review threshold', () => {
    const q = scoreUpdateQuality(sampleUpdate());
    expect(q.score).toBeGreaterThanOrEqual(60);
    expect(q.needsHumanReview).toBe(false);
  });

  it('blocks a publish candidate that is missing a summary (the gate)', () => {
    const bad: Update = { ...sampleUpdate(), id: 'gate', slug: 'gate-test', summary: '' };
    const result = validateUpdate(bad);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === 'summary')).toBe(true);
  });

  it('keeps Before/After as an honest optional pair where present', () => {
    const withBA = getPublicUpdates().filter((u) => u.beforeAfter);
    withBA.forEach((u) => {
      expect(u.beforeAfter!.before.length).toBeGreaterThan(0);
      expect(u.beforeAfter!.after.length).toBeGreaterThan(0);
      // Publishing a richer page must never break validation.
      expect(validateUpdate(u).ok).toBe(true);
    });
  });
});

// ── Developer update detail engine ────────────────────────────────────────

describe('developer update detail', () => {
  it('derives a unique slug for every published developer update', () => {
    const slugs = publicDevUpdateSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('strips the conventional dev- prefix from the id', () => {
    const u = getDevUpdates().find((x) => x.id.startsWith('dev-'))!;
    expect(devUpdateSlug(u)).toBe(u.id.replace(/^dev-/, ''));
    expect(devUpdatePath(u)).toBe(`/dev-updates/${devUpdateSlug(u)}`);
  });

  it('resolves every published developer update by slug — no orphans', () => {
    for (const slug of publicDevUpdateSlugs()) {
      expect(getPublicDevUpdateBySlug(slug)).toBeDefined();
    }
  });

  it('builds metadata with a canonical and a TechArticle JSON-LD graph', () => {
    const u = getDevUpdates()[0];
    const meta = buildDevUpdateMetadata(u);
    expect(meta.alternates?.canonical).toBe(devUpdatePath(u));

    const faqs = buildDevUpdateFaqs(u);
    const jsonLd = buildDevUpdateJsonLd(u, faqs) as { '@graph': Array<{ '@type': string }> };
    const types = jsonLd['@graph'].map((g) => g['@type']);
    expect(types).toContain('BreadcrumbList');
    expect(types).toContain('TechArticle');
    expect(() => JSON.parse(serializeJsonLd(jsonLd))).not.toThrow();
  });

  it('related dev updates exclude self and respect the limit', () => {
    const u = getDevUpdates()[0];
    const related = getRelatedDevUpdates(u, 3);
    expect(related.length).toBeLessThanOrEqual(3);
    expect(related.some((r) => r.id === u.id)).toBe(false);
  });
});
