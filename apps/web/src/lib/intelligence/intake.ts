// ============================================================
// SwingVantage — Deterministic Intake Questions (brief §18)
// ------------------------------------------------------------
// A few HIGH-VALUE, token-free follow-up questions that sharpen a diagnosis
// BEFORE any AI is considered. Each answer maps onto a symptom the engine
// already understands, so answering re-runs `analyzeDeterministicSession` with
// more signal — raising confidence (or surfacing a contradiction) for free.
//
// Deliberately short: at most a couple of questions, only the discriminating
// ones, and an honest "not sure" option that adds nothing. Pure + data-driven —
// adding a question is data, the engine never changes.
// ============================================================

import type { SportId } from '@swingiq/core';

export interface IntakeOption {
  label: string;
  /** The symptom this answer contributes (omit for "not sure" / no signal). */
  symptom?: string;
}

export interface IntakeQuestion {
  id: string;
  prompt: string;
  options: IntakeOption[];
}

const NOT_SURE: IntakeOption = { label: 'Not sure' };

const GOLF: IntakeQuestion[] = [
  {
    id: 'golf_curve',
    prompt: 'Which way does the ball curve in the air?',
    options: [
      { label: 'Curves right (away)', symptom: 'slice' },
      { label: 'Curves left (toward you)', symptom: 'hook' },
      { label: 'Starts right, stays right', symptom: 'push' },
      { label: 'Starts left, stays left', symptom: 'pull' },
      NOT_SURE,
    ],
  },
  {
    id: 'golf_contact',
    prompt: 'How does contact usually feel?',
    options: [
      { label: 'Hit the ground first (heavy)', symptom: 'fat' },
      { label: 'Thin / low and hot', symptom: 'thin' },
      { label: 'Off the toe', symptom: 'toe' },
      { label: 'Off the heel', symptom: 'heel' },
      NOT_SURE,
    ],
  },
];

const RACKET: IntakeQuestion[] = [
  {
    id: 'racket_errors',
    prompt: 'Where do your misses mostly go?',
    options: [
      { label: 'Into the net', symptom: 'net_errors' },
      { label: 'Long / past the line', symptom: 'long_errors' },
      { label: 'Mishits / off the frame', symptom: 'mishits' },
      NOT_SURE,
    ],
  },
  {
    id: 'racket_timing',
    prompt: 'How is your timing and movement?',
    options: [
      { label: 'Late / cramped on the ball', symptom: 'late' },
      { label: 'Slow / heavy feet', symptom: 'footwork' },
      { label: 'Tight on big points', symptom: 'under_pressure' },
      NOT_SURE,
    ],
  },
];

const BAT: IntakeQuestion[] = [
  {
    id: 'bat_result',
    prompt: 'What is the typical result?',
    options: [
      { label: 'Pop-ups in the air', symptom: 'pop_up' },
      { label: 'Weak ground balls (rollover)', symptom: 'rollover' },
      { label: 'Late / fouling it back', symptom: 'late' },
      { label: 'Weak the opposite way', symptom: 'weak_oppo' },
      NOT_SURE,
    ],
  },
  {
    id: 'bat_power',
    prompt: 'Where does your power come from?',
    options: [
      { label: 'Feels all arms / no pop', symptom: 'no_power' },
      { label: 'Hips drive it', symptom: undefined },
      NOT_SURE,
    ],
  },
];

const BY_SPORT: Record<SportId, IntakeQuestion[]> = {
  golf: GOLF,
  tennis: RACKET,
  pickleball: RACKET,
  padel: RACKET,
  baseball: BAT,
  softball_slow: BAT,
  softball_fast: BAT,
};

export interface IntakeSelectOptions {
  /** Question ids already asked (excluded). */
  askedIds?: string[];
  /** Symptoms already reported — a question whose answers are all already known
   *  is skipped as low-value. */
  knownSymptoms?: string[];
  /** Max questions to return (default 2 — keep it short). */
  max?: number;
}

/**
 * The high-value intake questions for a sport, minus any already asked or whose
 * signal the athlete has already given. Capped short on purpose.
 */
export function getIntakeQuestions(sport: SportId, opts: IntakeSelectOptions = {}): IntakeQuestion[] {
  const asked = new Set(opts.askedIds ?? []);
  const known = new Set(opts.knownSymptoms ?? []);
  const max = opts.max ?? 2;

  return (BY_SPORT[sport] ?? [])
    .filter((q) => !asked.has(q.id))
    .filter((q) => {
      // Skip a question only when EVERY signal-bearing option is already known.
      const signals = q.options.map((o) => o.symptom).filter(Boolean) as string[];
      return signals.length === 0 || signals.some((s) => !known.has(s));
    })
    .slice(0, max);
}

/** The symptoms contributed by a set of intake answers (skips "not sure"). */
export function intakeAnswerSymptoms(answers: Record<string, string | undefined>): string[] {
  return [...new Set(Object.values(answers).filter((s): s is string => Boolean(s)))];
}
