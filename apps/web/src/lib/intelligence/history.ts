'use client';

// ============================================================
// SwingVantage — Deterministic Diagnosis: persisted history
// ------------------------------------------------------------
// The structured intelligence hub for the deterministic engine: a small,
// SSR-safe, versioned localStorage log of the diagnoses an athlete has been
// shown, plus a pure summary over it (confidence trend, most-common causes,
// escalation rate). Mirrors the today-tasks / retest store conventions: lives
// in its own key, never touches the Zustand store, and never throws.
//
// HONESTY: records carry only non-PII engine metadata (sport, fault id,
// confidence, severity, escalation) — never identity, free-text, or video.
// ============================================================

import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { SportId } from '@swingiq/core';
import type { ConfidenceLabel } from './types';
import type { FaultSeverity } from '@/lib/faults/types';
import type { DeterministicDiagnosis } from './diagnose-types';

const KEY = 'swingiq-diagnosis-history-v1';
const MAX_RECORDS = 100;

/** One persisted, summarized diagnosis (non-PII). */
export interface DiagnosisRecord {
  /** sport::faultId::YYYY-MM-DD — stable within a day so re-renders dedupe. */
  id: string;
  at: string;
  sport: SportId;
  faultId: string;
  faultName: string;
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  severity: FaultSeverity;
  escalated: boolean;
  missingDataCount: number;
  engineVersion: string;
  ruleVersion: string;
}

interface Stored {
  version: 1;
  records: DiagnosisRecord[];
}

function dayStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── change notification (useSyncExternalStore-friendly) ──
const listeners = new Set<() => void>();
let storeVersion = 0;

export function getDiagnosisHistoryVersion(): number {
  return storeVersion;
}

function notify(): void {
  storeVersion++;
  for (const l of listeners) l();
}

export function subscribeDiagnosisHistory(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) notify();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

function read(): Stored {
  const empty: Stored = { version: 1, records: [] };
  if (typeof window === 'undefined') return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    const p = JSON.parse(raw);
    if (p && p.version === 1 && Array.isArray(p.records)) return p as Stored;
  } catch {
    /* fall through */
  }
  return empty;
}

function write(records: DiagnosisRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ version: 1, records: records.slice(-MAX_RECORDS) } satisfies Stored));
    notify();
  } catch {
    /* storage full / unavailable — non-critical */
  }
}

// Cached snapshot so the React reader returns a stable reference until a write
// bumps the version (required by useSyncExternalStore).
let snapCache: { v: number; value: DiagnosisRecord[] } | null = null;
function snapshot(): DiagnosisRecord[] {
  if (snapCache && snapCache.v === storeVersion) return snapCache.value;
  const value = read().records;
  snapCache = { v: storeVersion, value };
  return value;
}

/** All persisted diagnosis records, oldest → newest. Never throws. */
export function loadDiagnosisHistory(): DiagnosisRecord[] {
  return snapshot();
}

const EMPTY: DiagnosisRecord[] = [];

/** Reactive, SSR-safe diagnosis history. */
export function useDiagnosisHistory(): DiagnosisRecord[] {
  return useSyncExternalStore(subscribeDiagnosisHistory, snapshot, () => EMPTY);
}

/**
 * Record a shown diagnosis once per change (deduped by record id), from a
 * component. A no-op on the server and when `diagnosis` is null.
 */
export function useRecordDiagnosis(diagnosis: DeterministicDiagnosis | null | undefined): void {
  const lastId = useRef<string | null>(null);
  useEffect(() => {
    if (!diagnosis) return;
    const rec = toDiagnosisRecord(diagnosis);
    if (lastId.current === rec.id) return;
    lastId.current = rec.id;
    recordDiagnosis(diagnosis);
  }, [diagnosis]);
}

/** Build the (non-PII) record for a diagnosis. Pure — exported for tests. */
export function toDiagnosisRecord(d: DeterministicDiagnosis, at: Date = new Date()): DiagnosisRecord {
  return {
    id: `${d.sport}::${d.primary.faultId}::${dayStr(at)}`,
    at: at.toISOString(),
    sport: d.sport,
    faultId: d.primary.faultId,
    faultName: d.primary.name,
    confidence: d.confidence,
    confidenceLabel: d.confidenceLabel,
    severity: d.severity,
    escalated: d.escalateToAI,
    missingDataCount: d.missingData.length,
    engineVersion: d.engineVersion,
    ruleVersion: d.ruleVersion,
  };
}

/**
 * Append a diagnosis to the history, de-duplicated by id (same sport + fault +
 * day updates in place rather than spamming). Never throws.
 */
export function recordDiagnosis(d: DeterministicDiagnosis, at: Date = new Date()): void {
  const rec = toDiagnosisRecord(d, at);
  const records = read().records.filter((r) => r.id !== rec.id);
  records.push(rec);
  write(records);
}

// ── Pure summary (the "structured intelligence", brief §10/§17) ──

export interface DiagnosisHistorySummary {
  total: number;
  lastDiagnosedAt: string | null;
  /** Most-common causes, highest count first. */
  byFault: { faultId: string; faultName: string; count: number }[];
  /** Share of diagnoses that recommended AI escalation, 0..1. */
  escalationRate: number;
  /** Average confidence across all records, or null when empty. */
  averageConfidence: number | null;
  /** Confidence over time (chronological) for a trend sparkline. */
  confidenceTrend: { at: string; confidence: number }[];
}

/** Summarize a history into structured intelligence. Pure + side-effect-free. */
export function summarizeDiagnosisHistory(records: DiagnosisRecord[]): DiagnosisHistorySummary {
  if (records.length === 0) {
    return { total: 0, lastDiagnosedAt: null, byFault: [], escalationRate: 0, averageConfidence: null, confidenceTrend: [] };
  }
  const counts = new Map<string, { faultName: string; count: number }>();
  let escalated = 0;
  let confSum = 0;
  for (const r of records) {
    const prev = counts.get(r.faultId);
    counts.set(r.faultId, { faultName: r.faultName, count: (prev?.count ?? 0) + 1 });
    if (r.escalated) escalated += 1;
    confSum += r.confidence;
  }
  const byFault = [...counts.entries()]
    .map(([faultId, v]) => ({ faultId, faultName: v.faultName, count: v.count }))
    .sort((a, b) => b.count - a.count);

  return {
    total: records.length,
    lastDiagnosedAt: records[records.length - 1].at,
    byFault,
    escalationRate: Number((escalated / records.length).toFixed(3)),
    averageConfidence: Math.round(confSum / records.length),
    confidenceTrend: records.map((r) => ({ at: r.at, confidence: r.confidence })),
  };
}
