'use client';

// ============================================================
// BranchGuardianOS — owner state hook (CLIENT, localStorage)
// ------------------------------------------------------------
// The scan is generated server-side and is stateless. The operator's actions
// (recommendation status / notes / snooze / cleanup-approval), engine settings,
// the cleanliness-score history and the audit log persist in the browser — the
// same local-first pattern the Command Center + securityOS use — so the feature
// works in production's read-only filesystem and survives re-scans. State is
// keyed by the deterministic recommendation id, so actions survive re-scans.
//
// Every owner action also writes a REDACTED audit entry, satisfying the
// "every BranchGuardianOS action is logged" requirement.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { redactMetadata } from '@/lib/security-os/redaction';
import {
  DEFAULT_SETTINGS,
  AUDIT_CAP,
  type AuditEntry,
  type AuditSeverity,
  type BranchGuardianSettings,
  type RecOverride,
  type RecOverrideMap,
  type RecStatus,
  type ScoreHistoryPoint,
} from './types';

const OVERRIDES_KEY = 'swingvantage:branch-guardian:overrides:v1';
const SETTINGS_KEY = 'swingvantage:branch-guardian:settings:v1';
const HISTORY_KEY = 'swingvantage:branch-guardian:history:v1';
const AUDIT_KEY = 'swingvantage:branch-guardian:audit:v1';

const HISTORY_CAP = 180;

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
    /* quota / private mode — degrade silently */
  }
}

const now = () => new Date().toISOString();
const rid = () => `bg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export interface NewAuditEntry {
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  severity?: AuditSeverity;
  metadata?: Record<string, unknown>;
}

export interface BranchGuardianState {
  ready: boolean;
  overrides: RecOverrideMap;
  settings: BranchGuardianSettings;
  history: ScoreHistoryPoint[];
  auditLog: AuditEntry[];
  actor: string;
  setActor: (email: string) => void;
  setRecStatus: (id: string, status: RecStatus, opts?: { note?: string; title?: string; snoozeDays?: number }) => void;
  clearOverride: (id: string) => void;
  updateSettings: (patch: Partial<BranchGuardianSettings>) => void;
  resetSettings: () => void;
  recordSnapshot: (point: Omit<ScoreHistoryPoint, 'at'>) => void;
  recordAudit: (entry: NewAuditEntry) => void;
  clearAudit: () => void;
}

export function useBranchGuardian(): BranchGuardianState {
  const [ready, setReady] = useState(false);
  const [overrides, setOverrides] = useState<RecOverrideMap>({});
  const [settings, setSettings] = useState<BranchGuardianSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<ScoreHistoryPoint[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [actor, setActorState] = useState('admin');

  useEffect(() => {
    setOverrides(readJson<RecOverrideMap>(OVERRIDES_KEY, {}));
    setSettings(readJson<BranchGuardianSettings>(SETTINGS_KEY, DEFAULT_SETTINGS));
    setHistory(readJson<ScoreHistoryPoint[]>(HISTORY_KEY, []));
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
          id: rid(),
          at: now(),
          actor,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          summary: entry.summary,
          severity: entry.severity ?? 'info',
          metadata: redactMetadata(entry.metadata),
        };
        const cap = Math.max(50, settings.auditLogRetention || AUDIT_CAP);
        const next = [full, ...prev].slice(0, Math.min(AUDIT_CAP, cap));
        writeJson(AUDIT_KEY, next);
        return next;
      });
    },
    [actor, settings.auditLogRetention],
  );

  const setRecStatus = useCallback(
    (id: string, status: RecStatus, opts?: { note?: string; title?: string; snoozeDays?: number }) => {
      setOverrides((prev) => {
        const existing = prev[id];
        const snoozedUntil =
          status === 'snoozed'
            ? new Date(Date.now() + (opts?.snoozeDays ?? 7) * 86_400_000).toISOString()
            : undefined;
        const record: RecOverride = {
          status,
          note: opts?.note ?? existing?.note,
          snoozedUntil,
          updatedAt: now(),
        };
        const next = { ...prev, [id]: record };
        writeJson(OVERRIDES_KEY, next);
        return next;
      });
      recordAudit({
        action: `rec.${status}`,
        entityType: 'branch-guardian-recommendation',
        entityId: id,
        summary: `Recommendation ${opts?.title ? `"${opts.title}" ` : ''}set to ${status}`,
        severity: status === 'cleanup_approved' ? 'warning' : 'info',
      });
    },
    [recordAudit],
  );

  const clearOverride = useCallback(
    (id: string) => {
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[id];
        writeJson(OVERRIDES_KEY, next);
        return next;
      });
      recordAudit({ action: 'rec.reopen', entityType: 'branch-guardian-recommendation', entityId: id, summary: `Recommendation ${id} reopened` });
    },
    [recordAudit],
  );

  const persistSettings = useCallback(
    (next: BranchGuardianSettings) => {
      setSettings(next);
      writeJson(SETTINGS_KEY, next);
      recordAudit({ action: 'settings.update', entityType: 'branch-guardian-settings', summary: 'BranchGuardianOS settings updated' });
    },
    [recordAudit],
  );

  const updateSettings = useCallback(
    (patch: Partial<BranchGuardianSettings>) => persistSettings({ ...settings, ...patch }),
    [persistSettings, settings],
  );

  const resetSettings = useCallback(() => persistSettings(DEFAULT_SETTINGS), [persistSettings]);

  const recordSnapshot = useCallback((point: Omit<ScoreHistoryPoint, 'at'>) => {
    setHistory((prev) => {
      const today = now().slice(0, 10);
      const withoutToday = prev.filter((p) => p.at.slice(0, 10) !== today);
      const next = [...withoutToday, { ...point, at: now() }].slice(-HISTORY_CAP);
      writeJson(HISTORY_KEY, next);
      return next;
    });
  }, []);

  const clearAudit = useCallback(() => {
    setAuditLog([]);
    writeJson(AUDIT_KEY, []);
  }, []);

  return {
    ready,
    overrides,
    settings,
    history,
    auditLog,
    actor,
    setActor,
    setRecStatus,
    clearOverride,
    updateSettings,
    resetSettings,
    recordSnapshot,
    recordAudit,
    clearAudit,
  };
}
