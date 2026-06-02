// ============================================================
// SwingIQ — Retest Engine: Golf Derivation
// ------------------------------------------------------------
// Golf data comes from launch-monitor SESSIONS (Zustand store),
// not video history. Each golf diagnosis already carries a
// RetestProtocol (club, shot count, success criteria) — we reuse
// it for same-condition guidance instead of inventing new rules.
//
// Because launch-monitor numbers are statistical (not estimated
// from video), the golf comparator CAN flag a regression when the
// same issue registers more strongly under the same conditions.
// ============================================================

import type { DiagnosisOutput } from '@swingiq/core';
import type { LocalSession } from '@/store';
import { resolveFault } from '@/lib/faults';
import { buildWindow, statusFor } from './engine';
import type { RetestComparison, RetestResult, RetestStoreState, RetestTarget } from './types';

const GOLF_EMOJI = '⛳';

/** Read a diagnosis's shot sample size defensively (dist types may lag). */
function sampleSizeOf(d: DiagnosisOutput | null | undefined): number {
  const v = (d as { sample_size?: unknown } | null | undefined)?.sample_size;
  return typeof v === 'number' ? v : 0;
}

/** The highest-confidence non-"optimal" diagnosis on a session, or null. */
function golfPrimary(session: LocalSession): DiagnosisOutput | null {
  const real = session.diagnoses.filter((d) => !!d?.rule && d.rule.id !== 'optimal');
  if (real.length === 0) return null;
  return real.reduce((best, d) => (d.confidence > best.confidence ? d : best), real[0]);
}

/** Golf sessions that carry a real diagnosis, newest first. */
function diagnosedGolfSessions(sessions: LocalSession[]): LocalSession[] {
  return sessions
    .filter((s) => s.sport === 'golf' && golfPrimary(s) !== null)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/** Same-condition checklist built from the diagnosis's own RetestProtocol. */
function sameConditionsFromProtocol(d: DiagnosisOutput): string[] {
  const r = d.rule?.retest;
  const out: string[] = [];
  if (r?.club) out.push(`Same club (${r.club})`);
  if (r?.shot_count) out.push(`At least ${r.shot_count} shots`);
  out.push('Same launch monitor and setup (indoor/outdoor, mat/grass)');
  if (r?.focus_metrics?.length) out.push(`Re-check: ${r.focus_metrics.join(', ')}`);
  return out;
}

/** OPEN golf retest: the latest diagnosed golf session (0 or 1). */
export function deriveGolfRetestTargets(
  sessions: LocalSession[],
  store: RetestStoreState,
  now: Date = new Date(),
): RetestTarget[] {
  const list = diagnosedGolfSessions(sessions);
  const latest = list[0];
  if (!latest || store.dismissedTargetIds.includes(latest.id)) return [];

  const primary = golfPrimary(latest)!;
  const focus = primary.rule?.name ?? 'your top number';
  const fault = resolveFault(primary.rule?.id ?? 'golf_focus', { label: focus, sport: 'golf' });
  const window = buildWindow(latest.created_at, fault.retest.activeWindowDays);

  return [
    {
      id: latest.id,
      sport: 'golf',
      sportLabel: 'Golf',
      emoji: GOLF_EMOJI,
      faultId: primary.rule?.id ?? fault.id,
      faultName: focus,
      focus,
      declaredCameraAngle: undefined,
      window,
      status: statusFor(window, now),
      sameConditions: sameConditionsFromProtocol(primary),
      whatToReassess: primary.rule?.retest?.success_criteria || fault.retest.whatToReassess,
    },
  ];
}

const GOLF_NOTE =
  'Based on your launch-monitor numbers from both sessions. Most reliable when the club, shot count, and setup match.';

/** Compare a prior diagnosed golf session to a newer one. */
export function compareGolfSessions(prev: LocalSession, current: LocalSession): RetestComparison {
  const prevPrimary = golfPrimary(prev)!; // caller guarantees prev is diagnosed
  const priorId = prevPrimary.rule.id;
  const priorName = prevPrimary.rule.name ?? String(priorId);

  const currentDiags = current.diagnoses.filter((d) => !!d?.rule);
  const match = currentDiags.find((d) => d.rule.id === priorId) ?? null;
  const currentPrimary = golfPrimary(current);

  // Same conditions: compare club category (the dominant comparability factor).
  const pc = prev.club_category;
  const cc = current.club_category;
  const sameConditionsMet: boolean | null = !pc || !cc ? null : pc === cc;

  const cautions: string[] = [];
  if (sameConditionsMet === false) {
    cautions.push(`Different club type than last time (${pc} vs ${cc}), so this isn't a like-for-like comparison.`);
  }
  const sample = sampleSizeOf(match) || sampleSizeOf(currentPrimary);
  if (sample > 0 && sample < 5) {
    cautions.push('Few shots in the latest session — more shots make the comparison more reliable.');
  }

  let outcome: RetestComparison['outcome'];
  let headline: string;
  let detail: string;

  if (!match) {
    if (sameConditionsMet === false) {
      outcome = 'inconclusive';
      headline = 'Possible progress — but a different club';
      detail = `"${priorName}" didn't show up this time, but you used a different club. Confirm with a same-club session.`;
    } else {
      outcome = 'improved';
      headline = 'Looks like progress';
      detail = `"${priorName}" was your top issue last time and didn't register this session. Lock it in before shifting focus.`;
    }
  } else if (sameConditionsMet !== false && match.confidence - prevPrimary.confidence >= 15) {
    outcome = 'regressed';
    headline = 'Worth another look';
    detail = `"${priorName}" registered more strongly than last time. Revisit the foundational drills before adding anything new.`;
  } else if (currentPrimary && currentPrimary.rule.id === priorId) {
    outcome = 'persisting';
    headline = 'Still your top priority';
    detail = `"${priorName}" is still your #1. That's normal — give the drills more reps, then retest.`;
  } else if (sameConditionsMet === false) {
    outcome = 'inconclusive';
    headline = 'Mixed signal';
    detail = `"${priorName}" eased down your list, but the club changed — confirm with a same-club retest.`;
  } else {
    outcome = 'improved';
    headline = 'Trending the right way';
    detail = `"${priorName}" dropped from your top priority to lower down. Encouraging — keep going and retest again.`;
  }

  return { outcome, headline, detail, sameConditionsMet, cautions, confidenceNote: GOLF_NOTE };
}

/** COMPLETED golf retest: compare the two most recent diagnosed sessions. */
export function deriveGolfRetestResults(
  sessions: LocalSession[],
  store: RetestStoreState,
): RetestResult[] {
  const list = diagnosedGolfSessions(sessions);
  if (list.length < 2) return [];
  const [current, previous] = list;
  if (store.acknowledgedResultIds.includes(current.id)) return [];

  const prevPrimary = golfPrimary(previous)!;
  return [
    {
      id: current.id,
      sport: 'golf',
      sportLabel: 'Golf',
      emoji: GOLF_EMOJI,
      priorFocus: prevPrimary.rule.name ?? 'previous issue',
      priorDate: previous.created_at,
      currentDate: current.created_at,
      comparison: compareGolfSessions(previous, current),
    },
  ];
}
