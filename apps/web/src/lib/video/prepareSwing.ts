// ============================================================
// SwingIQ — Speculative Swing Preparation
//
// Frame extraction + on-device pose detection are the two browser-side
// steps that must finish before the AI vision call can start. They depend
// only on the video file (not the camera angle or any later choice), so we
// can run them speculatively the moment a video is selected — while the user
// is still reading the configure screen — and cache the result per file.
//
// By the time the user clicks "Analyze", this work is usually already done,
// so the click jumps almost straight to the AI call. The result is memoized
// per File, so kicking it off during configure and awaiting it on analyze
// reuses the exact same work (never double-extracts).
// ============================================================

import {
  extractSwingFrames,
  type FrameExtractionResult,
  type FrameExtractionOptions,
} from '@/lib/frame-extraction';
import { detectSwingPose, warmupPose, type PoseMetrics } from '@/lib/pose';

export interface PreparedSwing {
  extraction: FrameExtractionResult;
  pose: { metrics: PoseMetrics | null; summary: string | null };
}

// One in-flight (or finished) preparation per File. WeakMap so a removed/GC'd
// file's preparation is released automatically.
const cache = new WeakMap<File, Promise<PreparedSwing>>();

/**
 * Extract frames + run pose for a file, reusing any preparation already started
 * for the same File. Safe to call multiple times — only the first call does the
 * work; later calls return the same promise.
 */
export function prepareSwing(
  file: File,
  options?: FrameExtractionOptions,
): Promise<PreparedSwing> {
  const existing = cache.get(file);
  if (existing) return existing;

  const promise = (async (): Promise<PreparedSwing> => {
    // Kick off the model download immediately so it overlaps frame extraction.
    void warmupPose();
    const extraction = await extractSwingFrames(file, options);
    const pose = await detectSwingPose(extraction.frames);
    return { extraction, pose };
  })();

  // On failure, drop the cache entry so a later analyze can cleanly retry.
  // (This also marks the promise as handled, so an ignored speculative call
  // never surfaces an unhandled rejection.)
  promise.catch(() => {
    if (cache.get(file) === promise) cache.delete(file);
  });

  cache.set(file, promise);
  return promise;
}

/**
 * Start preparing in the background and swallow errors — for the speculative
 * "warm it up while they read the configure screen" call, where we don't yet
 * care about the result or any failure (the real analyze call will retry).
 */
export function warmSwingPreparation(
  file: File,
  options?: FrameExtractionOptions,
): void {
  void prepareSwing(file, options).catch(() => {});
}

/** Forget any cached preparation for a file (e.g. when the user removes it). */
export function forgetPreparedSwing(file: File | null): void {
  if (file) cache.delete(file);
}
