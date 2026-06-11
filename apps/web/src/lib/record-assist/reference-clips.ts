// ============================================================
// SwingVantage — RecordAssist: reference clips for comparison
// ------------------------------------------------------------
// Local-first store for "compare against a saved reference" (Phase 3
// side-by-side). Persists the Motion Lab session distilled from a guided
// recording, keyed by sport+action, so a later clip can be diffed against it
// via compareSessions(). Defensive — never throws; returns null/[] when
// storage is unavailable. Type-only Motion Lab import (erased at runtime).
// ============================================================

import type { MotionSession } from '@/lib/motion-lab';
import type { RecordAssistSport, SportActionId } from './types';

const KEY = 'swingiq-record-assist-reference-clips';
const MAX = 8;

export interface ReferenceClip {
  sport: RecordAssistSport;
  action: SportActionId;
  savedAt: number;
  session: MotionSession;
}

function read(): ReferenceClip[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ReferenceClip[]) : [];
  } catch {
    return [];
  }
}

function write(clips: ReferenceClip[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(clips.slice(0, MAX)));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

/** The saved reference for this sport+action, or null. */
export function getReferenceClip(sport: RecordAssistSport, action: SportActionId): ReferenceClip | null {
  return read().find((c) => c.sport === sport && c.action === action) ?? null;
}

/** Save (dedupe by sport+action, keeping the most recent). */
export function saveReferenceClip(
  sport: RecordAssistSport,
  action: SportActionId,
  session: MotionSession,
): ReferenceClip[] {
  const existing = read().filter((c) => !(c.sport === sport && c.action === action));
  const next: ReferenceClip[] = [{ sport, action, session, savedAt: Date.now() }, ...existing].slice(0, MAX);
  write(next);
  return next;
}

export function removeReferenceClip(sport: RecordAssistSport, action: SportActionId): ReferenceClip[] {
  const next = read().filter((c) => !(c.sport === sport && c.action === action));
  write(next);
  return next;
}
