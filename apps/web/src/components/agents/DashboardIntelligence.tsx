'use client';

// ============================================================
// SwingIQ — Dashboard Intelligence Block
// ------------------------------------------------------------
// The single embedded "intelligent product layer" for the
// dashboard. Shows a compact mode switcher, then the right hero
// for the moment — a guided first-swing journey for brand-new
// athletes, Welcome Back for returning users, or the next best
// step — followed by a calm, capped set of contextual insight
// cards. When the user is in Parent or Coach mode, the matching
// shareable summary is surfaced so the mode visibly re-frames
// the dashboard. One coherent voice — not a wall of bots.
//
// Renders nothing until the store hydrates (hydration-safe).
// ============================================================

import { useAgentInsights } from '@/hooks/useAgentInsights';
import { useRetests } from '@/lib/retest';
import { useSwingIQStore } from '@/store';
import { getTone } from '@/lib/coaching/tones';
import { WelcomeBackCard } from './WelcomeBackCard';
import { NextBestActionCard } from './NextBestActionCard';
import { FirstSwingJourneyCard } from './FirstSwingJourneyCard';
import { UserModeSelector } from './UserModeSelector';
import { CoachSummaryCard } from './CoachSummaryCard';
import { ParentSummaryCard } from './ParentSummaryCard';
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

  // The audience mode (same source of truth as the Settings selector).
  const mode = getTone(useSwingIQStore((s) => s.settings.coaching_tone)).id;

  if (!ready || !resume || !nextBestAction) return null;

  // Brand-new athlete (no sessions yet): lead with the guided journey.
  const isFirstTime = resume.sessionCount === 0;

  // Welcome Back is for returning users who actually have something to resume.
  const showWelcomeBack =
    !isFirstTime &&
    !welcomeBackDismissed &&
    resume.sessionCount > 0 &&
    (resume.status === 'continue' || resume.status === 'stale');

  return (
    <div className="space-y-4">
      <UserModeSelector />

      {isFirstTime ? (
        <FirstSwingJourneyCard firstName={resume.userFirstName} />
      ) : showWelcomeBack ? (
        <WelcomeBackCard resume={resume} onDismiss={dismissWelcomeBack} />
      ) : (
        <NextBestActionCard action={nextBestAction} />
      )}

      {topTarget && <RetestReminderCard target={topTarget} onDismiss={dismissRetest} />}

      {/* Mode-driven reframing: parent/coach get their shareable summary
          (each self-hides when there is no data yet). */}
      {mode === 'parent' && <ParentSummaryCard />}
      {mode === 'coach' && <CoachSummaryCard />}

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
