// ============================================================
// SwingVantage — Agent: Trust / Honesty Linter — Engine
// ------------------------------------------------------------
// Scans copy sentence-by-sentence and returns explainable findings.
// Pure, deterministic, never throws. Designed to run anywhere — a
// component, a test, or a CI gate over a bundle of strings.
// ============================================================

import { CONTEXT_GATES, RULES } from './rules';
import type {
  LintFinding,
  LintItemResult,
  LintOptions,
  LintReport,
  LintSeverity,
} from './types';

const SEVERITY_RANK: Record<LintSeverity, number> = { info: 0, warning: 1, error: 2 };

/** Split text into sentences with their start offsets (keeps indices honest). */
function sentences(text: string): Array<{ text: string; start: number }> {
  const out: Array<{ text: string; start: number }> = [];
  const re = /[^.!?\n]+[.!?]*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[0].trim()) out.push({ text: m[0], start: m.index });
    if (m.index === re.lastIndex) re.lastIndex += 1; // guard against zero-width
  }
  return out.length ? out : [{ text, start: 0 }];
}

/**
 * Lint a single piece of copy. Returns findings ordered by position. Context-
 * gated rules (medical, measurement) only fire when their surrounding context
 * is present, so honest copy passes clean.
 */
export function lintCopy(text: string, opts: LintOptions = {}): LintFinding[] {
  if (!text || !text.trim()) return [];
  const ignore = new Set(opts.ignore ?? []);
  const minRank = opts.minSeverity ? SEVERITY_RANK[opts.minSeverity] : 0;

  const findings: LintFinding[] = [];

  for (const sentence of sentences(text)) {
    for (const rule of RULES) {
      if (ignore.has(rule.id)) continue;
      if (rule.skipIf && rule.skipIf.test(sentence.text)) continue;

      const gate = CONTEXT_GATES[rule.id];
      if (gate && !gate.test(sentence.text)) continue;

      // Find every occurrence in the sentence (global, case-insensitive).
      const re = new RegExp(rule.pattern.source, rule.pattern.flags.includes('g') ? rule.pattern.flags : rule.pattern.flags + 'g');
      let m: RegExpExecArray | null;
      while ((m = re.exec(sentence.text)) !== null) {
        if (SEVERITY_RANK[rule.severity] < minRank) break;
        findings.push({
          ruleId: rule.id,
          category: rule.category,
          severity: rule.severity,
          match: m[0],
          index: sentence.start + m.index,
          message: rule.message,
          suggestion: rule.suggestion,
        });
        if (m.index === re.lastIndex) re.lastIndex += 1;
      }
    }
  }

  return findings.sort((a, b) => a.index - b.index);
}

/** Convenience: are there any blocking (error) findings? */
export function hasBlockingIssues(findings: LintFinding[]): boolean {
  return findings.some((f) => f.severity === 'error');
}

/**
 * Lint many named items at once and aggregate — built for a CI gate over a
 * record of UI strings (id → copy).
 */
export function lintMany(
  items: Array<{ id: string; text: string }> | Record<string, string>,
  opts: LintOptions = {},
): LintReport {
  const list = Array.isArray(items)
    ? items
    : Object.entries(items).map(([id, text]) => ({ id, text }));

  const results: LintItemResult[] = list.map(({ id, text }) => ({
    id,
    findings: lintCopy(text, opts),
  }));

  const all = results.flatMap((r) => r.findings);
  const totals = {
    errors: all.filter((f) => f.severity === 'error').length,
    warnings: all.filter((f) => f.severity === 'warning').length,
    infos: all.filter((f) => f.severity === 'info').length,
  };

  return {
    items: results.filter((r) => r.findings.length > 0),
    totals,
    hasBlocking: totals.errors > 0,
  };
}
