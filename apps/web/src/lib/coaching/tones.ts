// ============================================================
// SwingIQ — Coaching Tone Modes
// ------------------------------------------------------------
// A small, audience-oriented "tone" the user can pick once and
// have the app speak to them appropriately: Beginner, Parent,
// Competitive, or Coach.
//
// This is distinct from `settings.coaching_style` (which controls
// verbosity: detailed / concise / encouragement / balanced). Tone
// is about WHO the result is for and HOW it should be framed.
//
// Framework-agnostic (no React) so it can be reused by the UI, the
// onboarding flow, and the AI-coach prompt builder.
// ============================================================

export type CoachingTone = 'beginner' | 'parent' | 'competitive' | 'coach' | 'team';

export interface ToneGuidance {
  id: CoachingTone;
  label: string;
  /** One-line description shown in the selector. */
  description: string;
  /** How much detail the output should carry. */
  detail: 'simple' | 'balanced' | 'technical';
  /** A short framing line shown above a result in this tone. */
  resultIntro: string;
  /** Optional extra safety / positivity note shown with results. */
  note?: string;
  /** A compact style instruction usable inside an AI-coach prompt. */
  promptHint: string;
}

export const DEFAULT_TONE: CoachingTone = 'beginner';

export const COACHING_TONES: ToneGuidance[] = [
  {
    id: 'beginner',
    label: 'Beginner-friendly',
    description: 'Simple language, one focus at a time.',
    detail: 'simple',
    resultIntro: "Here's the one thing to focus on first — in plain language.",
    promptHint:
      'Use simple, encouraging language. Avoid jargon, and briefly explain any technical term. Give one priority at a time.',
  },
  {
    id: 'parent',
    label: 'Parent-friendly',
    description: 'Safety-first and encouraging, for guiding a young athlete.',
    detail: 'simple',
    resultIntro: 'A positive, safety-first plan you can guide your athlete through.',
    note:
      'Keep it fun and praise effort over results. Work on one focus at a time, and stop if anything causes pain — check with a qualified coach or professional.',
    promptHint:
      'Use supportive, parent-facing language. Emphasize safety, fun, and encouragement over pressure. Note when to consult a qualified coach. Never push intensity for a young athlete.',
  },
  {
    id: 'competitive',
    label: 'Competitive athlete',
    description: 'More technical detail and performance targets.',
    detail: 'technical',
    resultIntro: 'A more technical breakdown with targets you can measure.',
    promptHint:
      'Use precise, performance-oriented language. Include relevant mechanics, metrics to track, and progression targets. Assume familiarity with the sport.',
  },
  {
    id: 'coach',
    label: 'Coach',
    description: 'A concise athlete summary you can share or use in a session.',
    detail: 'balanced',
    resultIntro: 'A concise summary you can share with an athlete or use in a session.',
    note: 'Designed to support — not replace — your own coaching judgment.',
    promptHint:
      "Use concise, coach-facing language. Summarize the athlete's focus, suggested drills, and a practice assignment. Frame everything as input to the coach's judgment.",
  },
  {
    id: 'team',
    label: 'Team organizer',
    description: 'One clear focus you can hand to every player.',
    detail: 'balanced',
    resultIntro: 'One clear focus you can give each athlete before the next practice.',
    note: 'Built to scale across a roster — and to support, not replace, qualified coaching.',
    promptHint:
      'Use clear, scalable, operational language for a team organizer managing multiple athletes. Give one simple focus per player that is easy to communicate and repeat across a roster. Keep it safe and supportive, and defer mechanics to qualified coaching.',
  },
];

const TONE_MAP: Record<CoachingTone, ToneGuidance> = COACHING_TONES.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as Record<CoachingTone, ToneGuidance>,
);

/** Resolve a tone (falling back to the default for null/undefined/unknown). */
export function getTone(id?: CoachingTone | null): ToneGuidance {
  return (id && TONE_MAP[id]) || TONE_MAP[DEFAULT_TONE];
}

/** A sensible default tone derived from an onboarding user type. */
export function toneFromUserType(
  userType: 'athlete' | 'parent' | 'coach' | 'team',
): CoachingTone {
  switch (userType) {
    case 'parent':
      return 'parent';
    case 'coach':
      return 'coach';
    case 'team':
      return 'team';
    case 'athlete':
    default:
      return 'beginner';
  }
}
