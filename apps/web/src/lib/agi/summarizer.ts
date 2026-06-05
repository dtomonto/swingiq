// ============================================================
// SwingVantage — AGI: Athlete Summarizer (the ~120-word athlete narrative)
// ------------------------------------------------------------
// Turns an AthleteGIResult into a warm, plain-English, ~120-word summary
// for a NON-technical athlete — the friendly counterpart to the coach
// report in report.ts. It opens with the keystone (the one thing to
// train) and why it matters across their sports, mentions today's
// recommended effort, and ends with one concrete next action quoted
// VERBATIM from the plan.
//
// ABSOLUTE RULES (enforced in code, not just intent):
//   • It ONLY restates fields present in the result. It never introduces
//     a number, score, sport, drill, or claim that isn't in the input.
//   • It never re-derives or rounds a score/delta/confidence/basis/grade.
//   • A readiness CAUTION, when present, leads the narrative verbatim.
//   • Single-camera values are estimates — never called measurements.
//   • A null/absent field is reported as "not yet measured", never guessed.
//
// An optional LLM may only RE-WORD the deterministic narrative, and its
// output is run through `validateAthleteNarrative` — any invented number
// or out-of-roster sport makes us fall back to the deterministic text.
//
// Pure builder + validator are unit-tested in __tests__/summarizer.test.ts.
// ============================================================

import type { AthleteGIResult } from './types';
import type { SportId } from '@swingiq/core';
import { getActiveProvider } from '@/lib/agents';

export type SummaryTone = 'warm' | 'concise' | 'coach';

export interface AthleteSummary {
  /** The athlete-facing narrative (~120 words). */
  narrative: string;
  /** 'local' = deterministic; 'llm' = optionally re-worded (and validated). */
  source: 'local' | 'llm';
}

const NOT_MEASURED = 'not yet measured';

/** Map a sport id to the plain word a non-technical athlete would use. */
const SPORT_WORD: Record<SportId, string> = {
  golf: 'golf',
  tennis: 'tennis',
  baseball: 'baseball',
  softball_slow: 'softball',
  softball_fast: 'softball',
};

/** Join a label list as "a, b, and c". */
function listJoin(items: string[]): string {
  const u = Array.from(new Set(items));
  if (u.length === 0) return '';
  if (u.length === 1) return u[0];
  if (u.length === 2) return `${u[0]} and ${u[1]}`;
  return `${u.slice(0, -1).join(', ')}, and ${u[u.length - 1]}`;
}

/**
 * Build the deterministic athlete narrative. Pure, never throws — every
 * sentence restates a field from `result`; absent fields read "not yet measured".
 */
export function buildAthleteSummary(result: AthleteGIResult): AthleteSummary {
  const sentences: string[] = [];

  // 1) Readiness caution leads, VERBATIM, when present (safety first).
  const caution = result.model?.readiness?.caution ?? null;
  if (caution && caution.trim()) sentences.push(caution.trim());

  // 2) Keystone — the one thing to train — and why it spans sports.
  const keystone = result.plan?.keystone ?? null;
  const translations = result.keystoneTranslations ?? [];
  const sportLabels = translations.map((t) => t.sportLabel).filter(Boolean);

  if (keystone) {
    sentences.push(
      `Your keystone — the one skill to train first — is ${keystone.name}: ${keystone.why}`,
    );
    if (sportLabels.length >= 2) {
      sentences.push(
        `It shows up across your ${listJoin(sportLabels)}, so improving this one thing lifts more than a single sport at once.`,
      );
    } else {
      sentences.push('Improving this one thing carries across your training rather than fixing just one swing.');
    }
  } else {
    sentences.push(`Your keystone — the one skill to train first — is ${NOT_MEASURED}; analyse a few more sessions so SwingVantage can find it.`);
  }

  // 3) Today's recommended effort (readiness-scaled).
  const todayNote = result.plan?.todayNote ?? null;
  sentences.push(todayNote && todayNote.trim() ? `Today, ${todayNote.trim()}` : `Today's recommended effort is ${NOT_MEASURED}.`);

  // 4) Honest meta-confidence — the trust grade, quoted exactly.
  const grade = result.trust?.grade ?? null;
  if (grade) sentences.push(`Overall, this read carries a trust grade of ${grade}.`);

  // 5) End with ONE concrete next action, VERBATIM from the plan.
  const action = keystone?.drills?.[0]?.fix?.trim() || result.plan?.retestReminder?.trim() || null;
  if (action) sentences.push(`Your next step: ${action}`);

  const narrative = sentences
    .map((s) => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`))
    .join(' ');

  return { narrative, source: 'local' };
}

// ── Validator (the "CoachResponseValidator") ──────────────────

const BANNED = ['diagnos', 'injur', 'medical', 'guarantee', 'cured', 'lab-grade', 'tour-grade'];

/** Every numeric token in a string (integers + decimals). */
function numbersIn(text: string): string[] {
  return text.match(/\d+(?:\.\d+)?/g) ?? [];
}

/**
 * Validate an (LLM-reworded) narrative against the authoritative result. It is
 * intentionally strict: a rewrite may rephrase, but must not introduce a number
 * absent from the grounded text, name a sport outside the athlete's roster, or
 * use medical / guarantee language.
 */
export function validateAthleteNarrative(
  candidate: string,
  result: AthleteGIResult,
): { ok: boolean; violations: string[] } {
  const violations: string[] = [];
  const text = candidate ?? '';
  const lower = text.toLowerCase();

  // 1) No number that isn't already in the grounded deterministic narrative.
  const allowed = new Set(numbersIn(buildAthleteSummary(result).narrative));
  for (const n of numbersIn(text)) {
    if (!allowed.has(n)) violations.push(`introduced number "${n}" not present in the analysis`);
  }

  // 2) No sport outside the athlete's actual roster.
  const roster = new Set((result.model?.sports ?? []).map((s) => SPORT_WORD[s]).filter(Boolean));
  for (const word of new Set(Object.values(SPORT_WORD))) {
    const mentioned = new RegExp(`\\b${word}\\b`, 'i').test(lower);
    if (mentioned && !roster.has(word)) violations.push(`mentioned sport "${word}" not in the athlete's roster`);
  }

  // 3) No medical / guarantee / lab-grade language.
  for (const term of BANNED) {
    if (lower.includes(term)) violations.push(`used disallowed term "${term}"`);
  }

  return { ok: violations.length === 0, violations };
}

/**
 * Build the narrative, then OPTIONALLY let the flagged LLM re-word it. The LLM
 * output is validated; any violation (or the LLM being off) keeps the
 * deterministic text. Never throws.
 */
export async function narrateAthleteSummary(
  result: AthleteGIResult,
  opts: { tone?: SummaryTone } = {},
): Promise<AthleteSummary> {
  const base = buildAthleteSummary(result);
  try {
    const provider = getActiveProvider();
    if (provider.id === 'llm' && provider.isAvailable()) {
      const sport: SportId = result.model?.primarySport ?? result.model?.sports?.[0] ?? 'golf';
      const reworded = await provider.enhanceSummary({ text: base.narrative, sport, tone: opts.tone ?? 'warm' });
      const trimmed = (reworded ?? '').trim();
      if (trimmed && trimmed !== base.narrative.trim() && validateAthleteNarrative(trimmed, result).ok) {
        return { narrative: trimmed, source: 'llm' };
      }
    }
  } catch {
    // Deterministic fallback — the summary never depends on the LLM.
  }
  return base;
}

/** Convenience: the exact `{ narrative }` payload shape. */
export function athleteSummaryJson(result: AthleteGIResult): { narrative: string } {
  return { narrative: buildAthleteSummary(result).narrative };
}
