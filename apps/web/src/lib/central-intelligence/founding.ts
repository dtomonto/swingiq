// ============================================================
// CentralIntelligenceOS — Founding Fathers qualification (pure)
// ------------------------------------------------------------
// The qualification rules and the membership-tier gate, as pure
// functions so they can be tested exhaustively and reused by the
// client banner, the server claim endpoint, and the admin center.
//
// RULE: a user qualifies only when BOTH are true —
//   1. their player profile is fully complete, AND
//   2. they have recorded the required number of valid sessions.
// A bare account registration never qualifies.
//
// The scarce, tamper-sensitive value (the member NUMBER) is assigned
// server-side in qualification order — never by the client. These
// functions compute *eligibility* and *status*; founding-server.ts
// owns number assignment.
// ============================================================

import type { FoundingCampaignProgress, FoundingCampaignStatus, FoundingUserProgress } from './types';
import { FOUNDING_REQUIRED_COUNT, FOUNDING_REQUIRED_SESSIONS, FOUNDING_COUNTER_BASELINE } from './config';

export interface FoundingEvaluationInput {
  profileCompleted: boolean;
  profileCompletionPercent: number;
  validSessionCount: number;
  /** Server-assigned member number once claimed + confirmed (else null). */
  memberNumber?: number | null;
  qualifiedAt?: string | null;
  /** True when all founding spots are already filled (from campaign progress). */
  campaignFull?: boolean;
  requiredSessions?: number;
}

function deriveStatus(
  eligible: boolean,
  memberNumber: number | null,
  profileCompleted: boolean,
  profileCompletionPercent: number,
  validSessionCount: number,
  campaignFull: boolean,
): FoundingCampaignStatus {
  if (memberNumber != null) return 'qualified';
  if (eligible) return campaignFull ? 'waitlisted_after_cap' : 'qualified';
  if (profileCompleted) return 'profile_complete_sessions_needed';
  if (profileCompletionPercent > 0 || validSessionCount > 0) return 'profile_incomplete';
  return 'not_started';
}

/**
 * Evaluate a user's Founding Fathers progress from their own (local) data.
 * `eligible` means both conditions are met — the user may now CLAIM a number.
 * The returned `memberNumber` is only ever the server-confirmed value passed in.
 */
export function evaluateFoundingFathersStatus(input: FoundingEvaluationInput): FoundingUserProgress {
  const requiredSessions = input.requiredSessions ?? FOUNDING_REQUIRED_SESSIONS;
  const memberNumber = input.memberNumber ?? null;
  const validSessionCount = Math.max(0, Math.floor(input.validSessionCount || 0));
  const eligible = input.profileCompleted && validSessionCount >= requiredSessions;
  const status = deriveStatus(
    eligible,
    memberNumber,
    input.profileCompleted,
    input.profileCompletionPercent,
    validSessionCount,
    input.campaignFull ?? false,
  );

  return {
    profileCompleted: input.profileCompleted,
    profileCompletionPercent: input.profileCompletionPercent,
    validSessionCount,
    requiredSessions,
    eligible,
    status,
    memberNumber,
    qualifiedAt: input.qualifiedAt ?? null,
  };
}

export interface MembershipGateInput {
  /** REAL qualified-member count (the public counter adds the launch baseline). */
  qualifiedCount: number;
  requiredCount?: number;
  /** Admin override: true = force-unlock, false = force-lock, null = automatic. */
  manualOverride?: boolean | null;
  /** Public launch baseline added to the real count (defaults to the constant;
   *  pass 0 to compute against raw real counts, e.g. in tests). */
  baseline?: number;
}

/**
 * The membership-tier strategy stays locked until the first {requiredCount}
 * Founding Members qualify — unless an authorized admin overrides it. This is
 * the single source of truth for "are paid tiers allowed to surface yet?".
 */
export function shouldUnlockMembershipTiers(input: MembershipGateInput): boolean {
  if (input.manualOverride === true) return true;
  if (input.manualOverride === false) return false;
  const required = input.requiredCount ?? FOUNDING_REQUIRED_COUNT;
  return input.qualifiedCount >= required;
}

/** Build the public, privacy-safe campaign progress object. The displayed
 *  count = launch baseline + real qualified members, capped at requiredCount. */
export function buildCampaignProgress(input: MembershipGateInput): FoundingCampaignProgress {
  const requiredCount = input.requiredCount ?? FOUNDING_REQUIRED_COUNT;
  const baseline = Math.max(0, Math.floor(input.baseline ?? FOUNDING_COUNTER_BASELINE));
  const realQualified = Math.max(0, Math.floor(input.qualifiedCount || 0));
  const qualifiedCount = Math.min(requiredCount, baseline + realQualified);
  // The membership gate + "full" use the SAME displayed (baselined) count.
  const enabled = shouldUnlockMembershipTiers({ qualifiedCount, requiredCount, manualOverride: input.manualOverride });
  const full = qualifiedCount >= requiredCount;

  let reason: string;
  if (input.manualOverride === true) reason = 'Manually unlocked by an admin.';
  else if (input.manualOverride === false) reason = 'Manually locked by an admin.';
  else if (full) reason = `Unlocked — ${requiredCount} Founding Members reached.`;
  else reason = `Locked until ${requiredCount} Founding Members qualify (${qualifiedCount} so far).`;

  return {
    qualifiedCount,
    requiredCount,
    remaining: Math.max(0, requiredCount - qualifiedCount),
    full,
    membershipTiersEnabled: enabled,
    membershipUnlockReason: reason,
  };
}
