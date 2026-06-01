// ============================================================
// SwingIQ — Workflow: Pre-Round / Pre-Game Strategy
// ------------------------------------------------------------
// A short pre-event plan: 1–2 swing thoughts max, warm-up focus,
// a tactical reminder, a confidence cue, and what to avoid.
// Adapts to the active sport. Deterministic.
// ============================================================

import { getSportAgentProfile } from '../sportProfiles';
import type { AgentContext, PreGamePlan } from '../types';

export function buildPreGamePlan(ctx: AgentContext): PreGamePlan {
  const sp = getSportAgentProfile(ctx.activeSport);
  const lastFocus = ctx.latestDiagnosedSession?.primaryFocus ?? null;

  // Lead with the athlete's current focus when we have one, otherwise the
  // sport's fundamental swing thoughts. Never more than two thoughts.
  const swingThoughts = lastFocus
    ? [sp.preGameThoughts[0]!, `Light touch on your focus: ${lowerFirst(lastFocus)}.`]
    : sp.preGameThoughts.slice(0, 2);

  return {
    sport: ctx.activeSport,
    title: `${sp.preGameLabel}: keep it simple`,
    swingThoughts,
    warmupFocus: sp.preGameWarmup,
    tacticalReminder:
      ctx.activeSport === 'golf'
        ? 'Play to the fat part of the green and pick conservative targets early.'
        : 'Trust your timing — let the game come to you for the first few reps.',
    confidenceCue: `Today's focus: ${sp.defaultFocus}. You have done the work — now just compete.`,
    whatToAvoid: sp.preGameAvoid,
  };
}

function lowerFirst(s: string): string {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}
