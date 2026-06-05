// ============================================================
// SwingVantage — Source Credibility Evaluator
// Scores incoming research sources before they can influence
// benchmark proposals.
//
// Credibility scoring is deterministic, not AI-generated.
// The LLM is only used for summarization AFTER a source
// passes the credibility threshold.
// ============================================================

import type { SourceType, SourceCredibility, ResearchCategory } from './types';

// ──────────────────────────────────────────────────────────────
// Base credibility scores by source type
// ──────────────────────────────────────────────────────────────

const SOURCE_TYPE_SCORES: Record<SourceType, number> = {
  peer_reviewed_research:       90,
  sports_biomechanics_journal:  88,
  motor_learning_research:      85,
  governing_body:               80,   // USGA, R&A, PGA, LPGA
  launch_monitor_manufacturer:  75,   // TrackMan, FlightScope, etc.
  coaching_organization:        70,
  tour_statistics:              70,
  equipment_research:           65,
  golf_instruction:             50,
  technology_documentation:     55,
  other:                        30,
};

// ──────────────────────────────────────────────────────────────
// Known trusted publishers (bonus points)
// ──────────────────────────────────────────────────────────────

const TRUSTED_PUBLISHERS: Record<string, number> = {
  'trackman':        10,
  'flightscope':     10,
  'foresight sports': 10,
  'full swing':       8,
  'usga':            12,
  'r&a':             12,
  'pga':              8,
  'lpga':             8,
  'journal of sports sciences': 10,
  'journal of biomechanics':    10,
  'sports biomechanics':        10,
  'international journal of golf science': 10,
  'garmin golf':      6,
  'skytrak':          6,
};

// ──────────────────────────────────────────────────────────────
// Staleness penalty (older sources scored lower)
// ──────────────────────────────────────────────────────────────

function stalenessPenalty(publicationDate: string | null): number {
  if (!publicationDate) return -5; // unknown date = small penalty
  const year = new Date(publicationDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  if (age <= 2) return 0;
  if (age <= 5) return -5;
  if (age <= 10) return -10;
  return -20;
}

// ──────────────────────────────────────────────────────────────
// URL safety check (basic heuristic — not a full crawl)
// ──────────────────────────────────────────────────────────────

export interface URLSafetyResult {
  is_likely_usable: boolean;
  notes: string;
}

export function checkURLSafety(url: string): URLSafetyResult {
  const lower = url.toLowerCase();

  // Paywalled academic sites — likely need subscription
  const paywalled = [
    'sciencedirect.com', 'springer.com', 'wiley.com',
    'tandfonline.com', 'jstor.org', 'pubmed.ncbi.nlm.nih.gov',
  ];
  if (paywalled.some((p) => lower.includes(p))) {
    return {
      is_likely_usable: false,
      notes: 'Academic paywall detected — retrieve abstract only and cite source.',
    };
  }

  // Known open sources
  if (lower.includes('trackman.com') || lower.includes('flightscope.com')) {
    return { is_likely_usable: true, notes: 'Known trusted source.' };
  }
  if (lower.includes('usga.org') || lower.includes('randa.org')) {
    return { is_likely_usable: true, notes: 'Governing body source.' };
  }

  return {
    is_likely_usable: true,
    notes: 'URL appears accessible. Verify terms of use before reproducing content.',
  };
}

// ──────────────────────────────────────────────────────────────
// Main scoring function
// ──────────────────────────────────────────────────────────────

export interface SourceScoreInput {
  source_type: SourceType;
  publisher: string;
  publication_date: string | null;
  has_author: boolean;
  url: string;
  key_claims_count: number;
  is_quantitative: boolean;         // has actual numbers/data
}

export interface SourceScoreResult {
  score: number;                    // 0–100
  credibility: SourceCredibility;
  url_safety: URLSafetyResult;
  breakdown: Record<string, number>;
  recommendation: 'accept' | 'review' | 'reject';
}

export function scoreSource(input: SourceScoreInput): SourceScoreResult {
  const breakdown: Record<string, number> = {};

  // Base score from type
  breakdown.source_type_base = SOURCE_TYPE_SCORES[input.source_type] ?? 30;

  // Publisher bonus
  const publisherLower = input.publisher.toLowerCase();
  let publisherBonus = 0;
  for (const [key, bonus] of Object.entries(TRUSTED_PUBLISHERS)) {
    if (publisherLower.includes(key)) {
      publisherBonus = bonus;
      break;
    }
  }
  breakdown.publisher_bonus = publisherBonus;

  // Author presence
  breakdown.author_bonus = input.has_author ? 3 : 0;

  // Staleness
  breakdown.staleness_penalty = stalenessPenalty(input.publication_date);

  // Quantitative data
  breakdown.quantitative_bonus = input.is_quantitative ? 5 : 0;

  // Claims quality
  breakdown.claims_bonus = Math.min(input.key_claims_count * 2, 6);

  const rawScore = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const score = Math.max(0, Math.min(100, rawScore));

  const credibility: SourceCredibility =
    score >= 75 ? 'high' :
    score >= 55 ? 'medium' :
    score >= 35 ? 'low' : 'unverified';

  const url_safety = checkURLSafety(input.url);

  const recommendation =
    !url_safety.is_likely_usable ? 'reject' :
    score >= 55 ? 'accept' :
    score >= 35 ? 'review' : 'reject';

  return { score, credibility, url_safety, breakdown, recommendation };
}

// ──────────────────────────────────────────────────────────────
// Source category mapper
// ──────────────────────────────────────────────────────────────

/** Infer which benchmark categories a source likely covers */
export function inferSourceCategories(
  title: string,
  summary: string,
): ResearchCategory[] {
  const text = `${title} ${summary}`.toLowerCase();
  const categories: ResearchCategory[] = [];

  const patterns: [RegExp, ResearchCategory][] = [
    [/face.to.path|face angle|club face/i, 'face_to_path'],
    [/club path|swing path|path angle/i, 'club_path'],
    [/attack angle|angle of attack/i, 'attack_angle'],
    [/dynamic loft|delivered loft/i, 'dynamic_loft'],
    [/spin loft/i, 'spin_loft'],
    [/smash factor|ball speed efficiency/i, 'smash_factor'],
    [/spin rate|backspin|sidespin/i, 'spin_rate'],
    [/launch angle|vertical launch/i, 'launch_angle'],
    [/carry distance|total distance/i, 'carry_distance'],
    [/ball speed/i, 'ball_speed'],
    [/club speed|swing speed|clubhead speed/i, 'club_speed'],
    [/lateral|dispersion|offline|accuracy/i, 'lateral_dispersion'],
    [/impact location|strike location|sweetspot|sweet spot/i, 'impact_location'],
    [/low point|divot|ground contact/i, 'low_point'],
    [/swing plane|shaft plane/i, 'swing_plane'],
    [/sequencing|kinematic|kinetic chain/i, 'sequencing'],
    [/weight transfer|pressure shift|weight shift/i, 'weight_transfer'],
    [/drill|practice|training exercise/i, 'drill_effectiveness'],
    [/practice method|blocked|random|differential learning/i, 'practice_methodology'],
    [/biomechanics|posture|setup|address|backswing|downswing/i, 'biomechanics_general'],
    [/equipment|fitting|shaft|loft|club fitting/i, 'equipment_fitting'],
    [/injury|prevention|safe|mobility|flexibility/i, 'injury_prevention'],
  ];

  for (const [pattern, category] of patterns) {
    if (pattern.test(text)) categories.push(category);
  }

  return [...new Set(categories)];
}
