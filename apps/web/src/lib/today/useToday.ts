'use client';

// ============================================================
// WS-01 — useToday: composes the existing intelligence hooks (agent next-
// best-action + insights, priority, profile intelligence, skill tree) and
// store activity into the focused Today view. Composition only.
// ============================================================

import { useMemo } from 'react';
import type { SportId } from '@swingiq/core';
import { useSwingVantageStore } from '@/store';
import { useAgentInsights } from '@/hooks/useAgentInsights';
import { usePriorityResult } from '@/lib/priority/usePriorityResult';
import { usePlayerProfileIntelligence } from '@/lib/player-profile/usePlayerProfileIntelligence';
import { useSkillTree } from '@/lib/skill-tree/useSkillTree';
import { useRetests } from '@/lib/retest/useRetests';
import { buildTodayView, deriveUserType, type TodayView } from './engine';

export function useToday(sport: SportId): TodayView {
  const { nextBestAction, insights } = useAgentInsights();
  const priority = usePriorityResult();
  const profile = usePlayerProfileIntelligence(sport);
  const tree = useSkillTree(sport);
  const retests = useRetests();
  const sessions = useSwingVantageStore((s) => s.sessions);
  const training = useSwingVantageStore((s) => s.training);
  const profileObj = useSwingVantageStore((s) => s.profile);

  return useMemo(() => {
    const userType = deriveUserType({
      totalSessions: sessions.length,
      profileComplete: !!profileObj,
      lastActiveAt: training.last_practice_date ?? null,
      skillLevel: profileObj?.skill_level ?? null,
    });

    const top = priority.top;
    const criticalAlert =
      top && (top.severity === 'critical' || top.severity === 'high')
        ? { label: top.label, summary: top.summary, severity: top.severity, href: top.recommendedPlanHref }
        : null;

    const skillFocus = (tree?.nodes ?? [])
      .filter((n) => n.status === 'needs_attention' || n.status === 'regressed')
      .slice(0, 3)
      .map((n) => ({ name: n.name, href: '/profile' }));

    const activePlan = training.active_diagnosis_id
      ? { label: 'Pick up where you left off in your active fix.', href: '/training' }
      : null;

    // Real retest-due signal: the most urgent open target that is due/overdue.
    const t = retests.topTarget;
    const retestDue =
      t && (t.status.status === 'due' || t.status.status === 'overdue')
        ? { label: `${t.faultName} — ${t.status.label}`, href: '/retest' }
        : null;

    const secondaryInsights = insights.slice(0, 4).map((i) => ({
      id: i.id,
      title: i.title,
      body: i.body,
      href: i.primaryAction?.href,
    }));

    return buildTodayView({
      userType,
      nextBestAction: nextBestAction
        ? {
            id: nextBestAction.id,
            label: nextBestAction.label,
            href: nextBestAction.href,
            helperText: nextBestAction.helperText,
          }
        : null,
      criticalAlert,
      retestDue,
      activePlan,
      dataCoverage: profile.dataCoverage,
      skillFocus,
      secondaryInsights,
    });
  }, [sessions.length, profileObj, training.last_practice_date, training.active_diagnosis_id, priority.top, tree, retests.topTarget, nextBestAction, insights, profile.dataCoverage]);
}
