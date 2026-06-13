// ============================================================
// SwingVantage — Claims Registry (governance source of truth)
//
// Every public, factual claim about how the intelligence engine works lives
// here with an explicit EVIDENCE STATUS, an internal basis, the surfaces it is
// approved for, and a last-reviewed date. The point is honesty governance:
//
//   • A claim is only safe to render publicly when its evidenceStatus is
//     'verified' or 'partially_verified'. Use `isPubliclyUsable(id)`.
//   • Unverifiable marketing claims (e.g. "millions of data points",
//     "proprietary technology") are kept here as 'needs_review' / 'retired'
//     so they are NEVER hardcoded as public facts — they are governed, visible,
//     and waiting on founder verification instead of leaking into copy.
//
// This mirrors the DataSource honesty pattern (lib/recruiting/types.ts): a
// claim, like a metric, must declare where its confidence comes from.
//
// To surface a claim's status in the UI, use <ClaimStatusBadge claimId="…" />
// (components/authority/ClaimStatusBadge.tsx).
// ============================================================

export type ClaimEvidenceStatus =
  | 'verified' // Directly backed by shipped code / data model / config.
  | 'partially_verified' // True in part or for a configured mode; phrase carefully.
  | 'needs_review' // Plausible but not yet confirmed from the codebase — founder review.
  | 'retired'; // Do not use publicly. Kept for governance memory.

export type ClaimCategory =
  | 'engine' // How the deterministic / heuristic engine works.
  | 'ai' // Where and how AI is used.
  | 'confidence' // Confidence / evidence labelling.
  | 'retest' // The retest learning loop.
  | 'privacy' // Data handling & privacy posture.
  | 'positioning'; // Brand / category positioning language.

export type ClaimRiskLevel = 'low' | 'medium' | 'high';

export interface ClaimRecord {
  /** Stable id used by <ClaimStatusBadge> and analytics. */
  id: string;
  /** The claim, phrased exactly as it is (or would be) shown publicly. */
  claim: string;
  category: ClaimCategory;
  evidenceStatus: ClaimEvidenceStatus;
  /** Internal basis: the file/behavior/config that supports (or refutes) it. */
  basis: string;
  /** Site-relative paths / surfaces this claim is approved to appear on. */
  approvedLocations: string[];
  /** ISO date (YYYY-MM-DD) the claim was last reviewed. */
  lastReviewed: string;
  /** Accountable owner (role, not a person — keep PII out of the repo). */
  owner: string;
  /** How damaging an over-claim here would be to trust. */
  riskLevel: ClaimRiskLevel;
  /** Optional note for reviewers (e.g. how to phrase conservatively). */
  note?: string;
}

const REVIEWED = '2026-06-13';

export const CLAIMS_REGISTRY: readonly ClaimRecord[] = [
  {
    id: 'deterministic-engine',
    claim:
      'SwingVantage runs a deterministic, rules-based diagnostic engine that produces the same finding from the same inputs.',
    category: 'engine',
    evidenceStatus: 'verified',
    basis:
      'packages/core/src/diagnostic/{engine,rules}.ts — configuration-driven rules with explicit target windows; same shot data yields the same primary diagnosis.',
    approvedLocations: ['/deterministic-intelligence', '/methodology', '/trust', '/resources/what-is-heuristic-data'],
    lastReviewed: REVIEWED,
    owner: 'Founder / Product',
    riskLevel: 'low',
  },
  {
    id: 'heuristics-first',
    claim: 'Heuristics first. AI when needed.',
    category: 'engine',
    evidenceStatus: 'verified',
    basis:
      'apps/web/src/lib/intelligence/{router,heuristic}.ts + docs/intelligence-routing.md — a deterministic heuristic estimate is the floor every route falls back to; AI is selected per request (tier/video/budget/provider health).',
    approvedLocations: ['/deterministic-intelligence', '/resources/ai-in-sports-performance', '/methodology'],
    lastReviewed: REVIEWED,
    owner: 'Founder / Engineering',
    riskLevel: 'low',
  },
  {
    id: 'confidence-scoring',
    claim:
      'Every finding carries a confidence label calibrated by how much data was available and how consistently the pattern appears.',
    category: 'confidence',
    evidenceStatus: 'verified',
    basis:
      'packages/core/src/diagnostic/engine.ts — sample-size, dispersion and quality-completeness factors scale a 0–100 confidence; surfaced in the report UI (DiagnoseContent.tsx) and guarded by check-honesty-copy.mjs.',
    approvedLocations: ['/deterministic-intelligence', '/methodology', '/trust', '/trust/accuracy-and-limitations'],
    lastReviewed: REVIEWED,
    owner: 'Founder / Product',
    riskLevel: 'medium',
  },
  {
    id: 'evidence-labels',
    claim:
      'SwingVantage distinguishes what it measured from what it estimated, and labels every finding with the data behind it.',
    category: 'confidence',
    evidenceStatus: 'verified',
    basis:
      'apps/web/src/app/(marketing)/methodology — measured vs. estimated framing; DataSource labelling convention (lib/recruiting/types.ts).',
    approvedLocations: ['/methodology', '/trust/accuracy-and-limitations', '/deterministic-intelligence'],
    lastReviewed: REVIEWED,
    owner: 'Founder / Product',
    riskLevel: 'medium',
  },
  {
    id: 'retest-informed',
    claim:
      'SwingVantage uses a retest loop: each rule defines a retest protocol, and retest outcomes inform future recommendations.',
    category: 'retest',
    evidenceStatus: 'verified',
    basis:
      'packages/core/src/diagnostic/rules.ts — each rule carries a retest protocol (shot count, focus metrics, success criteria); RETEST_COMPLETED analytics closes the loop.',
    approvedLocations: ['/deterministic-intelligence', '/methodology', '/resources/what-is-heuristic-data'],
    lastReviewed: REVIEWED,
    owner: 'Founder / Product',
    riskLevel: 'low',
  },
  {
    id: 'ai-vision-frames',
    claim:
      'Optional AI video analysis reviews a small set of downscaled still frames with a vision model — qualitative frame review, not frame-by-frame biomechanical measurement.',
    category: 'ai',
    evidenceStatus: 'verified',
    basis: 'public/llms.txt + intelligence service; explicitly NOT pose/landmark capture.',
    approvedLocations: ['/resources/ai-in-sports-performance', '/trust/accuracy-and-limitations', '/methodology'],
    lastReviewed: REVIEWED,
    owner: 'Founder / Engineering',
    riskLevel: 'high',
    note: 'High risk: never describe as real-time pose tracking or lab-grade measurement.',
  },
  {
    id: 'local-first-privacy',
    claim:
      'SwingVantage is local-first: by default your data stays in your browser and the original video never leaves your device.',
    category: 'privacy',
    evidenceStatus: 'verified',
    basis: 'public/llms.txt + trust page; only downscaled frames are sent when the optional AI vision feature runs.',
    approvedLocations: ['/trust', '/trust/accuracy-and-limitations', '/deterministic-intelligence', '/resources/ai-in-sports-performance'],
    lastReviewed: REVIEWED,
    owner: 'Founder / Engineering',
    riskLevel: 'medium',
  },
  {
    id: 'sports-intelligence-platform',
    claim:
      'SwingVantage organizes sport-specific patterns, player-profile inputs, session history, video signals, and retest outcomes into practical improvement recommendations.',
    category: 'positioning',
    evidenceStatus: 'partially_verified',
    basis:
      'Describes the intended system shape (diagnostic engine + profile + sessions + heuristic/AI routing). Conservative phrasing — avoids unverifiable scale claims.',
    approvedLocations: ['/deterministic-intelligence', '/resources/ai-in-sports-performance', '/methodology'],
    lastReviewed: REVIEWED,
    owner: 'Founder / Product',
    riskLevel: 'medium',
    note: 'Approved default positioning line. Use instead of any volume/scale claim.',
  },
  {
    id: 'computer-vision-analysis',
    claim: 'Computer-vision swing analysis.',
    category: 'ai',
    evidenceStatus: 'needs_review',
    basis:
      'Current optional AI vision is qualitative still-frame review, not full computer-vision pipelines. Phrase as "AI vision review of sampled frames", not "computer vision".',
    approvedLocations: [],
    lastReviewed: REVIEWED,
    owner: 'Founder / Engineering',
    riskLevel: 'high',
    note: 'Do not present "computer vision" as a shipped capability until verified.',
  },
  {
    id: 'proprietary-technology',
    claim: 'Proprietary technology.',
    category: 'positioning',
    evidenceStatus: 'needs_review',
    basis: 'Generic, unverifiable marketing language. Prefer concrete, demonstrable descriptions of the engine.',
    approvedLocations: [],
    lastReviewed: REVIEWED,
    owner: 'Founder',
    riskLevel: 'low',
    note: 'Replace with specific capability descriptions; avoid the bare phrase.',
  },
  {
    id: 'millions-of-data-points',
    claim: 'Built on millions of data points.',
    category: 'positioning',
    evidenceStatus: 'retired',
    basis:
      'No verifiable dataset volume in the codebase. Retired to prevent fabricated-scale claims (CLAUDE.md: never fabricate data).',
    approvedLocations: [],
    lastReviewed: REVIEWED,
    owner: 'Founder',
    riskLevel: 'high',
    note: 'Never use publicly. Use the approved sports-intelligence-platform line instead.',
  },
] as const;

/** Look up a single claim by id. */
export function getClaim(id: string): ClaimRecord | undefined {
  return CLAIMS_REGISTRY.find((c) => c.id === id);
}

/** Claims with a given evidence status. */
export function claimsByStatus(status: ClaimEvidenceStatus): ClaimRecord[] {
  return CLAIMS_REGISTRY.filter((c) => c.evidenceStatus === status);
}

/**
 * True when a claim is safe to render as a public fact. Only 'verified' and
 * 'partially_verified' qualify — 'needs_review' / 'retired' must never appear
 * as hardcoded public copy.
 */
export function isPubliclyUsable(id: string): boolean {
  const c = getClaim(id);
  return c ? c.evidenceStatus === 'verified' || c.evidenceStatus === 'partially_verified' : false;
}
