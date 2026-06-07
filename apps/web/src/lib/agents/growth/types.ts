// ============================================================
// SwingVantage — Agent: Growth Coordinator — Types
// ------------------------------------------------------------
// Unifies the seven growth agents (churn, dispatch, activation,
// earn-moment referral, practice companion, trust linter, ad-
// creative) into ONE result with a single "what to surface now"
// decision — mirroring how the core orchestrator caps the
// dashboard to one calm set of cards. Pure data shapes.
// ============================================================

import type { AgentAction } from '../types';
import type { ChurnRisk, ChurnSignals } from '../churn/types';
import type { ActivationState, ActivationOptions } from '../activation/types';
import type { DispatchDecision, DispatchOptions } from '../dispatch/types';
import type { ReferralPrompt, EarnMomentOptions } from '../earn-moments/types';

/** Optional inputs the coordinator passes through to each agent. */
export interface GrowthInputs {
  /** Behavioural signals for churn (auto-derived from Daily Notes by the hook). */
  churnSignals?: ChurnSignals;
  activation?: ActivationOptions;
  dispatch?: DispatchOptions;
  referral?: EarnMomentOptions;
  now?: Date;
}

/** The kind of growth surface that won the single-voice contest. */
export type GrowthSurfaceKind = 'activation' | 'reengage' | 'referral' | 'none';

/** A render-ready, uniform action (both AgentAction and referral CTA fit). */
export interface GrowthAction {
  label: string;
  href: string;
}

/** The one growth surface to show in-app right now (or 'none'). */
export interface GrowthSurface {
  kind: GrowthSurfaceKind;
  title: string;
  body: string;
  action: GrowthAction | null;
  /** Why this surface was chosen — transparency, never shown raw. */
  reason: string;
}

/** Everything the coordinator computed — sub-results plus the decision. */
export interface GrowthAgentsResult {
  churn: ChurnRisk;
  activation: ActivationState;
  /** Outbound proposal (draft-first); independent of the in-app surface. */
  dispatch: DispatchDecision;
  referral: ReferralPrompt;
  /** The single most important in-app surface to show now. */
  primary: GrowthSurface;
  generatedAt: string;
}

export type { AgentAction };
