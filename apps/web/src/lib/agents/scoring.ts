// ============================================================
// SwingIQ — Agent Layer: Next-Best-Action Scoring
// ------------------------------------------------------------
// Deterministic ranking of "the one thing to do next". This is
// the brain behind the dashboard's next step and the Welcome
// Back card. Pure functions over AgentContext — no AI required.
//
// Ranking follows the product spec's priority ladder:
//   1 finish profile → 2 baseline → 3 diagnose → 4 create plan →
//   5 continue plan → 6 follow-up session → 7 progress →
//   8 equipment → 9 refresh after inactivity → 10 report
// ============================================================

import type { SportId } from '@swingiq/core';
import type { AgentAction, AgentContext } from './types';
import { getSportAgentProfile } from './sportProfiles';

// ── Route helpers ─────────────────────────────────────────────

function uploadHref(sport: SportId): string {
  return sport === 'golf' ? '/sessions/import' : '/video';
}

function equipmentHref(sport: SportId): string {
  switch (sport) {
    case 'golf':
      return '/bag';
    case 'tennis':
      return '/equipment/tennis';
    case 'baseball':
      return '/equipment/baseball';
    case 'softball_slow':
      return '/equipment/softball-slow';
    case 'softball_fast':
      return '/equipment/softball-fast';
    default:
      return '/equipment';
  }
}

// ── Full action library (also used for Resume "options") ──────

export function buildActionLibrary(ctx: AgentContext): Record<string, AgentAction> {
  const sp = getSportAgentProfile(ctx.activeSport);
  const upload = uploadHref(ctx.activeSport);
  const equip = equipmentHref(ctx.activeSport);

  return {
    finishProfile: {
      id: 'finish_profile',
      label: 'Complete your profile',
      href: '/profile',
      intent: 'finish_profile',
      priority: 1,
      helperText: 'Tell SwingIQ your sport, skill level, and goal so every tip is tailored to you.',
    },
    uploadBaseline: {
      id: 'upload_baseline',
      label: ctx.activeSport === 'golf' ? 'Import your first session' : 'Upload your first video',
      href: upload,
      intent: 'upload_session',
      priority: 2,
      helperText: `A quick baseline ${sp.inputNoun} is all SwingIQ needs to build your first plan.`,
    },
    runDiagnosis: {
      id: 'run_diagnosis',
      label: 'Run your diagnosis',
      href: '/diagnose',
      intent: 'run_diagnosis',
      priority: 3,
      helperText: 'Find your #1 priority in under a minute.',
    },
    createPlan: {
      id: 'create_plan',
      label: 'Build your practice plan',
      href: '/training',
      intent: 'create_plan',
      priority: 4,
      helperText: 'Turn your latest finding into a short, focused routine.',
    },
    continuePlan: {
      id: 'continue_plan',
      label: 'Continue your practice plan',
      href: '/training',
      intent: 'continue_plan',
      priority: 5,
      helperText: 'Pick up the drill you were working on.',
    },
    uploadFollowUp: {
      id: 'upload_follow_up',
      label: ctx.activeSport === 'golf' ? 'Upload a follow-up session' : 'Upload a follow-up video',
      href: upload,
      intent: 'upload_session',
      priority: 6,
      helperText: 'Re-test with the same setup so SwingIQ can measure your progress.',
    },
    viewProgress: {
      id: 'view_progress',
      label: 'See your progress',
      href: '/progress',
      intent: 'view_progress',
      priority: 7,
      helperText: 'Review what is improving across your sessions.',
    },
    updateEquipment: {
      id: 'update_equipment',
      label: ctx.activeSport === 'golf' ? 'Complete your bag' : `Add your ${sp.equipmentNoun} details`,
      href: equip,
      intent: 'add_equipment',
      priority: 8,
      helperText: 'A complete equipment profile improves your fit guidance.',
    },
    refreshBaseline: {
      id: 'refresh_baseline',
      label: ctx.activeSport === 'golf' ? 'Log a quick refresh session' : 'Record a quick refresh video',
      href: upload,
      intent: 'upload_session',
      priority: 9,
      helperText: 'It has been a while — a fresh baseline keeps your plan accurate.',
    },
    generateReport: {
      id: 'generate_report',
      label: 'Generate a progress report',
      href: '/reports',
      intent: 'generate_report',
      priority: 10,
      helperText: 'Summarize your improvement to keep or share.',
    },
    preGame: {
      id: 'pre_game',
      label: `${sp.preGameLabel} plan`,
      href: '/pre-round',
      intent: 'pre_game',
      priority: 11,
      helperText: 'A focused warm-up and one swing thought before you play.',
    },
    reviewLast: {
      id: 'review_last',
      label: ctx.activeSport === 'golf' ? 'Review your last session' : 'Review your last analysis',
      href: ctx.activeSport === 'golf' ? '/sessions' : '/sessions',
      intent: 'review_session',
      priority: 12,
      helperText: 'See what SwingIQ found last time.',
    },
  };
}

// ── The decision ──────────────────────────────────────────────

export function getNextBestAction(ctx: AgentContext): AgentAction {
  const lib = buildActionLibrary(ctx);

  // 1 — No usable profile yet.
  if (!ctx.profile.exists) return lib.finishProfile;

  // 9 — Returning after a long gap with existing data: refresh first.
  if (ctx.daysSinceLastActivity !== null && ctx.daysSinceLastActivity >= 30 && ctx.sessionCount > 0) {
    return lib.refreshBaseline;
  }

  // 2 — Profile but no session/video.
  if (ctx.sessionCount === 0) return lib.uploadBaseline;

  // 3 — Golf session without a diagnosis (non-golf video already carries the issue).
  if (ctx.activeSport === 'golf' && !ctx.latestDiagnosedSession) return lib.runDiagnosis;

  // 4 — A finding exists but no plan yet.
  if (ctx.planStatus === 'none' && ctx.latestDiagnosedSession) return lib.createPlan;

  // 5 — Plan in progress.
  if (ctx.planStatus === 'in_progress') return lib.continuePlan;

  // 6 — Plan completed but no fresh data since.
  if (ctx.planStatus === 'completed') return lib.uploadFollowUp;

  // 7 — Enough history to learn from.
  if (ctx.sessionCount >= 2) return lib.viewProgress;

  // 8 — Equipment data would improve guidance.
  if (!ctx.equipment.sufficientForFit) return lib.updateEquipment;

  // Fallback — keep the loop going.
  return lib.uploadFollowUp;
}

/**
 * Builds the ordered list of secondary options shown in the Welcome Back
 * card (review last, continue plan, upload new, update equipment, progress).
 * Excludes the primary action to avoid duplication.
 */
export function buildResumeOptions(ctx: AgentContext, primary: AgentAction): AgentAction[] {
  const lib = buildActionLibrary(ctx);
  const candidates: AgentAction[] = [];

  if (ctx.latestSession) candidates.push(lib.reviewLast);
  if (ctx.planStatus === 'in_progress') candidates.push(lib.continuePlan);
  candidates.push(lib.uploadFollowUp);
  if (!ctx.equipment.sufficientForFit) candidates.push(lib.updateEquipment);
  if (ctx.sessionCount >= 2) candidates.push(lib.viewProgress);

  // De-dupe and drop the primary action.
  const seen = new Set<string>([primary.id]);
  const out: AgentAction[] = [];
  for (const c of candidates) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out.slice(0, 4);
}
