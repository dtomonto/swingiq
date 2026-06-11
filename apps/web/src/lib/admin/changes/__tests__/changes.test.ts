import { describe, it, expect } from '@jest/globals';
import { parseConventional, laymanizeCommit } from '../laymanize';
import { buildChangesFeed, CHANGES_WINDOW_DAYS } from '../feed';
import type { CommitChange } from '../types';
import type { AuditEntry } from '../../audit';

const NOW = Date.parse('2026-06-11T12:00:00.000Z');
const daysAgo = (n: number) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString();

describe('laymanize', () => {
  it('parses a conventional commit', () => {
    expect(parseConventional('feat(agi): wire insight feedback (#42)')).toEqual({
      type: 'feat',
      scope: 'agi',
      subject: 'wire insight feedback (#42)',
    });
  });

  it('turns commit types into plain-English leads + strips PR refs', () => {
    expect(laymanizeCommit({ type: 'feat', scope: 'video', subject: 'add slow-mo (#7)' })).toBe(
      'New: Add slow-mo — video',
    );
    expect(laymanizeCommit({ type: 'fix', subject: 'crash on import' })).toBe('Fixed: Crash on import');
    expect(laymanizeCommit({ type: 'chore', subject: 'bump deps' })).toBe('Behind the scenes: Bump deps');
  });

  it('falls back gracefully on a non-conventional message', () => {
    const p = parseConventional('just some change');
    expect(p.type).toBe('other');
    expect(laymanizeCommit(p)).toBe('Update: Just some change');
  });
});

describe('buildChangesFeed', () => {
  const commit = (sha: string, type: string, subject: string, age: number): CommitChange => ({
    sha,
    at: daysAgo(age),
    type,
    subject,
  });
  const audit = (id: string, summary: string, age: number): AuditEntry => ({
    id,
    at: daysAgo(age),
    actor: 'owner@x.com',
    action: 'flag.toggle',
    entityType: 'feature-flag',
    summary,
    severity: 'info',
  });

  it('merges commits + admin actions, newest first', () => {
    const feed = buildChangesFeed({
      now: NOW,
      commits: [commit('aaaaaaaaaa', 'feat', 'new thing', 5)],
      auditEntries: [audit('a1', 'Toggled a flag', 1)],
    });
    expect(feed.map((e) => e.kind)).toEqual(['admin', 'ship']); // 1 day ago before 5 days ago
    expect(feed[1].summary).toBe('New: New thing');
  });

  it('prunes entries older than the 30-day window', () => {
    const feed = buildChangesFeed({
      now: NOW,
      commits: [
        commit('fresh000000', 'fix', 'recent', 10),
        commit('stale000000', 'fix', 'ancient', CHANGES_WINDOW_DAYS + 2),
      ],
    });
    expect(feed).toHaveLength(1);
    expect(feed[0].meta).toBe('fresh00');
  });

  it('respects the limit', () => {
    const commits = Array.from({ length: 10 }, (_, i) => commit(`c${i}00000000`, 'feat', `c${i}`, i));
    expect(buildChangesFeed({ now: NOW, commits, limit: 3 })).toHaveLength(3);
  });

  it('drops entries with unparseable dates without throwing', () => {
    const feed = buildChangesFeed({
      now: NOW,
      commits: [{ sha: 'bad0000000', at: 'not-a-date', type: 'feat', subject: 'x' }],
    });
    expect(feed).toHaveLength(0);
  });
});
