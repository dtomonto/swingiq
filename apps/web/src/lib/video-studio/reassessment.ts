// ============================================================
// SwingVantage — Video Studio: Reassessment Engine
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Videos go stale. Pages change, a thumbnail underperforms, a clip is
//   too long, captions are missing, a better provider appears. This
//   engine looks at a live video's performance scores plus a few facts
//   (is it a placeholder? does it have captions? how fresh is it? did the
//   page change?) and produces a ranked list of recommended actions —
//   keep, improve the script, shorten, new thumbnail, move, replace, add
//   captions/transcript, spin a sport/mobile/onboarding variant, retire,
//   or "a human should look at this".
//
//   It's deterministic and explainable: every recommendation carries a
//   plain-English rationale, and high-impact actions (replace/retire) are
//   flagged as needing human sign-off. Designed to be run on a schedule.
// ============================================================

import {
  type VideoAsset,
  type VideoPerformanceScore,
  type VideoReassessment,
  type ReassessmentRecommendation,
  type ReassessmentAction,
} from './types';

export interface ReassessInput {
  asset: VideoAsset;
  score: VideoPerformanceScore;
  placementId?: string;
  /** The underlying page/feature changed since the video was made. */
  contentChanged?: boolean;
  /** A higher-quality provider became available. */
  betterProviderAvailable?: boolean;
  /**
   * Whether there's enough traffic to trust the performance scores. When
   * false, we skip engagement/education/conversion-driven recommendations
   * (a brand-new video with no views isn't "underperforming" — it's untested).
   * Structural checks (captions, transcript, placeholder, staleness) still run.
   * Defaults to true.
   */
  hasEnoughData?: boolean;
  now?: Date;
}

function push(
  list: ReassessmentRecommendation[],
  action: ReassessmentAction,
  weight: number,
  rationale: string,
): void {
  list.push({ action, weight: Math.max(0, Math.min(100, Math.round(weight))), rationale });
}

/**
 * Produce a reassessment for one video. Recommendations are de-duplicated
 * (strongest weight wins) and sorted strongest-first.
 */
export function reassess(input: ReassessInput): VideoReassessment {
  const { asset, score } = input;
  const now = input.now ?? new Date();
  const recs: ReassessmentRecommendation[] = [];
  const signals: string[] = [];

  // Accessibility gaps are the highest priority — they affect everyone.
  if (asset.captions.length === 0) {
    push(recs, 'add_captions', 95, 'No caption track — captions are required for accessibility.');
    signals.push('missing captions');
  }
  if (!asset.transcript || asset.transcript.trim().length === 0) {
    push(recs, 'add_transcript', 82, 'No transcript — add one for accessibility and SEO.');
    signals.push('missing transcript');
  }

  // Placeholder footage should be upgraded once a real provider exists.
  if (asset.isPlaceholder) {
    push(
      recs,
      'replace',
      88,
      'Footage is a generated placeholder — replace with a real render when a provider is configured.',
    );
    signals.push('placeholder footage');
  }

  // Freshness / content drift.
  if (input.contentChanged) {
    push(recs, 'improve_script', 78, 'The underlying page/feature changed — refresh the script to match.');
    signals.push('page content changed');
  }
  if (score.freshness < 35) {
    push(recs, 'improve_script', 62, 'Video is getting stale — refresh the script and visuals.');
    signals.push(`low freshness (${score.freshness})`);
  }

  const hasEnoughData = input.hasEnoughData !== false;

  // Engagement problems (only judge once there's real traffic).
  if (hasEnoughData && score.engagement < 45) {
    push(recs, 'new_thumbnail', 64, 'Low engagement — a stronger thumbnail can lift play rate.');
    push(recs, 'improve_script', 60, 'Low engagement — tighten the hook in the first 5 seconds.');
    signals.push(`low engagement (${score.engagement})`);
  }

  // Education problems (low completion / likely confusion).
  if (hasEnoughData && score.education < 45) {
    push(recs, 'shorten', 58, 'Viewers are not finishing — shorten to the essential steps.');
    signals.push(`low education score (${score.education})`);
  }

  // Conversion problems on decision-stage content.
  if (hasEnoughData && score.conversionContribution < 30) {
    push(recs, 'move_placement', 48, 'Weak conversion contribution — try a higher-intent placement or stronger CTA.');
    signals.push(`low conversion contribution (${score.conversionContribution})`);
  }

  // Better provider available → upgrade quality.
  if (input.betterProviderAvailable && !asset.isPlaceholder) {
    push(recs, 'replace', 52, 'A higher-quality provider is now available — consider re-rendering.');
    signals.push('better provider available');
  }

  // Lifecycle-driven retirement.
  if (asset.lifecycle === 'outdated' || asset.lifecycle === 'deprecated') {
    push(recs, 'retire', 70, `Marked ${asset.lifecycle} — retire or replace.`);
    signals.push(`lifecycle: ${asset.lifecycle}`);
  }

  // High need-attention + low engagement → escalate to a human.
  if (hasEnoughData && score.recommendationPriority > 70 && score.engagement < 50) {
    push(recs, 'human_review', 55, 'High attention score with poor engagement — a person should decide next steps.');
    signals.push('escalated for human review');
  }

  // Nothing wrong → keep.
  if (recs.length === 0) {
    push(recs, 'keep', 100, 'Performing well, fresh, and accessible — keep as-is.');
    signals.push('healthy');
  }

  // De-dup by action (max weight wins), then sort strongest-first.
  const byAction = new Map<ReassessmentAction, ReassessmentRecommendation>();
  for (const r of recs) {
    const existing = byAction.get(r.action);
    if (!existing || r.weight > existing.weight) byAction.set(r.action, r);
  }
  const recommendations = [...byAction.values()].sort((a, b) => b.weight - a.weight);
  const primaryAction = recommendations[0].action;
  const requiresHuman =
    recommendations.some((r) => r.action === 'human_review') ||
    primaryAction === 'replace' ||
    primaryAction === 'retire';

  return {
    id: `reassess_${asset.id}_${now.getTime().toString(36)}`,
    assetId: asset.id,
    placementId: input.placementId,
    recommendations,
    primaryAction,
    signals,
    requiresHuman,
    createdAt: now.toISOString(),
  };
}
