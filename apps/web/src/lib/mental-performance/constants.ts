// ============================================================
// SwingVantage — Mental Performance: constants, disclaimers, catalogs
//
// Calm, supportive, athlete-centered copy. This layer is performance
// coaching, NOT therapy. Disclaimers here are deliberately non-alarming.
// ============================================================

import type {
  EmotionalState,
  EmotionFamily,
  ErrorClass,
  MentalProfile,
  MentalSettings,
  MentalState,
  CrisisResource,
} from './types';

// ── Disclaimers (shown wherever coaching appears) ────────────
export const NON_MEDICAL_DISCLAIMER =
  'Mental Performance is sport coaching for focus, composure and confidence — ' +
  'it is not medical or clinical mental-health treatment, diagnosis, or therapy, ' +
  'and it does not replace a licensed professional.';

export const SHORT_DISCLAIMER = 'Performance coaching, not medical or mental-health treatment.';

export const PROFESSIONAL_NOTE =
  'For ongoing anxiety, depression, trauma, panic, or any mental-health concern, ' +
  'please consult a qualified professional.';

export const CRISIS_NOTE =
  'If you are in crisis, feel unsafe, or may harm yourself or others, contact ' +
  'emergency services or a licensed professional immediately.';

/** Calm phrasings the deterministic coach draws from (never shame-based). */
export const SUPPORTIVE_LANGUAGE = {
  normalize: 'Every competitor reacts to mistakes — what matters is your next response.',
  accept: 'Name it without judgment, then let it go.',
  refocus: 'One play at a time. The next one is the only one you control.',
  effortOverOutcome: 'Commit to the process; the score takes care of itself.',
} as const;

// ── Crisis resources (US-forward, honest, with an international note) ──
export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    label: '988 Suicide & Crisis Lifeline (US)',
    detail: 'Free, confidential support 24/7 — call or text.',
    contact: 'Call or text 988',
  },
  {
    label: 'Crisis Text Line',
    detail: 'Text with a trained crisis counselor, 24/7.',
    contact: 'Text HOME to 741741',
  },
  {
    label: 'Emergency services',
    detail: 'If you or someone else is in immediate danger.',
    contact: 'Call 911 (US) or your local emergency number',
  },
  {
    label: 'Outside the US',
    detail: 'Find a local helpline through the International Association for Suicide Prevention.',
    contact: 'iasp.info/resources/Crisis_Centres',
  },
];

export const CRISIS_HEADING = 'You deserve real support right now';
export const CRISIS_MESSAGE =
  'It sounds like you may be going through something serious. SwingVantage is a ' +
  'sport-performance tool, not a crisis or mental-health service, so we won’t try ' +
  'to coach this — but you don’t have to handle it alone. Please reach out to one ' +
  'of these right away.';

export const MEDICAL_HEADING = 'This is outside what SwingVantage can help with';
export const MEDICAL_MESSAGE =
  'That sounds like a health or mental-health question. SwingVantage coaches sport ' +
  'focus and composure, not medical care. Please talk with a qualified professional ' +
  'who can give you real guidance.';

// ── Emotional-state catalog ──────────────────────────────────
export interface EmotionMeta {
  id: EmotionalState;
  label: string;
  family: EmotionFamily;
  /** What kind of reset this emotion usually needs (drives coach defaults). */
  needs: string;
  emoji: string;
}

export const EMOTIONAL_STATES: EmotionMeta[] = [
  { id: 'frustrated', label: 'Frustrated', family: 'frustration', needs: 'release + refocus', emoji: '😤' },
  { id: 'angry', label: 'Angry', family: 'frustration', needs: 'nervous-system reset', emoji: '😠' },
  { id: 'embarrassed', label: 'Embarrassed', family: 'frustration', needs: 'self-compassion + refocus', emoji: '😳' },
  { id: 'nervous', label: 'Nervous', family: 'fear', needs: 'breath + commitment', emoji: '😬' },
  { id: 'distracted', label: 'Distracted', family: 'mixed', needs: 'attention anchor', emoji: '🌀' },
  { id: 'rushed', label: 'Rushed', family: 'arousal_high', needs: 'slow down + routine', emoji: '⏩' },
  { id: 'overthinking', label: 'Overthinking', family: 'mixed', needs: 'simplify to one cue', emoji: '🧠' },
  { id: 'defeated', label: 'Defeated', family: 'arousal_low', needs: 'confidence + small win', emoji: '😞' },
  { id: 'afraid_repeat', label: 'Afraid it happens again', family: 'fear', needs: 'commitment + acceptance', emoji: '😨' },
  { id: 'too_excited', label: 'Too amped up', family: 'arousal_high', needs: 'settle + slow breath', emoji: '🔥' },
  { id: 'too_cautious', label: 'Too cautious', family: 'arousal_low', needs: 'commit + free up', emoji: '🐢' },
  { id: 'calm_uncertain', label: 'Calm but unsure', family: 'mixed', needs: 'clarity + simple plan', emoji: '🤔' },
];

export const emotionMeta = (id: EmotionalState | null | undefined): EmotionMeta | undefined =>
  EMOTIONAL_STATES.find((e) => e.id === id);

// ── Mistake-category catalog ─────────────────────────────────
// `sportFamily` groups which sports a mistake applies to. `errorClass`
// is the default classification the coach uses (overridable per input).
export type SportFamily = 'golf' | 'bat' | 'racket' | 'any';

export interface MistakeMeta {
  id: string;
  label: string;
  sportFamily: SportFamily;
  errorClass: ErrorClass;
  /** Default routine slug to recommend (must exist in routines.ts). */
  routineSlug: string;
}

export const MISTAKE_CATEGORIES: MistakeMeta[] = [
  // Golf
  { id: 'bad_tee_shot', label: 'Bad tee shot', sportFamily: 'golf', errorClass: 'unforced', routineSlug: 'bad-shot-reset' },
  { id: 'water_ball', label: 'Water / penalty ball', sportFamily: 'golf', errorClass: 'emotional', routineSlug: 'penalty-ball-reset' },
  { id: 'three_putt', label: 'Three-putt', sportFamily: 'golf', errorClass: 'unforced', routineSlug: 'three-putt-recovery' },
  { id: 'chunked_wedge', label: 'Chunked / thin wedge', sportFamily: 'golf', errorClass: 'unforced', routineSlug: 'bad-shot-reset' },
  { id: 'shank', label: 'Shank', sportFamily: 'golf', errorClass: 'emotional', routineSlug: 'shank-reset' },
  { id: 'blow_up_hole', label: 'Blow-up hole', sportFamily: 'golf', errorClass: 'emotional', routineSlug: 'blow-up-hole-recovery' },
  { id: 'missed_short_putt', label: 'Missed short putt', sportFamily: 'golf', errorClass: 'unforced', routineSlug: 'three-putt-recovery' },
  { id: 'first_tee_nerves', label: 'First-tee nerves', sportFamily: 'golf', errorClass: 'emotional', routineSlug: 'first-tee-nerves' },
  { id: 'protecting_score', label: 'Protecting a good score', sportFamily: 'golf', errorClass: 'strategic', routineSlug: 'protect-a-score' },
  // Bat (baseball + softball)
  { id: 'fielding_error', label: 'Fielding error', sportFamily: 'bat', errorClass: 'unforced', routineSlug: 'error-recovery' },
  { id: 'throwing_error', label: 'Throwing error', sportFamily: 'bat', errorClass: 'unforced', routineSlug: 'error-recovery' },
  { id: 'dropped_fly', label: 'Dropped fly ball', sportFamily: 'bat', errorClass: 'unforced', routineSlug: 'error-recovery' },
  { id: 'bad_hop', label: 'Bad hop', sportFamily: 'bat', errorClass: 'forced', routineSlug: 'bad-hop-recovery' },
  { id: 'strikeout', label: 'Strikeout', sportFamily: 'bat', errorClass: 'unforced', routineSlug: 'strikeout-recovery' },
  { id: 'baserunning_mistake', label: 'Baserunning mistake', sportFamily: 'bat', errorClass: 'strategic', routineSlug: 'error-recovery' },
  { id: 'pitching_mistake', label: 'Pitching mistake', sportFamily: 'bat', errorClass: 'unforced', routineSlug: 'next-pitch-reset' },
  { id: 'fear_next_ball', label: 'Fear of the next ball', sportFamily: 'bat', errorClass: 'emotional', routineSlug: 'fielding-confidence' },
  // Racket (tennis / pickleball / padel)
  { id: 'forced_error', label: 'Forced error', sportFamily: 'racket', errorClass: 'forced', routineSlug: 'forced-error-recovery' },
  { id: 'unforced_error', label: 'Unforced error', sportFamily: 'racket', errorClass: 'unforced', routineSlug: 'unforced-error-reset' },
  { id: 'double_fault', label: 'Double fault', sportFamily: 'racket', errorClass: 'unforced', routineSlug: 'serve-reset' },
  { id: 'missed_return', label: 'Missed return', sportFamily: 'racket', errorClass: 'unforced', routineSlug: 'between-point-reset' },
  { id: 'netted_volley', label: 'Netted volley', sportFamily: 'racket', errorClass: 'unforced', routineSlug: 'between-point-reset' },
  { id: 'lost_long_rally', label: 'Lost a long rally', sportFamily: 'racket', errorClass: 'forced', routineSlug: 'forced-error-recovery' },
  { id: 'partner_frustration', label: 'Frustration with partner', sportFamily: 'racket', errorClass: 'emotional', routineSlug: 'doubles-frustration-reset' },
  { id: 'bad_line_call', label: 'Bad line call', sportFamily: 'racket', errorClass: 'emotional', routineSlug: 'between-point-reset' },
  { id: 'choking_ahead', label: 'Tightening up while ahead', sportFamily: 'racket', errorClass: 'strategic', routineSlug: 'one-point-reset' },
  { id: 'rushing_behind', label: 'Rushing while behind', sportFamily: 'racket', errorClass: 'strategic', routineSlug: 'one-point-reset' },
  // Universal
  { id: 'general_mistake', label: 'A mistake I can’t shake', sportFamily: 'any', errorClass: 'emotional', routineSlug: 'universal-reset' },
  { id: 'pre_game_nerves', label: 'Pre-game nerves', sportFamily: 'any', errorClass: 'emotional', routineSlug: 'pre-game-routine' },
  { id: 'lost_confidence', label: 'Lost confidence', sportFamily: 'any', errorClass: 'emotional', routineSlug: 'confidence-rebuilding' },
];

export const mistakeMeta = (id: string | null | undefined): MistakeMeta | undefined =>
  MISTAKE_CATEGORIES.find((m) => m.id === id);

/** Sports → family, for mapping a SportId to its mistake set. */
export function sportFamilyFor(sport: string): SportFamily {
  if (sport === 'golf') return 'golf';
  if (sport === 'baseball' || sport === 'softball_slow' || sport === 'softball_fast') return 'bat';
  if (sport === 'tennis' || sport === 'pickleball' || sport === 'padel') return 'racket';
  return 'any';
}

// ── Defaults ─────────────────────────────────────────────────
export const DEFAULT_PROFILE: MentalProfile = {
  preferredResetStyle: null,
  preferredTone: null,
  commonTriggers: [],
  sportFocus: null,
  pressureComfort: null,
  confidence: null,
  focus: null,
  recoverySpeed: null,
  selfTalkPreference: null,
  notes: '',
  updatedAt: null,
};

export const DEFAULT_SETTINGS: MentalSettings = {
  enabled: false,
  consentedAt: null,
  storeLogs: false,
  preferredTone: null,
  lastSituation: null,
};

export const DEFAULT_MENTAL_STATE: MentalState = {
  version: 1,
  settings: { ...DEFAULT_SETTINGS },
  profile: { ...DEFAULT_PROFILE },
  logs: [],
  planAssignments: [],
};

// ── Tone presets (self-talk flavor) ──────────────────────────
export const TONE_LABELS: Record<string, string> = {
  calm: 'Calm & steady',
  direct: 'Direct & simple',
  encouraging: 'Encouraging',
  tactical: 'Tactical',
};

/** Feature-flag env key for the whole section (default ON). */
export const SECTION_FLAG_ENV = 'NEXT_PUBLIC_MENTAL_PERFORMANCE';
/** Feature-flag env key for the optional AI-rewrite seam (default OFF). */
export const AI_FLAG_ENV = 'MENTAL_AI_ENABLED';
