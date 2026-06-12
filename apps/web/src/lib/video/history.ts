// ============================================================
// SwingVantage — Saved Video-Analysis History (local-first)
// ------------------------------------------------------------
// A tiny, self-contained localStorage record of past AI video
// analyses. It powers three things:
//   1. "Welcome back" — surface the user's last swing focus.
//   2. "Compare to your last swing" — feed the previous priorities
//      to the AI as context (it judges only the new frames).
//   3. Export — download a single analysis as JSON.
//
// IMPORTANT: this lives in its OWN localStorage key. It does NOT
// touch the Zustand store, the backup schema, or export/import — so
// existing data flows are completely unaffected. It is safe to be
// missing, corrupt, or cleared at any time and never throws.
//
// Privacy: this record holds only the VALIDATED text analysis the AI
// returned (plus a few labels) — never the frames sent to the AI. The
// original clip is kept SEPARATELY and ON-DEVICE in IndexedDB (see
// clip-store) so saved swings can be replayed; deletes here cascade to
// that clip. Nothing is ever uploaded.
// ============================================================

import type {
  AIVisualAnalysis,
  VisualSport,
  PreviousAnalysisSummary,
} from '@swingiq/core';
import { deleteClip, clearClips } from '@/lib/video/clip-store';

const KEY = 'swingiq-video-analyses-v1';

/** Cap the number of stored analyses so localStorage stays small. */
const MAX_ENTRIES = 25;

export interface SavedVideoAnalysis {
  version: 1;
  id: string;
  sport: VisualSport;
  sportLabel: string;
  emoji?: string;
  /** The camera angle the user declared at capture, if any. */
  declaredCameraAngle?: string;
  /** ISO timestamp of when the analysis was saved. */
  createdAt: string;
  /** The #1 priority issue — used for the quick "you were working on…" line. */
  topFocus: string;
  overallConfidence: number;
  visibilityQuality: string;
  /** The full validated analysis, suitable for re-viewing or export. */
  analysis: AIVisualAnalysis;
}

export interface SaveVideoAnalysisInput {
  sport: VisualSport;
  sportLabel: string;
  emoji?: string;
  declaredCameraAngle?: string;
  analysis: AIVisualAnalysis;
}

// ──────────────────────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────────────────────

function makeId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `va_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function isValidRecord(value: unknown): value is SavedVideoAnalysis {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<SavedVideoAnalysis>;
  return (
    r.version === 1 &&
    typeof r.id === 'string' &&
    typeof r.sport === 'string' &&
    typeof r.createdAt === 'string' &&
    !!r.analysis &&
    typeof r.analysis === 'object'
  );
}

// ── Change notification (powers the useVideoHistory React hook) ──
const listeners = new Set<() => void>();
let storeVersion = 0;

/** Monotonic version that changes whenever stored history changes (same tab). */
export function getVideoHistoryVersion(): number {
  return storeVersion;
}

function notifyChange(): void {
  storeVersion++;
  for (const listener of listeners) listener();
}

/**
 * Subscribe to history changes — same-tab mutations (save/delete/clear) and
 * cross-tab `storage` events. Returns an unsubscribe function. Consumed by
 * `useVideoHistory` via `useSyncExternalStore`.
 */
export function subscribeVideoHistory(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) notifyChange();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

function writeAll(records: SavedVideoAnalysis[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(records.slice(0, MAX_ENTRIES)));
    notifyChange();
  } catch {
    // storage full / unavailable — non-critical
  }
}

// ──────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────

/** Read all saved analyses, newest first. Never throws. */
export function loadVideoHistory(): SavedVideoAnalysis[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidRecord);
  } catch {
    return [];
  }
}

/**
 * Persist a new analysis. Returns the saved record (with its id) or null
 * if storage is unavailable. Newest is stored first; the list is capped.
 */
export function saveVideoAnalysis(input: SaveVideoAnalysisInput): SavedVideoAnalysis | null {
  if (typeof window === 'undefined') return null;

  const record: SavedVideoAnalysis = {
    version: 1,
    id: makeId(),
    sport: input.sport,
    sportLabel: input.sportLabel,
    emoji: input.emoji,
    declaredCameraAngle: input.declaredCameraAngle,
    createdAt: new Date().toISOString(),
    topFocus: input.analysis.topPriorities[0]?.issue ?? 'General swing review',
    overallConfidence: input.analysis.overallConfidence,
    visibilityQuality: input.analysis.visibilityQuality,
    analysis: input.analysis,
  };

  const next = [record, ...loadVideoHistory()].slice(0, MAX_ENTRIES);
  writeAll(next);
  return record;
}

/** All saved analyses for one sport, newest first. */
export function historyForSport(sport: VisualSport): SavedVideoAnalysis[] {
  return loadVideoHistory().filter((r) => r.sport === sport);
}

/** The most recent saved analysis for a sport, or null. */
export function latestForSport(sport: VisualSport): SavedVideoAnalysis | null {
  return historyForSport(sport)[0] ?? null;
}

/** Remove a single analysis by id (and its on-device replay clip). Never throws. */
export function deleteVideoAnalysis(id: string): void {
  writeAll(loadVideoHistory().filter((r) => r.id !== id));
  void deleteClip(id);
}

/** Clear all saved analyses. Never throws. */
export function clearVideoHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
    void clearClips();
    notifyChange();
  } catch {
    // ignore
  }
}

/**
 * Build the "previous analysis" context object the AI route accepts so a
 * new analysis can note whether prior issues persist. The AI is instructed
 * not to assume improvement — it judges only the new frames.
 */
export function toPreviousSummary(record: SavedVideoAnalysis): PreviousAnalysisSummary {
  return {
    sport: record.sport,
    summary: record.analysis.summary,
    priorities: record.analysis.topPriorities.map((p) => p.issue).slice(0, 4),
  };
}

/**
 * Trigger a browser download of a single analysis as a JSON file. Honest,
 * offline export — no server round-trip. Returns false if it can't run.
 */
export function downloadAnalysisJson(record: SavedVideoAnalysis): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    const payload = {
      exportedFrom: 'SwingVantage',
      exportedAt: new Date().toISOString(),
      ...record,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = record.createdAt.slice(0, 10);
    a.href = url;
    a.download = `swingvantage-${record.sport}-analysis-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
