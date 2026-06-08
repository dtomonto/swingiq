// ============================================================
// SwingVantage — Visual analysis uncertainty assessment
// ------------------------------------------------------------
// Pure, presentation-free logic that decides WHEN a visual AI result should
// carry a prominent "this read is limited — here's how to get a sharper one"
// notice, and WHY. The confidence number and per-aspect visibility already
// render in AIVisualAnalysisPanel; this lifts the plan's "AI uncertainty"
// prompt (§6) up top instead of leaving it in a quiet box at the bottom.
//
// Honest-first and welcoming: it never hides the result or scolds — it frames
// a limited capture as "useful first read, here's the next step." No new data
// and no new AI call: it reads the same fields the detail section already shows.
// ============================================================
import type { AIVisualAnalysis, VisibilityQuality } from '@swingiq/core';

export interface VisualUncertainty {
  /** Whether to surface the prominent uncertainty notice. */
  show: boolean;
  /** Overall confidence as a 0–100 percentage (what the UI shows). */
  confidencePct: number;
  /** Plain-English, already user-facing reasons the read was limited. */
  reasons: string[];
  /** The specific next-capture action (the model's tip, with a safe fallback). */
  recommendation: string;
}

const isLimited = (q: VisibilityQuality): boolean => q === 'limited' || q === 'poor';

const FALLBACK_RECOMMENDATION =
  'film from down the line with your whole body and the full swing in frame, in good light.';

/**
 * Decide whether a visual analysis warrants a prominent uncertainty notice.
 *
 * Trigger on the model's own holistic signals — overall confidence under 50%,
 * OR overall visibility rated limited/poor — so a strong video with one minor
 * limitation never trips it. The `reasons` then explain which specific aspects
 * were weak, drawn from the same data the detail section renders.
 */
export function assessVisualUncertainty(analysis: AIVisualAnalysis): VisualUncertainty {
  const vq = analysis.videoQuality;
  const confidencePct = Math.round(analysis.overallConfidence * 100);

  const reasons: string[] = [];
  if (isLimited(vq.bodyVisibility.quality)) reasons.push("your full body wasn't clearly in frame");
  if (isLimited(vq.cameraAngle.quality)) reasons.push('the camera angle was hard to read');
  if (isLimited(vq.swingVisibility.quality)) reasons.push("parts of the swing weren't fully visible");
  if (isLimited(vq.lighting.quality)) reasons.push('the lighting hid some positions');
  if (!vq.contactVisible) reasons.push("the moment of contact wasn't clearly visible");
  if (!vq.fullMotionCaptured) reasons.push("the full motion wasn't captured");

  const show = analysis.overallConfidence < 0.5 || isLimited(analysis.visibilityQuality);

  const recommendation = vq.nextCaptureRecommendation?.trim() || FALLBACK_RECOMMENDATION;

  return { show, confidencePct, reasons, recommendation };
}

/** Join the first two reasons into a natural clause, or '' when there are none. */
export function formatUncertaintyReasons(reasons: string[]): string {
  if (reasons.length === 0) return '';
  return reasons.slice(0, 2).join(' and ');
}
