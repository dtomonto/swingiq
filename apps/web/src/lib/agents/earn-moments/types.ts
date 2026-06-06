// ============================================================
// SwingVantage — Agent: Earn-Moment Referral — Types
// ------------------------------------------------------------
// Detects the peak-emotion moments worth asking for a referral
// (a personal best, a streak milestone, a real improvement, a
// reward-tier unlock) and proposes a grounded invite built on the
// existing ReferralOS engine. Pure data shapes; no React, no DOM.
//
// HONESTY: a moment only fires when the user's own data supports
// it. We never manufacture a "win" to trigger a share.
// ============================================================

/** The kinds of moments, strongest signal first. */
export type EarnMomentKind =
  | 'tier_unlocked'
  | 'personal_best'
  | 'big_improvement'
  | 'streak_milestone'
  | 'consistency'
  | 'first_win';

export interface EarnMoment {
  kind: EarnMomentKind;
  /** 0–100 how strong/celebratory the moment is (drives ranking + tone). */
  strength: number;
  headline: string;
  detail: string;
  /** The data points the moment is grounded in (for transparency). */
  groundedOn: string[];
}

export type ReferralSuppression = 'no_moment' | 'recently_prompted' | 'opted_out';

/** A ready-to-present invite proposal tied to a real moment. */
export interface ReferralPrompt {
  /** True only when a real moment fired and no gate suppressed it. */
  show: boolean;
  moment: EarnMoment | null;
  /** Why-now framing shown above the share controls. */
  headline: string;
  body: string;
  /** Ready-to-send share copy (includes the invite link when available). */
  shareText: string;
  shareSubject: string;
  /** The actual shareable invite URL, or null when no code is available yet. */
  inviteUrl: string | null;
  /** Fallback call-to-action (e.g. open the referral hub to get a code). */
  cta: { label: string; href: string };
  suppressedReason: ReferralSuppression | null;
}

/** Inputs the AgentContext cannot carry (referral state, origin, cadence). */
export interface EarnMomentOptions {
  /** Master opt-in. When false the agent suppresses ('opted_out'). */
  enabled?: boolean;
  /** The user's stable invite code (from ReferralState). */
  code?: string | null;
  /** Public site origin for the invite URL (e.g. https://swingvantage.com). */
  origin?: string;
  /** Reward tiers newly unlocked but not yet celebrated (from ReferralOS). */
  pendingTierTitles?: string[];
  /** ISO time the user was last shown a referral prompt (cadence gate). */
  recentlyPromptedAt?: string | null;
  /** Minimum hours between referral prompts. Default 120 (5 days). */
  minHoursBetweenPrompts?: number;
  /** Where to send the user when there is no direct invite URL. */
  hubHref?: string;
  now?: Date;
}
