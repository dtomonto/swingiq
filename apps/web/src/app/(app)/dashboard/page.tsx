'use client';

import { DashboardContent } from './DashboardContent';
import { NonGolfDashboard } from './NonGolfDashboard';
import { IntentPicker } from '@/components/intent/IntentPicker';
import { useSport } from '@/contexts/SportContext';

export default function DashboardPage() {
  const { isGolf } = useSport();

  return (
    <>
      {/* Low-cognition front door (§5.1): one question that routes into the
          existing flow. The full sport dashboard renders right below. */}
      <IntentPicker />
      {isGolf ? <DashboardContent /> : <NonGolfDashboard />}
    </>
  );
}
