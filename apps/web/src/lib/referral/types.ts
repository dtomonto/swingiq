// ============================================================
// SwingVantage — ReferralOS: types
// ------------------------------------------------------------
// The viral invite loop. Honest-first: we only ever surface what we
// can actually measure. "Shares" are links the user sent; "credited
// signups" are attributions recorded against this account. No inflated
// vanity numbers, no fake counters.
// ============================================================

export type ShareChannel =
  | 'copy' | 'native' | 'sms' | 'whatsapp' | 'email' | 'x' | 'facebook' | 'reddit';

/** A single outbound share the user performed (recorded locally). */
export interface ShareEvent {
  id: string;
  channel: ShareChannel;
  at: string; // ISO
}

/** A signup credited to this user's link (attribution recorded on this account). */
export interface CreditedSignup {
  id: string;
  /** Opaque friend handle if known (first name / initials) — optional, privacy-safe. */
  label?: string;
  at: string; // ISO
  /** Whether the referred friend reached the "activated" milestone. */
  activated: boolean;
}

/** A reward tier the referrer unlocks as credited signups accrue. */
export interface RewardTier {
  id: string;
  /** Signups required to unlock. */
  threshold: number;
  title: string;
  description: string;
  /** Bonus XP granted toward the community level. */
  xp: number;
  icon: string; // emoji
}

export interface ReferralSettings {
  /** User opted into the referral program (shows the hub prominently). */
  enabled: boolean;
  /** Display name the user wants on shared cards (optional, defaults to generic). */
  displayName?: string;
}

export interface ReferralState {
  version: 1;
  /** Stable, human-readable invite code for this user/device. */
  code: string;
  shares: ShareEvent[];
  credited: CreditedSignup[];
  /** Reward tier ids the user has already seen the celebration for. */
  acknowledgedTiers: string[];
  settings: ReferralSettings;
  createdAt: string;
}

/** Derived, read-only stats for the hub UI. */
export interface ReferralStats {
  shareCount: number;
  signupCount: number;
  activatedCount: number;
  /** Estimated invites-per-share→signup conversion (honest: null until data). */
  conversionRate: number | null;
  /** Simple viral coefficient estimate for the owner: signups / sharers. */
  kFactor: number | null;
  /** XP earned from referral tiers reached. */
  xpEarned: number;
  nextTier: RewardTier | null;
  unlockedTiers: RewardTier[];
  /** 0–100 progress toward the next tier. */
  progressToNext: number;
}
