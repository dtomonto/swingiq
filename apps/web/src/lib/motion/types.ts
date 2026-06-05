// ============================================================
// SwingVantage — Motion Engine: Readiness Types (scaffolding)
// ------------------------------------------------------------
// Interfaces for a FUTURE browser-side motion pipeline (pose
// estimation → phase detection → metrics → motion score). No
// real model runs yet; these abstractions exist so MediaPipe,
// TensorFlow MoveNet, WebGPU/WebNN, or a server model can drop in
// without reworking the app.
//
// HONESTY: every value carries a `basis` so the UI can label
// measured vs estimated vs AI-inferred vs user-entered vs
// placeholder/demo. Nothing here fabricates biomechanical
// precision — the mock provider returns clearly-flagged data.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { EvidenceBasis } from '@/lib/faults';

/** Extends the ontology's evidence basis with an explicit demo/placeholder tag. */
export type MotionDataBasis = EvidenceBasis | 'placeholder';

/** A single tracked point. Normalized (0–1) image coordinates. */
export interface PoseLandmark {
  x: number;
  y: number;
  z?: number;
  /** Model-reported visibility/confidence for this point (0–1), if available. */
  visibility?: number;
}

export interface PoseFrame {
  timestampMs: number;
  landmarks: PoseLandmark[];
}

/** A normalized pose track that any model can be mapped onto. */
export interface PoseSequence {
  /** Landmark naming scheme so providers stay interchangeable. */
  schema: 'mediapipe_pose_33' | 'movenet_17' | 'generic';
  fps: number;
  frameCount: number;
  frames: PoseFrame[];
  basis: MotionDataBasis;
  /** Overall sequence confidence (0–1). */
  confidence: number;
}

/** One movement metric (e.g. tempo ratio, hip rotation). */
export interface MotionMetric {
  id: string;
  label: string;
  /** null when not derivable from the available data. */
  value: number | null;
  unit: string;
  basis: MotionDataBasis;
  confidence: number;
}

/** A detected (or estimated) swing-phase window over the sequence. */
export interface SwingPhaseWindow {
  phase: string;
  startFrame: number;
  endFrame: number;
  confidence: number;
  basis: MotionDataBasis;
}

export interface MotionScoreComponent {
  id: string;
  label: string;
  /** 0–100. */
  score: number;
  /** Relative weight in the overall score. */
  weight: number;
}

/** A transparent, composable swing score. */
export interface MotionScore {
  /** 0–100. */
  overall: number;
  components: MotionScoreComponent[];
  basis: MotionDataBasis;
  confidence: number;
  /** Present whenever basis !== 'measured' — keeps the score honest. */
  disclaimer: string | null;
}

/**
 * A compact, stable signature of how an athlete moves — the "Swing
 * Fingerprint" concept. It is an identity for a movement PATTERN, never a
 * biometric identifier of the person.
 */
export interface SwingFingerprint {
  /** Deterministic signature derived from the descriptors. */
  signature: string;
  sport: SportId;
  /** Interpretable descriptors (e.g. { tempoRatio: 3.1, sequenceScore: 0.7 }). */
  descriptors: Record<string, number>;
  basis: MotionDataBasis;
  createdAt: string;
}
