// Read-only inventory integration: milestones (committed public pages) and
// training videos (Library Publishing) now surface in the PublishingOS queue
// with their REAL state, but as read-only rows managed by their native tool —
// the override store must never toggle them.

jest.mock('@/lib/admin/updates-store', () => ({
  readPublishSnapshot: () => ({ product: [], dev: [], writable: false }),
}));
jest.mock('@/lib/admin/content-publish-store', () => ({
  readSeoRows: () => [],
  readBlogRows: () => [],
}));
jest.mock('@/lib/milestones/catalog', () => ({
  MILESTONE_CATALOG: [{ id: 'm001', slug: 'first', title: 'First Milestone', category: 'Launch' }],
}));
jest.mock('@/content/milestones/published', () => ({
  PUBLISHED_MILESTONES: [
    { slug: 'first', definitionId: 'm001', verifiedMetric: 'launched', achievedAt: '2026-06-08' },
  ],
}));
jest.mock('@/lib/library/training-videos', () => ({
  getTrainingItems: () => [
    { id: 'vid-live', title: 'Live Video', category: 'drills-technique', sport: 'golf' },
    { id: 'vid-draft', title: 'Draft Video', category: 'drills-technique', sport: 'golf' },
  ],
  isTrainingPublic: (id: string) => id === 'vid-live',
}));

import { getPublishingOSData } from '../admin-data.server';
import { setPublishOverride, __resetMemoryStore } from '../store';

beforeEach(() => __resetMemoryStore());

describe('PublishingOS queue — read-only inventory (milestones + library)', () => {
  it('surfaces published milestones as read-only live rows that link to the Milestone Center', async () => {
    const data = await getPublishingOSData();
    const ms = data.queue.find((q) => q.kind === 'milestone' && q.id === 'first');
    expect(ms).toBeDefined();
    expect(ms?.entityType).toBe('milestone');
    expect(ms?.title).toBe('First Milestone'); // catalog title wins over verifiedMetric
    expect(ms?.published).toBe(true); // committed == live
    expect(ms?.readOnly).toBe(true);
    expect(ms?.manageHref).toBe('/admin/milestones');
  });

  it('surfaces training videos with their EFFECTIVE public state, read-only', async () => {
    const data = await getPublishingOSData();
    const live = data.queue.find((q) => q.kind === 'library' && q.id === 'vid-live');
    const draft = data.queue.find((q) => q.kind === 'library' && q.id === 'vid-draft');
    expect(live?.published).toBe(true);
    expect(draft?.published).toBe(false);
    expect(live?.readOnly).toBe(true);
    expect(live?.manageHref).toBe('/admin/library');
  });

  it('does not let the durable override store flip a read-only library row', async () => {
    // An override keyed to the same id must NOT change the library row's state —
    // its truth is the library's own store, surfaced read-only here.
    await setPublishOverride('library-video', 'vid-draft', true, 'admin@example.com');
    const data = await getPublishingOSData();
    const vid = data.queue.find((q) => q.kind === 'library' && q.id === 'vid-draft');
    expect(vid?.published).toBe(false); // still draft — override ignored for read-only
    expect(vid?.readOnly).toBe(true);
  });
});
