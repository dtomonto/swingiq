// ============================================================
// SwingVantage — Motion Lab: Pose Fusion (L2)
// ------------------------------------------------------------
// When a second pose engine runs (MoveNet, mapped onto the MediaPipe-33
// index space), don't blindly trust either one — COMPARE them. For each
// shared joint in each frame this measures agreement, selects the better
// source, rejects gross outliers, and reports an overall model-agreement
// score so the report can lower confidence honestly when the engines
// disagree (occlusion / blur / ambiguity).
//
// Pure + deterministic (operates on already-detected landmarks) so it is
// fully unit-tested without any engine or dependency.
// ============================================================

import type { PoseFrame } from '@/lib/pose';
import { SHARED_MP_INDICES } from '@/lib/pose';

export type AgreementLabel = 'high' | 'medium' | 'low' | 'none';

export interface FusedPoseResult {
  /** The fused track (one entry per primary frame). */
  frames: PoseFrame[];
  /** 0–1 mean per-joint agreement across jointly-observed joints. */
  modelAgreementScore: number;
  agreementLabel: AgreementLabel;
  /** How many (frame × joint) pairs both engines observed. */
  jointsComparable: number;
  /** How many joints the validator supplied or improved. */
  jointsFromValidator: number;
  /** Gross-disagreement joints where the low-confidence estimate was dropped. */
  outliersRejected: number;
  warnings: string[];
}

export interface FusionOptions {
  /** Min visibility to consider a landmark "observed". */
  minVisibility?: number;
  /** Normalized distance at which joint agreement hits 0. */
  agreementSpan?: number;
  /** Normalized distance above which the lower-confidence estimate is an outlier. */
  outlierDistance?: number;
  /** Max timestamp gap (ms) to align a validator frame to a primary frame. */
  alignToleranceMs?: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

function labelFor(score: number, comparable: number): AgreementLabel {
  if (comparable === 0) return 'none';
  if (score >= 0.8) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
}

/**
 * Fuse a primary (MediaPipe) track with a validator (e.g. MoveNet) track, both
 * in the MediaPipe-33 index space. Frames are aligned by timestamp; only the
 * shared joints are corroborated, and the primary's other joints pass through
 * untouched. Never throws.
 */
export function fusePoses(
  primary: PoseFrame[],
  validator: PoseFrame[],
  options: FusionOptions = {},
): FusedPoseResult {
  const minVis = options.minVisibility ?? 0.3;
  const span = options.agreementSpan ?? 0.15;
  const outlierDist = options.outlierDistance ?? 0.2;
  const alignTol = (options.alignToleranceMs ?? 40) / 1000;

  const warnings: string[] = [];
  if (validator.length === 0) {
    return {
      frames: primary,
      modelAgreementScore: 0,
      agreementLabel: 'none',
      jointsComparable: 0,
      jointsFromValidator: 0,
      outliersRejected: 0,
      warnings: ['No validator frames — returned the primary track unchanged.'],
    };
  }

  // Index validator frames by timestamp for nearest-match alignment.
  const vByTime = [...validator].sort((a, b) => a.timestampSeconds - b.timestampSeconds);
  const alignValidator = (t: number): PoseFrame | null => {
    let best: PoseFrame | null = null;
    let bestGap = Infinity;
    for (const vf of vByTime) {
      const gap = Math.abs(vf.timestampSeconds - t);
      if (gap < bestGap) {
        bestGap = gap;
        best = vf;
      }
    }
    return best && bestGap <= alignTol ? best : null;
  };

  let agreementSum = 0;
  let comparable = 0;
  let fromValidator = 0;
  let outliers = 0;

  const frames: PoseFrame[] = primary.map((pf) => {
    const vf = alignValidator(pf.timestampSeconds);
    if (!vf) return pf;
    const landmarks = pf.landmarks.map((p) => ({ ...p }));
    for (const j of SHARED_MP_INDICES) {
      const p = pf.landmarks[j];
      const v = vf.landmarks[j];
      if (!p || !v) continue;
      const pVis = p.visibility ?? 0;
      const vVis = v.visibility ?? 0;
      const pSeen = pVis >= minVis;
      const vSeen = vVis >= minVis;

      if (pSeen && vSeen) {
        const dist = Math.hypot(p.x - v.x, p.y - v.y);
        agreementSum += clamp(1 - dist / span, 0, 1);
        comparable++;
        if (dist > outlierDist) {
          // Gross disagreement — drop the lower-confidence estimate.
          outliers++;
          if (vVis > pVis) {
            landmarks[j] = { x: v.x, y: v.y, z: p.z, visibility: vVis };
            fromValidator++;
          }
        } else if (vVis > pVis) {
          // Agree — take the higher-confidence position, lift visibility.
          landmarks[j] = { x: v.x, y: v.y, z: p.z, visibility: Math.max(pVis, vVis) };
          fromValidator++;
        } else {
          landmarks[j] = { ...p, visibility: Math.max(pVis, vVis) };
        }
      } else if (vSeen && !pSeen) {
        // Validator recovered a joint the primary missed.
        landmarks[j] = { x: v.x, y: v.y, z: p.z, visibility: vVis };
        fromValidator++;
      }
      // pSeen && !vSeen, or neither: keep the primary (already copied).
    }
    return { timestampSeconds: pf.timestampSeconds, personCount: pf.personCount, landmarks };
  });

  const modelAgreementScore = comparable > 0 ? +(agreementSum / comparable).toFixed(3) : 0;
  if (comparable === 0) warnings.push('Engines never observed the same joint — agreement not computable.');

  return {
    frames,
    modelAgreementScore,
    agreementLabel: labelFor(modelAgreementScore, comparable),
    jointsComparable: comparable,
    jointsFromValidator: fromValidator,
    outliersRejected: outliers,
    warnings,
  };
}
