// ============================================================
// SwingVantage Admin — "What changed" feed types
// ============================================================

import type { AuditSeverity } from '../audit';

export type ChangeKind = 'ship' | 'admin';

/** A unified, display-ready change row (shipped commit OR admin action). */
export interface ChangeEntry {
  id: string;
  /** ISO timestamp. */
  at: string;
  kind: ChangeKind;
  /** Plain-English, one-line summary. */
  summary: string;
  /** Secondary label: short sha (ship) or actor (admin). */
  meta?: string;
  severity?: AuditSeverity;
}

/** One commit landed on master — the raw snapshot row (see scan-changes.mjs). */
export interface CommitChange {
  sha: string;
  /** ISO author date. */
  at: string;
  type: string;
  scope?: string;
  subject: string;
}
