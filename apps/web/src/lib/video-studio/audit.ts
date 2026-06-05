// ============================================================
// SwingVantage — Video Studio: Audit Log
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   A small factory for the tamper-evident trail of who did what in the
//   video system — scanned, approved, generated, published, retired.
//   Persisting it is the repo's job (repo.ts); this file just builds a
//   well-formed record so every call site logs the same shape.
// ============================================================

import type { VideoAuditLog, AuditAction } from './types';

let seq = 0;

/** Build an audit-log record. `actor` is 'system' for automated runs. */
export function makeAuditLog(
  action: AuditAction,
  targetId: string,
  summary: string,
  opts: { actor?: string; detail?: Record<string, unknown>; now?: Date } = {},
): VideoAuditLog {
  const now = opts.now ?? new Date();
  seq += 1;
  return {
    id: `audit_${now.getTime().toString(36)}_${seq}`,
    action,
    actor: opts.actor ?? 'system',
    targetId,
    summary,
    detail: opts.detail,
    createdAt: now.toISOString(),
  };
}
