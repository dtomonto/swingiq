// ============================================================
// SwingIQ — Multi-Sport Fault Ontology: Types
// ------------------------------------------------------------
// A single structured layer that sits ON TOP of the per-sport
// detection engines in @swingiq/core. Those engines decide WHAT
// is happening in a swing; the ontology decides what each fault
// MEANS — its root causes, the evidence to look for, which drill
// families fix it, how to retest it, and how to explain it to a
// parent, a coach, or an advanced athlete.
//
// PHILOSOPHY (matches the rest of the app):
//   - Never fabricate precision. Each entry carries an evidence
//     basis so the UI can label measured vs estimated vs inferred.
//   - Honest fallbacks. Any fault id without a curated entry gets
//     a clearly-marked `generated` entry rather than a fake one.
//   - One vocabulary used everywhere: analysis, retest, training,
//     coach summaries, parent summaries, next-best-session.
// ============================================================

import type { SportId } from '@swingiq/core';

/** Who a fault explanation is written for. */
export type FaultAudience = 'parent' | 'coach' | 'advanced';

/** Severity scale — mirrors core `SportIssueSeverity` so the two interop. */
export type FaultSeverity = 'critical' | 'notable' | 'minor' | 'watch';

/**
 * The basis for a claim about a fault. Lets the UI honestly distinguish
 * what was measured from what was estimated, inferred, or user-entered —
 * a hard requirement of the product (no fake biomechanical precision).
 */
export type EvidenceBasis = 'measured' | 'estimated' | 'ai_inferred' | 'user_entered';

/**
 * Everything the Retest Engine needs to turn a one-time finding into an
 * improvement loop. Lives on the fault so retest rules stay consistent
 * wherever a fault appears.
 */
export interface FaultRetestCriteria {
  /** Days a diagnosis of this fault stays "active" before a retest is due. */
  activeWindowDays: number;
  /** Plain-language: what to look at again to judge whether it changed. */
  whatToReassess: string;
  /** Same-condition requirements for a fair before/after comparison. */
  sameConditions: string[];
  /** Plain-language definition of a genuine improvement. */
  improvedWhen: string;
}

/** Role-aware explanations of the same fault. */
export interface FaultExplanations {
  /** Encouraging, simple, non-shaming — safe for a youth athlete's parent. */
  parent: string;
  /** Concise and practical — usable in a lesson or a session plan. */
  coach: string;
  /** Mechanically precise — for a competitive/advanced athlete. */
  advanced: string;
}

/**
 * The full ontology record for one fault. `id` matches a core
 * `SportIssueId` / `VisualIssueId` wherever possible so existing
 * detections map straight onto an entry.
 */
export interface FaultOntologyEntry {
  id: string;
  sports: SportId[];
  name: string;
  description: string;
  likelyRootCauses: string[];
  observableEvidence: string[];
  defaultSeverity: FaultSeverity;
  /**
   * Drill *families* (categories like "tempo & sequencing"), not specific
   * drills. Specific drills still come from the per-sport drill libraries;
   * this keeps the ontology stable and lets it point at the right family.
   */
  drillFamilies: string[];
  retest: FaultRetestCriteria;
  /** Conservative cautions; surfaced more strongly for youth/injury context. */
  safetyCautions: string[];
  explanations: FaultExplanations;
  /** How sure, in general, an estimated-vision detection of this fault is. */
  typicalEvidenceBasis: EvidenceBasis;
  /** True when this entry was synthesized by the fallback, not hand-curated. */
  generated?: boolean;
}

/** Options for resolving a fault when only partial info is known. */
export interface ResolveFaultOptions {
  /** A human label to seed the name when the id is unknown (e.g. AI output). */
  label?: string;
  /** Constrain the synthesized sports list when the sport is known. */
  sport?: SportId;
}
