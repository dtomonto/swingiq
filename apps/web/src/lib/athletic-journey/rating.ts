// ============================================================
// SwingVantage — Athletic Journey: rating / handicap alignment
// ------------------------------------------------------------
// Compares an OPTIONAL official rating (golf handicap, UTR, NTRP)
// against the athlete's performance-implied stage and explains, in
// plain language, whether their game profiles above, with, or below
// the rating. Ratings are never required and never presented as
// verified unless they actually are.
// ============================================================

import type {
  ClassificationCategory,
  PlayerRating,
  RatingAlignmentResult,
  RatingSource,
  RatingType,
  SportJourneyConfig,
} from './types';
import type { ClassificationResult } from './classify';
import { JOURNEY_THRESHOLDS as T } from './config/thresholds';
import { getStageByOrder } from './config';

export const RATING_TYPE_LABEL: Record<RatingType, string> = {
  golf_handicap: 'handicap',
  utr: 'UTR',
  ntrp: 'USTA/NTRP rating',
  dupr: 'DUPR',
};

export const RATING_SOURCE_LABEL: Record<RatingSource, string> = {
  self_reported: 'Self-reported',
  coach_entered: 'Coach-entered',
  imported: 'Imported',
  verified: 'Verified',
  estimated: 'Estimated by SwingVantage',
};

const CATEGORY_PHRASE: Record<ClassificationCategory, string> = {
  scoring: 'scoring',
  technique: 'ball-striking',
  consistency: 'consistency',
  finesse: 'short game and touch',
  movement: 'movement',
  tactical: 'decision-making',
  practice: 'practice volume',
  mental: 'pressure performance',
  competitive: 'competitive results',
};

/** Validate a rating value for a type; returns a clamped value or null. */
export function normalizeRatingValue(type: RatingType, value: number): number | null {
  if (!Number.isFinite(value)) return null;
  switch (type) {
    case 'golf_handicap':
      // USGA: plus handicaps to about -10, max index 54.0.
      return value >= -10 && value <= 54 ? value : null;
    case 'utr':
      return value >= 1 && value <= 16.5 ? value : null;
    case 'ntrp':
      return value >= 1.5 && value <= 7 ? value : null;
    case 'dupr':
      // DUPR: roughly 1.0 (new) to 8.0 (pro). Pickleball.
      return value >= 1 && value <= 8 ? value : null;
  }
}

/** Compare an optional rating against the performance-implied stage. */
export function compareRatingAlignment(
  rating: PlayerRating | null,
  classification: ClassificationResult,
  config: SportJourneyConfig,
): RatingAlignmentResult {
  const sportNoun = config.sport === 'golf' ? 'golf' : 'tennis';

  // Sport-aware label for the optional rating, used only in copy.
  const noRatingPhrase: Record<typeof config.sport | string, string> = {
    golf: 'a handicap',
    tennis: 'a UTR or USTA/NTRP rating',
    pickleball: 'a DUPR or self-rating',
    padel: 'a club or league rating',
  };

  if (!rating) {
    const ratingPhrase = noRatingPhrase[config.sport] ?? 'a rating';
    return {
      alignment: 'unknown',
      ratingType: null,
      ratingValue: null,
      ratingSource: null,
      ratingImpliedOrder: null,
      performanceImpliedOrder: classification.performanceImpliedOrder,
      explanation:
        config.sport === 'golf'
          ? 'You don\'t have a handicap on file yet. SwingVantage estimates your stage from scoring, swing, and practice data — add a handicap any time to sharpen it.'
          : `You don't have ${ratingPhrase} on file yet. SwingVantage estimates your stage from match logs, video analysis, and practice data — add one any time to sharpen it.`,
    };
  }

  const ratingImpliedOrder = config.ratingToStageOrder(rating);
  const perfOrder = classification.performanceImpliedOrder;
  const ratingStage = ratingImpliedOrder !== null ? getStageByOrder(config.sport, ratingImpliedOrder) : null;
  const sourceLabel = RATING_SOURCE_LABEL[rating.source];
  const typeLabel = RATING_TYPE_LABEL[rating.ratingType];

  // No performance signal to compare against yet.
  if (perfOrder === null || ratingImpliedOrder === null) {
    return {
      alignment: 'unknown',
      ratingType: rating.ratingType,
      ratingValue: rating.value,
      ratingSource: rating.source,
      ratingImpliedOrder,
      performanceImpliedOrder: perfOrder,
      explanation: ratingStage
        ? `Your ${sourceLabel.toLowerCase()} ${typeLabel} suggests ${ratingStage.code}: ${ratingStage.name}. Add a video or log your ${sportNoun === 'golf' ? 'rounds' : 'matches'} so SwingVantage can confirm whether your game profiles there.`
        : `Add a video or log your ${sportNoun === 'golf' ? 'rounds' : 'matches'} so SwingVantage can compare your game against your ${typeLabel}.`,
    };
  }

  const gap = perfOrder - ratingImpliedOrder;
  let alignment: RatingAlignmentResult['alignment'];
  if (Math.abs(gap) <= T.alignmentBand) alignment = 'aligned';
  else if (gap > 0) alignment = 'above';
  else alignment = 'below';

  // Identify the category most responsible for a mismatch.
  const drivingGap = [...classification.developmentGaps][0]?.category;
  const drivingStrength = [...classification.primaryStrengths][0]?.category;

  let explanation: string;
  if (alignment === 'aligned') {
    explanation = `Your ${typeLabel} and your performance data agree — both profile around ${ratingStage?.code}: ${ratingStage?.name}. Keep building evidence to raise confidence.`;
  } else if (alignment === 'below') {
    const cat = drivingGap ? CATEGORY_PHRASE[drivingGap] : 'consistency';
    explanation = `Your ${typeLabel} suggests ${ratingStage?.code}, but your performance data currently profiles a stage lower — your ${cat} is the main thing holding it back. That's your fastest path up.`;
  } else {
    const cat = drivingStrength ? CATEGORY_PHRASE[drivingStrength] : 'ball-striking';
    explanation = `Your ${cat} is ahead of your ${typeLabel} — the raw ability is there. Your next unlock is turning it into results, not adding more of it.`;
  }

  // Never imply a self-entered rating is verified.
  if (rating.source === 'self_reported') {
    explanation += ' (Self-reported — not independently verified.)';
  }

  return {
    alignment,
    ratingType: rating.ratingType,
    ratingValue: rating.value,
    ratingSource: rating.source,
    ratingImpliedOrder,
    performanceImpliedOrder: perfOrder,
    explanation,
  };
}
