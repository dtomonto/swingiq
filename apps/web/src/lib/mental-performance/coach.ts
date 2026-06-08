// ============================================================
// SwingVantage — Mental Performance: deterministic Coach (pure, keyless)
//
// Maps sport × mistake × emotion → an immediate reset routine, a short non-
// pathologizing explanation, a sport-specific next-action cue, a self-talk
// script, a breath pattern, an optional visualization, a practice drill, a
// reflection prompt, and a future-training recommendation.
//
// Crisis/medical language short-circuits to safe referral — never coaching.
// An optional AI-rewrite seam (ai.ts) can polish the prose later; it is OFF
// by default and the deterministic output is always complete on its own.
// ============================================================

import type {
  CoachInput, CoachResponse, CoachTone, ErrorClass, MentalProfile,
  MentalRoutine, EmotionFamily, MentalSport,
} from './types';
import { SHORT_DISCLAIMER, emotionMeta, mistakeMeta, sportFamilyFor } from './constants';
import { routineForContext } from './routines';
import { screenForCrisis, isMedicalAdviceRequest, medicalRedirect } from './crisis';

// ── Tone selection ───────────────────────────────────────────
function toneForEmotion(family: EmotionFamily | null, errorClass: ErrorClass | null): CoachTone {
  if (errorClass === 'forced' || errorClass === 'strategic') return 'tactical';
  switch (family) {
    case 'frustration': return 'calm';
    case 'fear': return 'encouraging';
    case 'arousal_high': return 'calm';
    case 'arousal_low': return 'encouraging';
    default: return 'direct';
  }
}

// ── "What happened mentally" (non-pathologizing) ─────────────
function explainEmotion(family: EmotionFamily | null): string {
  switch (family) {
    case 'frustration':
      return 'Frustration is a sign you care. Unchecked, it tightens your body and rushes your next move — so the move is to discharge it fast and refocus.';
    case 'fear':
      return 'Nerves are your body getting ready. They only cost you when they make you tentative or speed you up.';
    case 'arousal_high':
      return 'You’re amped up — useful energy, but it can rush your timing. We’ll settle the system a notch.';
    case 'arousal_low':
      return 'Your energy dropped a gear. A small win and a confidence cue bring it back up.';
    default:
      return 'Your attention slipped for a moment. One clear cue brings it back to what you control.';
  }
}

function explainErrorClass(errorClass: ErrorClass | null, sport: MentalSport): string {
  const racket = sportFamilyFor(sport) === 'racket';
  switch (errorClass) {
    case 'forced':
      return racket
        ? 'That error was forced — your opponent earned it. The response is tactical, not self-criticism.'
        : 'That one was caused by the situation, not a breakdown in you. Stay aggressive on the next.';
    case 'unforced':
      return 'That one was on you — which is good news. Unforced misses are the easiest to fix with a single simple correction.';
    case 'strategic':
      return 'That was a decision miss, not a mechanics miss. Recognize the pattern so you choose better next time.';
    case 'emotional':
      return 'Frustration changed your execution there — so the fix is a nervous-system reset, not a technical one.';
    default:
      return '';
  }
}

// ── Practice drills to TRAIN the response ────────────────────
function drillFor(sport: MentalSport, routine: MentalRoutine): { name: string; how: string } {
  const fam = sportFamilyFor(sport);
  const t = routine.routineType;
  if (fam === 'golf') {
    if (routine.slug === 'shank-reset')
      return { name: 'Hands-in reset reps', how: 'Hit half wedges with a towel under both arms; after any mishit, run your reset breath before the next ball.' };
    if (routine.slug.includes('putt'))
      return { name: '3-6-9 calm putting', how: 'Make one putt from 3, 6, and 9 feet; a miss restarts the ladder, building a calm, repeatable routine.' };
    return { name: 'Pressure wedge ladder', how: 'Hit 9 shots to 3 targets; after any miss, run your full reset before the next swing so it becomes automatic.' };
  }
  if (fam === 'bat') {
    if (t === 'confidence' || routine.slug === 'fielding-confidence')
      return { name: 'Want-it reps', how: 'Take extra reaction grounders saying "hit it here" before each one, so the body learns to invite the ball.' };
    if (routine.slug === 'strikeout-recovery')
      return { name: 'Two-strike battles', how: 'In BP, work every rep from two strikes; after a strikeout, run the one-note reset before the next round.' };
    if (routine.slug === 'next-pitch-reset')
      return { name: 'Step-off bullpen', how: 'Throw a pen with a rule: after any "bad" pitch, step off and reset before the next.' };
    return { name: 'Boot-and-reset grounders', how: 'Take 10 grounders, intentionally boot one, and run your glove-tap reset before the next rep.' };
  }
  if (fam === 'racket') {
    if (routine.slug === 'serve-reset')
      return { name: 'Pressure serves', how: 'Serve two baskets with a rule: one double fault = run your full serve ritual before the next serve.' };
    if (routine.slug === 'forced-error-recovery')
      return { name: 'Pattern adjustments', how: 'Play out a tough pattern; after a forced miss, say one tactical adjustment out loud before the next point.' };
    if (routine.slug === 'doubles-frustration-reset')
      return { name: 'Partner cue reps', how: 'Practice points with one agreed shared cue you say after every point, win or lose.' };
    return { name: 'One-thought sets', how: 'Play a set with a single swing thought; reset with your routine after any unforced miss.' };
  }
  return { name: 'Mistake-reps', how: 'In practice, deliberately make a mistake and rehearse your reset until it’s automatic.' };
}

// ── Self-talk shaping ────────────────────────────────────────
function shapeSelfTalk(routine: MentalRoutine, profile?: MentalProfile | null): string {
  const cue = routine.selfTalkCue;
  if (profile?.selfTalkPreference === 'detailed') {
    return `${cue} — say it, mean it, then commit fully to the next one. Effort is yours; the outcome takes care of itself.`;
  }
  return cue;
}

function visualizationFor(sport: MentalSport, mode: CoachInput['mode'], family: EmotionFamily | null): string | null {
  const noun = sportFamilyFor(sport) === 'golf' ? 'swing'
    : sportFamilyFor(sport) === 'bat' ? 'play'
      : sportFamilyFor(sport) === 'racket' ? 'point' : 'rep';
  if (mode === 'pre_game' || mode === 'reflect' || family === 'fear' || family === 'arousal_low') {
    return `Take 10 seconds, close your eyes, and watch yourself execute the next ${noun} exactly the way you want it.`;
  }
  return null;
}

function futureTrainingFor(sport: MentalSport, routine: MentalRoutine): string {
  const fam = sportFamilyFor(sport);
  if (routine.routineType === 'confidence')
    return 'Add a short weekly confidence block — keep an "evidence list" of things you do well and review it before you compete.';
  if (fam === 'racket')
    return 'Add a weekly pressure-points block so this reset is automatic when the score gets tight.';
  if (fam === 'bat')
    return 'Add reaction reps + a fixed reset so the next ball always feels invited, not feared.';
  if (fam === 'golf')
    return 'Add a weekly "pressure round" drill where every miss is followed by your reset, on purpose.';
  return 'Practice your reset on purpose in training so it’s automatic when it counts.';
}

// ── Error-class resolution ───────────────────────────────────
function resolveErrorClass(input: CoachInput): ErrorClass | null {
  const meta = mistakeMeta(input.mistake ?? undefined);
  if (meta) return meta.errorClass;
  // If only an emotion is given and it's anger/frustration, treat as emotional.
  const fam = emotionMeta(input.emotion ?? undefined)?.family;
  if (fam === 'frustration') return 'emotional';
  return null;
}

/**
 * Build a complete deterministic coaching response. `profile` (optional)
 * personalizes tone + self-talk. Crisis/medical text short-circuits to safe
 * referral with NO coaching content.
 */
export function buildCoachResponse(input: CoachInput, profile?: MentalProfile | null): CoachResponse {
  const disclaimer = SHORT_DISCLAIMER;

  // 1) Safety screen first — never coach over crisis/medical language.
  const crisis = screenForCrisis(input.freeText);
  if (crisis.flagged) {
    return {
      kind: 'crisis', routine: null,
      whatHappened: '', nextActionCue: '', selfTalk: '', breathPattern: '',
      visualization: null, drill: null, reflectionPrompt: '', futureTraining: '',
      errorClass: null, tone: 'calm', disclaimer, safety: crisis,
    };
  }
  if (isMedicalAdviceRequest(input.freeText)) {
    return {
      kind: 'medical_redirect', routine: null,
      whatHappened: '', nextActionCue: '', selfTalk: '', breathPattern: '',
      visualization: null, drill: null, reflectionPrompt: '', futureTraining: '',
      errorClass: null, tone: 'calm', disclaimer, safety: medicalRedirect(),
    };
  }

  // 2) Resolve routine + classification.
  const routine = routineForContext(input.sport, input.mistake ?? undefined);
  const errorClass = resolveErrorClass(input);
  const family = emotionMeta(input.emotion ?? undefined)?.family ?? null;
  const tone = profile?.preferredTone ?? toneForEmotion(family, errorClass);

  // 3) Compose explanation (emotion + optional error-class note).
  const classNote = explainErrorClass(errorClass, input.sport);
  const whatHappened = classNote ? `${explainEmotion(family)} ${classNote}` : explainEmotion(family);

  const base: CoachResponse = {
    kind: 'coaching',
    routine,
    whatHappened,
    nextActionCue: `${routine.title}: ${routine.steps[routine.steps.length - 1]}`,
    selfTalk: shapeSelfTalk(routine, profile),
    breathPattern: routine.breathPattern,
    visualization: visualizationFor(input.sport, input.mode, family),
    drill: drillFor(input.sport, routine),
    reflectionPrompt: routine.reflectionPrompt,
    futureTraining: futureTrainingFor(input.sport, routine),
    errorClass,
    tone,
    disclaimer,
  };

  // Parent / coach guidance: same routine, reframed for an adult SUPPORTING an
  // athlete (never adds pressure, never clinical).
  return input.mode === 'parent_coach' ? toParentCoachGuidance(base, input.sport) : base;
}

/** Reframe an athlete-facing response as guidance for a parent or coach. */
function toParentCoachGuidance(base: CoachResponse, sport: MentalSport): CoachResponse {
  const fam = sportFamilyFor(sport);
  const noun = fam === 'golf' ? 'shot' : fam === 'bat' ? 'play' : fam === 'racket' ? 'point' : 'rep';
  return {
    ...base,
    tone: 'encouraging',
    whatHappened:
      'Your athlete just made a mistake and is feeling it. Your calm is contagious — the goal is to '
      + 'help them reset and move on, not to fix the technique in this moment.',
    nextActionCue:
      `Give them space for the reset, then a short, forward cue. Don’t replay the ${noun} — point them at the next one.`,
    selfTalk:
      `Try saying: "Next ${noun}. I’ve got you." Keep it short, warm, and about effort — not the result.`,
    futureTraining:
      'Away from competition, practice the reset together so it becomes their habit — and praise the '
      + 'recovery, not just the outcome.',
  };
}
