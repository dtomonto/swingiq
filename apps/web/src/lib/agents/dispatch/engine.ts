// ============================================================
// SwingVantage — Agent: Re-Engagement Dispatch — Engine
// ------------------------------------------------------------
// Turns a ChurnRisk read into a concrete, grounded, draft-first
// win-back proposal: channel + timing + copy. Deterministic, pure,
// SSR-safe, never throws. It NEVER sends — `executeDispatch` calls
// caller-supplied adapters, and only when the decision says send.
//
// The copy is intentionally honest and guarantee-free, so the
// Trust/Honesty Linter agent passes it clean.
// ============================================================

import type { AgentContext } from '../types';
import type { ChurnRisk } from '../churn/types';
import { getNextBestAction } from '../scoring';
import { getSportAgentProfile } from '../sport-profiles';
import {
  DEFAULT_POLICY,
  type DispatchAdapters,
  type DispatchChannel,
  type DispatchDecision,
  type DispatchMessage,
  type DispatchOptions,
  type DispatchPolicy,
  type DispatchRecord,
} from './types';

const HOUR = 3_600_000;
const DAY = 86_400_000;

// ── Scheduling helpers ────────────────────────────────────────

function isQuiet(hour: number, start: number, end: number): boolean {
  return start <= end ? hour >= start && hour < end : hour >= start || hour < end;
}

/** Next moment outside quiet hours (in_app ignores quiet hours upstream). */
function nextAllowedSend(now: Date, q: { start: number; end: number }): Date {
  const h = now.getHours();
  if (!isQuiet(h, q.start, q.end)) return now;
  const out = new Date(now);
  out.setMinutes(0, 0, 0);
  if (q.start <= q.end) {
    out.setHours(q.end);
  } else if (h >= q.start) {
    out.setDate(out.getDate() + 1); // evening side of midnight → tomorrow morning
    out.setHours(q.end);
  } else {
    out.setHours(q.end); // early-morning side → later today
  }
  return out;
}

// ── Cap helpers ───────────────────────────────────────────────

function lastOutboundAt(history: DispatchRecord[]): number | null {
  const outbound = history.filter((r) => r.channel !== 'in_app');
  if (outbound.length === 0) return null;
  return Math.max(...outbound.map((r) => new Date(r.at).getTime()).filter((t) => !Number.isNaN(t)));
}

function sendsInLast7Days(history: DispatchRecord[], now: Date): number {
  const cutoff = now.getTime() - 7 * DAY;
  return history.filter(
    (r) => r.channel !== 'in_app' && new Date(r.at).getTime() >= cutoff,
  ).length;
}

// ── Channel selection ─────────────────────────────────────────

function pickChannel(hint: ChurnRisk['intervention']['channelHint'], p: DispatchPolicy): DispatchChannel | null {
  // Honour the churn hint, then degrade to what consent allows.
  if (hint === 'email' && p.allowEmail) return 'email';
  if (hint === 'push' && p.allowPush) return 'push';
  if (hint === 'email' || hint === 'push') {
    // Wanted outbound but not consented → fall back to passive in_app.
    return 'in_app';
  }
  if (hint === 'in_app') return 'in_app';
  return null;
}

// ── Copy ──────────────────────────────────────────────────────

interface Copy {
  subject: string;
  preheader: string;
  title: string;
  body: string;
}

function buildCopy(ctx: AgentContext, risk: ChurnRisk): Copy {
  const sp = getSportAgentProfile(ctx.activeSport);
  const name = ctx.profile.firstName ?? 'there';
  const days = ctx.daysSinceLastActivity;
  const sport = ctx.sportLabel.toLowerCase();
  const focus = ctx.latestDiagnosedSession?.primaryFocus ?? ctx.latestSession?.primaryFocus ?? null;

  switch (risk.intervention.angle) {
    case 'celebrate_progress':
      return {
        subject: `${name}, your ${sport} was trending up`,
        preheader: 'Pick up where the progress left off.',
        title: 'You were on a roll',
        body:
          `Hi ${name} — last time, your ${sport} was heading in the right direction. ` +
          `A short ${sp.inputNoun} keeps that momentum going while it is fresh.`,
      };
    case 'protect_streak':
      return {
        subject: `${name}, keep your ${sport} rhythm going`,
        preheader: 'One quick check keeps the habit alive.',
        title: 'Keep the rhythm',
        body:
          `Hi ${name} — you had a nice rhythm with your ${sport}. ` +
          `It has been ${days ?? 'a few'} days; one quick ${sp.inputNoun} is all it takes to keep it going.`,
      };
    case 'one_small_step':
      return {
        subject: `${name}, one small step on your plan`,
        preheader: focus ? `Your focus: ${focus}.` : 'Pick the plan back up — no catching-up required.',
        title: 'Pick it back up',
        body:
          `Hi ${name} — your practice plan${focus ? ` on ${focus}` : ''} is right where you left it. ` +
          `No need to catch up — just do the next small step today.`,
      };
    case 'gentle_restart':
      return {
        subject: `${name}, an easy way back into ${sport}`,
        preheader: 'Start small — momentum beats catching up.',
        title: 'Restart small',
        body:
          `Hi ${name} — no pressure to do everything at once. ` +
          `Start with one quick ${sp.inputNoun} so your plan reflects where your ${sp.motion} is today.`,
      };
    case 'check_in':
    default:
      return {
        subject: `${name}, how is the ${sport} going?`,
        preheader: 'A fresh look can unstick a plateau.',
        title: 'Quick check-in',
        body:
          `Hi ${name} — improvement is rarely a straight line. ` +
          `A fresh ${sp.inputNoun} gives SwingVantage something new to work with and often unsticks a plateau.`,
      };
  }
}

function groundsFor(ctx: AgentContext, risk: ChurnRisk): string[] {
  const grounds = risk.drivers.slice(0, 2).map((d) => d.reason);
  if (ctx.latestSession?.primaryFocus) grounds.push(`Last focus: ${ctx.latestSession.primaryFocus}`);
  return grounds;
}

// ── The decision ──────────────────────────────────────────────

function suppressed(
  suppressedReason: DispatchDecision['suppressedReason'],
  reason: string,
  angle: ChurnRisk['intervention']['angle'],
): DispatchDecision {
  return { send: false, message: null, sendAt: null, angle, reason, suppressedReason };
}

/**
 * Decide whether/when/how to re-engage one user. Draft-first: a `send: true`
 * result is a proposal — call `executeDispatch` to actually deliver it.
 */
export function buildDispatch(
  ctx: AgentContext,
  risk: ChurnRisk,
  opts: DispatchOptions = {},
): DispatchDecision {
  const policy: DispatchPolicy = { ...DEFAULT_POLICY, ...opts.policy };
  const history = opts.history ?? [];
  const now = opts.now ?? new Date();
  const angle = risk.intervention.angle;

  if (!policy.enabled) return suppressed('opted_out', 'Re-engagement is turned off for this user.', angle);

  // Nothing worth saying — the user is safe.
  if (risk.intervention.urgency === 0 || risk.band === 'safe') {
    return suppressed('not_at_risk', 'User is not at risk — staying quiet is the right move.', angle);
  }

  const channel = pickChannel(risk.intervention.channelHint, policy);
  if (!channel) return suppressed('no_channel', 'No eligible channel for this user.', angle);

  // Frequency caps apply to OUTBOUND channels only (in_app is passive).
  if (channel !== 'in_app') {
    const last = lastOutboundAt(history);
    if (last !== null && now.getTime() - last < policy.minHoursBetweenSends * HOUR) {
      return suppressed('frequency_cap', `Last outbound was within ${policy.minHoursBetweenSends}h — too soon.`, angle);
    }
    if (sendsInLast7Days(history, now) >= policy.maxPerWeek) {
      return suppressed('weekly_cap', `Already sent ${policy.maxPerWeek} this week — respecting the cap.`, angle);
    }
  }

  const copy = buildCopy(ctx, risk);
  const nba = getNextBestAction(ctx);
  const sendAt = channel === 'in_app' ? now : nextAllowedSend(now, policy.quietHours);

  const message: DispatchMessage = {
    channel,
    subject: channel === 'in_app' ? '' : copy.subject,
    preheader: copy.preheader,
    title: copy.title,
    body: copy.body,
    cta: { label: nba.label, href: nba.href },
    groundedOn: groundsFor(ctx, risk),
  };

  return {
    send: true,
    message,
    sendAt: sendAt.toISOString(),
    angle,
    reason: `${risk.band} risk (${risk.score}) → ${angle} via ${channel}.`,
    suppressedReason: null,
  };
}

/**
 * Deliver a decision through caller-supplied adapters. No-op (and honest) when
 * the decision says don't send or the needed adapter is absent. Never throws;
 * returns whether anything was delivered.
 */
export async function executeDispatch(
  decision: DispatchDecision,
  adapters: DispatchAdapters,
  recipientEmail?: string,
): Promise<{ delivered: boolean; channel: DispatchChannel | null }> {
  if (!decision.send || !decision.message) return { delivered: false, channel: null };
  const msg = decision.message;
  try {
    if (msg.channel === 'email' && adapters.sendEmail && recipientEmail) {
      await adapters.sendEmail(msg, recipientEmail);
      return { delivered: true, channel: 'email' };
    }
    if (msg.channel === 'push' && adapters.sendPush) {
      await adapters.sendPush(msg);
      return { delivered: true, channel: 'push' };
    }
    if (msg.channel === 'in_app' && adapters.showInApp) {
      await adapters.showInApp(msg);
      return { delivered: true, channel: 'in_app' };
    }
  } catch {
    // Honest fallback — delivery failures never crash the caller.
    return { delivered: false, channel: msg.channel };
  }
  return { delivered: false, channel: msg.channel };
}
