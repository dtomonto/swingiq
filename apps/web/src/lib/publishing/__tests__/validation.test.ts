import { validateEntity, unknownValidation } from '../validation';

describe('publishing/validation', () => {
  it('passes a clean, complete entity', () => {
    const r = validateEntity({
      entityType: 'update',
      title: 'New equipment diagnostics',
      slug: 'new-equipment-diagnostics',
      body: 'A'.repeat(300),
      indexable: true,
      rankIntended: true,
      metaTitle: 'New equipment diagnostics',
      metaDescription: 'Track your clubs and get tailored equipment insights from every session you log.',
    });
    expect(r.ok).toBe(true);
    expect(r.status).toBe('passed');
    expect(r.errors).toHaveLength(0);
  });

  it('errors on missing title', () => {
    const r = validateEntity({ entityType: 'update', title: '' });
    expect(r.ok).toBe(false);
    expect(r.status).toBe('failed');
  });

  it('errors on a colliding slug', () => {
    const r = validateEntity({
      entityType: 'seo-page',
      title: 'Break 90',
      slug: 'break-90',
      existingSlugs: ['break-90'],
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/break-90/);
  });

  it('errors on a malformed slug', () => {
    const r = validateEntity({ entityType: 'seo-page', title: 'X', slug: 'Not A Slug' });
    expect(r.ok).toBe(false);
  });

  it('blocks secret/credential leakage', () => {
    const r = validateEntity({
      entityType: 'update',
      title: 'Oops',
      body: 'here is the service_role key we should not ship',
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ').toLowerCase()).toMatch(/secret|credential|leak/);
  });

  it('warns on placeholder text and thin content', () => {
    const r = validateEntity({
      entityType: 'seo-page',
      title: 'Coming soon page',
      slug: 'coming-soon',
      body: 'TODO write this',
      rankIntended: true,
    });
    expect(r.status === 'warnings' || r.status === 'failed').toBe(true);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('rejects invalid structured-data JSON', () => {
    const r = validateEntity({
      entityType: 'seo-page',
      title: 'X',
      slug: 'x',
      schemaJson: '{ not valid json',
    });
    expect(r.ok).toBe(false);
  });

  it('accepts valid structured-data JSON', () => {
    const r = validateEntity({
      entityType: 'seo-page',
      title: 'X',
      slug: 'x',
      schemaJson: '{"@type":"FAQPage"}',
    });
    expect(r.checks.find((c) => c.id === 'schema-json')?.passed).toBe(true);
  });

  it('unknownValidation is a not-ok placeholder', () => {
    const r = unknownValidation();
    expect(r.status).toBe('unknown');
    expect(r.ok).toBe(false);
  });
});
