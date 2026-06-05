// ============================================================
// SwingVantage — Video Studio: Brand & Quality Governance
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   This is the "house style guide" every generated video must follow.
//   It sets the voice, the reading level, the maximum length per video
//   type, the calls-to-action we use, and — importantly — the claims we
//   are NEVER allowed to make (no fake guarantees, no medical advice,
//   no "measured" when we mean "estimated").
//
//   The brief generator reads this, and `vetClaims()` is a guardrail
//   that flags any script line that drifts off-brand BEFORE a video is
//   produced. It encodes the product's honest-but-confident voice:
//   we keep the "estimate / starting point / see a coach" framing, but
//   word it warmly and with confidence (never apologetic, never hyped).
// ============================================================

import type { VideoType, VideoStyle, StudioSport } from './types';

export interface BrandVoice {
  tone: string;
  /** Target reading grade level for narration. */
  readingLevel: number;
  /** Voice qualities to lean into. */
  attributes: string[];
  /** Things the voice must never be. */
  avoid: string[];
}

export const BRAND_VOICE: BrandVoice = {
  tone: 'Warm, confident, plain-spoken coach. Encouraging without hype. Premium and modern, never cheesy.',
  readingLevel: 7,
  attributes: [
    'clear and concrete',
    'confident and welcoming',
    'honest about what is an estimate',
    'action-oriented (always a next step)',
    'inclusive of players, parents, coaches, and teams',
  ],
  avoid: [
    'jargon without explanation',
    'hype or false urgency',
    'apologetic hedging ("sorry, this is just a guess")',
    'guarantees of results or scores',
    'medical or injury-diagnosis claims',
  ],
};

/** CTA style: short, verb-first, benefit-led. */
export const CTA_STYLE = {
  pattern: 'Verb-first, 2–6 words, names the benefit. e.g. "See your top fix".',
  examples: [
    'See how it works',
    'Analyze your swing',
    'Get your top fix',
    'Start your free plan',
    'Read your results',
  ],
};

/** Default visual style per video type (the brief can override). */
export const DEFAULT_STYLE_BY_TYPE: Record<VideoType, VideoStyle> = {
  hero_explainer: 'hybrid',
  feature_tutorial: 'screen_capture',
  onboarding_walkthrough: 'screen_capture',
  contextual_tooltip: 'motion_graphics',
  help_center: 'screen_capture',
  empty_state: 'motion_graphics',
  error_resolution: 'screen_capture',
  product_tour: 'hybrid',
  results_explainer: 'screen_capture',
  trust_safety: 'kinetic_text',
  comparison: 'motion_graphics',
  conversion_upgrade: 'hybrid',
  re_engagement: 'kinetic_text',
  sport_instructional: 'live_action',
  admin_training: 'screen_capture',
};

/** Maximum length (seconds) per video type — keeps videos tight (spec §13). */
export const MAX_DURATION_BY_TYPE: Record<VideoType, number> = {
  hero_explainer: 75,
  feature_tutorial: 150,
  onboarding_walkthrough: 120,
  contextual_tooltip: 30,
  help_center: 120,
  empty_state: 30,
  error_resolution: 60,
  product_tour: 120,
  results_explainer: 90,
  trust_safety: 60,
  comparison: 75,
  conversion_upgrade: 60,
  re_engagement: 30,
  sport_instructional: 120,
  admin_training: 240,
};

/** Accessibility defaults every video inherits (spec §10). */
export const ACCESSIBILITY_DEFAULTS = [
  'Captions on by default',
  'Full transcript available',
  'Keyboard-operable controls with visible focus',
  'Screen-reader labels on all controls',
  'No essential info conveyed by audio alone',
  'Respects prefers-reduced-motion (no autoplay motion when reduced)',
  'Overlay text meets WCAG AA contrast',
];

/** Sport-specific language so instructional videos use the right terms. */
export const SPORT_LANGUAGE: Record<StudioSport, { unit: string; cues: string[]; surface: string }> = {
  golf: { unit: 'carry distance', cues: ['takeaway', 'top of backswing', 'impact', 'follow-through'], surface: 'the range or course' },
  tennis: { unit: 'contact point', cues: ['unit turn', 'racket drop', 'contact', 'follow-through'], surface: 'the court' },
  baseball: { unit: 'exit velocity', cues: ['load', 'stride', 'contact', 'extension'], surface: 'the cage or field' },
  softball_slow: { unit: 'contact quality', cues: ['load', 'weight shift', 'contact', 'finish'], surface: 'the field' },
  softball_fast: { unit: 'bat speed', cues: ['load', 'stride', 'contact', 'extension'], surface: 'the field' },
};

/**
 * Legal/compliance disclaimers, keyed by video type. The brief generator
 * attaches the relevant ones to `complianceNotes`. These keep our honest
 * framing intact (see feedback: keep disclaimers, reframe confident).
 */
export const COMPLIANCE_NOTES: Partial<Record<VideoType, string[]>> = {
  results_explainer: [
    'Frame visual conclusions as estimates / a smart starting point, not measurements.',
    'Mention that a coach can confirm what the analysis suggests.',
  ],
  sport_instructional: [
    'Include a brief "stop if you feel pain" safety note.',
    'No medical or injury-treatment claims.',
  ],
  trust_safety: [
    'Describe privacy accurately: data is tied to the account and synced — not "never leaves your device".',
    'Youth privacy protections are on by default.',
  ],
  conversion_upgrade: [
    'No guaranteed-results or guaranteed-score claims.',
    'State that core analysis is free.',
  ],
};

// ── Claim guardrails ──────────────────────────────────────────

export type ClaimSeverity = 'block' | 'warn';

export interface ClaimFinding {
  severity: ClaimSeverity;
  /** The line (or phrase) that triggered the finding. */
  line: string;
  /** Why it was flagged. */
  reason: string;
  /** Suggested on-brand rewrite direction. */
  suggestion: string;
}

interface ClaimRule {
  severity: ClaimSeverity;
  /** Case-insensitive matcher. */
  pattern: RegExp;
  reason: string;
  suggestion: string;
}

/**
 * Phrases that violate the honest-but-confident voice. `block` rules must
 * be fixed before a video is produced; `warn` rules are advisory.
 */
const CLAIM_RULES: ClaimRule[] = [
  {
    severity: 'block',
    pattern: /\b(guarantee|guaranteed|guarantees)\b/i,
    reason: 'We never guarantee results or scores.',
    suggestion: 'Describe the likely benefit ("helps you…") instead of guaranteeing it.',
  },
  {
    severity: 'block',
    pattern: /\b(cure|diagnose|treat|injury-free|prevents? injury)\b/i,
    reason: 'No medical / injury-treatment claims.',
    suggestion: 'Keep to performance language; add the safety note instead.',
  },
  {
    severity: 'block',
    pattern: /\bnever leaves? your (device|phone|browser)\b/i,
    reason: 'Inaccurate — data is account-synced, not device-only.',
    suggestion: 'Say "tied to your private account and synced across your devices".',
  },
  {
    severity: 'warn',
    pattern: /\b(measured|exact|precise|precisely)\b/i,
    reason: 'Visual analysis is an estimate, not a measurement.',
    suggestion: 'Use "estimated" / "a smart starting point".',
  },
  {
    severity: 'warn',
    pattern: /\b(best|#1|number one|unbeatable|revolutionary)\b/i,
    reason: 'Avoid hype / superlatives.',
    suggestion: 'Lead with a concrete, specific benefit.',
  },
  {
    severity: 'warn',
    pattern: /\bsorry\b|\bjust a guess\b|\bonly an estimate\b/i,
    reason: 'Apologetic hedging — reframe confidently.',
    suggestion: 'State the estimate with confidence ("a strong starting read").',
  },
];

/**
 * Vet a set of script lines against the brand claim rules. Returns every
 * finding; callers decide policy (the brief generator records warnings and
 * blocks publishing when a `block` finding is present).
 */
export function vetClaims(lines: string[]): ClaimFinding[] {
  const findings: ClaimFinding[] = [];
  for (const line of lines) {
    for (const rule of CLAIM_RULES) {
      if (rule.pattern.test(line)) {
        findings.push({
          severity: rule.severity,
          line,
          reason: rule.reason,
          suggestion: rule.suggestion,
        });
      }
    }
  }
  return findings;
}

/** True when a script is safe to produce (no hard `block` violations). */
export function isOnBrand(lines: string[]): boolean {
  return !vetClaims(lines).some((f) => f.severity === 'block');
}
