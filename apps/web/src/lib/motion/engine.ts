// ============================================================
// SwingIQ — Motion Engine: Core (scaffolding)
// ------------------------------------------------------------
// The provider seam, browser-capability detection, and two
// transparent, deterministic primitives (Motion Score + Swing
// Fingerprint). Everything is honest about its data basis; the
// score refuses to drop its disclaimer unless inputs are measured.
// ============================================================

import type {
  MotionDataBasis,
  MotionScore,
  MotionScoreComponent,
  PoseSequence,
  SwingFingerprint,
} from './types';
import type { SportId } from '@swingiq/core';

// Re-export so providers can import the sequence type from the engine seam.
export type { PoseSequence };

// ── Provider seam ─────────────────────────────────────────────

/** Generic input to a pose model — frames as encoded images + timing. */
export interface PoseEstimateInput {
  frames: Array<{ timestampMs: number; image: string }>;
  fps?: number;
  schema?: PoseSequence['schema'];
}

/** The single interface a real pose model must implement. */
export interface PoseProvider {
  id: string;
  label: string;
  /** Cheap, synchronous check (model loaded / API reachable / flag on). */
  isAvailable: () => boolean;
  estimate: (input: PoseEstimateInput) => Promise<PoseSequence>;
}

/** Browser acceleration surfaces a future local model could use. */
export interface MotionEngineCapabilities {
  webgpu: boolean;
  webnn: boolean;
  offscreenCanvas: boolean;
  wasm: boolean;
}

/** SSR-safe capability probe — never throws, all behind typeof guards. */
export function detectMotionCapabilities(): MotionEngineCapabilities {
  const hasNav = typeof navigator !== 'undefined';
  return {
    webgpu: hasNav && 'gpu' in navigator,
    webnn: hasNav && 'ml' in navigator,
    offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
    wasm: typeof WebAssembly !== 'undefined',
  };
}

// ── Data-basis honesty ────────────────────────────────────────

const BASIS_RANK: Record<MotionDataBasis, number> = {
  placeholder: 0,
  ai_inferred: 1,
  estimated: 2,
  user_entered: 3,
  measured: 4,
};

/** The weakest (least trustworthy) basis among inputs — drives labeling. */
export function weakestBasis(bases: MotionDataBasis[]): MotionDataBasis {
  if (bases.length === 0) return 'placeholder';
  return bases.reduce((weak, b) => (BASIS_RANK[b] < BASIS_RANK[weak] ? b : weak), bases[0]);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ── Motion Score ──────────────────────────────────────────────

const SCORE_DISCLAIMER =
  'This Motion Score is a directional estimate from video, not a measured biomechanical result.';

/**
 * Combine weighted components into a transparent 0–100 score. The result's
 * basis is the weakest input basis, and the disclaimer is only dropped when
 * every input is `measured` — so the UI can never present an estimate as fact.
 */
export function computeMotionScore(
  components: MotionScoreComponent[],
  basis: MotionDataBasis = 'placeholder',
): MotionScore {
  const totalWeight = components.reduce((s, c) => s + c.weight, 0);
  const overall =
    totalWeight > 0
      ? Math.round(components.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight)
      : 0;

  const confidence = basis === 'measured' ? 0.9 : basis === 'placeholder' ? 0 : 0.5;

  return {
    overall: clamp(overall, 0, 100),
    components,
    basis,
    confidence,
    disclaimer: basis === 'measured' ? null : SCORE_DISCLAIMER,
  };
}

// ── Swing Fingerprint ─────────────────────────────────────────

/** Deterministic FNV-1a over the sorted descriptor pairs. */
function hashDescriptors(descriptors: Record<string, number>): string {
  const str = Object.keys(descriptors)
    .sort()
    .map((k) => `${k}:${descriptors[k].toFixed(3)}`)
    .join('|');
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Build a stable signature of a movement pattern (NOT a biometric identity).
 * The signature depends only on the descriptors, so the same movement maps to
 * the same fingerprint across sessions.
 */
export function buildSwingFingerprint(
  sport: SportId,
  descriptors: Record<string, number>,
  basis: MotionDataBasis = 'placeholder',
  createdAt: string = new Date().toISOString(),
): SwingFingerprint {
  return {
    signature: `fp_${hashDescriptors(descriptors)}`,
    sport,
    descriptors,
    basis,
    createdAt,
  };
}
