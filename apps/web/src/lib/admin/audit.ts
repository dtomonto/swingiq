// ============================================================
// SwingVantage Admin — audit log types & helpers (isomorphic)
// ------------------------------------------------------------
// No 'use client' and no server-only imports here so BOTH the
// client store (stores/audit-log.ts) and any server sink can share
// the shape. Every mutating admin action should produce an entry.
// ============================================================

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditEntry {
  id: string;
  /** ISO timestamp. */
  at: string;
  /** Who did it — admin email, or 'header-admin'/'system' when no email. */
  actor: string;
  /** Machine action key, e.g. 'flag.toggle', 'user.suspend'. */
  action: string;
  /** Entity class, e.g. 'feature-flag', 'user', 'content'. */
  entityType: string;
  entityId?: string;
  /** Human-readable one-liner for the audit viewer. */
  summary: string;
  before?: unknown;
  after?: unknown;
  severity: AuditSeverity;
}

export type NewAuditEntry = Omit<AuditEntry, 'id' | 'at' | 'severity'> &
  Partial<Pick<AuditEntry, 'severity'>>;

const rid = () =>
  `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/** Fill in id/at/severity defaults for a new entry. */
export function makeAuditEntry(input: NewAuditEntry): AuditEntry {
  return {
    id: rid(),
    at: new Date().toISOString(),
    severity: input.severity ?? 'info',
    ...input,
  };
}

/** Max entries kept in the local-first ring buffer. */
export const AUDIT_LOG_CAP = 500;
