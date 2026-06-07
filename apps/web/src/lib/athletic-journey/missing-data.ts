// ============================================================
// SwingVantage — Athletic Journey: missing-data recommendations
// ------------------------------------------------------------
// Missing data is never hidden — it's turned into the most useful
// next inputs the athlete can supply, ranked by how much they'd
// sharpen the journey. Each item is gated on what's actually absent.
// ============================================================

import type { JourneySignals, MissingDataItem, SportJourneyConfig } from './types';

const COMPETITION_TARGET = 3; // rounds / matches before the prompt clears
const RETEST_TARGET = 1;

/** Return the open (still-useful) missing-data prompts, highest priority first. */
export function getMissingDataRecommendations(
  signals: JourneySignals,
  config: SportJourneyConfig,
): MissingDataItem[] {
  const ratingTypes = new Set(signals.ratings.map((r) => r.ratingType));
  const branchUploads = signals.activity.videoUploadsByBranch ?? {};

  const open = config.missingDataPrompts.filter((p) => {
    switch (p.kind) {
      case 'rating':
        return p.ratingType ? !ratingTypes.has(p.ratingType) : signals.ratings.length === 0;
      case 'video':
        return p.branchKey ? (branchUploads[p.branchKey] ?? 0) === 0 : signals.activity.videoUploads === 0;
      case 'competition_log':
        return signals.activity.loggedCompetitions < COMPETITION_TARGET;
      case 'benchmark':
        return signals.activity.retests < RETEST_TARGET;
      case 'profile':
        return p.profileField === 'typicalScore'
          ? signals.profile.typicalScore == null
          : true;
      case 'self_assessment':
        return signals.selfAssessments.length === 0;
      default:
        return true;
    }
  });

  return open
    .sort((a, b) => b.priority - a.priority)
    .map((p) => ({
      id: p.id,
      kind: p.kind,
      label: p.label,
      description: p.description,
      href: p.href,
      ctaLabel: p.ctaLabel,
      priority: p.priority,
    }));
}

/** A short, honest line about WHY confidence is what it is (provisional, etc). */
export function missingDataConfidenceNote(
  signals: JourneySignals,
  config: SportJourneyConfig,
): string {
  const open = getMissingDataRecommendations(signals, config);
  if (!open.length) return 'SwingVantage has a well-rounded picture of your game.';
  const top = open.slice(0, 3).map((p) => p.label.toLowerCase());
  return `Your Athletic Journey is still filling in. The fastest ways to sharpen it: ${top.join(', ')}.`;
}
