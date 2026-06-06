// ============================================================
// SwingVantage — Agent: Trust / Honesty Linter — Rules
// ------------------------------------------------------------
// The rule catalogue. Each rule runs per-SENTENCE so context-aware
// rules (medical, privacy) can look at surrounding words and avoid
// false positives — e.g. swing "diagnosis" is fine; injury
// "treatment" is not. Patterns are deliberately tight to keep the
// linter trustworthy on the app's own honest copy.
// ============================================================

import type { LintCategory, LintSeverity } from './types';

export interface LintRule {
  id: string;
  category: LintCategory;
  severity: LintSeverity;
  /** Matched against each sentence. */
  pattern: RegExp;
  /** If present and the sentence matches it, the rule is skipped (kept honest). */
  skipIf?: RegExp;
  message: string;
  suggestion: string;
}

// Words that mark a sentence as a (legitimate) video-privacy claim — the owner
// wants these KEPT, so the privacy-overclaim rule skips them.
const VIDEO_CONTEXT = /\b(video|frame|frames|footage|clip|recording|camera roll)\b/i;
// Words that mark a sentence as health/injury context — where medical verbs
// become real (non-)medical claims rather than swing-fault language.
const HEALTH_CONTEXT =
  /\b(injur\w*|pain|sore|medical|health|knee|back|elbow|wrist|shoulder|hip|tendon|muscle)\b/i;
// Words that mark a claim as being about a single-camera/pose estimate.
const ESTIMATE_CONTEXT = /\b(pose|single[- ]camera|video|ai vision|phone camera)\b/i;

export const RULES: LintRule[] = [
  // ── Guarantees / hard overclaims (blocking) ──
  {
    id: 'guarantee',
    category: 'guarantee',
    severity: 'error',
    pattern: /\bguarantee(d|s)?\b/i,
    message: 'Guarantees overpromise — results vary by player and effort.',
    suggestion: 'Reframe as a confident expectation: "designed to help you…" or "most players see…".',
  },
  {
    id: 'percent-absolute',
    category: 'guarantee',
    severity: 'error',
    pattern: /\b100%\s*(accurate|guaranteed|effective|reliable)\b/i,
    message: 'A 100% claim is not defensible for an estimate-based product.',
    suggestion: 'State the real basis instead (e.g. "high-confidence" or a measured range).',
  },
  {
    id: 'cure',
    category: 'guarantee',
    severity: 'error',
    pattern: /\bcure[sd]?\b/i,
    message: '"Cure" is a guarantee (and medical) claim.',
    suggestion: 'Use "improve" or "help with".',
  },

  // ── Medical (blocking, but context-gated to avoid swing "diagnosis") ──
  {
    id: 'medical-treatment',
    category: 'medical',
    severity: 'error',
    pattern: /\b(treat|treatment|heal(s|ed|ing)?|rehab(ilitate)?|therapy|diagnose an injury)\b/i,
    skipIf: undefined, // gated below by requiring HEALTH_CONTEXT in the engine
    message: 'Reads as a medical claim. SwingVantage is not a medical tool.',
    suggestion: 'Defer to a qualified professional for anything health- or injury-related.',
  },

  // ── Misleading "local-only" data claims (keep TRUE video-privacy claims) ──
  {
    id: 'privacy-local-only',
    category: 'privacy_overclaim',
    severity: 'warning',
    pattern:
      /\b(local[- ]only|never leaves your (device|browser|phone)|stays? (on|in) your (device|browser|phone)|nothing is (stored|uploaded|saved)|we (do not|don'?t|never) store)\b/i,
    skipIf: VIDEO_CONTEXT,
    message:
      'Data is cloud-synced for signed-in users — a blanket "local-only" claim is misleading.',
    suggestion:
      'Use hybrid framing ("works offline, syncs to your account"). Keep specific, true video-privacy claims.',
  },
  {
    id: 'privacy-100-private',
    category: 'privacy_overclaim',
    severity: 'warning',
    pattern: /\b100%\s*private\b/i,
    skipIf: VIDEO_CONTEXT,
    message: '"100% private" overclaims for account-synced data.',
    suggestion: 'Describe exactly what is private and what syncs to the account.',
  },

  // ── Measurement overclaims (single-camera is an estimate) ──
  {
    id: 'lab-grade',
    category: 'measurement_overclaim',
    severity: 'warning',
    pattern: /\b(lab[- ]?(grade|accurate|quality)|tour[- ]?grade)\b/i,
    message: 'Implies lab-grade precision the single-camera estimate does not have.',
    suggestion: 'Say "directional estimate" or cite the real, measured source (e.g. launch monitor).',
  },
  {
    id: 'exact-measurement',
    category: 'measurement_overclaim',
    severity: 'warning',
    pattern: /\b(precise measurement|exact (angle|number|measurement)|measured your)\b/i,
    skipIf: undefined, // gated below: only fires in ESTIMATE_CONTEXT
    message: 'Calls an estimate a measurement.',
    suggestion: 'Use "estimated" for pose/single-camera values; reserve "measured" for sensor data.',
  },

  // ── Superlatives / hype (non-blocking) ──
  {
    id: 'superlative',
    category: 'superlative',
    severity: 'warning',
    // Note: '#1' is intentionally NOT flagged — the app uses "your #1 priority"
    // (top priority), which is honest. We only flag product-ranking superlatives.
    pattern: /\b(the best|the only|world'?s best|never miss(es)?|always works)\b/i,
    message: 'Unprovable superlative.',
    suggestion: 'Lead with a specific, true benefit instead of a ranking claim.',
  },
  {
    id: 'instant',
    category: 'hype',
    severity: 'warning',
    pattern: /\binstant(ly)?\b/i,
    message: '"Instant" overpromises the speed of improvement.',
    suggestion: 'Be concrete about timing ("in a few sessions", "in under a minute" for analysis).',
  },
  {
    id: 'magic',
    category: 'hype',
    severity: 'info',
    pattern: /\b(magic|secret|miracle)\b/i,
    message: 'Hype word — undercuts the honest, evidence-led tone.',
    suggestion: 'Replace with the actual mechanism or benefit.',
  },
];

/** Rules that only fire when the sentence carries the matching context. */
export const CONTEXT_GATES: Record<string, RegExp> = {
  'medical-treatment': HEALTH_CONTEXT,
  'exact-measurement': ESTIMATE_CONTEXT,
};
