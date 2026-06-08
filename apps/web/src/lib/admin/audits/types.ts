// ============================================================
// SwingVantage Admin — Audit Reports: shared types
// ------------------------------------------------------------
// The in-app view of what the scheduled audit robots found. The raw
// data is mirrored from docs/master-audit-report.json (+ docs/audits/*)
// by scripts/sync-audit-reports.mjs into src/data/audit-reports.json.
// These types describe the bundled snapshot AND the owner's local
// status-tracking overlay.
// ============================================================

/** The owner's tracking status for a finding (separate from the report's own). */
export type AuditTrackStatus = 'open' | 'in-progress' | 'done';

/** Priority labels as the master report emits them. */
export type AuditPriority = 'P0' | 'P1' | 'P2' | 'P3' | '-' | string;

/** One consolidated finding (F-xx) from the master report. */
export interface AuditFinding {
  id: string;
  category: string;
  finding: string;
  recommendation: string;
  priority: AuditPriority;
  effort?: string;
  confidence?: string;
  businessImpact?: string;
  sources: string[];
  /** The report's own status (open | resolved | needs-verification | …). */
  status: string;
}

/** An audit source as catalogued in the master report's auditSources. */
export interface AuditSourceMeta {
  id: string;
  path: string;
  type: string;
  date: string | null;
  scheduled: boolean;
  schedule?: string;
  contribution?: string;
}

/** Latest per-category report file discovered under docs/audits/<category>/. */
export interface AuditReportPointer {
  date: string | null;
  path: string;
}

/** The bundled snapshot shape (src/data/audit-reports.json). */
export interface AuditReportSnapshot {
  generatedAt: string;
  note?: string;
  masterGenerated: string;
  masterStatus?: string;
  findings: AuditFinding[];
  sources: AuditSourceMeta[];
  roadmap: Record<string, string[]>;
  reports: Record<string, AuditReportPointer>;
}

/** A finding enriched with the owner's tracking status (the view model). */
export interface AuditFindingView extends AuditFinding {
  /** Owner's tracked status, defaulting from the report's own status. */
  trackStatus: AuditTrackStatus;
  /** True when the owner has explicitly set a status (vs. the derived default). */
  trackedByOwner: boolean;
}

/** Headline counts for the hub + Command Center alert. */
export interface AuditSummary {
  total: number;
  open: number;
  inProgress: number;
  done: number;
  /** Open findings at P0 or P1 — the "needs you" number. */
  openCritical: number;
  needsVerification: number;
}
