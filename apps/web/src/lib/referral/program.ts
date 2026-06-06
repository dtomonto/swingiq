// ============================================================
// SwingVantage — ReferralOS: program configuration
// ------------------------------------------------------------
// The ethical, free-user-growth referral program. Rewards are
// product value (XP, recognition) — not pay-for-spam. English is the
// source of truth; copy is short and honest.
// ============================================================

import type { RewardTier } from './types';

/** UTM + query-param conventions for attributing a referred visit. */
export const REFERRAL_PARAM = 'ref';
export const REFERRAL_UTM = {
  source: 'referral',
  medium: 'invite',
  campaign: 'member-get-member',
} as const;

/** What "activated" means for a referred friend (kept honest + simple). */
export const ACTIVATION_DEFINITION =
  'Referred friend created an account and completed their first swing check.';

/**
 * Reward ladder. Thresholds are credited signups. Rewards are XP +
 * recognition, never anything that incentivizes spammy behavior.
 */
export const REWARD_TIERS: RewardTier[] = [
  {
    id: 'first-friend',
    threshold: 1,
    title: 'First Friend',
    description: 'You brought your first player to SwingVantage.',
    xp: 100,
    icon: '🤝',
  },
  {
    id: 'connector',
    threshold: 3,
    title: 'Connector',
    description: 'Three friends joined through your link.',
    xp: 250,
    icon: '🔗',
  },
  {
    id: 'team-builder',
    threshold: 5,
    title: 'Team Builder',
    description: 'Five players in your circle are improving with you.',
    xp: 500,
    icon: '🏗️',
  },
  {
    id: 'ambassador',
    threshold: 10,
    title: 'Ambassador',
    description: 'Ten friends joined — you are a SwingVantage Ambassador.',
    xp: 1200,
    icon: '🌟',
  },
];

/** Owner-facing target for a healthy invite loop. Informational only. */
export const K_FACTOR_TARGET = 0.5;

/** Channel-specific share copy. {url} is replaced with the invite link. */
export const SHARE_MESSAGES: Record<string, string> = {
  default:
    'I’ve been using SwingVantage to fix my swing — it gives you one clear thing to work on. Try it free: {url}',
  sms: 'Try SwingVantage with me — free swing analysis, one fix at a time: {url}',
  email:
    'Hey — I’ve been using SwingVantage to improve my swing and thought you’d like it. ' +
    'It analyzes your swing and gives you one clear fix to work on. It’s free to start: {url}',
  x: 'Fixing my swing one clear cue at a time with @SwingVantage. Free swing analysis 👇 {url}',
};

export const SHARE_SUBJECT = 'Try SwingVantage with me (free swing analysis)';
