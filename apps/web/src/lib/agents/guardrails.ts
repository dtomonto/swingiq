// ============================================================
// SwingVantage — Agent Layer: Guardrails
// ------------------------------------------------------------
// Runs before user-facing recommendations are shown. Detects
// pain/injury language, youth context, medical claims, and
// overtraining risk, and returns safe fallbacks. The agent
// layer never gives medical advice and always defers to a
// qualified professional when appropriate.
// ============================================================

import type { AgentContext, SafetyFlag } from './types';

// ── Text detectors (used on free-text goals / notes) ──────────

const PAIN_PATTERNS = [
  /\b(pain|hurts?|hurting|injur(y|ed|ies)|sore(ness)?|ache|aching|strain(ed)?|sprain(ed)?|tendon|torn|tear|surgery|physio|inflamm)/i,
];

const MEDICAL_CLAIM_PATTERNS = [
  /\b(diagnos(e|is)|treat(ment)?|cure|rehab|therapy|concussion|fracture|dislocat)/i,
];

export function detectPainLanguage(text: string | null | undefined): boolean {
  if (!text) return false;
  return PAIN_PATTERNS.some((p) => p.test(text));
}

export function detectMedicalClaim(text: string | null | undefined): boolean {
  if (!text) return false;
  return MEDICAL_CLAIM_PATTERNS.some((p) => p.test(text));
}

// ── Context-level evaluation ──────────────────────────────────

export function isYouthContext(ctx: AgentContext): boolean {
  return ctx.usageCategory === 'minor_13_17' || ctx.usageCategory === 'minor_under_13';
}

export function isParentOrCoachContext(ctx: AgentContext): boolean {
  return ctx.usageCategory === 'parent_guardian' || ctx.usageCategory === 'coach';
}

/**
 * Produces safety flags from the current context. These annotate or gate
 * recommendations — they never block the core product flow.
 */
export function evaluateSafety(ctx: AgentContext): SafetyFlag[] {
  const flags: SafetyFlag[] = [];

  const goalText = ctx.profile.goal ?? '';
  const injuryText = ctx.golfProfile?.injury_notes ?? '';

  if (detectPainLanguage(goalText) || detectPainLanguage(injuryText)) {
    flags.push({
      id: 'pain_injury',
      type: 'pain_injury',
      severity: 'stop',
      message:
        'You mentioned pain or an injury. If anything hurts, stop and check with a sports-medicine professional before training. SwingVantage helps with technique, not injuries.',
      recommendProfessional: true,
    });
  }

  if (detectMedicalClaim(goalText)) {
    flags.push({
      id: 'medical_claim',
      type: 'medical_claim',
      severity: 'caution',
      message:
        'SwingVantage is not a medical tool and cannot diagnose or treat injuries. For anything health-related, please consult a qualified professional.',
      recommendProfessional: true,
    });
  }

  if (isYouthContext(ctx)) {
    flags.push({
      id: 'youth',
      type: 'youth',
      severity: 'info',
      message:
        'For a younger athlete, keep sessions short and focus on one cue at a time. Stop if it stops being fun or if anything hurts.',
      recommendProfessional: false,
    });
  }

  // Overtraining nudge: a long active streak with no rest day.
  if (ctx.streakDays >= 14) {
    flags.push({
      id: 'overtraining',
      type: 'overtraining',
      severity: 'info',
      message:
        'Great consistency — remember that rest days are part of improvement. Mix in a lighter day so your body recovers.',
      recommendProfessional: false,
    });
  }

  return flags;
}

/** True if a flag should prevent confident technical recommendations. */
export function shouldSoftenRecommendations(flags: SafetyFlag[]): boolean {
  return flags.some((f) => f.severity === 'stop');
}
