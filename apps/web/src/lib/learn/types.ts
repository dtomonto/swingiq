// ============================================================
// SwingVantage — Swing Education System: Types
// ------------------------------------------------------------
// A scalable, code-defined content model for the public learning
// hub. Two kinds of page share ONE rich shape so they can use one
// renderer, one SEO pipeline, and one sitemap gate:
//
//   - `concept`     → flagship deep-dive pages (grip, weight
//                     distribution, swing plane) at /learn/<slug>.
//   - `data-point`  → one page per meaningful analysis data point
//                     at /learn/data-points/<slug>.
//
// PHILOSOPHY (matches the rest of the app):
//   - Reuse, don't reinvent: relationships point at the existing
//     fault ontology (lib/faults) and coach styles (coach-mix) by id.
//   - Honest by default: every entry declares the typical
//     `evidenceBasis` so pages can say measured vs inferred.
//   - Admin-gateable: only `status: 'published'` entries get a
//     public page + a sitemap row. Drafts stay dark.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { EvidenceBasis } from '@/lib/faults';

/** Flagship concept vs. per-data-point page. */
export type LearnKind = 'concept' | 'data-point';

/** Publication gate. Only `published` entries are crawlable / in the sitemap. */
export type LearnStatus = 'published' | 'review' | 'draft';

/** High-level grouping used for filtering + the data-point index. */
export type LearnCategory =
  | 'setup'
  | 'motion'
  | 'sequencing'
  | 'contact'
  | 'release'
  | 'result'
  | 'mind';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LearnFaq {
  question: string;
  answer: string;
}

/** A single original drill. Specific drills, not coach-copied scripts. */
export interface LearnDrill {
  name: string;
  /** What it trains. */
  goal: string;
  /** How to do it (original phrasing). */
  how: string;
  /** The feel to chase. */
  feel?: string;
  /** Dosage, e.g. "3 sets of 8". */
  reps?: string;
  /** e.g. "None", "Alignment stick", "Phone on a tripod". */
  equipment?: string;
  level?: DifficultyLevel;
}

/** An at-home self-check the user can run without SwingVantage. */
export interface LearnCheck {
  label: string;
  detail: string;
}

/** A generic titled prose block (troubleshooting items, extra deep sections). */
export interface LearnSection {
  heading: string;
  body: string;
}

/** How this concept changes from sport to sport. */
export interface SportVariation {
  sport: SportId;
  note: string;
}

/**
 * One learning page. Fields map to the spec's suggested content model but
 * reuse existing types (SportId, EvidenceBasis) and reference relationships
 * by id rather than duplicating other systems' data.
 */
export interface LearnEntry {
  // ── identity ──
  id: string;
  slug: string;
  kind: LearnKind;
  title: string;
  category: LearnCategory;
  sports: SportId[];
  difficultyLevels: DifficultyLevel[];
  status: LearnStatus;
  /** Flagship concept pages get the deepest template + top nav placement. */
  flagship?: boolean;

  // ── explanations ──
  /** One/two sentences — used in cards, the index, and meta description fallback. */
  descriptionShort: string;
  explanationBeginner: string;
  explanationAdvanced: string;
  whyItMatters: string;

  // ── detection + honesty ──
  /** How SwingVantage measures or infers this. */
  detectionLogic: string;
  /** Typical evidence basis (measured / estimated / ai_inferred / user_entered). */
  evidenceBasis: EvidenceBasis;
  confidenceExplanation: string;

  // ── patterns ──
  goodPattern: string;
  poorPatterns: string[];
  commonCauses: string[];
  /** What the user may feel during the swing. */
  symptoms: string[];
  /** What the ball flight / contact / result may look like. */
  ballFlightOrResult?: string[];

  // ── sport-specific ──
  sportVariations?: SportVariation[];

  // ── practice ──
  selfChecks?: LearnCheck[];
  videoUploadTips?: string[];
  drills: LearnDrill[];
  /** A simple ordered plan ("one plan"). */
  practicePlan: string[];
  /** Beginner → advanced progression. */
  progressionLadder?: string[];
  troubleshooting?: LearnSection[];

  // ── relationships (resolved at render via the registry) ──
  /** Fault ids in lib/faults ontology that this page relates to. */
  relatedFaultIds?: string[];
  /**
   * Fault ids this page is the *canonical* explainer for (it is ABOUT this
   * fault). Used to wire a detected fault → its definitive learn page, so a
   * page that merely mentions a fault never wins over the one that explains it.
   */
  canonicalForFaultIds?: string[];
  /** Slugs of other data-point pages. */
  relatedDataPointSlugs?: string[];
  /** Slugs of flagship concept pages. */
  relatedConceptSlugs?: string[];
  /** Coach-mix user-style ids (default | feel | technical | data | precision | blended). */
  relatedCoachStyleIds?: string[];
  /** Drill family labels from the fault ontology. */
  drillFamilies?: string[];

  /** Extra deep prose sections (mostly for flagship concept pages). */
  extraSections?: LearnSection[];

  // ── SEO ──
  seoTitle: string;
  seoDescription: string;
  faqs: LearnFaq[];

  // ── governance (sourceNotes is admin-only; never rendered publicly) ──
  lastReviewedAt: string;
  sourceNotes?: string;
}
