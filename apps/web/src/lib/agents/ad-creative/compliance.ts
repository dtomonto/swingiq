// ============================================================
// SwingVantage — Agent: Ad-Creative — Compliance
// ------------------------------------------------------------
// Ad copy is the highest-risk surface for overclaiming, so this
// agent runs every generated string through the Trust/Honesty
// Linter. It also validates any optional LLM rewrite: a rewrite may
// rephrase but must stay lint-clean AND must not introduce a number
// that isn't in the grounded proof (mirrors agi/summarizer).
// ============================================================

import { lintCopy, hasBlockingIssues, type LintFinding } from '../trust-linter';
import type { AdProof } from './types';

/** Numbers the copy is allowed to contain (from the grounded proof). */
export function allowedNumbersFor(proof?: AdProof | null): Set<string> {
  const allowed = new Set<string>();
  if (!proof) return allowed;
  for (const n of [proof.before, proof.after]) {
    if (typeof n === 'number' && Number.isFinite(n)) allowed.add(String(n));
  }
  // Any standalone integers in the timeframe (e.g. "3 weeks") are fine too.
  for (const m of (proof.timeframe ?? '').match(/\d+(?:\.\d+)?/g) ?? []) allowed.add(m);
  return allowed;
}

const numbersIn = (text: string): string[] => text.match(/\d+(?:\.\d+)?/g) ?? [];

/** A generated line is acceptable when it has no BLOCKING lint findings. */
export function isAdCopyClean(text: string): { ok: boolean; findings: LintFinding[] } {
  const findings = lintCopy(text);
  return { ok: !hasBlockingIssues(findings), findings };
}

/**
 * Validate an (optionally LLM-reworded) ad line against the grounded proof.
 * Strict: must be lint-clean of blocking issues AND introduce no number that
 * isn't already justified by the proof.
 */
export function validateAdRewrite(
  candidate: string,
  proof?: AdProof | null,
): { ok: boolean; violations: string[] } {
  const violations: string[] = [];
  const allowed = allowedNumbersFor(proof);

  for (const n of numbersIn(candidate)) {
    if (!allowed.has(n)) violations.push(`introduced number "${n}" not in the proof`);
  }
  const { ok, findings } = isAdCopyClean(candidate);
  if (!ok) {
    for (const f of findings.filter((x) => x.severity === 'error')) {
      violations.push(`blocking copy issue: ${f.ruleId} ("${f.match}")`);
    }
  }
  return { ok: violations.length === 0, violations };
}
