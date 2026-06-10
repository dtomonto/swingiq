// ============================================================
// SwingVantage — RecordAssist: RetakeEngine
// ------------------------------------------------------------
// After a clip is recorded we score whether it's analysis-ready and, if
// not, give specific, actionable retake reasons. Pure + deterministic.
//
// Inputs are the *aggregate* of frame quality across the clip (or the
// last good frame) plus the readiness at the moment recording started.
// We never block — recording can always proceed — but we surface the
// honest tradeoffs (Acceptance Criteria §12).
// ============================================================

import type {
  FrameQualitySignals,
  RetakeRecommendation,
  RetakeReason,
  KineticConfidenceLevel,
} from '../types';

export interface RetakeInput {
  /** Aggregate quality across the recorded clip. */
  quality: FrameQualitySignals;
  /** Readiness score (0–100) representative of the clip. */
  readiness: number;
  /** Fraction 0–1 of frames in which a person was detected. */
  detectionRate: number;
  /** Clip duration in seconds (very short clips are suspect). */
  durationSeconds: number;
}

const MIN_USABLE_DURATION = 1.0;

export function evaluateRetake(input: RetakeInput): RetakeRecommendation {
  const { quality: q, readiness, detectionRate, durationSeconds } = input;
  const reasons: RetakeReason[] = [];

  if (durationSeconds < MIN_USABLE_DURATION) {
    reasons.push({
      id: 'too_short',
      reason: 'The clip is very short.',
      fix: 'Record the full motion from setup through follow-through.',
      severity: 'blocking',
    });
  }

  if (detectionRate < 0.4) {
    reasons.push({
      id: 'low_detection',
      reason: 'We could not track a body for most of the clip.',
      fix: 'Improve lighting, reduce clutter, and keep your whole body in frame.',
      severity: 'blocking',
    });
  }

  if (!q.fullBodyVisible) {
    if (q.feetVisible !== 'visible') {
      reasons.push({
        id: 'feet_cut',
        reason: 'Your feet were cut off.',
        fix: 'Tilt the phone down or step back so head-to-feet stays in frame.',
        severity: 'warning',
      });
    }
    if (q.headVisible !== 'visible') {
      reasons.push({
        id: 'head_cut',
        reason: 'Your head was cut off.',
        fix: 'Tilt the phone up to include your head.',
        severity: 'warning',
      });
    }
  }

  if (q.implementRisk === 'high') {
    reasons.push({
      id: 'implement_risk',
      reason: 'Your equipment likely left the frame during the swing.',
      fix: 'Step back so the full swing path stays in view.',
      severity: 'warning',
    });
  }

  if (q.lighting === 'low') {
    reasons.push({
      id: 'low_light',
      reason: 'Lighting was low, which reduces tracking accuracy.',
      fix: 'Move toward brighter, even light.',
      severity: 'warning',
    });
  }

  if (q.stability === 'shaky') {
    reasons.push({
      id: 'shaky',
      reason: 'The camera was unstable.',
      fix: 'Prop the phone up or use a tripod.',
      severity: 'warning',
    });
  }

  if (q.personCount > 1) {
    reasons.push({
      id: 'multiple_people',
      reason: 'More than one person was in the frame.',
      fix: 'Record with only the athlete in view.',
      severity: 'warning',
    });
  }

  const hasBlocking = reasons.some((r) => r.severity === 'blocking');
  // Recommend a retake when blocked, OR when readiness was clearly poor.
  const recommended = hasBlocking || readiness < 55 || reasons.length >= 3;

  const confidence = confidenceForClip(readiness, detectionRate, hasBlocking);

  return { recommended, reasons, confidence };
}

function confidenceForClip(
  readiness: number,
  detectionRate: number,
  hasBlocking: boolean,
): KineticConfidenceLevel {
  if (hasBlocking || detectionRate < 0.4) return 'insufficient';
  if (readiness >= 85 && detectionRate >= 0.8) return 'high';
  if (readiness >= 70 && detectionRate >= 0.6) return 'medium';
  return 'low';
}
