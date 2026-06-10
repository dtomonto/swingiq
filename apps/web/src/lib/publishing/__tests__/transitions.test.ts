import {
  canTransition,
  nextStatuses,
  statusForAction,
  isPubliclyVisible,
  isActionable,
} from '../transitions';

describe('publishing/transitions', () => {
  it('allows one-click instant publish but blocks nonsense jumps', () => {
    expect(canTransition('draft', 'published')).toBe(true); // instant publish
    expect(canTransition('draft', 'review')).toBe(true);
    expect(canTransition('validated', 'published')).toBe(true);
    expect(canTransition('archived', 'published')).toBe(false); // must reopen first
    expect(canTransition('failed', 'published')).toBe(false); // must revalidate first
  });

  it('is idempotent for same-status saves', () => {
    expect(canTransition('published', 'published')).toBe(true);
  });

  it('lets a published item unpublish, archive or roll back', () => {
    expect(canTransition('published', 'draft')).toBe(true);
    expect(canTransition('published', 'archived')).toBe(true);
    expect(canTransition('published', 'rolled_back')).toBe(true);
  });

  it('archived only returns to draft', () => {
    expect(nextStatuses('archived')).toEqual(['draft']);
    expect(canTransition('archived', 'published')).toBe(false);
  });

  it('maps actions to statuses', () => {
    expect(statusForAction('publish')).toBe('published');
    expect(statusForAction('unpublish')).toBe('draft');
    expect(statusForAction('rollback')).toBe('rolled_back');
    expect(statusForAction('archive')).toBe('archived');
  });

  it('only published is publicly visible', () => {
    expect(isPubliclyVisible('published')).toBe(true);
    for (const s of ['draft', 'review', 'validated', 'failed', 'rolled_back', 'archived', 'scheduled'] as const) {
      expect(isPubliclyVisible(s)).toBe(false);
    }
  });

  it('archived is not actionable as in-flight', () => {
    expect(isActionable('archived')).toBe(false);
    expect(isActionable('draft')).toBe(true);
  });
});
