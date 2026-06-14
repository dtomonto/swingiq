// ============================================================
// Player Experience Overhaul — Today engine (WS-01)
// ------------------------------------------------------------
// Turns the existing intelligence (agent next-best-action, priority engine,
// profile intelligence, skill tree, journey) into a FOCUSED Today view:
// a small, capped set of primary items, with everything else pushed into
// collapsed sections. Pure + deterministic; it selects + ranks, it does not
// recompute scores or fabricate anything.
// ============================================================

export type TodayUserType = 'new' | 'beginner' | 'intermediate' | 'advanced' | 'returning';

export type TodayKind =
  | 'must_do'
  | 'recommended_next'
  | 'retest_due'
  | 'critical_alert'
  | 'active_plan'
  | 'skill_focus'
  | 'secondary';

export interface TodayItem {
  id: string;
  kind: TodayKind;
  /** Higher = more urgent (used only for ordering). */
  urgency: number;
  title: string;
  reason: string;
  actionHref?: string;
  actionLabel?: string;
  collapsedDetail?: string;
  source: string;
}

export interface TodaySection {
  id: string;
  title: string;
  items: TodayItem[];
}

export interface TodayView {
  userType: TodayUserType;
  visibleCap: number;
  primary: TodayItem[];
  collapsed: TodaySection[];
}

export interface TodayInput {
  userType: TodayUserType;
  nextBestAction?: { id: string; label: string; href: string; helperText?: string } | null;
  criticalAlert?: { label: string; summary: string; severity: string; href: string } | null;
  retestDue?: { label: string; href: string } | null;
  activePlan?: { label: string; href: string } | null;
  /** From profile intelligence: data coverage gates new-user onboarding. */
  dataCoverage?: 'none' | 'low' | 'moderate' | 'high';
  /** Skill-tree nodes that need attention or regressed. */
  skillFocus?: { name: string; href: string }[];
  /** Lower-priority insights for the collapsed "More insights" section. */
  secondaryInsights?: { id: string; title: string; body: string; href?: string }[];
  now?: string;
}

/** Visible primary-item cap by user type. */
export const TODAY_CAPS: Record<TodayUserType, number> = {
  new: 4,
  beginner: 3,
  intermediate: 4,
  advanced: 6,
  returning: 4,
};

const BASE_URGENCY: Record<TodayKind, number> = {
  critical_alert: 100,
  retest_due: 90,
  must_do: 85,
  recommended_next: 70,
  active_plan: 60,
  skill_focus: 50,
  secondary: 30,
};

/**
 * Derive a coarse user type from activity + skill level. Pure.
 */
export function deriveUserType(args: {
  totalSessions: number;
  profileComplete: boolean;
  lastActiveAt: string | null;
  skillLevel?: string | null;
  now?: string;
}): TodayUserType {
  if (args.totalSessions === 0 || !args.profileComplete) return 'new';
  if (args.lastActiveAt) {
    const days = (new Date(args.now ?? Date.now()).getTime() - new Date(args.lastActiveAt).getTime()) / 86_400_000;
    if (days > 14) return 'returning';
  }
  switch (args.skillLevel) {
    case 'beginner': return 'beginner';
    case 'advanced':
    case 'elite': return 'advanced';
    default: return 'intermediate';
  }
}

export function buildTodayView(input: TodayInput): TodayView {
  const cap = TODAY_CAPS[input.userType];
  const candidates: TodayItem[] = [];

  if (input.criticalAlert) {
    const sevBump = input.criticalAlert.severity === 'critical' ? 10 : input.criticalAlert.severity === 'high' ? 4 : 0;
    candidates.push({
      id: 'critical_alert',
      kind: 'critical_alert',
      urgency: BASE_URGENCY.critical_alert + sevBump,
      title: input.criticalAlert.label,
      reason: input.criticalAlert.summary,
      actionHref: input.criticalAlert.href,
      actionLabel: 'Address it',
      source: 'priority',
    });
  }

  if (input.retestDue) {
    candidates.push({
      id: 'retest_due',
      kind: 'retest_due',
      urgency: BASE_URGENCY.retest_due,
      title: 'Retest due',
      reason: input.retestDue.label,
      actionHref: input.retestDue.href,
      actionLabel: 'Start retest',
      source: 'retest',
    });
  }

  // New users get an explicit onboarding "must do".
  if (input.dataCoverage === 'none' || input.userType === 'new') {
    candidates.push({
      id: 'onboarding',
      kind: 'must_do',
      urgency: BASE_URGENCY.must_do,
      title: 'Set up your profile & first swing',
      reason: 'Complete your profile and upload a swing to unlock personalized coaching.',
      actionHref: '/profile',
      actionLabel: 'Get started',
      source: 'onboarding',
    });
  }

  if (input.nextBestAction) {
    candidates.push({
      id: `nba_${input.nextBestAction.id}`,
      kind: 'recommended_next',
      urgency: BASE_URGENCY.recommended_next,
      title: input.nextBestAction.label,
      reason: input.nextBestAction.helperText ?? 'Your recommended next action.',
      actionHref: input.nextBestAction.href,
      actionLabel: 'Do it',
      source: 'agent',
    });
  }

  if (input.activePlan) {
    candidates.push({
      id: 'active_plan',
      kind: 'active_plan',
      urgency: BASE_URGENCY.active_plan,
      title: 'Continue your plan',
      reason: input.activePlan.label,
      actionHref: input.activePlan.href,
      actionLabel: 'Continue',
      source: 'plan',
    });
  }

  for (const [i, node] of (input.skillFocus ?? []).entries()) {
    candidates.push({
      id: `skill_${i}`,
      kind: 'skill_focus',
      urgency: BASE_URGENCY.skill_focus - i,
      title: `Work on ${node.name}`,
      reason: 'A skill-tree area that needs attention.',
      actionHref: node.href,
      actionLabel: 'Open',
      source: 'skill_tree',
    });
  }

  for (const [i, ins] of (input.secondaryInsights ?? []).entries()) {
    candidates.push({
      id: `insight_${ins.id}`,
      kind: 'secondary',
      urgency: BASE_URGENCY.secondary - i,
      title: ins.title,
      reason: ins.body,
      actionHref: ins.href,
      collapsedDetail: ins.body,
      source: 'agent',
    });
  }

  // Stable sort by urgency desc (ties keep insertion order).
  const ranked = candidates
    .map((c, i) => ({ c, i }))
    .sort((a, b) => b.c.urgency - a.c.urgency || a.i - b.i)
    .map((x) => x.c);

  const primary = ranked.slice(0, cap);
  const overflow = ranked.slice(cap);

  const collapsed: TodaySection[] = [];
  const optional = overflow.filter((i) => i.kind !== 'secondary');
  const moreInsights = overflow.filter((i) => i.kind === 'secondary');
  if (optional.length) collapsed.push({ id: 'optional', title: 'Optional work', items: optional });
  if (moreInsights.length) collapsed.push({ id: 'more', title: 'More insights', items: moreInsights });

  return { userType: input.userType, visibleCap: cap, primary, collapsed };
}
