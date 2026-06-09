'use client';

import { DashboardContent } from './DashboardContent';
import { NonGolfDashboard } from './NonGolfDashboard';
import { IntentPicker } from '@/components/intent/IntentPicker';
import { FoundingProgressNudge } from '@/components/founding/FoundingProgressNudge';
import { useSport } from '@/contexts/SportContext';

export default function DashboardPage() {
  const { isGolf } = useSport();

  return (
    <>
      {/* Low-cognition front door (§5.1): one question that routes into the
          existing flow. The full sport dashboard renders right below. */}
      <IntentPicker />
      {/* Personal Founding-Member progress (profile + sessions) so the qualify
          loop is visible where users land, not only on /profile. Self-hides
          once qualified or when the campaign is full. */}
      <FoundingProgressNudge />
      {isGolf ? <DashboardContent /> : <NonGolfDashboard />}
    </>
  );
}
