'use client';

// ============================================================
// SwingIQ — Dashboard Intelligence Block
// ------------------------------------------------------------
// The single embedded "intelligent product layer" for the
// dashboard. Shows the Welcome Back card for returning users
// (or the next best step otherwise), followed by a calm,
// capped set of contextual insight cards. One coherent voice —
// not a wall of bots.
//
// Renders nothing until the store hydrates (hydration-safe).
// ============================================================

import { useAgentInsights } from '@/hooks/useAgentInsights';
import { useRetests } from '@/lib/retest';
import { WelcomeBackCard } from './WelcomeBackCard';
import { NextBestActionCard } from './NextBestActionCard';
import { AgentInsightCard } from './AgentInsightCard';
import { RetestReminderCard } from '@/components/retest/RetestReminderCard';

export function DashboardIntelligence() {
  const {
    ready,
    resume,
    nextBestAction,
    insights,
    welcomeBackDismissed,
    dismissWelcomeBack,
    dismissInsight,
  } = useAgentInsights();

  // The single most urgent retest (due/overdue only) — keeps the dashboard
  // calm by never nagging about findings that are still comfortably active.
  const { topTarget, dismiss: dismissRetest } = useRetests();

  if (!ready || !resume || !nextBestAction) return null;

  // Welcome Back is for returning users who actually have something to resume.
  const showWelcomeBack =
    !welcomeBackDismissed &&
    resume.sessionCount > 0 &&
    (resume.status === 'continue' || resume.status === 'stale');

  return (
    <div className="space-y-4">
      {showWelcomeBack ? (
        <WelcomeBackCard resume={resume} onDismiss={dismissWelcomeBack} />
      ) : (
        <NextBestActionCard action={nextBestAction} />
      )}

      {topTarget && <RetestReminderCard target={topTarget} onDismiss={dismissRetest} />}

      {insights.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {insights.map((insight) => (
            <AgentInsightCard key={insight.id} insight={insight} onDismiss={dismissInsight} />
          ))}
        </div>
      )}
    </div>
  );
}
