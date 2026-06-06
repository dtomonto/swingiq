// ============================================================
// SwingVantage — ReferralOS: pure engine (no React, no DOM)
// ------------------------------------------------------------
// Code generation, invite-link building, and honest stat math.
// Deterministic and unit-testable.
// ============================================================

import type { ReferralState, ReferralStats, RewardTier, ShareChannel } from './types';
import { REFERRAL_PARAM, REFERRAL_UTM, REWARD_TIERS, SHARE_MESSAGES } from './program';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars

/** Generate a short, human-friendly invite code (e.g. "SV-7KQ4MX"). */
export function generateCode(rand: () => number = Math.random): string {
  let body = '';
  for (let i = 0; i < 6; i += 1) {
    body += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  }
  return `SV-${body}`;
}

/**
 * Build the full invite URL for a code. `origin` should be the public
 * site origin (e.g. https://swingvantage.com). Falls back to a relative
 * path when origin is empty so the link is never broken.
 */
export function buildInviteUrl(code: string, origin: string): string {
  const params = new URLSearchParams({
    [REFERRAL_PARAM]: code,
    utm_source: REFERRAL_UTM.source,
    utm_medium: REFERRAL_UTM.medium,
    utm_campaign: REFERRAL_UTM.campaign,
  });
  const base = origin ? origin.replace(/\/$/, '') : '';
  return `${base}/start?${params.toString()}`;
}

/** Resolve the share message for a channel, with {url} interpolated. */
export function shareMessage(channel: ShareChannel, url: string): string {
  const template =
    SHARE_MESSAGES[channel] ?? SHARE_MESSAGES.default;
  return template.replace('{url}', url);
}

/** Sorted ascending by threshold. */
export function tiersByThreshold(): RewardTier[] {
  return [...REWARD_TIERS].sort((a, b) => a.threshold - b.threshold);
}

/**
 * Compute honest, derived stats from raw state. Never invents numbers:
 * conversion + kFactor are null until there is enough signal to be real.
 */
export function computeStats(state: ReferralState): ReferralStats {
  const shareCount = state.shares.length;
  const signupCount = state.credited.length;
  const activatedCount = state.credited.filter((c) => c.activated).length;

  const tiers = tiersByThreshold();
  const unlockedTiers = tiers.filter((t) => signupCount >= t.threshold);
  const nextTier = tiers.find((t) => signupCount < t.threshold) ?? null;
  const xpEarned = unlockedTiers.reduce((sum, t) => sum + t.xp, 0);

  const prevThreshold = unlockedTiers.length
    ? unlockedTiers[unlockedTiers.length - 1].threshold
    : 0;
  const progressToNext = nextTier
    ? Math.round(
        ((signupCount - prevThreshold) / (nextTier.threshold - prevThreshold)) * 100,
      )
    : 100;

  // Only report a conversion rate once at least one link was shared.
  const conversionRate = shareCount > 0 ? signupCount / shareCount : null;
  // K-factor here is per-sharer (this single user): signups they generated.
  const kFactor = shareCount > 0 ? signupCount : null;

  return {
    shareCount,
    signupCount,
    activatedCount,
    conversionRate,
    kFactor,
    xpEarned,
    nextTier,
    unlockedTiers,
    progressToNext: Math.max(0, Math.min(100, progressToNext)),
  };
}

/** Tiers newly crossed but not yet acknowledged (for celebration prompts). */
export function pendingTierCelebrations(state: ReferralState): RewardTier[] {
  const stats = computeStats(state);
  return stats.unlockedTiers.filter((t) => !state.acknowledgedTiers.includes(t.id));
}
