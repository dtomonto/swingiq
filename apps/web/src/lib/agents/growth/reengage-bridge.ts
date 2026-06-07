// ============================================================
// SwingVantage — Growth ↔ Re-engagement OS Bridge
// ------------------------------------------------------------
// RECONCILIATION (read this first):
//   Another module, '@/lib/reengage', is the production OUTBOUND
//   layer — it owns delivery, channels, frequency caps, quiet
//   hours, the prefs store, and the admin UI. It selects a nudge
//   from binary TRIGGERS (comeback_14, streak_at_risk, …) with a
//   static priority order. What it lacks is a *quantitative* sense
//   of how at-risk a user actually is.
//
//   Our Churn agent provides exactly that (a 0–100 explainable
//   score). This bridge wires the two together WITHOUT editing
//   reengage: it adds churn-aware gating + the score for analytics
//   and escalation, and can build reengage's ActivitySignal from
//   our normalized AgentContext so both speak one source of truth.
//
// Tandem-safe: imports reengage's public API only; never mutates
// its files. Pure, deterministic, never throws.
// ============================================================

// Subpath imports (not the '@/lib/reengage' barrel) so this stays server-safe:
// the barrel re-exports a 'use client' hook a pure bridge must not pull in.
import { selectNudge, type SelectOptions } from '@/lib/reengage/engine';
import type { ActivitySignal, NudgeMessage, NudgeState, TriggerId } from '@/lib/reengage/types';
import type { AgentContext } from '../types';
import { scoreChurnRisk } from '../churn/engine';
import type { ChurnRisk, ChurnSignals } from '../churn/types';

const COMEBACK_TRIGGERS = new Set<TriggerId>(['comeback_3', 'comeback_7', 'comeback_14']);

export function isComebackTrigger(id: TriggerId): boolean {
  return COMEBACK_TRIGGERS.has(id);
}

function practicedToday(ctx: AgentContext): boolean {
  if (!ctx.lastPracticeDate) return false;
  const d = new Date(ctx.lastPracticeDate);
  const now = new Date(ctx.now);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/** Fields the AgentContext cannot determine on its own (kept honest). */
export interface ActivitySignalOverrides {
  /** reengage's "active fix + enough reps to retest" — needs drill counts. */
  retestDue?: boolean;
  /** Override the activation heuristic if a richer source is available. */
  activated?: boolean;
  streakAtRisk?: boolean;
}

/**
 * Build reengage's ActivitySignal from our normalized AgentContext so a
 * server/cron path can drive reengage from the same context our agents use.
 * (In the client, reengage's own hook already derives this from the store —
 * prefer that there.) Fields it cannot infer are conservative or overridable.
 */
export function toActivitySignal(ctx: AgentContext, overrides: ActivitySignalOverrides = {}): ActivitySignal {
  return {
    daysSinceLastActivity: ctx.daysSinceLastActivity,
    streakDays: ctx.streakDays,
    streakAtRisk: overrides.streakAtRisk ?? (ctx.streakDays >= 1 && !practicedToday(ctx)),
    hasPendingFix: ctx.hasActivePlan,
    retestDue: overrides.retestDue ?? false,
    sessionCount: ctx.sessionCount,
    activated: overrides.activated ?? ctx.sessionCount > 0,
    sport: ctx.activeSport,
  };
}

export interface ChurnAwareOptions extends SelectOptions {
  churnSignals?: ChurnSignals;
  /**
   * When true, suppress a *comeback* nudge if our richer churn model says the
   * user is actually 'safe' — avoids nagging someone who is merely a few days
   * out but otherwise healthy. Other triggers (streak, retest, activation,
   * finish_fix) are left to reengage.
   */
  suppressIfSafe?: boolean;
}

export interface ChurnAwareResult {
  /** reengage's chosen message (its copy, channels, caps), or null. */
  nudge: NudgeMessage | null;
  /** Our quantitative read — use for ordering, escalation, and analytics. */
  churn: ChurnRisk;
  /** True when churn gating overrode an otherwise-eligible comeback nudge. */
  suppressedBySafe: boolean;
}

/**
 * Run reengage's selection, then layer our churn score on top: optionally gate
 * low-value comeback nudges, and always return the score so the caller can
 * escalate the channel (churn.intervention.channelHint) or log risk on send.
 *
 * The caller passes the `signal` + `state` it already has (e.g. from
 * useReengage), so this never duplicates reengage's store or signal logic.
 */
export function selectChurnAwareNudge(
  ctx: AgentContext,
  signal: ActivitySignal,
  state: NudgeState,
  opts: ChurnAwareOptions = {},
): ChurnAwareResult {
  const churn = scoreChurnRisk(ctx, opts.churnSignals);
  let nudge = selectNudge(signal, state, opts);
  let suppressedBySafe = false;

  if (nudge && opts.suppressIfSafe && churn.band === 'safe' && isComebackTrigger(nudge.triggerId)) {
    nudge = null;
    suppressedBySafe = true;
  }

  return { nudge, churn, suppressedBySafe };
}
