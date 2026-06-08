// ============================================================
// SwingVantage Admin — Audit Reports: server data layer (SERVER-ONLY)
// ------------------------------------------------------------
// The one place the audits page + the Action Center adapter get their data.
// Reads the bundled snapshot (mirrored from docs/ by sync-audit-reports.mjs),
// overlays the owner's tracking statuses, computes summary counts, and joins
// the static audit registry with the snapshot's live dates.
//
// Server-only (status-store uses node:fs). The page passes plain data to the
// client filter island.
// ============================================================

import snapshotJson from '@/data/audit-reports.json';
import { readStatusOverrides, canWriteAuditStatus } from './status-store';
import { AUDITS, nextRun, type AuditDefinition } from './registry';
import type {
  AuditFinding,
  AuditFindingView,
  AuditReportSnapshot,
  AuditSummary,
  AuditTrackStatus,
  AuditReportPointer,
} from './types';

const snapshot = snapshotJson as AuditReportSnapshot;

/** Map the report's own status string to a sensible default tracking status. */
function defaultTrackStatus(reportStatus: string): AuditTrackStatus {
  const s = reportStatus.toLowerCase();
  if (s === 'resolved' || s === 'done' || s === 'closed') return 'done';
  if (s === 'partially-resolved' || s === 'in-progress') return 'in-progress';
  return 'open';
}

const PRIORITY_RANK: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
const priorityRank = (p: string): number => PRIORITY_RANK[p] ?? 9;

/** Findings with the owner's tracking overlay applied, priority-sorted. */
export function loadFindings(): AuditFindingView[] {
  const overrides = readStatusOverrides();
  const findings: AuditFinding[] = Array.isArray(snapshot.findings) ? snapshot.findings : [];
  return findings
    .map((f) => {
      const override = overrides[f.id];
      return {
        ...f,
        trackStatus: override ?? defaultTrackStatus(f.status),
        trackedByOwner: Boolean(override),
      };
    })
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.id.localeCompare(b.id));
}

/** Headline counts for the hub + the Command Center alert. */
export function summarizeFindings(findings: AuditFindingView[] = loadFindings()): AuditSummary {
  const summary: AuditSummary = {
    total: findings.length,
    open: 0,
    inProgress: 0,
    done: 0,
    openCritical: 0,
    needsVerification: 0,
  };
  for (const f of findings) {
    if (f.trackStatus === 'done') summary.done += 1;
    else if (f.trackStatus === 'in-progress') summary.inProgress += 1;
    else summary.open += 1;

    if (f.trackStatus !== 'done' && (f.priority === 'P0' || f.priority === 'P1')) {
      summary.openCritical += 1;
    }
    if (f.status.toLowerCase().includes('needs-verification')) summary.needsVerification += 1;
  }
  return summary;
}

/** A registry audit joined with its latest report pointer + next run. */
export interface AuditSourceView extends AuditDefinition {
  lastReport: AuditReportPointer | null;
  lastRunDate: string | null;
  nextRunIso: string | null;
}

/** The audit cards: static registry + live last-run/next-run. */
export function loadAuditSources(now: Date = new Date()): AuditSourceView[] {
  const reports = snapshot.reports ?? {};
  return AUDITS.map((a) => {
    const lastReport = (a.reportCategory && reports[a.reportCategory]) || null;
    const next = nextRun(a, now);
    return {
      ...a,
      lastReport,
      lastRunDate: lastReport?.date ?? null,
      nextRunIso: next ? next.toISOString() : null,
    };
  });
}

/** Snapshot metadata (when it was synced, the master report's own date). */
export function reportMeta(): { syncedAt: string; masterGenerated: string; masterStatus: string; writable: boolean } {
  return {
    syncedAt: snapshot.generatedAt ?? '',
    masterGenerated: snapshot.masterGenerated ?? '',
    masterStatus: snapshot.masterStatus ?? '',
    writable: canWriteAuditStatus(),
  };
}

/** The audit-source catalogue from the master report (provenance list). */
export function loadSourceCatalogue() {
  return Array.isArray(snapshot.sources) ? snapshot.sources : [];
}
