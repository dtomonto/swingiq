// ============================================================
// SwingVantage — Technology Claims & Copy Config
// ------------------------------------------------------------
// SINGLE source of truth for how SwingVantage describes its
// intelligence technology to the public: Athlete General
// Intelligence (AGI), heuristic intelligence, AI in sports, the
// data-scale claim, and the trust disclaimer.
//
// WHY THIS FILE EXISTS (trust + legal):
//   Marketing copy about "AI" and "millions of data points" is the
//   easiest place for an honest product to drift into unsupported
//   claims. Centralizing the language here means:
//     • one place to audit and soften wording for legal/trust review,
//     • no scattered, contradictory descriptions across pages,
//     • a hard switch (`DATA_SCALE_VERIFIED`) that keeps us in safe,
//       defensible language until real, verifiable scale exists.
//
//   This mirrors the rest of the codebase's "honest by default"
//   posture (see lib/learn/types.ts, /methodology, DataSource labels).
//
// BRANDING NOTE:
//   The shipped product brands the cross-sport engine as
//   **Athlete General Intelligence (AGI)** — see
//   app/(marketing)/athlete-general-intelligence/page.tsx, which
//   deliberately explains the acronym. We reuse that exact term here
//   instead of inventing a competing name, so every surface agrees.
// ============================================================

/**
 * Flip to `true` ONLY when there is verified, defensible evidence in the
 * product (e.g. a real, auditable count of analyzed sessions/data points)
 * that substantiates a "millions of data points" claim. Until then we stay
 * in safe, capability-framed language ("designed to…", "built to…") that
 * describes intent and architecture, not unproven scale.
 *
 * As of this writing there is NO substantiated millions-scale claim in the
 * codebase, so this is `false` and the public copy uses the safe variant.
 */
export const DATA_SCALE_VERIFIED = false as boolean;

export interface TechnologyClaims {
  /** Proprietary cross-sport engine — the headline narrative. */
  athleteGeneralIntelligence: {
    /** Short product name, as branded across the app. */
    name: string;
    /** Acronym used in dense UI. */
    abbreviation: string;
    /** One-line description for cards, meta, and tooltips. */
    short: string;
    /** Full, defensible description for hero/body copy. */
    full: string;
  };
  /** Heuristic / structured rules-based intelligence. */
  heuristicIntelligence: {
    short: string;
    full: string;
    /** Plain-English explainer used on the heuristic education page. */
    plainEnglish: string;
  };
  /** AI in sports performance. */
  aiSportsPerformance: {
    short: string;
    full: string;
  };
  /**
   * The data-scale claim — resolved through the verification switch. Read this
   * (never hard-code "millions") anywhere you describe how much data the engine
   * learns from.
   */
  dataScaleClaim: string;
  /** Optional "millions of data points" phrasing — only safe when verified. */
  millionsDataPointsClaim: string;
  /** Site-wide trust disclaimer for intelligence surfaces. */
  trustDisclaimer: string;
}

/** Safe vs. verified phrasing for the data-scale claim. */
const DATA_SCALE_SAFE = 'large-scale sport-specific performance signals';
const DATA_SCALE_VERIFIED_PHRASE = 'millions of sport-specific data points';

/**
 * The single resolved data-scale phrase. Defaults to the safe, capability-framed
 * language; only becomes the "millions" phrasing when `DATA_SCALE_VERIFIED` is
 * flipped on with real evidence.
 */
export const dataScaleClaim: string = DATA_SCALE_VERIFIED
  ? DATA_SCALE_VERIFIED_PHRASE
  : DATA_SCALE_SAFE;

export const technologyClaims: TechnologyClaims = {
  athleteGeneralIntelligence: {
    name: 'Athlete General Intelligence',
    abbreviation: 'AGI',
    short:
      'SwingVantage’s proprietary engine that organizes scattered athletic data into one practical improvement plan.',
    full:
      'SwingVantage’s Athlete General Intelligence is designed to organize and apply ' +
      `${DATA_SCALE_SAFE}, including athlete profiles, sport-specific movement patterns, ` +
      'video-analysis observations, session history, drill feedback, self-reported symptoms, ' +
      'performance outcomes, and retest results — turning fragmented data into a clear next best action.',
  },
  heuristicIntelligence: {
    short:
      'Structured, rules-based performance logic that produces fast, useful guidance from known patterns.',
    full:
      'Heuristic intelligence is structured, rules-based performance logic. It uses known patterns, ' +
      'athlete inputs, symptoms, movement clues, historical results, and sport-specific rules to produce ' +
      'useful guidance quickly — a transparent, auditable first pass before deeper AI analysis is needed.',
    plainEnglish:
      'Heuristic data is the structured performance logic that helps SwingVantage make fast, useful ' +
      'recommendations before deeper AI analysis is needed. It looks at patterns like your sport, skill ' +
      'level, swing miss, ball flight, video clues, session history, and previous retest outcomes, then ' +
      'applies proven rules to identify the most likely next-best action.',
  },
  aiSportsPerformance: {
    short:
      'Technology that connects video, profile data, session history, and performance signals into personalized improvement guidance.',
    full:
      'AI in sports performance is software that analyzes patterns, context, and data to produce useful ' +
      'recommendations. Its real value is not “AI giving tips” — it is putting fragmented data (video, ' +
      'movement signals, athlete profiles, goals, session history, drill results, and retest outcomes) ' +
      'together into a personalized improvement system.',
  },
  dataScaleClaim,
  // Only surfaces the "millions" phrasing when verified; otherwise mirrors the
  // safe phrase so accidental use can never overstate scale.
  millionsDataPointsClaim: DATA_SCALE_VERIFIED ? DATA_SCALE_VERIFIED_PHRASE : DATA_SCALE_SAFE,
  trustDisclaimer:
    'SwingVantage does not treat heuristic output as a final diagnosis. It is a structured estimate ' +
    'designed to guide your next best action. Deeper AI analysis, video review, retesting, and session ' +
    'history can improve confidence over time. Nothing here is medical, injury, or guaranteed-result advice.',
};

export default technologyClaims;
