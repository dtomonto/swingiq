// ============================================================
// SwingVantage — Agent: Trust / Honesty Linter — Types
// ------------------------------------------------------------
// The guardian of the "nothing misleading" standard. Scans
// user-facing copy for overclaiming, guarantees, medical claims,
// misleading "local-only" data claims, and measurement overclaims —
// while deliberately preserving honest, confident language and the
// TRUE video-privacy claims. Pure data shapes; no React, DOM, AI.
// ============================================================

export type LintCategory =
  | 'guarantee'
  | 'medical'
  | 'privacy_overclaim'
  | 'superlative'
  | 'measurement_overclaim'
  | 'hype';

export type LintSeverity = 'error' | 'warning' | 'info';

/** One issue found in a piece of copy. */
export interface LintFinding {
  ruleId: string;
  category: LintCategory;
  severity: LintSeverity;
  /** The exact offending substring. */
  match: string;
  /** Character offset of the match within the scanned text. */
  index: number;
  /** Plain-English explanation of why this is a problem. */
  message: string;
  /** A concrete, on-brand rewrite suggestion. */
  suggestion: string;
}

export interface LintOptions {
  /** Rule ids to skip (e.g. a reviewed, intentional exception). */
  ignore?: string[];
  /** Drop findings below this severity. Default: keep all. */
  minSeverity?: LintSeverity;
}

/** Findings for one named item (file, key, component). */
export interface LintItemResult {
  id: string;
  findings: LintFinding[];
}

/** Aggregate report across many items — convenient for CI. */
export interface LintReport {
  items: LintItemResult[];
  totals: { errors: number; warnings: number; infos: number };
  /** True when any 'error' finding exists — fail the build on this. */
  hasBlocking: boolean;
}
