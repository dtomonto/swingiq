// ============================================================
// SwingVantage — RecordAssist → Analyzer handoff
// ------------------------------------------------------------
// A tiny in-memory bridge that hands a freshly recorded clip from the
// guided recorder to the existing /video analyzer WITHOUT a round-trip
// or re-upload. The clip Blob lives only in memory (an object URL can't
// survive a query-param navigation), so we stash it here, set the active
// sport, and route to /video — the analyzer consumes it on mount through
// the SAME `handleVideoReady(file, metadata, objectUrl)` path an upload
// uses, so nothing downstream changes.
//
// Privacy: the clip never leaves the device here — this is the same
// browser session handing the File to another route's component.
// ============================================================

import type { SwingVideoMetadata, SportId } from '@swingiq/core';

export interface PendingClip {
  file: File;
  metadata: SwingVideoMetadata;
  objectUrl: string;
  sport: SportId;
  action: string;
  /** Detected active-motion window (seconds) from auto-trim, when available. */
  trimWindow?: { start: number; end: number };
  createdAt: number;
}

let pending: PendingClip | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const cb of listeners) {
    try {
      cb();
    } catch {
      /* ignore */
    }
  }
}

/** Stash a clip for the analyzer to pick up on its next mount. */
export function setPendingClip(clip: PendingClip): void {
  pending = clip;
  emit();
}

/** Look without consuming. */
export function peekPendingClip(): PendingClip | null {
  return pending;
}

/**
 * Consume the pending clip if it matches the requesting analyzer's sport
 * (so the golf analyzer never grabs a tennis clip). Returns null otherwise.
 * Pass no sport to consume unconditionally.
 */
export function consumePendingClip(sport?: SportId): PendingClip | null {
  if (!pending) return null;
  if (sport && pending.sport !== sport) return null;
  const clip = pending;
  pending = null;
  emit();
  return clip;
}

/** Discard without consuming (e.g. user navigated away / retook). */
export function clearPendingClip(): void {
  if (!pending) return;
  pending = null;
  emit();
}

export function subscribePendingClip(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
