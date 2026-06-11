// ============================================================
// SwingVantage Admin — Layman summarizer (pure, keyless)
// ------------------------------------------------------------
// Turns a conventional-commit message ("feat(agi): wire …") into a
// plain-English, non-technical one-liner for the admin "What changed"
// scroller. Deterministic + keyless (no LLM, no spend, no fabrication) —
// it only rephrases what the commit already says. An optional LLM polish
// can layer on later behind a capability flag; this is the honest baseline.
// ============================================================

export interface ParsedCommit {
  type: string;
  scope?: string;
  subject: string;
}

/** Conventional-commit type → friendly lead-in. */
const LEAD: Record<string, string> = {
  feat: 'New',
  fix: 'Fixed',
  perf: 'Made faster',
  revert: 'Rolled back',
  docs: 'Documentation',
  style: 'Polish',
  refactor: 'Behind the scenes',
  test: 'Behind the scenes',
  build: 'Behind the scenes',
  ci: 'Behind the scenes',
  chore: 'Behind the scenes',
};

/** Parse a "type(scope): subject" message. Falls back gracefully. */
export function parseConventional(message: string): ParsedCommit {
  const m = /^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/.exec(message.trim());
  if (!m) return { type: 'other', subject: message.trim() };
  return { type: m[1].toLowerCase(), scope: m[2], subject: m[3] };
}

/**
 * Plain-English, non-technical summary of one change. Never fabricates —
 * it cleans and reframes the commit's own words.
 */
export function laymanizeCommit(c: ParsedCommit): string {
  const lead = LEAD[c.type] ?? 'Update';
  // Drop trailing PR/issue refs and make it read like a sentence.
  let s = c.subject.replace(/\s*\(#\d+\)\s*$/, '').trim();
  if (s) s = s.charAt(0).toUpperCase() + s.slice(1);
  const area = c.scope ? ` — ${c.scope.replace(/[-_]/g, ' ')}` : '';
  return `${lead}: ${s}${area}`;
}
