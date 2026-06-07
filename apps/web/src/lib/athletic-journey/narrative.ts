// ============================================================
// SwingVantage — Athletic Journey: structured narrative layer
// ------------------------------------------------------------
// Converts the computed journey into a structured, plain-English
// development explanation. This deterministic builder IS the source
// of truth; an optional LLM may only RE-WORD it (see the API route),
// and its output must pass validateNarrative or we keep the base.
//
// Safe by construction: never guarantees outcomes, never invents a
// rating, never presents self-reported data as verified, never shames.
// ============================================================

import type {
  ConfidenceLevel,
  EvidenceItem,
  JourneyNarrative,
  MissingDataItem,
  MomentumResult,
  PracticePrescription,
  RatingAlignmentResult,
  StageDefinition,
  UnlockCriterion,
} from './types';

export interface NarrativeInput {
  sportNoun: string; // 'golf' | 'tennis'
  currentStage: StageDefinition;
  nextStage: StageDefinition | null;
  confidence: ConfidenceLevel;
  primaryStrengths: EvidenceItem[];
  developmentGaps: EvidenceItem[];
  contradictoryEvidence: EvidenceItem[];
  ratingAlignment: RatingAlignmentResult;
  momentum: MomentumResult;
  missingData: MissingDataItem[];
  unlockRequirements: UnlockCriterion[];
  prescription: PracticePrescription;
}

const CONFIDENCE_PHRASE: Record<ConfidenceLevel, string> = {
  high: 'a high-confidence read',
  medium: 'a solid read',
  low: 'an early read',
  provisional: 'a provisional read',
};

/** Build the deterministic, honest journey narrative. */
export function buildJourneyNarrative(input: NarrativeInput): JourneyNarrative {
  const {
    currentStage,
    nextStage,
    confidence,
    primaryStrengths,
    developmentGaps,
    contradictoryEvidence,
    ratingAlignment,
    missingData,
    unlockRequirements,
    prescription,
  } = input;

  const stageSummary =
    `You're currently ${currentStage.code}: ${currentStage.name} — ${CONFIDENCE_PHRASE[confidence]} from your blended data. ` +
    currentStage.description;

  const whyHere: string[] = [];
  if (primaryStrengths.length) {
    whyHere.push(`Your strengths: ${primaryStrengths.map((s) => s.text).join(' ')}`);
  }
  if (developmentGaps.length) {
    whyHere.push(`What's holding you back: ${developmentGaps.map((g) => g.text).join(' ')}`);
  }
  if (!primaryStrengths.length && !developmentGaps.length) {
    whyHere.push('This stage is based mostly on your profile so far — add a video or log play to ground it in performance data.');
  }
  whyHere.push(ratingAlignment.explanation);

  const strengths = primaryStrengths.length
    ? primaryStrengths.map((s) => s.text)
    : ['Not enough performance data yet to name a clear strength.'];

  const developmentGapsText = developmentGaps.length
    ? developmentGaps.map((g) => g.text)
    : ['No clear weakness has surfaced yet — more data will reveal your priority.'];

  const nextStageFocus = nextStage
    ? unlockRequirements.slice(0, 5).map((u) => u.label)
    : ['You\'re at the top of the modeled pathway — focus shifts to sustaining results across events.'];

  const coachNote = buildCoachNote(input);

  const missingDataRequests = missingData.slice(0, 4).map((m) => m.label);

  const recommendedNextActions = [
    prescription.blocks[0] ? `Start your ${prescription.blocks[0].title.toLowerCase()}: ${prescription.blocks[0].drills[0]}` : null,
    prescription.uploadRequest ? `Upload next: ${prescription.uploadRequest}` : null,
    missingData[0] ? missingData[0].label : null,
    nextStage ? `Target ${nextStage.code}: ${nextStage.name}` : null,
  ].filter((x): x is string => Boolean(x)).slice(0, 4);

  return {
    stageSummary,
    whyHere,
    strengths,
    developmentGaps: developmentGapsText,
    contradictoryEvidence: contradictoryEvidence.map((c) => c.text),
    nextStageFocus,
    ratingAlignment: ratingAlignment.explanation,
    coachNote,
    missingDataRequests,
    recommendedNextActions,
    enhanced: false,
  };
}

function buildCoachNote(input: NarrativeInput): string {
  const { currentStage, nextStage, developmentGaps, primaryStrengths, momentum, prescription } = input;
  const parts: string[] = [];

  if (primaryStrengths.length && developmentGaps.length) {
    parts.push(
      `Your data shows you're not limited by ${describeCategory(primaryStrengths[0])} — your biggest opportunity is ${describeCategory(developmentGaps[0])}.`,
    );
  } else if (developmentGaps.length) {
    parts.push(`Your clearest opportunity right now is ${describeCategory(developmentGaps[0])}.`);
  } else {
    parts.push(`You're building the foundation of ${currentStage.name}.`);
  }

  if (prescription.blocks[0]) {
    parts.push(`Put your reps into your ${prescription.blocks[0].title.toLowerCase()} this week.`);
  }
  if (nextStage) {
    parts.push(`Clear the unlocks and you'll move into ${nextStage.name}.`);
  }

  // Momentum framing — honest about what it measures.
  if (momentum.band === 'inactive' || momentum.band === 'low') {
    parts.push('Your momentum is low right now, but one short session restarts it — momentum measures activity, not talent.');
  } else if (momentum.band === 'accelerated' || momentum.band === 'strong') {
    parts.push('Your momentum is strong — keep the cadence and the gains compound.');
  }

  return parts.join(' ');
}

function describeCategory(item: EvidenceItem): string {
  const map: Record<string, string> = {
    scoring: 'turning ability into scores',
    technique: 'your ball-striking',
    consistency: 'consistency',
    finesse: 'your short game and touch',
    movement: 'your movement',
    tactical: 'your decision-making',
    practice: 'practice discipline',
    mental: 'pressure performance',
    competitive: 'competitive exposure',
  };
  return map[item.category] ?? 'your development';
}

// ── Validation for any optional LLM re-word ───────────────────

// Outcome guarantees / hype the re-word must never introduce. (The base
// narrative never claims verification; the route's system prompt also bars it.)
const FORBIDDEN = [
  'guarantee',
  'guaranteed',
  'will become a pro',
  'will go pro',
  'pro-ready',
  "can't-miss",
  'cannot miss',
  'next (federer|nadal|woods|mcilroy)',
  'definitely will',
  'scholarship',
];

/** Guard an LLM-reworded narrative: must keep structure & avoid hype/claims. */
export function validateNarrative(base: JourneyNarrative, candidate: unknown): JourneyNarrative {
  if (!candidate || typeof candidate !== 'object') return base;
  const c = candidate as Partial<JourneyNarrative>;

  // Required string fields must remain non-empty strings.
  const stringFields: Array<keyof JourneyNarrative> = ['stageSummary', 'ratingAlignment', 'coachNote'];
  for (const f of stringFields) {
    const v = c[f];
    if (typeof v !== 'string' || v.trim().length < 3) return base;
  }
  // Array fields must remain string arrays.
  const arrayFields: Array<keyof JourneyNarrative> = [
    'whyHere', 'strengths', 'developmentGaps', 'contradictoryEvidence',
    'nextStageFocus', 'missingDataRequests', 'recommendedNextActions',
  ];
  for (const f of arrayFields) {
    const v = c[f];
    if (v !== undefined && (!Array.isArray(v) || v.some((x) => typeof x !== 'string'))) return base;
  }

  // Forbidden-claim scan across the whole candidate.
  const blob = JSON.stringify(candidate).toLowerCase();
  for (const pat of FORBIDDEN) {
    if (new RegExp(pat).test(blob)) return base;
  }

  return {
    stageSummary: c.stageSummary ?? base.stageSummary,
    whyHere: c.whyHere ?? base.whyHere,
    strengths: c.strengths ?? base.strengths,
    developmentGaps: c.developmentGaps ?? base.developmentGaps,
    contradictoryEvidence: c.contradictoryEvidence ?? base.contradictoryEvidence,
    nextStageFocus: c.nextStageFocus ?? base.nextStageFocus,
    ratingAlignment: c.ratingAlignment ?? base.ratingAlignment,
    coachNote: c.coachNote ?? base.coachNote,
    missingDataRequests: c.missingDataRequests ?? base.missingDataRequests,
    recommendedNextActions: c.recommendedNextActions ?? base.recommendedNextActions,
    enhanced: true,
  };
}
