// ============================================================
// SwingVantage — Client-side Swing Frame Extraction
//
// Samples still frames from an uploaded swing video entirely in the
// browser (no network round-trip to extract). Rather than sampling the
// clip uniformly (which wastes most frames on the idle setup/standstill),
// it first measures motion across the clip, locates the actual SWING
// WINDOW via frame-to-frame differencing, and concentrates the sampled
// frames there — while still keeping a setup and finish frame for context.
//
// Only these downscaled still frames are later sent to the AI provider
// for analysis; the original video file never leaves the device.
// ============================================================

import type { GrayLumaStats } from './frame-enhance';
import { cameraMotionProfile, type CameraMotionProfile } from './camera-motion';

/**
 * Default number of frames returned for analysis. Concentrated on the detected
 * swing window (plus a setup + finish frame), 10 keys carry the whole motion
 * while sending far fewer image tokens than a uniform 16 — markedly faster to
 * upload and for the AI to read, with no meaningful loss for a swing review.
 */
export const DEFAULT_FRAME_COUNT = 10;

/** Hard ceiling so payloads stay reasonable even if a caller asks for more. */
export const MAX_FRAME_COUNT = 24;

/**
 * Longest edge (px) each frame is downscaled to before encoding. 512 keeps the
 * body and club clearly legible while roughly halving pixels vs. 720 — fewer
 * image tokens for the vision model and a smaller upload.
 */
const DEFAULT_MAX_EDGE = 512;

/** JPEG quality for encoded frames (0–1). */
const DEFAULT_QUALITY = 0.72;

/** Tiny grayscale signature dimensions used for motion detection. */
const SIG_W = 32;
const SIG_H = 32;

export interface ExtractedFrame {
  /** `data:image/jpeg;base64,...` */
  dataUrl: string;
  /** Source timestamp in seconds. */
  timestampSeconds: number;
  /** Coarse position label across the clip (approximate, not a measured phase). */
  position: 'early' | 'middle' | 'late';
  /** 0-based order across the clip. */
  index: number;
}

export interface FrameExtractionOptions {
  /** How many frames to return (clamped to [1, MAX_FRAME_COUNT]). */
  count?: number;
  maxEdge?: number;
  quality?: number;
  /** Concentrate frames on the detected swing window (default true). */
  smart?: boolean;
  /** Optional manual trim: only sample frames from this start time (seconds). */
  trimStartSeconds?: number;
  /** Optional manual trim: only sample frames up to this end time (seconds). */
  trimEndSeconds?: number;
}

export interface FrameExtractionResult {
  frames: ExtractedFrame[];
  /** Resolution of the source video, e.g. "1920x1080". */
  resolution: string;
  durationSeconds: number;
  /** True when motion-based selection found and targeted a swing window. */
  swingWindowDetected: boolean;
  /**
   * Per-kept-frame luma statistics (brightness / contrast / sharpness), aligned
   * 1:1 with `frames`. Present only when grayscale signatures were readable for
   * every kept frame (canvas not tainted); undefined otherwise so consumers can
   * degrade honestly rather than assume a quality they couldn't measure.
   */
  frameStats?: GrayLumaStats[];
  /**
   * Global camera-motion summary (steadiness / shake / pan) estimated across the
   * scanned candidates. Present only when grayscale signatures were readable;
   * `perFrame` is omitted to keep the result compact.
   */
  cameraMotion?: Omit<CameraMotionProfile, 'perFrame'>;
}

// ──────────────────────────────────────────────────────────────
// Pure helpers (unit-tested — no DOM)
// ──────────────────────────────────────────────────────────────

/** Mean absolute difference between two grayscale signatures, normalized to 0–1. */
export function frameDifference(a: ArrayLike<number>, b: ArrayLike<number>): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += Math.abs(a[i] - b[i]);
  return sum / n / 255;
}

/** Per-candidate motion: motion[i] = difference from candidate i-1 (motion[0] = 0). */
export function motionProfile(signatures: ArrayLike<number>[]): number[] {
  const motion: number[] = new Array(signatures.length).fill(0);
  for (let i = 1; i < signatures.length; i++) {
    motion[i] = frameDifference(signatures[i - 1], signatures[i]);
  }
  return motion;
}

/**
 * Normalized brightness / contrast / sharpness from a grayscale buffer (values
 * 0–255, row-major `width`×`height`). Used to profile capture quality and to
 * decide whether a dark/flat clip should be enhanced before a retry detection
 * pass. Pure — exercised directly in tests.
 *
 *  • brightness — mean luma / 255 (0 = black, 1 = white)
 *  • contrast   — std of luma, scaled into 0–1 (0 = flat, 1 = high spread)
 *  • sharpness  — mean absolute neighbour gradient, scaled into 0–1
 *                 (0 = very soft/blurred, 1 = crisp edges)
 */
export function grayStats(
  gray: ArrayLike<number>,
  width: number = SIG_W,
  height: number = SIG_H,
): GrayLumaStats {
  const n = gray.length;
  if (n === 0) return { brightness: 0, contrast: 0, sharpness: 0 };

  let sum = 0;
  for (let i = 0; i < n; i++) sum += gray[i];
  const meanLuma = sum / n;

  let varSum = 0;
  for (let i = 0; i < n; i++) varSum += (gray[i] - meanLuma) ** 2;
  const stdLuma = Math.sqrt(varSum / n);

  // Average absolute gradient to the right + down neighbour (edge energy).
  let gradSum = 0;
  let gradCount = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (idx >= n) break;
      if (x + 1 < width && idx + 1 < n) {
        gradSum += Math.abs(gray[idx] - gray[idx + 1]);
        gradCount++;
      }
      if (y + 1 < height && idx + width < n) {
        gradSum += Math.abs(gray[idx] - gray[idx + width]);
        gradCount++;
      }
    }
  }
  const meanGrad = gradCount > 0 ? gradSum / gradCount : 0;

  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  return {
    brightness: clamp01(meanLuma / 255),
    // std of ~38 (8-bit) is already healthy contrast → scale so ~0.18 maps high.
    contrast: clamp01((stdLuma / 255) * 2.4),
    // crisp 32×32 thumbnails carry ~20+ mean gradient; scale to land near 1.
    sharpness: clamp01(meanGrad / 28),
  };
}

/**
 * Find the contiguous swing window in a motion profile. Returns candidate
 * index bounds [start, end], or null when there is no clear motion peak
 * (static camera / uniformly busy footage) — in which case callers should
 * fall back to even sampling.
 */
export function findSwingWindow(motion: number[]): { start: number; end: number } | null {
  const n = motion.length;
  if (n < 5) return null;

  const max = Math.max(...motion);
  const mean = motion.reduce((a, b) => a + b, 0) / n;
  // No meaningful peak — bail so the caller samples evenly.
  if (max <= 1e-4 || max < mean * 1.6) return null;

  const peak = motion.indexOf(max);
  const threshold = max * 0.25;
  let start = peak;
  let end = peak;
  while (start > 0 && motion[start - 1] >= threshold) start--;
  while (end < n - 1 && motion[end + 1] >= threshold) end++;

  // Pad one candidate each side to catch the transition in/out of the swing.
  start = Math.max(0, start - 1);
  end = Math.min(n - 1, end + 1);
  return { start, end };
}

function pickEven(arr: number[], k: number): number[] {
  if (k <= 0 || arr.length === 0) return [];
  if (k >= arr.length) return arr.slice();
  const out: number[] = [];
  for (let i = 0; i < k; i++) {
    out.push(arr[Math.round((i * (arr.length - 1)) / (k - 1))]);
  }
  return [...new Set(out)];
}

function range(start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

/**
 * Choose which of `n` scanned candidates to keep for analysis. When a swing
 * window is given, the budget concentrates inside it while always retaining a
 * setup (first) and finish (last) frame; otherwise it samples evenly.
 * Returns a sorted, unique list of candidate indices (length ≤ count).
 */
export function selectFrameIndices(
  n: number,
  count: number,
  window: { start: number; end: number } | null,
): number[] {
  if (n <= 0) return [];
  if (count >= n) return range(0, n - 1);

  if (!window) return pickEven(range(0, n - 1), count);

  const selected = new Set<number>([0, n - 1]);
  const inWindow = range(window.start, window.end).filter((i) => !selected.has(i));
  for (const idx of pickEven(inWindow, count - selected.size)) selected.add(idx);

  // If the window was small, top up with evenly-spaced global frames.
  if (selected.size < count) {
    for (const idx of pickEven(range(0, n - 1), count)) {
      if (selected.size >= count) break;
      selected.add(idx);
    }
  }
  return [...selected].sort((a, b) => a - b).slice(0, count);
}

function clampCount(count: number): number {
  if (!Number.isFinite(count) || count < 1) return 1;
  return Math.min(Math.floor(count), MAX_FRAME_COUNT);
}

function positionFor(fraction: number): ExtractedFrame['position'] {
  if (fraction < 0.34) return 'early';
  if (fraction < 0.67) return 'middle';
  return 'late';
}

// ──────────────────────────────────────────────────────────────
// DOM helpers
// ──────────────────────────────────────────────────────────────

/** Seek the element and resolve once the frame at that time is actually painted. */
function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      clearTimeout(timer);
    };
    const onSeeked = () => {
      if (settled) return;
      settled = true;
      cleanup();
      // Give the decoder a tick to paint the frame (iOS/Safari quirk).
      requestAnimationFrame(() => resolve());
    };
    const onError = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Video seek failed while extracting frames.'));
    };
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      // Don't hard-fail on a slow seek — resolve and let the draw proceed.
      resolve();
    }, 1500);

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    // Clamp into a safe range; exactly 0 or exactly duration can be flaky.
    video.currentTime = Math.max(0.01, Math.min(time, (video.duration || time) - 0.05));
  });
}

interface Candidate {
  dataUrl: string;
  t: number;
  fraction: number;
  signature: number[];
}

function toGrayscale(data: Uint8ClampedArray): number[] {
  const out: number[] = new Array(data.length >> 2);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    out[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return out;
}

/**
 * Extract swing frames, concentrated on the detected motion (the actual swing).
 *
 * @param source A File/Blob OR an existing object URL string.
 * @throws if the video cannot be loaded or no frames can be drawn.
 */
export async function extractSwingFrames(
  source: File | Blob | string,
  options: FrameExtractionOptions = {},
): Promise<FrameExtractionResult> {
  const count = clampCount(options.count ?? DEFAULT_FRAME_COUNT);
  const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const smart = options.smart ?? true;

  // Scan more candidates than we keep, so motion detection has resolution.
  // Capped at 24 seeks — enough to localize the swing without a long scan.
  const scanCount = smart
    ? Math.min(24, Math.max(count + 10, Math.ceil(count * 1.8)))
    : count;

  const ownsObjectUrl = typeof source !== 'string';
  const objectUrl = ownsObjectUrl ? URL.createObjectURL(source) : source;

  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';

  const revoke = () => {
    if (ownsObjectUrl) URL.revokeObjectURL(objectUrl);
    video.removeAttribute('src');
    video.load();
  };

  try {
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        video.removeEventListener('loadeddata', onLoaded);
        video.removeEventListener('error', onError);
        resolve();
      };
      const onError = () => {
        video.removeEventListener('loadeddata', onLoaded);
        video.removeEventListener('error', onError);
        reject(new Error('Could not load the video for frame extraction.'));
      };
      video.addEventListener('loadeddata', onLoaded);
      video.addEventListener('error', onError);
      video.src = objectUrl;
    });

    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error('Video has no readable duration; cannot extract frames.');
    }

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) {
      throw new Error('Video has no readable dimensions; cannot extract frames.');
    }

    // Downscale preserving aspect ratio.
    const scale = Math.min(1, maxEdge / Math.max(vw, vh));
    const cw = Math.max(1, Math.round(vw * scale));
    const ch = Math.max(1, Math.round(vh * scale));

    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable; cannot extract frames.');

    // Tiny canvas for grayscale motion signatures.
    const sigCanvas = document.createElement('canvas');
    sigCanvas.width = SIG_W;
    sigCanvas.height = SIG_H;
    const sigCtx = sigCanvas.getContext('2d', { willReadFrequently: true });

    // ── Pass 1: scan candidates across the clip (or the trimmed window) ──
    const clampFrac = (n: number) => Math.max(0.001, Math.min(0.999, n));
    const ts = options.trimStartSeconds;
    const te = options.trimEndSeconds;
    const startFrac =
      ts != null && Number.isFinite(ts) ? clampFrac(ts / duration) : 0.02;
    const rawEndFrac =
      te != null && Number.isFinite(te) ? clampFrac(te / duration) : 0.98;
    // Guard against an inverted/too-narrow trim window.
    const endFrac = rawEndFrac > startFrac + 0.02 ? rawEndFrac : Math.min(0.999, startFrac + 0.05);
    const candidates: Candidate[] = [];
    let signaturesUsable = Boolean(sigCtx) && smart;

    for (let i = 0; i < scanCount; i++) {
      const fraction =
        scanCount === 1 ? 0.5 : startFrac + ((endFrac - startFrac) * i) / (scanCount - 1);
      const t = duration * fraction;
      await seekTo(video, t);
      ctx.drawImage(video, 0, 0, cw, ch);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= 1000) continue; // blank/failed draw — skip

      let signature: number[] = [];
      if (signaturesUsable && sigCtx) {
        try {
          sigCtx.drawImage(video, 0, 0, SIG_W, SIG_H);
          signature = toGrayscale(sigCtx.getImageData(0, 0, SIG_W, SIG_H).data);
        } catch {
          // Canvas tainted / read blocked — disable motion path, sample evenly.
          signaturesUsable = false;
        }
      }
      candidates.push({ dataUrl, t, fraction, signature });
    }

    if (candidates.length === 0) {
      throw new Error('No frames could be extracted from this video. Try a different file.');
    }

    // ── Pass 2: choose which candidates to keep ────────────────
    const window =
      signaturesUsable && candidates.length >= 5
        ? findSwingWindow(motionProfile(candidates.map((c) => c.signature)))
        : null;

    const keep = selectFrameIndices(candidates.length, count, window);

    const frames: ExtractedFrame[] = keep.map((candIdx, i) => {
      const c = candidates[candIdx];
      return {
        dataUrl: c.dataUrl,
        timestampSeconds: Number(c.t.toFixed(3)),
        position: positionFor(c.fraction),
        index: i,
      };
    });

    // Per-kept-frame luma stats — only when EVERY kept frame carries a readable
    // signature, so the array stays 1:1 with `frames`. Otherwise omit (the
    // quality profiler then honestly reports pixel signals as unavailable).
    const keptSignatures = keep.map((candIdx) => candidates[candIdx].signature);
    const frameStats =
      keptSignatures.length > 0 && keptSignatures.every((s) => s.length > 0)
        ? keptSignatures.map((s) => grayStats(s))
        : undefined;

    // Global camera-motion (steadiness / shake / pan) across the scanned
    // candidates — computed only when signatures were readable. `perFrame` is
    // dropped from the result to keep it compact.
    const allSignatures = candidates.map((c) => c.signature);
    let cameraMotion: Omit<CameraMotionProfile, 'perFrame'> | undefined;
    if (signaturesUsable && allSignatures.length >= 3 && allSignatures.every((s) => s.length > 0)) {
      const { perFrame, ...summary } = cameraMotionProfile(allSignatures, SIG_W, SIG_H);
      void perFrame;
      cameraMotion = summary;
    }

    return {
      frames,
      resolution: `${vw}x${vh}`,
      durationSeconds: Number(duration.toFixed(2)),
      swingWindowDetected: window !== null,
      frameStats,
      cameraMotion,
    };
  } finally {
    revoke();
  }
}
