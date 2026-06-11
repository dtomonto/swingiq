'use client';

// ============================================================
// ReliabilityOS — owner state hook (CLIENT, localStorage)
// ------------------------------------------------------------
// The scan/grouping is computed (pure) from events. The owner's actions (issue
// status / notes / settings) and a redacted audit log persist in the browser —
// the same local-first pattern securityOS + the Command Center use — so the
// feature works in production's read-only filesystem and survives rescans.
// State is keyed by deterministic issue id (the fingerprint).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { redactMetadata } from '@/lib/security-os/redaction';
import {
  DEFAULT_SETTINGS,
  RELIABILITY_AUDIT_CAP,
  type IssueOverride,
  type IssueOverrideMap,
  type OperationalIssueStatus,
  type ReliabilityAuditEntry,
  type ReliabilitySettings,
} from './types';

const OVERRIDES_KEY = 'swingvantage:reliability-os:overrides:v1';
const SETTINGS_KEY = 'swingvantage:reliability-os:settings:v1';
const AUDIT_KEY = 'swingvantage:reliability-os:audit:v1';

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
const rid = () => `rel_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export interface ReliabilityOSState {
  ready: boolean;
  overrides: IssueOverrideMap;
  settings: ReliabilitySettings;
  auditLog: ReliabilityAuditEntry[];
  actor: string;
  setActor: (email: string) => void;
  setIssueStatus: (id: string, status: OperationalIssueStatus, opts?: { note?: string; title?: string }) => void;
  addNote: (id: string, note: string) => void;
  snooze: (id: string, untilIso: string, title?: string) => void;
  clearOverride: (id: string, title?: string) => void;
  updateSettings: (patch: Partial<ReliabilitySettings>) => void;
  resetSettings: () => void;
  clearAudit: () => void;
}

export function useReliabilityOS(): ReliabilityOSState {
  const [ready, setReady] = useState(false);
  const [overrides, setOverrides] = useState<IssueOverrideMap>({});
  const [settings, setSettings] = useState<ReliabilitySettings>(DEFAULT_SETTINGS);
  const [auditLog, setAuditLog] = useState<ReliabilityAuditEntry[]>([]);
  const [actor, setActorState] = useState('admin');

  useEffect(() => {
    setOverrides(readJson<IssueOverrideMap>(OVERRIDES_KEY, {}));
    setSettings(readJson<ReliabilitySettings>(SETTINGS_KEY, DEFAULT_SETTINGS));
    setAuditLog(readJson<ReliabilityAuditEntry[]>(AUDIT_KEY, []));
    setReady(true);
  }, []);

  const setActor = useCallback((email: string) => {
    if (email) setActorState(email);
  }, []);

  const recordAudit = useCallback(
    (action: string, summary: string, entityId?: string, metadata?: Record<string, unknown>) => {
      setAuditLog((prev) => {
        const entry: ReliabilityAuditEntry = { id: rid(), at: now(), actor, action, entityId, summary, metadata: redactMetadata(metadata) };
        const next = [entry, ...prev].slice(0, RELIABILITY_AUDIT_CAP);
        writeJson(AUDIT_KEY, next);
        return next;
      });
    },
    [actor],
  );

  const mutate = useCallback(
    (id: string, patch: Partial<IssueOverride>) => {
      setOverrides((prev) => {
        const existing = prev[id] ?? { status: 'new' as OperationalIssueStatus, updatedAt: now() };
        const next = { ...prev, [id]: { ...existing, ...patch, updatedAt: now() } };
        writeJson(OVERRIDES_KEY, next);
        return next;
      });
    },
    [],
  );

  const setIssueStatus = useCallback(
    (id: string, status: OperationalIssueStatus, opts?: { note?: string; title?: string }) => {
      mutate(id, { status, note: opts?.note, resolvedAt: status === 'resolved' ? now() : undefined });
      recordAudit('issue.status', `Issue ${opts?.title ? `"${opts.title}" ` : ''}set to ${status}`, id);
    },
    [mutate, recordAudit],
  );

  const addNote = useCallback(
    (id: string, note: string) => {
      mutate(id, { note });
      recordAudit('issue.note', 'Note added', id);
    },
    [mutate, recordAudit],
  );

  const snooze = useCallback(
    (id: string, untilIso: string, title?: string) => {
      mutate(id, { snoozedUntil: untilIso });
      recordAudit('issue.snooze', `Issue ${title ? `"${title}" ` : ''}snoozed until ${untilIso}`, id);
    },
    [mutate, recordAudit],
  );

  const clearOverride = useCallback(
    (id: string, title?: string) => {
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[id];
        writeJson(OVERRIDES_KEY, next);
        return next;
      });
      recordAudit('issue.reopen', `Issue ${title ? `"${title}" ` : ''}reset to New`, id);
    },
    [recordAudit],
  );

  const persistSettings = useCallback(
    (next: ReliabilitySettings) => {
      setSettings(next);
      writeJson(SETTINGS_KEY, next);
      recordAudit('settings.update', 'ReliabilityOS settings updated');
    },
    [recordAudit],
  );
  const updateSettings = useCallback((patch: Partial<ReliabilitySettings>) => persistSettings({ ...settings, ...patch }), [persistSettings, settings]);
  const resetSettings = useCallback(() => persistSettings(DEFAULT_SETTINGS), [persistSettings]);

  const clearAudit = useCallback(() => {
    setAuditLog([]);
    writeJson(AUDIT_KEY, []);
  }, []);

  return {
    ready,
    overrides,
    settings,
    auditLog,
    actor,
    setActor,
    setIssueStatus,
    addNote,
    snooze,
    clearOverride,
    updateSettings,
    resetSettings,
    clearAudit,
  };
}
