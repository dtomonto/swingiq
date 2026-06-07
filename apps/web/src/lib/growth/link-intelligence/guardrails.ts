// ============================================================
// Link Intelligence Agent — guardrails (white-hat, safe-by-default)
// ------------------------------------------------------------
// Two jobs:
//   1. Decide whether an internal-link recommendation is safe to AUTO-APPLY
//      (everything else needs human approval). §17 of the spec.
//   2. Enforce WHITE-HAT-only backlink tactics — the agent must never
//      recommend spam, PBNs, paid links, link farms, etc.
// Pure functions — easy to unit-test and reason about.
// ============================================================

import type { PageNode, AnchorKind, AnchorProfile } from './types';

/** Minimum opportunity score before an internal link may auto-apply. */
export const SAFE_AUTO_APPLY_MIN_SCORE = 70;

/** Anchor kinds that may NEVER auto-apply (over-optimization / low value). */
const UNSAFE_AUTO_ANCHORS: AnchorKind[] = ['exact-match', 'generic', 'image-alt'];

export interface AutoApplyDecision {
  safe: boolean;
  reasons: string[];
}

/**
 * Can this internal-link recommendation be applied automatically (no human)?
 * Conservative by design — when in doubt, require approval.
 */
export function evaluateAutoApply(params: {
  source: PageNode;
  dest: PageNode;
  anchorKind: AnchorKind;
  score: number;
  destProfile?: AnchorProfile;
}): AutoApplyDecision {
  const { source, dest, anchorKind, score, destProfile } = params;
  const reasons: string[] = [];
  let safe = true;

  if (source.sensitive) { safe = false; reasons.push('Source is a money/conversion page — human approval required.'); }
  if (source.pageType === 'home') { safe = false; reasons.push('Homepage/nav changes always need approval.'); }
  if (source.pageType === 'legal') { safe = false; reasons.push('Legal pages are not auto-edited.'); }

  const relevant = source.cluster === dest.cluster || source.sport === dest.sport;
  if (!relevant) { safe = false; reasons.push('Source and destination are not closely related.'); }

  if (UNSAFE_AUTO_ANCHORS.includes(anchorKind)) {
    safe = false;
    reasons.push(`Anchor type "${anchorKind}" requires review (over-optimization / low value).`);
  }

  if (score < SAFE_AUTO_APPLY_MIN_SCORE) {
    safe = false;
    reasons.push(`Confidence ${score} is below the auto-apply threshold (${SAFE_AUTO_APPLY_MIN_SCORE}).`);
  }

  if (destProfile?.overOptimized) {
    safe = false;
    reasons.push('Destination already has an over-optimized anchor profile — adding more needs review.');
  }

  if (safe) reasons.push('Highly relevant, natural anchor, high confidence, reversible — safe to auto-apply.');
  return { safe, reasons };
}

// ── White-hat backlink enforcement ────────────────────────────

/** Tactics the agent must NEVER produce or recommend. */
export const BLACKLISTED_TACTICS = [
  'pbn', 'private blog network', 'link farm', 'paid link', 'buy link', 'link scheme',
  'comment spam', 'forum spam', 'guestbook', 'cloaking', 'doorway', 'hidden link',
  'mass directory', 'link exchange scheme', 'article spinning', 'expired domain redirect',
];

export interface WhiteHatVerdict {
  ok: boolean;
  reason: string;
}

/**
 * Validate a backlink opportunity is white-hat. Rejects anything matching a
 * blacklisted tactic or carrying an unacceptable spam risk.
 */
export function validateWhiteHat(input: {
  opportunityType: string;
  targetOutlet: string;
  pitchAngle?: string;
  spamRisk?: number; // 0..1
}): WhiteHatVerdict {
  const hay = `${input.opportunityType} ${input.targetOutlet} ${input.pitchAngle ?? ''}`.toLowerCase();
  const hit = BLACKLISTED_TACTICS.find((t) => hay.includes(t));
  if (hit) return { ok: false, reason: `Rejected: matches blacklisted tactic "${hit}".` };
  if ((input.spamRisk ?? 0) > 0.5) return { ok: false, reason: `Rejected: spam risk too high (${Math.round((input.spamRisk ?? 0) * 100)}%).` };
  return { ok: true, reason: 'Editorial, relevant, white-hat opportunity.' };
}

/** Actions that ALWAYS require human approval (never auto-executed). §17. */
export const ALWAYS_REQUIRES_APPROVAL = [
  'outreach / external communication',
  'homepage, header, footer or global nav changes',
  'links on money/conversion pages',
  'programmatic link-template changes',
  'redirect / canonical / noindex changes',
  'content deletion or consolidation',
  'backlink disavow recommendations',
] as const;
