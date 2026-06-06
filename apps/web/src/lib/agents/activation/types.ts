// ============================================================
// SwingVantage — Agent: Activation Concierge — Types
// ------------------------------------------------------------
// The "first-week" funnel guide. It models the path from sign-up
// to the first real "aha" (a finding + a plan), detects exactly
// which step a new user is stuck on, and proposes the single next
// micro-step. Pure data shapes; no React, no DOM, no AI.
//
// Distinct from next-best-action (one ranked action) and
// contextual-help (static per page): this is a STAGED model with
// completion %, stall detection, and onboarding-specific copy.
// ============================================================

import type { AgentAction } from '../types';

/** The ordered activation milestones. Non-golf folds diagnosis into upload. */
export type ActivationStepId =
  | 'profile'
  | 'first_upload'
  | 'first_diagnosis'
  | 'first_plan'
  | 'first_retest';

export interface ActivationStep {
  id: ActivationStepId;
  /** Short label for a checklist UI. */
  label: string;
  done: boolean;
  /** True for the single step the user is on right now. */
  current: boolean;
}

export type ActivationStatus = 'new' | 'activating' | 'activated';

/** The single, onboarding-framed nudge toward the current step. */
export interface ActivationNudge {
  headline: string;
  body: string;
  /** The concrete action (reuses the agent action library). */
  action: AgentAction;
  /** A tiny, low-effort framing of the same step ("just 10 minutes"). */
  microStep: string;
}

export interface ActivationState {
  status: ActivationStatus;
  steps: ActivationStep[];
  currentStepId: ActivationStepId | null;
  completedCount: number;
  totalCount: number;
  /** 0–100. */
  percent: number;
  /** True when the user has been stuck on the current step too long. */
  stalled: boolean;
  /** Days stuck (best-effort; null when we cannot honestly tell). */
  stalledDays: number | null;
  /** The one thing to surface. Null only when fully activated. */
  nudge: ActivationNudge | null;
}

/** Optional inputs the AgentContext cannot carry. */
export interface ActivationOptions {
  /** Days since the account was created — enables honest stall detection. */
  accountAgeDays?: number | null;
  now?: Date;
}
