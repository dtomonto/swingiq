'use client';

import { DashboardContent } from './DashboardContent';
import { NonGolfDashboard } from './NonGolfDashboard';
import { IntentPicker } from '@/components/intent/IntentPicker';
import { FirstWeekPlanCard } from '@/components/onboarding/FirstWeekPlanCard';
import { FoundingProgressNudge } from '@/components/founding/FoundingProgressNudge';
import { useSport } from '@/contexts/SportContext';

export default function DashboardPage() {
  const { isGolf } = useSport();

  return (
    <>
      {/* Low-cognition front door (§5.1): one question that routes into the
          existing flow. The full sport dashboard renders right below. */}
      <IntentPicker />
      {/* Guided First 7 Days — leads new athletes through the activation→habit
          path one step at a time; self-hides once they graduate (the retention
          loop that gates Phase 2). */}
      <FirstWeekPlanCard />
      {/* Personal Founding-Member progress (profile + sessions) so the qualify
          loop is visible where users land, not only on /profile. Self-hides
          once qualified or when the campaign is full. */}
      <FoundingProgressNudge />
      {isGolf ? <DashboardContent /> : <NonGolfDashboard />}
    </>
  );
}
