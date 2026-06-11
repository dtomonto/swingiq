// ============================================================
// SwingVantage Admin — "What changed" feed engine (pure)
// ------------------------------------------------------------
// Merges two honest sources into one 30-day, newest-first feed:
//   1) shipped commits (committed JSON snapshot from scan-changes.mjs)
//   2) admin actions (the local-first audit log)
// Entries older than the window are pruned (the "auto-delete every 30 days"
// requirement). Pure + deterministic — `now` is injectable for tests.
// ============================================================

import type { AuditEntry } from '../audit';
import { laymanizeCommit } from './laymanize';
import type { ChangeEntry, CommitChange } from './types';

export const CHANGES_WINDOW_DAYS = 30;

export function commitToChange(c: CommitChange): ChangeEntry {
  return {
    id: `ship_${c.sha.slice(0, 9)}`,
    at: c.at,
    kind: 'ship',
    summary: laymanizeCommit(c),
    meta: c.sha.slice(0, 7),
  };
}

export function auditToChange(e: AuditEntry): ChangeEntry {
  return {
    id: `admin_${e.id}`,
    at: e.at,
    kind: 'admin',
    summary: e.summary,
    meta: e.actor,
    severity: e.severity,
  };
}

export interface BuildChangesFeedOptions {
  commits?: CommitChange[];
  auditEntries?: AuditEntry[];
  /** Defaults to Date.now(); injected in tests for determinism. */
  now?: number;
  windowDays?: number;
  limit?: number;
}

/** Build the merged, pruned, newest-first change feed. */
export function buildChangesFeed(opts: BuildChangesFeedOptions = {}): ChangeEntry[] {
  const now = opts.now ?? Date.now();
  const windowMs = (opts.windowDays ?? CHANGES_WINDOW_DAYS) * 24 * 60 * 60 * 1000;
  const cutoff = now - windowMs;

  const merged = [
    ...(opts.commits ?? []).map(commitToChange),
    ...(opts.auditEntries ?? []).map(auditToChange),
  ].filter((e) => {
    const t = Date.parse(e.at);
    return Number.isFinite(t) && t >= cutoff && t <= now + 60_000; // tolerate slight clock skew
  });

  merged.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return typeof opts.limit === 'number' ? merged.slice(0, Math.max(0, opts.limit)) : merged;
}
