'use client';

import { DashboardContent } from './DashboardContent';
import { NonGolfDashboard } from './NonGolfDashboard';
import { IntentPicker } from '@/components/intent/IntentPicker';
import { FirstWeekPlanCard } from '@/components/onboarding/FirstWeekPlanCard';
import { FoundingProgressNudge } from '@/components/founding/FoundingProgressNudge';
import { useSport } from '@/contexts/SportContext';

export default function DashboardPage() {
  const { isGolf } = useSport();

  // These render INSIDE the dashboard, immediately under the "Welcome back"
  // greeting — so the personal greeting leads, with Founding-Member progress
  // directly beneath it, then the low-cognition front door and the guided
  // first-week plan. Each self-hides when not relevant.
  const topNudges = (
    <>
      {/* Personal Founding-Member progress (profile + sessions). Self-hides
          once qualified or when the campaign is full. */}
      <FoundingProgressNudge />
      {/* Low-cognition front door (§5.1): one question that routes into the flow. */}
      <IntentPicker />
      {/* Guided First 7 Days — self-hides once the athlete graduates. */}
      <FirstWeekPlanCard />
    </>
  );

  return isGolf ? (
    <DashboardContent>{topNudges}</DashboardContent>
  ) : (
    <NonGolfDashboard>{topNudges}</NonGolfDashboard>
  );
}
