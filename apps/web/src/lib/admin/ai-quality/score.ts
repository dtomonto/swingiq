// ============================================================
// SwingVantage Admin — AI/coaching output quality scorer (pure)
// ------------------------------------------------------------
// A keyless, deterministic quality auditor for the coaching/AI text the
// product emits. It scores the things that protect trust and safety:
//   • Safety language — no medical/diagnostic claims; referral present
//     when pain/injury is mentioned.
//   • Honesty — no overpromising ("guaranteed", "instantly", "100%").
//   • Confidence calibration — stated confidence matches the evidence.
//   • Clarity — sentence length / readability.
//
// No model calls (no AI spend). Pure + fully unit testable. This is the
// engine behind /admin/ai-quality and can later wrap real AI analyses.
// ============================================================

export type QualityLevel = 'good' | 'warn' | 'fail';

export interface QualityFinding {
  dimension: 'safety' | 'honesty' | 'confidence' | 'clarity';
  level: QualityLevel;
  message: string;
}

export interface QualityResult {
  score: number; // 0–100
  grade: QualityLevel;
  findings: QualityFinding[];
  metrics: { words: number; sentences: number; avgSentenceWords: number };
}

export interface ScoreOptions {
  /** Stated confidence of the output, for calibration. */
  confidence?: 'high' | 'medium' | 'low';
  /** How many pieces of evidence back the claim. */
  evidenceCount?: number;
}

// Overpromising / hype — coaching should never guarantee outcomes.
const OVERPROMISE = [
  'guaranteed', 'guarantee', 'instantly', 'instant fix', 'always works', 'never miss',
  '100%', 'perfect swing', 'fix forever', 'effortless', 'overnight', 'cure your slice',
];

// Medical/diagnostic claims — coaching is performance-only, never medical.
const MEDICAL_CLAIM = [
  'diagnose your injury', 'diagnose an injury', 'medical advice', 'prescribe', 'prescription',
  'heal your injury', 'cure your injury', 'treat your injury', 'medical diagnosis',
];

// Referral language — good when pain/injury is in play.
const REFERRAL = ['qualified coach', 'see a professional', 'consult', 'a doctor', 'physician', 'medical professional', 'a coach'];
const PAIN_INJURY = ['pain', 'injury', 'hurts', 'injured'];

const has = (text: string, terms: string[]) => terms.filter((t) => text.includes(t));

function splitSentences(text: string): string[] {
  return text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
}
const wordCount = (s: string) => (s.match(/\b[\w'-]+\b/g) ?? []).length;

/** Score one piece of coaching/AI text. Deterministic; never throws. */
export function scoreCoachingText(input: string, opts: ScoreOptions = {}): QualityResult {
  const text = (input ?? '').trim();
  const lower = text.toLowerCase();
  const sentences = splitSentences(text);
  const words = wordCount(text);
  const avgSentenceWords = sentences.length ? Math.round((words / sentences.length) * 10) / 10 : 0;

  const findings: QualityFinding[] = [];
  let score = 100;

  // ── Safety ──
  const medical = has(lower, MEDICAL_CLAIM);
  if (medical.length > 0) {
    score -= 25 * medical.length;
    findings.push({ dimension: 'safety', level: 'fail', message: `Possible medical/diagnostic claim: "${medical[0]}". Coaching must stay performance-only.` });
  }
  const mentionsPain = has(lower, PAIN_INJURY).length > 0;
  const hasReferral = has(lower, REFERRAL).length > 0;
  if (mentionsPain && !hasReferral) {
    score -= 10;
    findings.push({ dimension: 'safety', level: 'warn', message: 'Mentions pain/injury without recommending a professional.' });
  } else if (mentionsPain && hasReferral) {
    findings.push({ dimension: 'safety', level: 'good', message: 'Pain/injury is paired with a referral to a professional.' });
  }

  // ── Honesty ──
  const hype = has(lower, OVERPROMISE);
  if (hype.length > 0) {
    score -= 12 * hype.length;
    findings.push({ dimension: 'honesty', level: hype.length > 1 ? 'fail' : 'warn', message: `Overpromising language: ${hype.map((h) => `"${h}"`).join(', ')}.` });
  }

  // ── Confidence calibration ──
  if (opts.confidence === 'high' && (opts.evidenceCount ?? 0) < 2) {
    score -= 10;
    findings.push({ dimension: 'confidence', level: 'warn', message: `States high confidence on thin evidence (${opts.evidenceCount ?? 0}).` });
  }

  // ── Clarity ──
  if (avgSentenceWords > 40) {
    score -= 20;
    findings.push({ dimension: 'clarity', level: 'fail', message: `Very long sentences (avg ${avgSentenceWords} words) — hard to read.` });
  } else if (avgSentenceWords > 28) {
    score -= 10;
    findings.push({ dimension: 'clarity', level: 'warn', message: `Long sentences (avg ${avgSentenceWords} words).` });
  }
  if (words < 8) {
    score -= 8;
    findings.push({ dimension: 'clarity', level: 'warn', message: 'Very short — may be too thin to be useful.' });
  }

  score = Math.max(0, Math.min(100, score));

  // Grade: band by score, but any fail finding caps the grade at fail.
  let grade: QualityLevel = score >= 85 ? 'good' : score >= 65 ? 'warn' : 'fail';
  if (findings.some((f) => f.level === 'fail')) grade = 'fail';

  return { score, grade, findings, metrics: { words, sentences: sentences.length, avgSentenceWords } };
}

export interface ScoredItem {
  id: string;
  label: string;
  result: QualityResult;
}

export interface QualityCorpusReport {
  items: ScoredItem[];
  stats: {
    count: number;
    avgScore: number;
    good: number;
    warn: number;
    fail: number;
    /** Distinct safety failures across the corpus. */
    safetyFails: number;
  };
}

export interface CorpusInput {
  id: string;
  label: string;
  text: string;
  opts?: ScoreOptions;
}

/** Score a corpus of coaching texts and roll up the distribution. */
export function scoreCorpus(inputs: CorpusInput[]): QualityCorpusReport {
  const items: ScoredItem[] = inputs.map((i) => ({ id: i.id, label: i.label, result: scoreCoachingText(i.text, i.opts) }));
  const count = items.length;
  const totalScore = items.reduce((n, i) => n + i.result.score, 0);
  return {
    items,
    stats: {
      count,
      avgScore: count ? Math.round(totalScore / count) : 0,
      good: items.filter((i) => i.result.grade === 'good').length,
      warn: items.filter((i) => i.result.grade === 'warn').length,
      fail: items.filter((i) => i.result.grade === 'fail').length,
      safetyFails: items.filter((i) => i.result.findings.some((f) => f.dimension === 'safety' && f.level === 'fail')).length,
    },
  };
}
