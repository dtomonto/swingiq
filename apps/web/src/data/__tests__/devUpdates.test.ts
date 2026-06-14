import {
  getAllDevUpdates,
  getDevUpdates,
  getDevMilestones,
  isPublicDevUpdate,
  type DevUpdate,
} from '../devUpdates';
import { findDevUpdateDisclosure } from '@/lib/updates/dev-detail';

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

// ── Proprietary-protection policy (see the note at the top of devUpdates.ts) ──
// Every PUBLISHED developer update is competitor-readable marketing copy. None
// may name a vendor/library/infra, an internal codename, an env/config flag, or
// a source-file path. This gate catches hand-written seed entries (which bypass
// the commit-trailer leak guard) before they can ship.
describe('public dev updates never leak proprietary detail', () => {
  it('no published entry names tech, internals, flags, or file paths', () => {
    const offenders = getDevUpdates()
      .map((u) => ({ u, leak: findDevUpdateDisclosure(u) }))
      .filter((x) => x.leak);

    const report = offenders
      .map(({ u, leak }) => `  • ${u.id}: ${leak!.name} → "${leak!.sample}"`)
      .join('\n');

    expect(report).toBe('');
  });

  it('no published entry surfaces a stack list (we do not publish our technologies)', () => {
    // The `stack` field is deprecated and never rendered; published seeds must
    // not carry one so it can never leak back into the page.
    const withStack = getDevUpdates().filter((u) => (u.stack?.length ?? 0) > 0);
    expect(withStack.map((u) => u.id)).toEqual([]);
  });
});
