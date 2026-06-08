// ============================================================
// SwingVantage — Mental Performance: safety screen (pure)
//
// Screens free text for crisis / self-harm / harm-to-others language and for
// requests for medical or clinical advice. When flagged, the coach short-
// circuits to calm, supportive referral language and NEVER attempts therapy
// or counseling. Deliberately conservative about false positives so common
// sport idioms ("kill this putt", "this is killing me") do NOT trigger it.
// ============================================================

import type { CrisisReferral } from './types';
import {
  CRISIS_RESOURCES, CRISIS_HEADING, CRISIS_MESSAGE,
  MEDICAL_HEADING, MEDICAL_MESSAGE,
} from './constants';

// Patterns that genuinely indicate self-harm / suicide / harm to others.
// Each requires the harmful intent to attach to a person (self/other), so
// "kill this shot" or "dying out here" do not match.
const CRISIS_PATTERNS: RegExp[] = [
  // "kill myself" — deliberately NOT "kill me" (the idiom "this is killing me").
  /\bkill(ing)?\s+(myself|my\s*self)\b/i,
  /\bwant\s+(to|someone\s+to)\s+kill\s+me\b/i,
  /\b(i\s+)?(want|wanna|going|plan|need)\s+to\s+die\b/i,
  /\bend(ing)?\s+(my|it\s+all)\s*(life|own\s+life)?\b/i,
  /\bend\s+it\s+all\b/i,
  /\b(commit|committing)\s+suicide\b/i,
  /\bsuicid(e|al)\b/i,
  /\bself[-\s]?harm(ing)?\b/i,
  /\bhurt(ing)?\s+(myself|my\s*self)\b/i,
  /\bcut(ting)?\s+(myself|my\s*self)\b/i,
  /\b(no\s+(reason|point)\s+(to|in)\s+(live|living))\b/i,
  /\b(better\s+off\s+dead)\b/i,
  /\b(don'?t|do\s+not)\s+want\s+to\s+(be\s+here|live|exist)\b/i,
  /\b(kill|hurt|harm)\s+(him|her|them|someone|people|everyone)\b/i,
];

/**
 * Screen text for crisis language. Returns a referral payload; `flagged`/
 * `severity` tell the caller whether to short-circuit normal coaching.
 */
export function screenForCrisis(text: string | null | undefined): CrisisReferral {
  const t = (text ?? '').trim();
  const flagged = t.length > 0 && CRISIS_PATTERNS.some((re) => re.test(t));
  if (!flagged) {
    return { flagged: false, severity: 'none', heading: '', message: '', resources: [] };
  }
  return {
    flagged: true,
    severity: 'urgent',
    heading: CRISIS_HEADING,
    message: CRISIS_MESSAGE,
    resources: CRISIS_RESOURCES,
  };
}

// Requests for clinical diagnosis or medication — outside sport coaching.
// NOTE: encouraging someone to "see a therapist" is good and is NOT redirected;
// we only redirect attempts to get a diagnosis / medication / clinical answer.
const MEDICAL_PATTERNS: RegExp[] = [
  /\bdiagnos(e|is|ed|ing)\b/i,
  /\bdo\s+i\s+have\s+(an?\s+)?(depression|anxiety|adhd|ocd|ptsd|bipolar|panic\s+disorder|\w+\s+disorder|a\s+mental\s+illness)\b/i,
  /\b(what|which)\s+(medication|meds|antidepressant|drug)\b/i,
  /\b(should\s+i\s+(take|try)\s+(medication|meds|antidepressants?|adderall|xanax|prozac))\b/i,
  /\bis\s+this\s+(a\s+)?panic\s+attack\b/i,
  /\b(clinical|clinically)\s+(depressed|anxious|diagnosed)\b/i,
];

export function isMedicalAdviceRequest(text: string | null | undefined): boolean {
  const t = (text ?? '').trim();
  return t.length > 0 && MEDICAL_PATTERNS.some((re) => re.test(t));
}

/** Convenience referral payload for a medical-advice redirect. */
export function medicalRedirect(): CrisisReferral {
  return {
    flagged: true,
    severity: 'support',
    heading: MEDICAL_HEADING,
    message: MEDICAL_MESSAGE,
    resources: CRISIS_RESOURCES.filter((r) => !r.label.startsWith('Emergency')),
  };
}
