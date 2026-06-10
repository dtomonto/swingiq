import { buildPublishDetail, entityKey, isRankingType, type DetailInput } from '../detail';
import { classifyRisk, explainRisk } from '../risk';
import type { PublishableEntity, PublishEvent } from '../types';

const baseInput = (over: Partial<DetailInput> = {}): DetailInput => ({
  entityType: 'update',
  entityId: 'u1',
  title: 'A real update',
  published: false,
  ...over,
});

describe('publishing/detail', () => {
  it('builds the canonical entity key', () => {
    expect(entityKey('seo-page', 'break-90')).toBe('seo-page:break-90');
  });

  it('carries the risk rationale from the shared classifier', () => {
    const d = buildPublishDetail(baseInput({ entityType: 'trust-copy', entityId: 'privacy' }));
    expect(d.risk.level).toBe(classifyRisk('trust-copy', 'publish'));
    expect(d.risk.explanation).toBe(explainRisk('trust-copy', d.risk.level));
    expect(d.risk.allowsInstant).toBe(true); // high, not critical
  });

  it('passes pre-flight when title + slug are clean', () => {
    const d = buildPublishDetail(baseInput({ slug: 'clean-slug' }));
    expect(d.validation.ok).toBe(true);
    expect(d.validation.status).toBe('passed');
    expect(d.validation.checks.find((c) => c.id === 'title')?.passed).toBe(true);
    expect(d.validation.checks.find((c) => c.id === 'slug-format')?.passed).toBe(true);
  });

  it('fails pre-flight on a malformed slug and on a slug collision', () => {
    const bad = buildPublishDetail(baseInput({ slug: 'Not A Slug' }));
    expect(bad.validation.ok).toBe(false);
    expect(bad.validation.checks.find((c) => c.id === 'slug-format')?.passed).toBe(false);

    const collide = buildPublishDetail(baseInput({ slug: 'taken' }), undefined, [], ['taken']);
    expect(collide.validation.checks.find((c) => c.id === 'slug-unique')?.passed).toBe(false);
  });

  it('does NOT assert meta/thin-content failures it cannot see (honest shallow pre-flight)', () => {
    // A ranking type with no body must not produce a false content-length / meta fail.
    const d = buildPublishDetail(baseInput({ entityType: 'seo-page', entityId: 'p', slug: 'p', title: 'T' }));
    const ids = d.validation.checks.map((c) => c.id);
    expect(ids).not.toContain('content-length');
    expect(ids).not.toContain('meta-desc');
    expect(isRankingType('seo-page')).toBe(true);
    expect(isRankingType('update')).toBe(false);
  });

  it('flags placeholder + secret leakage in the title', () => {
    const ph = buildPublishDetail(baseInput({ title: 'Coming soon' }));
    expect(ph.validation.checks.find((c) => c.id === 'no-placeholder')?.passed).toBe(false);
    const secret = buildPublishDetail(baseInput({ title: 'key sk-abcdef12345' }));
    expect(secret.validation.checks.find((c) => c.id === 'no-secret-leak')?.passed).toBe(false);
    expect(secret.validation.ok).toBe(false);
  });

  it('orders the timeline newest-first and maps actor/message', () => {
    const events: PublishEvent[] = [
      { id: 'e1', publishableEntityId: 'update:u1', entityType: 'update', eventType: 'publish', toStatus: 'published', actorEmail: 'a@x.com', message: 'first', createdAt: '2026-06-01T00:00:00.000Z' },
      { id: 'e2', publishableEntityId: 'update:u1', entityType: 'update', eventType: 'unpublish', toStatus: 'draft', message: 'second', createdAt: '2026-06-02T00:00:00.000Z' },
    ];
    const d = buildPublishDetail(baseInput(), undefined, events);
    expect(d.timeline.map((t) => t.id)).toEqual(['e2', 'e1']);
    expect(d.timeline[0].actor).toBe('system'); // no actorEmail → system
    expect(d.timeline[1].actor).toBe('a@x.com');
  });

  it('derives lifecycle from the snapshot when present, else from live state', () => {
    const noSnap = buildPublishDetail(baseInput({ published: true }));
    expect(noSnap.lifecycle.hasSnapshot).toBe(false);
    expect(noSnap.lifecycle.status).toBe('published');
    expect(noSnap.lifecycle.version).toBe(0);

    const entity: PublishableEntity = {
      id: 'update:u1', entityType: 'update', entityId: 'u1', title: 'A real update',
      status: 'published', publishMode: 'instant', riskLevel: 'low',
      createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-03T00:00:00.000Z',
      publishedAt: '2026-06-03T00:00:00.000Z', publishedBy: 'b@x.com',
      version: 3, validationStatus: 'passed', deploymentStatus: 'none',
      affectedRoutes: ['/updates'],
    };
    const snap = buildPublishDetail(baseInput({ published: true }), entity);
    expect(snap.lifecycle.hasSnapshot).toBe(true);
    expect(snap.lifecycle.version).toBe(3);
    expect(snap.lifecycle.publishedBy).toBe('b@x.com');
    expect(snap.affectedRoutes).toEqual(['/updates']);
  });

  it('falls back to the registry public routes when the snapshot has none', () => {
    const d = buildPublishDetail(baseInput({ entityType: 'blog-post', entityId: 'b', slug: 'b' }));
    expect(d.area?.owner).toBe('Content');
    expect(d.affectedRoutes).toEqual(['/blog', '/blog/*']);
  });

  it('can revert only when currently live', () => {
    expect(buildPublishDetail(baseInput({ published: true })).canRevert).toBe(true);
    expect(buildPublishDetail(baseInput({ published: false })).canRevert).toBe(false);
  });
});
