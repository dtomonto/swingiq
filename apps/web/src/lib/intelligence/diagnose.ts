// ============================================================
// SwingVantage — Deterministic Diagnosis Engine
// ------------------------------------------------------------
// A pure, token-free, weighted symptom→cause engine. Given an athlete's
// reported miss pattern(s) plus optional profile/history signals, it returns
// a RANKED, explainable diagnosis: primary + secondary cause, supporting and
// contradicting evidence, missing data, a confidence score WITH the reason
// for it, severity/urgency, and an explicit AI-escalation recommendation.
//
// It does NOT call any external AI provider and performs no I/O — it composes
// the existing fault ontology (lib/faults) and the per-sport symptom rule packs
// (symptom-rules.ts). Fully unit-testable; safe to run on free tiers, in Today
// refreshes, and in the admin scenario lab.
//
// Public service surface (brief §2, adapted to repo conventions):
//   analyzeDeterministicSession  → DeterministicDiagnosis
//   calculateConfidence          → { score, label, reason }
//   shouldEscalateToAI           → { escalate, reasons }
//   getTriggeredRuleTrace        → TriggeredRule[]
//   runDeterministicScenarioTest → ScenarioResult   (the evaluation lab)
// ============================================================

import { resolveFault } from '@/lib/faults/ontology';
import type { FaultOntologyEntry, FaultSeverity } from '@/lib/faults/types';
import type { ConfidenceLabel } from './types';
import type {
  DeterministicDiagnosis,
  DiagnosisCandidate,
  DiagnosisInput,
  DiagnosisUrgency,
  SkillLevel,
  TriggeredRule,
} from './diagnose-types';
import {
  getSportDiagnosisConfig,
  type SportDiagnosisConfig,
  type SymptomRule,
} from './symptom-rules';

const ENGINE_VERSION = '1.0.0';
const RULE_VERSION = '2026.06';

// ── Confidence bands ────────────────────────────────────────
const HIGH_CONFIDENCE = 70;
const MODERATE_CONFIDENCE = 50;

function labelFor(score: number): ConfidenceLabel {
  if (score >= HIGH_CONFIDENCE) return 'high';
  if (score >= MODERATE_CONFIDENCE) return 'moderate';
  return 'low';
}

// ── Symptom normalization ───────────────────────────────────

const STOP = new Set(['the', 'and', 'too', 'for', 'of', 'to', 'in', 'on', 'is', 'at', 'or', 'your', 'a', 'an', 'with', 'it']);

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokens(s: string): Set<string> {
  return new Set(normalize(s).split(' ').filter((w) => w.length > 2 && !STOP.has(w)));
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const t of a) if (b.has(t)) n += 1;
  return n;
}

/**
 * Map one free-text or id token onto a canonical symptom id for the sport.
 * Tries: exact id → alias contains → label/alias token overlap. Returns null
 * when nothing matches confidently (the caller keeps the raw text as a lead).
 */
function matchSymptom(text: string, rules: SymptomRule[]): string | null {
  const norm = normalize(text);
  if (!norm) return null;

  // 1. Exact canonical id.
  const exact = rules.find((r) => r.symptom === norm || normalize(r.symptom) === norm);
  if (exact) return exact.symptom;

  // 2. Alias or label substring containment.
  for (const r of rules) {
    const hay = [r.label, ...(r.aliases ?? [])].map(normalize);
    if (hay.some((h) => h.includes(norm) || norm.includes(r.symptom.replace(/_/g, ' ')))) return r.symptom;
  }

  // 3. Token overlap against label + aliases.
  const needle = tokens(text);
  let best: { symptom: string; score: number } | null = null;
  for (const r of rules) {
    const hay = tokens([r.label, ...(r.aliases ?? []), r.symptom.replace(/_/g, ' ')].join(' '));
    const score = overlap(needle, hay);
    if (score > 0 && score > (best?.score ?? 0)) best = { symptom: r.symptom, score };
  }
  return best ? best.symptom : null;
}

// ── Severity / urgency ──────────────────────────────────────

const SEVERITY_RANK: Record<FaultSeverity, number> = { critical: 3, notable: 2, minor: 1, watch: 0 };

function urgencyFor(severity: FaultSeverity, input: DiagnosisInput): DiagnosisUrgency {
  let rank = SEVERITY_RANK[severity];
  // History bumps urgency: a regressed retest or repeated failed fix is pressing.
  if (input.lastRetestOutcome === 'regressed') rank += 1;
  if ((input.priorFailedAttempts ?? 0) >= 2) rank += 1;
  if (rank >= 3) return 'high';
  if (rank >= 2) return 'medium';
  return 'low';
}

// ── Candidate accumulation ──────────────────────────────────

interface Accum {
  faultId: string;
  score: number;
  supporting: Set<string>;
  trace: TriggeredRule[];
}

function evaluateCandidates(
  matchedSymptoms: string[],
  cfg: SportDiagnosisConfig,
): { accums: Map<string, Accum>; contradictionsHit: string[]; ruleTrace: TriggeredRule[] } {
  const present = new Set(matchedSymptoms);
  const byId = new Map(cfg.rules.map((r) => [r.symptom, r]));
  const accums = new Map<string, Accum>();
  const ruleTrace: TriggeredRule[] = [];
  const contradictionsHit: string[] = [];

  for (const sym of matchedSymptoms) {
    const rule = byId.get(sym);
    if (!rule) continue;

    // Reinforcement: a small bonus when a corroborating symptom is also present.
    const reinforced = (rule.reinforcedBy ?? []).some((r) => present.has(r));
    const reinforceMul = reinforced ? 1.15 : 1;

    // Contradiction: dampen when a contradicting symptom is present.
    const contradicted = (rule.contradictedBy ?? []).filter((c) => present.has(c));
    const contradictMul = contradicted.length ? 0.7 : 1;
    for (const c of contradicted) if (!contradictionsHit.includes(c)) contradictionsHit.push(c);

    for (const cand of rule.candidates) {
      const contribution = cand.weight * reinforceMul * contradictMul;
      const acc = accums.get(cand.faultId) ?? { faultId: cand.faultId, score: 0, supporting: new Set<string>(), trace: [] };
      acc.score += contribution;
      acc.supporting.add(sym);
      accums.set(cand.faultId, acc);
      const row: TriggeredRule = { symptom: sym, faultId: cand.faultId, weight: cand.weight, contribution: Number(contribution.toFixed(3)) };
      acc.trace.push(row);
      ruleTrace.push(row);
    }
  }

  return { accums, contradictionsHit, ruleTrace };
}

function toCandidate(acc: Accum, totalScore: number, sport: DiagnosisInput['sport']): DiagnosisCandidate {
  const fault: FaultOntologyEntry = resolveFault(acc.faultId, { sport });
  const supporting = [...acc.supporting].map((s) => s.replace(/_/g, ' '));
  // Add a couple of the fault's own observable-evidence lines as supporting context.
  for (const e of fault.observableEvidence.slice(0, 2)) supporting.push(e);
  return {
    faultId: acc.faultId,
    name: fault.name,
    score: Number(acc.score.toFixed(3)),
    share: totalScore > 0 ? Number((acc.score / totalScore).toFixed(3)) : 0,
    severity: fault.defaultSeverity,
    supporting,
    generated: Boolean(fault.generated),
    drillFamilies: fault.drillFamilies,
  };
}

// ── Confidence ──────────────────────────────────────────────

export interface ConfidenceResult {
  score: number;
  label: ConfidenceLabel;
  reason: string;
}

/**
 * Score confidence 0..100 in the primary diagnosis, and explain WHY. Pure and
 * exported so the report UI, admin trace, and tests share one definition.
 */
export function calculateConfidence(args: {
  matchedSymptomCount: number;
  primary: DiagnosisCandidate | null;
  secondary: DiagnosisCandidate | null;
  contradictionCount: number;
  skillLevel: SkillLevel;
  priorFailedAttempts: number;
  videoAvailable: boolean;
}): ConfidenceResult {
  const { matchedSymptomCount, primary, secondary, contradictionCount, skillLevel, priorFailedAttempts } = args;
  const reasons: string[] = [];

  if (!primary || matchedSymptomCount === 0) {
    return {
      score: 30,
      label: 'low',
      reason: 'No recognized miss pattern was provided, so this is a generic starting point — add a symptom or a swing video to sharpen it.',
    };
  }

  // A single clearly-reported common miss should already be "moderate"; extra
  // corroborating symptoms, a clear lead, and (later) video push it higher,
  // while contradictions / repeated failed fixes pull it down below escalation.
  let score = 44;
  const corroborating = Math.min(matchedSymptomCount, 4);
  score += corroborating * 7;
  if (corroborating >= 2) reasons.push(`${matchedSymptomCount} reported symptoms point the same way`);
  else reasons.push('only one symptom was reported');

  // Lead margin: how far the primary stands apart from the runner-up.
  const margin = secondary ? primary.share - secondary.share : primary.share;
  score += Math.round(Math.max(0, Math.min(0.4, margin)) * 38); // up to +15
  if (margin >= 0.25) reasons.push('one cause clearly leads the others');
  else if (secondary) reasons.push('two causes are close, so the lead is not clear-cut');

  if (contradictionCount > 0) {
    score -= contradictionCount * 12;
    reasons.push(`${contradictionCount} reported symptom(s) point a different direction`);
  }
  if (primary.generated) {
    score -= 15;
    reasons.push('there is no curated coaching profile for this exact pattern yet');
  }
  if (skillLevel === 'elite') {
    score -= 5;
    reasons.push('elite swings need video to confirm subtle causes');
  }
  if (priorFailedAttempts >= 2) {
    score -= 10;
    reasons.push('the obvious fix has already been tried without success');
  }
  // No video/measurement is always a ceiling on a reported-symptom estimate.
  reasons.push('no swing video or measured data was analyzed');

  score = Math.max(5, Math.min(95, Math.round(score)));
  const label = labelFor(score);
  const lead = label === 'high' ? 'Confidence is high because' : label === 'moderate' ? 'Confidence is moderate because' : 'Confidence is low because';
  return { score, label, reason: `${lead} ${reasons.join('; ')}.` };
}

// ── AI escalation ───────────────────────────────────────────

export interface EscalationResult {
  escalate: boolean;
  reasons: string[];
  recommendVideo: boolean;
}

/**
 * Decide whether AI / deeper analysis is genuinely warranted (brief §14).
 * Pure: it reads only the deterministic result + input signals, never a budget
 * or provider. The router (lib/intelligence/router) still has final say on
 * whether a paid call is actually made (cost-saving mode can veto it).
 */
export function shouldEscalateToAI(
  diagnosis: Pick<DeterministicDiagnosis, 'confidence' | 'contradictingEvidence' | 'secondary' | 'primary'>,
  input: Pick<DiagnosisInput, 'videoAvailable' | 'priorFailedAttempts' | 'lastRetestOutcome' | 'skillLevel'>,
  threshold = MODERATE_CONFIDENCE + 5,
): EscalationResult {
  const reasons: string[] = [];

  if (diagnosis.confidence < threshold) reasons.push('Deterministic confidence is below the escalation threshold');
  if (diagnosis.contradictingEvidence.length > 0) reasons.push('Reported symptoms contradict each other');
  if (diagnosis.secondary && diagnosis.primary.share - diagnosis.secondary.share < 0.1) {
    reasons.push('Two root causes are nearly tied');
  }
  if ((input.priorFailedAttempts ?? 0) >= 2) reasons.push('The same fix has failed multiple times');
  if (input.lastRetestOutcome === 'regressed') reasons.push('A retest rejected the deterministic diagnosis');

  // A video would sharpen the picture whenever we don't already have one (this
  // is a reported-symptom estimate), or whenever the read is unclear.
  const recommendVideo =
    !input.videoAvailable ||
    diagnosis.confidence < threshold ||
    diagnosis.contradictingEvidence.length > 0;

  // When a video is available AND the athlete is advanced/elite, deeper analysis
  // adds genuine value even at decent confidence.
  if (input.videoAvailable && (input.skillLevel === 'advanced' || input.skillLevel === 'elite')) {
    reasons.push('A video is available and the athlete is advanced — deeper analysis adds value');
  }

  return { escalate: reasons.length > 0, reasons, recommendVideo };
}

// ── Public entry ────────────────────────────────────────────

/**
 * Run the full deterministic diagnosis for a reported session. Always returns a
 * usable, honest result — even for an unknown sport or an empty symptom (it
 * falls back to a clearly-`generated` cause). Pure + synchronous.
 */
export function analyzeDeterministicSession(input: DiagnosisInput): DeterministicDiagnosis {
  const skillLevel: SkillLevel = input.skillLevel ?? 'intermediate';
  const cfg = getSportDiagnosisConfig(input.sport);

  // Collect every reported token (primary issue first, then finer symptoms).
  const rawTokens = [input.issue, ...(input.symptoms ?? [])].map((s) => (s ?? '').trim()).filter(Boolean);

  const rules = cfg?.rules ?? [];
  const matched: string[] = [];
  for (const tok of rawTokens) {
    const sym = matchSymptom(tok, rules);
    if (sym && !matched.includes(sym)) matched.push(sym);
  }

  const { accums, contradictionsHit, ruleTrace } = evaluateCandidates(matched, cfg ?? fallbackConfig(input.sport));
  const totalScore = [...accums.values()].reduce((n, a) => n + a.score, 0);

  let ranked: DiagnosisCandidate[] = [...accums.values()]
    .map((a) => toCandidate(a, totalScore, input.sport))
    .sort((x, y) => y.score - x.score);

  // Honest fallback: nothing matched → synthesize a single generated lead from
  // the raw issue so the rest of the app always has content.
  if (ranked.length === 0) {
    const fault = resolveFault(input.issue, { sport: input.sport, label: input.issue });
    ranked = [{
      faultId: fault.id,
      name: fault.name,
      score: 0.5,
      share: 1,
      severity: fault.defaultSeverity,
      supporting: [...fault.observableEvidence.slice(0, 2)],
      generated: true,
      drillFamilies: fault.drillFamilies,
    }];
  }

  const primary = ranked[0];
  const secondary = ranked[1];

  const confidence = calculateConfidence({
    matchedSymptomCount: matched.length,
    primary,
    secondary: secondary ?? null,
    contradictionCount: contradictionsHit.length,
    skillLevel,
    priorFailedAttempts: input.priorFailedAttempts ?? 0,
    videoAvailable: Boolean(input.videoAvailable),
  });

  const severity = primary.severity;
  const urgency = urgencyFor(severity, input);

  // Evidence + missing data.
  const supportingEvidence = dedupe(primary.supporting);
  const contradictingEvidence = buildContradictions(contradictionsHit, rules);
  const { missingData, missingDataPrompts } = buildMissingData(matched, rules, input, confidence.score);
  const whatWouldChangeIt = buildWhatWouldChangeIt(primary, secondary, input);

  const partial: Pick<DeterministicDiagnosis, 'confidence' | 'contradictingEvidence' | 'secondary' | 'primary'> = {
    confidence: confidence.score,
    contradictingEvidence,
    secondary,
    primary,
  };
  const escalation = shouldEscalateToAI(partial, input, (cfg?.escalationConfidenceThreshold ?? 55) + 0);

  return {
    engineVersion: ENGINE_VERSION,
    ruleVersion: RULE_VERSION,
    sport: input.sport,
    skillLevel,
    issue: input.issue,
    primary,
    secondary,
    ranked,
    confidence: confidence.score,
    confidenceLabel: confidence.label,
    confidenceReason: confidence.reason,
    severity,
    urgency,
    supportingEvidence,
    contradictingEvidence,
    missingData,
    missingDataPrompts,
    whatWouldChangeIt,
    escalateToAI: escalation.escalate,
    escalationReasons: escalation.reasons,
    recommendVideo: escalation.recommendVideo,
    ruleTrace,
    disclaimer: cfg?.disclaimer ?? GENERIC_DISCLAIMER,
  };
}

/** The admin/debug trace of which rules fired for an input (brief §13). */
export function getTriggeredRuleTrace(input: DiagnosisInput): TriggeredRule[] {
  return analyzeDeterministicSession(input).ruleTrace;
}

// ── Evidence / missing-data builders ────────────────────────

const GENERIC_DISCLAIMER =
  'This is a deterministic estimate based on your reported miss pattern — not a measured or video-confirmed analysis. Retest to confirm.';

function dedupe(items: string[]): string[] {
  return [...new Set(items.map((s) => s.trim()).filter(Boolean))];
}

function buildContradictions(hits: string[], rules: SymptomRule[]): string[] {
  // Only GENUINE symptom conflicts belong here — a close-but-compatible
  // secondary cause is not a contradiction (it is captured in whatWouldChangeIt
  // and the ranked list, and gated separately by the "nearly tied" escalation
  // rule). Mixing the two would over-escalate clean diagnoses.
  const byId = new Map(rules.map((r) => [r.symptom, r]));
  const out = hits.map((h) => {
    const r = byId.get(h);
    return r ? `You also reported "${r.label}", which usually has a different cause.` : `Reported "${h.replace(/_/g, ' ')}" points a different direction.`;
  });
  return dedupe(out);
}

function buildMissingData(
  matched: string[],
  rules: SymptomRule[],
  input: DiagnosisInput,
  confidenceScore: number,
): { missingData: string[]; missingDataPrompts: string[] } {
  const prompts: string[] = [];
  const byId = new Map(rules.map((r) => [r.symptom, r]));
  for (const sym of matched) {
    for (const p of byId.get(sym)?.missingDataPrompts ?? []) prompts.push(p);
  }

  const missingData: string[] = [];
  if (!input.videoAvailable) missingData.push('No swing video for visual confirmation');
  if (matched.length <= 1) missingData.push('Only one reported symptom — more detail would sharpen the picture');
  if (!input.skillLevel) missingData.push('Skill level not provided');
  if (confidenceScore < MODERATE_CONFIDENCE) missingData.push('Ball-start direction and contact location would most improve confidence');

  if (prompts.length === 0 && !input.videoAvailable) {
    prompts.push('Upload a swing video so we can confirm the cause visually.');
  }
  return { missingData: dedupe(missingData), missingDataPrompts: dedupe(prompts) };
}

function buildWhatWouldChangeIt(primary: DiagnosisCandidate, secondary: DiagnosisCandidate | undefined, input: DiagnosisInput): string[] {
  const out: string[] = [];
  if (secondary) out.push(`Evidence that points to ${secondary.name} instead of ${primary.name} (e.g. opposite ball-start or contact pattern).`);
  if (!input.videoAvailable) out.push('A swing video confirming or contradicting the visible mechanics.');
  out.push('A retest result that shows the prescribed fix is not changing the miss.');
  return dedupe(out);
}

/** A minimal config so an unknown sport still evaluates (no rules → fallback). */
function fallbackConfig(sport: DiagnosisInput['sport']): SportDiagnosisConfig {
  return {
    sport,
    displayName: String(sport),
    escalationConfidenceThreshold: 55,
    recommendationLimits: {
      beginner: { primary: 1, optional: 1 },
      intermediate: { primary: 1, optional: 2 },
      advanced: { primary: 1, optional: 3 },
      elite: { primary: 1, optional: 3 },
    },
    disclaimer: GENERIC_DISCLAIMER,
    rules: [],
  };
}

// ── Evaluation lab (brief §16) ──────────────────────────────

export interface ScenarioExpectation {
  /** Any of these fault ids is an acceptable primary diagnosis. */
  expectedPrimaryFaultIds?: string[];
  /** Inclusive confidence range the result must fall within. */
  confidenceRange?: [number, number];
  expectedConfidenceLabel?: ConfidenceLabel;
  /** Whether AI escalation should (true) or should not (false) be recommended. */
  shouldEscalate?: boolean;
  expectedUrgency?: DiagnosisUrgency;
}

export interface DiagnosisScenario {
  name: string;
  input: DiagnosisInput;
  expect: ScenarioExpectation;
}

export interface ScenarioResult {
  name: string;
  pass: boolean;
  failures: string[];
  diagnosis: DeterministicDiagnosis;
}

/**
 * Run a single golden scenario and assert its expectations. Returns a structured
 * result (rather than throwing) so it can power both the Jest eval suite and an
 * admin "run sample athlete scenarios" surface.
 */
export function runDeterministicScenarioTest(scenario: DiagnosisScenario): ScenarioResult {
  const diagnosis = analyzeDeterministicSession(scenario.input);
  const failures: string[] = [];
  const { expect } = scenario;

  if (expect.expectedPrimaryFaultIds && !expect.expectedPrimaryFaultIds.includes(diagnosis.primary.faultId)) {
    failures.push(`primary fault ${diagnosis.primary.faultId} not in [${expect.expectedPrimaryFaultIds.join(', ')}]`);
  }
  if (expect.confidenceRange) {
    const [lo, hi] = expect.confidenceRange;
    if (diagnosis.confidence < lo || diagnosis.confidence > hi) {
      failures.push(`confidence ${diagnosis.confidence} outside [${lo}, ${hi}]`);
    }
  }
  if (expect.expectedConfidenceLabel && diagnosis.confidenceLabel !== expect.expectedConfidenceLabel) {
    failures.push(`confidence label ${diagnosis.confidenceLabel} ≠ ${expect.expectedConfidenceLabel}`);
  }
  if (typeof expect.shouldEscalate === 'boolean' && diagnosis.escalateToAI !== expect.shouldEscalate) {
    failures.push(`escalateToAI ${diagnosis.escalateToAI} ≠ ${expect.shouldEscalate}`);
  }
  if (expect.expectedUrgency && diagnosis.urgency !== expect.expectedUrgency) {
    failures.push(`urgency ${diagnosis.urgency} ≠ ${expect.expectedUrgency}`);
  }

  return { name: scenario.name, pass: failures.length === 0, failures, diagnosis };
}
