// ============================================================
// Claude Handoff — shared shape (isomorphic, zero runtime deps)
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Every admin surface raises alerts, findings and recommendations in its
//   own shape. `ClaudeFixInput` is the ONE normalized shape they all collapse
//   into so we can render a single "Copy for Claude Code" affordance and turn
//   any of them into a clean, paste-ready fix prompt (see ./prompt.ts).
//
//   Pure types only — safe to import in a server component, a client
//   component or a test. The per-source normalizers live in ./adapters.ts.
// ============================================================

/** One supporting context line, e.g. "Severity: high" or "Page: /golf/fix-slice". */
export interface ClaudeFixField {
  label: string;
  value: string;
}

/** A single issue, normalized so it can be handed to Claude Code as a fix task. */
export interface ClaudeFixInput {
  /** Short human title, e.g. "Duplicate meta description on 2 pages". */
  title: string;
  /** Where it came from, e.g. "Link Intelligence · link audit". */
  source: string;
  /** Severity label as the engine reported it (passed through, never invented). */
  severity?: string;
  /** The interpreted problem sentence. */
  problem?: string;
  /** The engine's recommended fix, if it offered one. */
  recommendation?: string;
  /** Concrete affected files / URLs / items to point Claude Code at. */
  affected?: string[];
  /** Ordered remediation steps the engine already worked out. */
  steps?: string[];
  /** Extra label/value context (metric, status, ids, evidence …). */
  fields?: ClaudeFixField[];
  /** Deep link back to the admin surface (reference only). */
  href?: string;
}
