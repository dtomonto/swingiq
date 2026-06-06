// ============================================================
// SwingVantage — Agent: Re-Engagement Dispatch — Types
// ------------------------------------------------------------
// The outbound win-back brain. It decides WHEN to reach a lapsing
// user, WHICH channel, and WHAT to say — then returns a DRAFT.
// Nothing is ever sent without an explicit adapter call, so this
// is safe to run anywhere. Pure data shapes; no React, no email
// SDK, no network.
//
// Guardrails baked into the type contract:
//   • draft-first: a decision is a proposal, not a send.
//   • frequency caps + quiet hours are inputs, never bypassed.
//   • email/push require explicit consent flags (allowEmail/allowPush).
// ============================================================

import type { ChurnIntervention } from '../churn/types';

export type DispatchChannel = 'in_app' | 'email' | 'push';

/** Why a candidate message was held back (honest, surfaced for the admin). */
export type SuppressionReason =
  | 'not_at_risk'
  | 'frequency_cap'
  | 'weekly_cap'
  | 'no_channel'
  | 'opted_out';

/** Caller-supplied policy. Sensible, conservative defaults in DEFAULT_POLICY. */
export interface DispatchPolicy {
  /** Master switch — when false, the agent always suppresses ('opted_out'). */
  enabled: boolean;
  /** Consent gates. Outbound channels are OFF unless explicitly allowed. */
  allowEmail: boolean;
  allowPush: boolean;
  /** Local quiet-hours window (24h clock). Email/push are scheduled past it. */
  quietHours: { start: number; end: number };
  /** Minimum hours between any two outbound (email/push) sends. */
  minHoursBetweenSends: number;
  /** Hard ceiling on outbound sends in a rolling 7 days. */
  maxPerWeek: number;
}

/** A record of one previously dispatched outbound message. */
export interface DispatchRecord {
  channel: DispatchChannel;
  at: string; // ISO
}

/** Everything the agent needs beyond the AgentContext + ChurnRisk. */
export interface DispatchOptions {
  policy?: Partial<DispatchPolicy>;
  /** Prior sends, used to enforce caps. Newest or oldest order both fine. */
  history?: DispatchRecord[];
  /** Optional "now" for deterministic tests. */
  now?: Date;
}

/** The grounded message body the agent proposes. */
export interface DispatchMessage {
  channel: DispatchChannel;
  /** Email subject / push title. Empty for in_app (uses title instead). */
  subject: string;
  /** Short email preheader / push subtitle. */
  preheader: string;
  /** In-app card title. */
  title: string;
  /** Plain-text body. No markdown, no links inline (CTA carries the link). */
  body: string;
  cta: { label: string; href: string };
  /** The data points the copy is grounded in (shown for transparency). */
  groundedOn: string[];
}

/** The agent's full proposal for one user. Draft-first: `send` may be false. */
export interface DispatchDecision {
  /** True only when every gate passed and there is something worth saying. */
  send: boolean;
  /** Populated when `send` is true. */
  message: DispatchMessage | null;
  /** When the message should go out (ISO). Respects quiet hours. */
  sendAt: string | null;
  angle: ChurnIntervention['angle'];
  /** Human reason for the decision (always present). */
  reason: string;
  /** Set when `send` is false. */
  suppressedReason: SuppressionReason | null;
}

/**
 * The delivery seam. Implement these to actually send (e.g. Resend for email,
 * web-push for push, a toast/store write for in_app). Keeping it an interface
 * means the agent never imports a vendor SDK — wiring one up later is additive.
 */
export interface DispatchAdapters {
  sendEmail?: (msg: DispatchMessage, to: string) => Promise<void> | void;
  sendPush?: (msg: DispatchMessage) => Promise<void> | void;
  showInApp?: (msg: DispatchMessage) => Promise<void> | void;
}

export const DEFAULT_POLICY: DispatchPolicy = {
  enabled: true,
  allowEmail: false, // consent-gated by default
  allowPush: false, // consent-gated by default
  quietHours: { start: 21, end: 8 },
  minHoursBetweenSends: 72,
  maxPerWeek: 2,
};
