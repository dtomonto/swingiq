// ============================================================
// SwingVantage — Agent: Earn-Moment Referral — Engine
// ------------------------------------------------------------
// Finds the single strongest "ask a friend" moment from the user's
// own data and turns it into a grounded invite using the existing
// ReferralOS engine (buildInviteUrl / shareMessage). Pure,
// deterministic, SSR-safe, never throws.
//
// Tandem note: this reads '@/lib/referral' (another module's public
// API) but never modifies it.
// ============================================================

import { buildInviteUrl, shareMessage, SHARE_SUBJECT } from '@/lib/referral';
import { getSportAgentProfile } from '../sport-profiles';
import type { AgentContext } from '../types';
import type { EarnMoment, EarnMomentOptions, ReferralPrompt } from './types';

const HOUR = 3_600_000;
const STREAK_MILESTONES = new Set([3, 5, 7, 14, 30, 60, 100]);
const CONSISTENCY_MILESTONES = new Set([5, 10, 25, 50, 100]);
const IMPROVEMENT_DELTA = 8;

// ── Detection ─────────────────────────────────────────────────

/** Find the single strongest earn-moment, or null if none qualifies. */
export function detectEarnMoment(ctx: AgentContext, opts: EarnMomentOptions = {}): EarnMoment | null {
  const moments: EarnMoment[] = [];
  const sport = ctx.sportLabel.toLowerCase();

  // 1) Reward tier unlocked (handed in from ReferralOS) — strongest.
  const tier = (opts.pendingTierTitles ?? [])[0];
  if (tier) {
    moments.push({
      kind: 'tier_unlocked',
      strength: 95,
      headline: `You unlocked “${tier}”`,
      detail: 'Your invites are paying off — keep the circle growing.',
      groundedOn: [`Reward tier: ${tier}`],
    });
  }

  // Score-based moments (need real scores).
  const sessions = ctx.sportSessions;
  const latest = sessions[0] ?? null;
  const latestScore = typeof latest?.score === 'number' ? latest.score : null;
  const priorScores = sessions.slice(1).map((s) => s.score).filter((n): n is number => typeof n === 'number');

  if (latestScore !== null && priorScores.length >= 1) {
    const bestPrior = Math.max(...priorScores);
    const priorAvg = priorScores.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(priorScores.length, 3);

    // 2) Personal best — strictly beats every prior scored session.
    if (latestScore > bestPrior) {
      moments.push({
        kind: 'personal_best',
        strength: 85,
        headline: `New personal best in ${sport} 🎯`,
        detail: `Your latest swing score (${latestScore}) is your highest yet.`,
        groundedOn: [`Latest score ${latestScore}`, `Previous best ${bestPrior}`],
      });
    } else if (latestScore - priorAvg >= IMPROVEMENT_DELTA) {
      // 3) Big improvement vs recent average (even if not an all-time best).
      moments.push({
        kind: 'big_improvement',
        strength: 75,
        headline: `Big jump in your ${sport}`,
        detail: `Your latest score is well above your recent average — real progress.`,
        groundedOn: [`Latest score ${latestScore}`, `Recent avg ${Math.round(priorAvg)}`],
      });
    }
  }

  // 4) Streak milestone.
  if (STREAK_MILESTONES.has(ctx.streakDays)) {
    moments.push({
      kind: 'streak_milestone',
      strength: ctx.streakDays >= 7 ? 70 : 60,
      headline: `${ctx.streakDays}-day streak 🔥`,
      detail: 'Consistency like this is exactly what improves a swing — worth sharing.',
      groundedOn: [`Streak: ${ctx.streakDays} days`],
    });
  }

  // 5) Consistency milestone (total sessions).
  if (CONSISTENCY_MILESTONES.has(ctx.sessionCount)) {
    moments.push({
      kind: 'consistency',
      strength: 55,
      headline: `${ctx.sessionCount} sessions logged`,
      detail: 'You are clearly putting in the work — invite someone to push each other.',
      groundedOn: [`${ctx.sessionCount} sessions`],
    });
  }

  // 6) First win — gentle, only when there is a real first result.
  if (ctx.sessionCount === 1 && (latestScore !== null || !!latest?.primaryFocus)) {
    moments.push({
      kind: 'first_win',
      strength: 40,
      headline: 'You ran your first analysis',
      detail: 'Know someone who would find this useful too?',
      groundedOn: ['First session analyzed'],
    });
  }

  if (moments.length === 0) return null;
  moments.sort((a, b) => b.strength - a.strength);
  return moments[0];
}

// ── Prompt assembly ───────────────────────────────────────────

function suppressed(reason: ReferralPrompt['suppressedReason'], hubHref: string): ReferralPrompt {
  return {
    show: false,
    moment: null,
    headline: '',
    body: '',
    shareText: '',
    shareSubject: SHARE_SUBJECT,
    inviteUrl: null,
    cta: { label: 'Invite a friend', href: hubHref },
    suppressedReason: reason,
  };
}

/**
 * Build a ready-to-present referral prompt for the strongest current moment.
 * Draft-like: `show` is false (with a reason) whenever a gate blocks it.
 */
export function buildReferralPrompt(ctx: AgentContext, opts: EarnMomentOptions = {}): ReferralPrompt {
  const hubHref = opts.hubHref ?? '/refer';
  const enabled = opts.enabled ?? true;
  if (!enabled) return suppressed('opted_out', hubHref);

  // Cadence gate — never ask twice in a short window.
  const now = opts.now ?? new Date();
  const minHours = opts.minHoursBetweenPrompts ?? 120;
  if (opts.recentlyPromptedAt) {
    const last = new Date(opts.recentlyPromptedAt).getTime();
    if (!Number.isNaN(last) && now.getTime() - last < minHours * HOUR) {
      return suppressed('recently_prompted', hubHref);
    }
  }

  const moment = detectEarnMoment(ctx, opts);
  if (!moment) return suppressed('no_moment', hubHref);

  const code = opts.code ?? null;
  const inviteUrl = code ? buildInviteUrl(code, opts.origin ?? '') : null;
  const shareText = inviteUrl
    ? shareMessage('copy', inviteUrl)
    : 'Try SwingVantage with me — free swing analysis, one fix at a time.';

  const sp = getSportAgentProfile(ctx.activeSport);
  const body =
    moment.kind === 'tier_unlocked'
      ? moment.detail
      : `${moment.detail} Invite a friend to work on their ${sp.motion} alongside you — it is free to start.`;

  return {
    show: true,
    moment,
    headline: moment.headline,
    body,
    shareText,
    shareSubject: SHARE_SUBJECT,
    inviteUrl,
    cta: { label: 'Invite a friend', href: inviteUrl ?? hubHref },
    suppressedReason: null,
  };
}
