// Tests for the shared SEO layer that the sport-analysis pages were migrated
// onto (master-audit-report F-03 / F-08 / F-09). These guard against metadata
// and structured-data regressions across every page that uses the helpers.

import { buildMetadata } from '@/lib/seo/metadata';
import {
  buildGraph,
  organizationSchema,
  websiteSchema,
  softwareApplicationSchema,
  articleSchema,
  faqPageSchema,
  howToSchema,
  breadcrumbListSchema,
} from '@/lib/seo/jsonLd';
import { siteConfig, absoluteUrl } from '@/config/site';

describe('buildMetadata', () => {
  it('appends the brand to a page title', () => {
    const m = buildMetadata({ title: 'Free Golf Swing Analysis', path: '/golf-swing-analysis' });
    expect(m.title).toBe(`Free Golf Swing Analysis | ${siteConfig.siteName}`);
  });

  it('does not double-append the brand when already present', () => {
    const m = buildMetadata({ title: `SwingIQ — Home` });
    expect(m.title).toBe('SwingIQ — Home');
  });

  it('falls back to the default branded title when none is given', () => {
    const m = buildMetadata({});
    expect(m.title).toBe(`${siteConfig.siteName} — ${siteConfig.tagline}`);
  });

  it('sets the canonical to the given path', () => {
    const m = buildMetadata({ path: '/tennis-swing-analysis' });
    expect(m.alternates?.canonical).toBe('/tennis-swing-analysis');
  });

  it('indexes by default and respects noindex', () => {
    expect(buildMetadata({}).robots).toMatchObject({ index: true, follow: true });
    expect(buildMetadata({ noindex: true }).robots).toMatchObject({ index: false, follow: false });
  });

  it('uses the default OG image as an absolute URL when none is provided', () => {
    const m = buildMetadata({ path: '/x' });
    const images = (m.openGraph as { images?: Array<{ url: string }> }).images;
    expect(images?.[0]?.url).toBe(absoluteUrl(siteConfig.defaultOgImage));
    expect(images?.[0]?.url.startsWith('http')).toBe(true);
  });

  it('emits a summary_large_image twitter card', () => {
    const m = buildMetadata({ path: '/x' });
    expect((m.twitter as { card?: string }).card).toBe('summary_large_image');
  });

  it('includes keywords only when provided', () => {
    expect(buildMetadata({}).keywords).toBeUndefined();
    expect(buildMetadata({ keywords: ['a', 'b'] }).keywords).toEqual(['a', 'b']);
  });
});

describe('jsonLd builders', () => {
  it('links WebSite publisher to the Organization @id', () => {
    const org = organizationSchema();
    const site = websiteSchema();
    expect(org['@id']).toBe(`${siteConfig.liveSiteUrl}/#organization`);
    expect((site.publisher as { '@id': string })['@id']).toBe(org['@id']);
  });

  it('points the Organization logo at an absolute icon-512 URL', () => {
    expect(organizationSchema().logo).toBe(absoluteUrl('/icon-512.png'));
  });

  it('reports the free price truthfully', () => {
    const app = softwareApplicationSchema();
    expect(app.offers).toMatchObject({ price: '0', priceCurrency: 'USD' });
  });

  it('maps FAQ items to Question/Answer nodes', () => {
    const faq = faqPageSchema([{ question: 'Q1?', answer: 'A1' }]);
    expect(faq['@type']).toBe('FAQPage');
    const entity = (faq.mainEntity as Array<Record<string, unknown>>)[0];
    expect(entity.name).toBe('Q1?');
    expect((entity.acceptedAnswer as { text: string }).text).toBe('A1');
  });

  it('numbers HowTo steps starting at 1', () => {
    const howTo = howToSchema('How it works', [
      { name: 'Step A', text: 'do a' },
      { name: 'Step B', text: 'do b' },
    ]);
    const steps = howTo.step as Array<{ position: number; name: string }>;
    expect(steps.map((s) => s.position)).toEqual([1, 2]);
    expect(steps[1].name).toBe('Step B');
  });

  it('builds absolute breadcrumb items in order', () => {
    const crumbs = breadcrumbListSchema([
      { name: 'Home', path: '/' },
      { name: 'Golf Swing Analysis', path: '/golf-swing-analysis' },
    ]);
    const items = crumbs.itemListElement as Array<{ position: number; item: string }>;
    expect(items.map((i) => i.position)).toEqual([1, 2]);
    expect(items[1].item).toBe(absoluteUrl('/golf-swing-analysis'));
  });

  it('wraps nodes in a single @graph document', () => {
    const graph = buildGraph(organizationSchema(), websiteSchema(), faqPageSchema([]));
    expect(graph['@context']).toBe('https://schema.org');
    expect((graph['@graph'] as unknown[]).length).toBe(3);
  });

  it('mirrors the sport-page graph composition without a duplicate BreadcrumbList', () => {
    // Sport pages render <Breadcrumbs> (which emits its own BreadcrumbList),
    // so the page graph must NOT also include one — only Org/WebSite/HowTo/FAQ.
    const graph = buildGraph(
      organizationSchema(),
      websiteSchema(),
      howToSchema('How Golf Swing Analysis Works', [{ name: 'Upload', text: 'x' }]),
      faqPageSchema([{ question: 'Q?', answer: 'A' }]),
    );
    const types = (graph['@graph'] as Array<{ '@type': string }>).map((n) => n['@type']);
    expect(types).toEqual(['Organization', 'WebSite', 'HowTo', 'FAQPage']);
    expect(types).not.toContain('BreadcrumbList');
  });

  it('omits empty optional fields (article dates, org sameAs)', () => {
    const art = articleSchema({ headline: 'H', description: 'D', path: '/blog/x' });
    expect(art.datePublished).toBeUndefined();
    expect(art.author).toMatchObject({ '@id': organizationSchema()['@id'] });
  });
});
