'use client';

// ============================================================
// SwingVantage — Swing Session: one-upload fan-out
// ------------------------------------------------------------
// When a user uploads/records ONE swing in the video analyzer, this
// hook quietly runs the on-device Motion Lab pipeline for the SAME file
// in the background and persists the result. That single pass produces
// a real per-frame MediaPipe pose track, which the 3D Swing Avatar
// (/avatar) then renders — so the user never re-uploads the clip just
// to see it in 3D.
//
// • On-device only — no extra network/AI cost (Motion Lab is local).
// • Best-effort — failure never affects the AI video analysis.
// • Deduped per File (WeakMap) — at most one pass per uploaded clip.
// • Flag-gated — if Motion Lab is turned off, we skip the work entirely.
// • Lazily code-split — the heavy pipeline only loads when a clip arrives.
// ============================================================

import { useEffect } from 'react';
import type { SportId, SwingVideoMetadata } from '@swingiq/core';
import { isFlagEnabled } from '@/lib/admin/stores/feature-flags';
import { captureContextForVideo } from './sport-motion';

const MOTION_LAB_FLAG = 'motion_lab.enabled';

// One in-flight (or finished) fan-out per File. WeakMap so a removed/GC'd
// file's work is released automatically and the same clip never runs twice.
const inflight = new WeakMap<File, Promise<void>>();

/**
 * Ensure a Motion Lab session exists for this uploaded clip. Reuses any pass
 * already started for the same File. Resolves when the session is saved.
 * Throws only on a genuine pipeline failure (so the caller can surface state);
 * the cache entry is dropped on failure so a later attempt can cleanly retry.
 */
export function ensureMotionSessionForVideo(
  file: File,
  metadata: SwingVideoMetadata,
  sport: SportId,
): Promise<void> {
  const existing = inflight.get(file);
  if (existing) return existing;

  const promise = (async () => {
    // Lazy-load the heavy on-device pipeline so it stays out of the /video bundle.
    const { runMotionAnalysis, saveSession } = await import('@/lib/motion-lab');
    const session = await runMotionAnalysis(file, captureContextForVideo(sport, metadata), {
      estimatedFps: metadata.frame_rate_estimated,
    });
    saveSession(session);
  })();

  promise.catch(() => {
    if (inflight.get(file) === promise) inflight.delete(file);
  });

  inflight.set(file, promise);
  return promise;
}

/**
 * React binding: fire-and-forget. Whenever a clip is present (and Motion Lab is
 * enabled), kicks off the deduped fan-out so its pose track is ready by the time
 * the user opens the 3D Swing Avatar. The avatar reads the saved session
 * reactively (useMotionSessions), so this hook intentionally holds no state.
 */
export function useSwingSessionFanout(
  file: File | null,
  metadata: SwingVideoMetadata | null,
  sport: SportId,
): void {
  useEffect(() => {
    if (!file || !metadata) return;
    if (!isFlagEnabled(MOTION_LAB_FLAG)) return;
    // Best-effort: a pipeline failure must never disturb the AI video analysis.
    void ensureMotionSessionForVideo(file, metadata, sport).catch(() => {});
    // metadata identity changing (e.g. a camera-angle tweak) is fine — the
    // fan-out is deduped per File, so this re-adopts rather than re-runs.
  }, [file, metadata, sport]);
}
