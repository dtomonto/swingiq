// ============================================================
// SwingVantage — Re-engagement: outbound batch decision layer (pure-ish)
// ------------------------------------------------------------
// The decision half of scheduled outbound reminders (retest-due / streak / …).
// It reuses the in-app selection engine (selectNudge) so the SAME honest rules —
// per-trigger cooldowns, the global daily cap, dismissals, and channel opt-in —
// govern an email/push send exactly as they govern an in-app card. No new copy,
// no new policy: just "given this user's signal + state + opted-in channels,
// should we send something outbound right now, and what?".
//
// `runReengageBatch` takes its side effects as injected deps so it is fully
// unit-testable without a network or a database. The cron route supplies the
// real candidate loader + delivery primitive.
//
// DORMANT BY DESIGN: this only does anything when outbound is configured
// (Resend + Supabase) AND a candidate source exists. Re-engage prefs/history
// currently live in device localStorage, so server-side enumeration also needs
// a server-side prefs/email model — see docs/OUTBOUND_REMINDERS.md.
// ============================================================

import { selectNudge, buildPayloads } from './engine';
import type { ActivitySignal, NudgeChannel, NudgeState } from './types';
import type { NudgeDelivery, DeliveryResult } from '@/lib/notifications/deliver';

/** Everything the planner needs about one user to decide an outbound send. */
export interface OutboundCandidate {
  userId: string;
  /** Recipient email (null when we have no contact for them → no email send). */
  email: string | null;
  signal: ActivitySignal;
  /** Their re-engage state: prefs (channel opt-in, quiet hours) + send history. */
  state: NudgeState;
}

export type OutboundPlan =
  | { action: 'send'; delivery: NudgeDelivery; triggerId: string; channels: NudgeChannel[] }
  | { action: 'suppress'; reason: string };

/**
 * Decide what (if anything) to send one user right now. Pure: no I/O. Channel
 * availability is derived from the user's own opt-in prefs, so a user who never
 * enabled email/push is suppressed before any nudge is selected.
 */
export function planOutboundForUser(
  c: OutboundCandidate,
  opts: { now?: number; origin?: string } = {},
): OutboundPlan {
  const now = opts.now ?? Date.now();

  // Only the channels the user actually opted into are "available" — and email
  // needs an address. in_app is never an outbound channel (no live client here).
  const available: NudgeChannel[] = [];
  if (c.state.prefs.email && c.email) available.push('email');
  if (c.state.prefs.push) available.push('push');
  if (available.length === 0) return { action: 'suppress', reason: 'no_outbound_channel' };

  const msg = selectNudge(c.signal, c.state, { availableChannels: available, now });
  if (!msg) return { action: 'suppress', reason: 'no_nudge_due' };

  const payloads = buildPayloads(msg, opts.origin ?? '');
  const sendEmail = msg.channels.includes('email') && c.state.prefs.email && !!c.email;
  const delivery: NudgeDelivery = {
    userId: c.userId,
    email: sendEmail ? c.email : null,
    subject: msg.emailSubject,
    title: msg.title,
    body: msg.body,
    url: payloads.push.url,
    cta: msg.cta,
    tag: msg.triggerId,
  };
  return { action: 'send', delivery, triggerId: msg.triggerId, channels: msg.channels };
}

export interface ReengageBatchDeps {
  /** True only when a real outbound channel is configured (Resend + Supabase). */
  configured: boolean;
  /** Load the users to consider this run (their signal, state, and email). */
  loadCandidates: () => Promise<OutboundCandidate[]>;
  /** Deliver one nudge across configured channels (honest no-op per channel). */
  deliver: (n: NudgeDelivery) => Promise<DeliveryResult>;
  now?: number;
  origin?: string;
}

export interface ReengageBatchResult {
  ok: boolean;
  configured: boolean;
  considered: number;
  sent: number;
  /** reason → count, for the suppressions (opt-out, cooldown, nothing due, …). */
  suppressed: Record<string, number>;
  errors: number;
  reason?: string;
}

/**
 * Run one outbound pass. Honest no-op when not configured; otherwise loads
 * candidates and, for each, applies the same selection rules as the in-app
 * nudge, delivering only to opted-in channels. Never throws.
 */
export async function runReengageBatch(deps: ReengageBatchDeps): Promise<ReengageBatchResult> {
  const suppressed: Record<string, number> = {};
  const bump = (r: string) => { suppressed[r] = (suppressed[r] ?? 0) + 1; };

  if (!deps.configured) {
    return { ok: true, configured: false, considered: 0, sent: 0, suppressed, errors: 0,
      reason: 'outbound_not_configured' };
  }

  let users: OutboundCandidate[];
  try {
    users = await deps.loadCandidates();
  } catch {
    return { ok: false, configured: true, considered: 0, sent: 0, suppressed, errors: 1,
      reason: 'load_candidates_failed' };
  }

  let sent = 0;
  let errors = 0;
  for (const u of users) {
    const plan = planOutboundForUser(u, { now: deps.now, origin: deps.origin });
    if (plan.action === 'suppress') { bump(plan.reason); continue; }
    try {
      const res = await deps.deliver(plan.delivery);
      if (res.email.sent || res.push.sent > 0) sent += 1;
      else bump('delivered_noop'); // configured but nothing actually went out
    } catch {
      errors += 1;
    }
  }
  return { ok: true, configured: true, considered: users.length, sent, suppressed, errors };
}
