import {
  getAllDevUpdates,
  getDevUpdates,
  getDevMilestones,
  isPublicDevUpdate,
  type DevUpdate,
} from '../devUpdates';

const make = (over: Partial<DevUpdate>): DevUpdate => ({
  id: 'x',
  title: 't',
  date: '2026-06-07',
  displayDate: 'June 2026',
  category: 'Platform',
  impact: 'notable',
  headline: 'h',
  details: 'd',
  ...over,
});

describe('isPublicDevUpdate', () => {
  it('hides drafts', () => {
    expect(isPublicDevUpdate(make({ status: 'draft' }))).toBe(false);
  });
  it('shows published', () => {
    expect(isPublicDevUpdate(make({ status: 'published' }))).toBe(true);
  });
  it('treats a missing status as published (seed entries stay live)', () => {
    expect(isPublicDevUpdate(make({ status: undefined }))).toBe(true);
  });
});

describe('getDevUpdates (public page)', () => {
  it('never returns a draft', () => {
    expect(getDevUpdates().every((u) => u.status !== 'draft')).toBe(true);
  });

  it('is a subset of all dev updates', () => {
    expect(getDevUpdates().length).toBeLessThanOrEqual(getAllDevUpdates().length);
  });

  it('excludes exactly the drafts', () => {
    const all = getAllDevUpdates();
    const drafts = all.filter((u) => u.status === 'draft').length;
    expect(getDevUpdates().length).toBe(all.length - drafts);
  });
});

describe('getDevMilestones (public timeline)', () => {
  it('never returns a draft', () => {
    expect(getDevMilestones().every((u) => u.status !== 'draft')).toBe(true);
  });
});
