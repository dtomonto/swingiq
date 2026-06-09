'use client';

// ============================================================
// SwingVantage Milestones — owner state hook (CLIENT, localStorage)
// ------------------------------------------------------------
// The evaluation is generated server-side and stateless. The admin's actions
// (approve/reject, admin-attested values, update-card + dedicated-page toggles,
// noindex, SEO edits, notes) and the audit log persist in the browser — the
// local-first pattern securityOS/BranchGuardianOS use — so it works in
// production's read-only FS and survives re-scans. Keyed by milestone id.
//
// Publishing a PUBLIC page is deliberately a commit step: the admin exports the
// approved entries and commits them to content/milestones/published.ts. This
// hook produces that export; it never writes public pages from the browser.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { redactMetadata } from '@/lib/security-os/redaction';
import {
  AUDIT_CAP,
  type AuditEntry,
  type AuditSeverity,
  type EditorialStatus,
  type MilestoneOverride,
  type MilestoneOverrideMap,
} from './types';

const OVERRIDES_KEY = 'swingvantage:milestones:overrides:v1';
const AUDIT_KEY = 'swingvantage:milestones:audit:v1';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return Array.isArray(fallback) ? (parsed as T) : ({ ...fallback, ...(parsed as object) } as T);
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

const now = () => new Date().toISOString();
const rid = () => `ms_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export interface NewAuditEntry {
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  severity?: AuditSeverity;
  metadata?: Record<string, unknown>;
}

export interface MilestonesState {
  ready: boolean;
  overrides: MilestoneOverrideMap;
  auditLog: AuditEntry[];
  actor: string;
  setActor: (email: string) => void;
  patchOverride: (id: string, patch: Partial<MilestoneOverride>, audit?: NewAuditEntry) => void;
  setEditorial: (id: string, status: EditorialStatus, title?: string) => void;
  clearOverride: (id: string) => void;
  recordAudit: (entry: NewAuditEntry) => void;
  clearAudit: () => void;
}

export function useMilestones(): MilestonesState {
  const [ready, setReady] = useState(false);
  const [overrides, setOverrides] = useState<MilestoneOverrideMap>({});
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [actor, setActorState] = useState('admin');

  useEffect(() => {
    setOverrides(readJson<MilestoneOverrideMap>(OVERRIDES_KEY, {}));
    setAuditLog(readJson<AuditEntry[]>(AUDIT_KEY, []));
    setReady(true);
  }, []);

  const setActor = useCallback((email: string) => {
    if (email) setActorState(email);
  }, []);

  const recordAudit = useCallback(
    (entry: NewAuditEntry) => {
      setAuditLog((prev) => {
        const full: AuditEntry = {
          id: rid(), at: now(), actor,
          action: entry.action, entityType: entry.entityType, entityId: entry.entityId,
          summary: entry.summary, severity: entry.severity ?? 'info',
          metadata: redactMetadata(entry.metadata),
        };
        const next = [full, ...prev].slice(0, AUDIT_CAP);
        writeJson(AUDIT_KEY, next);
        return next;
      });
    },
    [actor],
  );

  const patchOverride = useCallback(
    (id: string, patch: Partial<MilestoneOverride>, audit?: NewAuditEntry) => {
      setOverrides((prev) => {
        const existing = prev[id] ?? { status: 'open' as EditorialStatus, updatedAt: now() };
        const next = { ...prev, [id]: { ...existing, ...patch, updatedAt: now() } };
        writeJson(OVERRIDES_KEY, next);
        return next;
      });
      if (audit) recordAudit(audit);
    },
    [recordAudit],
  );

  const setEditorial = useCallback(
    (id: string, status: EditorialStatus, title?: string) => {
      patchOverride(id, { status }, {
        action: `milestone.${status}`,
        entityType: 'milestone',
        entityId: id,
        summary: `Milestone ${title ? `"${title}" ` : ''}set to ${status}`,
        severity: status === 'approved' ? 'warning' : 'info',
      });
    },
    [patchOverride],
  );

  const clearOverride = useCallback(
    (id: string) => {
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[id];
        writeJson(OVERRIDES_KEY, next);
        return next;
      });
      recordAudit({ action: 'milestone.reset', entityType: 'milestone', entityId: id, summary: `Milestone ${id} reset` });
    },
    [recordAudit],
  );

  const clearAudit = useCallback(() => {
    setAuditLog([]);
    writeJson(AUDIT_KEY, []);
  }, []);

  return { ready, overrides, auditLog, actor, setActor, patchOverride, setEditorial, clearOverride, recordAudit, clearAudit };
}

/** Serialize approved+earned milestones as a content/milestones/published.ts snippet to commit. PURE. */
export function buildPublishedExport(
  entries: { slug: string; definitionId: string; verifiedMetric: string; achievedAt: string; noindex?: boolean }[],
): string {
  if (entries.length === 0) return '// No approved, earned milestones to export yet.';
  const body = entries
    .map(
      (e) =>
        `  {\n    slug: ${JSON.stringify(e.slug)},\n    definitionId: ${JSON.stringify(e.definitionId)},\n    verifiedMetric: ${JSON.stringify(e.verifiedMetric)},\n    achievedAt: ${JSON.stringify(e.achievedAt)},${e.noindex ? '\n    noindex: true,' : ''}\n  },`,
    )
    .join('\n');
  return `// Paste into PUBLISHED_MILESTONES in apps/web/src/content/milestones/published.ts and commit.\n${body}`;
}
