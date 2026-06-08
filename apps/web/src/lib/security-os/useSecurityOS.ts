'use client';

// ============================================================
// securityOS — owner state hook (CLIENT, localStorage)
// ------------------------------------------------------------
// The scan is generated server-side and is stateless. The owner's actions
// (finding status / notes / risk-acceptance), engine settings, the score
// history and the security audit log persist in the browser — the exact
// local-first pattern the Command Center + admin audit log use — so the
// feature works in production's read-only filesystem and survives re-scans.
// State is keyed by deterministic finding id, so actions survive re-scans.
//
// Every owner action also writes a REDACTED security-audit entry, satisfying
// the "securityOS finding status changes are audited" requirement.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { redactMetadata } from './redaction';
import {
  DEFAULT_SETTINGS,
  SECURITY_AUDIT_CAP,
  type FindingOverride,
  type FindingOverrideMap,
  type FindingStatus,
  type ScoreCategoryId,
  type ScoreHistoryPoint,
  type SecurityAuditEntry,
  type SecurityAuditSeverity,
  type SecuritySettings,
} from './types';

const OVERRIDES_KEY = 'swingvantage:security-os:overrides:v1';
const SETTINGS_KEY = 'swingvantage:security-os:settings:v1';
const HISTORY_KEY = 'swingvantage:security-os:history:v1';
const AUDIT_KEY = 'swingvantage:security-os:audit:v1';

const HISTORY_CAP = 180;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return Array.isArray(fallback) ? (parsed as T) : { ...fallback, ...(parsed as object) } as T;
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
const rid = () => `sec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export interface NewAuditEntry {
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  severity?: SecurityAuditSeverity;
  metadata?: Record<string, unknown>;
}

export interface SecurityOSState {
  ready: boolean;
  overrides: FindingOverrideMap;
  settings: SecuritySettings;
  history: ScoreHistoryPoint[];
  auditLog: SecurityAuditEntry[];
  actor: string;
  /** Set the working actor email (resolved from the page). */
  setActor: (email: string) => void;
  setFindingStatus: (id: string, status: FindingStatus, opts?: { note?: string; justification?: string; title?: string }) => void;
  addNote: (id: string, note: string) => void;
  clearOverride: (id: string) => void;
  updateSettings: (patch: Partial<SecuritySettings>) => void;
  setWeight: (id: ScoreCategoryId, weight: number) => void;
  resetSettings: () => void;
  recordSnapshot: (point: Omit<ScoreHistoryPoint, 'at'>) => void;
  recordAudit: (entry: NewAuditEntry) => void;
  clearAudit: () => void;
}

export function useSecurityOS(): SecurityOSState {
  const [ready, setReady] = useState(false);
  const [overrides, setOverrides] = useState<FindingOverrideMap>({});
  const [settings, setSettings] = useState<SecuritySettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<ScoreHistoryPoint[]>([]);
  const [auditLog, setAuditLog] = useState<SecurityAuditEntry[]>([]);
  const [actor, setActorState] = useState('admin');

  useEffect(() => {
    setOverrides(readJson<FindingOverrideMap>(OVERRIDES_KEY, {}));
    setSettings(readJson<SecuritySettings>(SETTINGS_KEY, DEFAULT_SETTINGS));
    setHistory(readJson<ScoreHistoryPoint[]>(HISTORY_KEY, []));
    setAuditLog(readJson<SecurityAuditEntry[]>(AUDIT_KEY, []));
    setReady(true);
  }, []);

  const setActor = useCallback((email: string) => {
    if (email) setActorState(email);
  }, []);

  const recordAudit = useCallback(
    (entry: NewAuditEntry) => {
      setAuditLog((prev) => {
        const full: SecurityAuditEntry = {
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
        const cap = Math.max(50, settings.auditLogRetention || SECURITY_AUDIT_CAP);
        const next = [full, ...prev].slice(0, Math.min(SECURITY_AUDIT_CAP, cap));
        writeJson(AUDIT_KEY, next);
        return next;
      });
    },
    [actor, settings.auditLogRetention],
  );

  const persistOverrides = useCallback((next: FindingOverrideMap) => {
    setOverrides(next);
    writeJson(OVERRIDES_KEY, next);
  }, []);

  const setFindingStatus = useCallback(
    (id: string, status: FindingStatus, opts?: { note?: string; justification?: string; title?: string }) => {
      setOverrides((prev) => {
        const existing = prev[id];
        const record: FindingOverride = {
          status,
          note: opts?.note ?? existing?.note,
          acceptedRiskJustification:
            status === 'accepted_risk' ? opts?.justification ?? existing?.acceptedRiskJustification : existing?.acceptedRiskJustification,
          resolvedAt: status === 'resolved' ? now() : existing?.resolvedAt,
          updatedAt: now(),
        };
        const next = { ...prev, [id]: record };
        writeJson(OVERRIDES_KEY, next);
        return next;
      });
      recordAudit({
        action: 'finding.status',
        entityType: 'security-finding',
        entityId: id,
        summary: `Finding ${opts?.title ? `"${opts.title}" ` : ''}set to ${status}`,
        severity: status === 'accepted_risk' ? 'warning' : 'info',
        metadata: opts?.justification ? { justification: opts.justification } : undefined,
      });
    },
    [recordAudit],
  );

  const addNote = useCallback(
    (id: string, note: string) => {
      setOverrides((prev) => {
        const existing = prev[id] ?? { status: 'new' as FindingStatus, updatedAt: now() };
        const next = { ...prev, [id]: { ...existing, note, updatedAt: now() } };
        writeJson(OVERRIDES_KEY, next);
        return next;
      });
    },
    [],
  );

  const clearOverride = useCallback(
    (id: string) => {
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[id];
        writeJson(OVERRIDES_KEY, next);
        return next;
      });
      recordAudit({ action: 'finding.reopen', entityType: 'security-finding', entityId: id, summary: `Finding ${id} reset to New` });
    },
    [recordAudit],
  );

  const persistSettings = useCallback(
    (next: SecuritySettings) => {
      setSettings(next);
      writeJson(SETTINGS_KEY, next);
      recordAudit({ action: 'settings.update', entityType: 'security-settings', summary: 'securityOS settings updated' });
    },
    [recordAudit],
  );

  const updateSettings = useCallback(
    (patch: Partial<SecuritySettings>) => persistSettings({ ...settings, ...patch }),
    [persistSettings, settings],
  );

  const setWeight = useCallback(
    (id: ScoreCategoryId, weight: number) =>
      persistSettings({ ...settings, weights: { ...settings.weights, [id]: Math.max(0, Math.min(100, weight)) } }),
    [persistSettings, settings],
  );

  const resetSettings = useCallback(() => persistSettings(DEFAULT_SETTINGS), [persistSettings]);

  const recordSnapshot = useCallback((point: Omit<ScoreHistoryPoint, 'at'>) => {
    setHistory((prev) => {
      const today = now().slice(0, 10);
      // One snapshot per day (latest wins) so history is a clean daily series.
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
    setFindingStatus,
    addNote,
    clearOverride,
    updateSettings,
    setWeight,
    resetSettings,
    recordSnapshot,
    recordAudit,
    clearAudit,
  };
}
