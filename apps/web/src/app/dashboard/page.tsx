'use client';

import { AppShell } from '@/components/layout/AppShell';
import { DashboardContent } from './DashboardContent';
import { NonGolfDashboard } from './NonGolfDashboard';
import { useSport } from '@/contexts/SportContext';

export default function DashboardPage() {
  const { isGolf } = useSport();

  return (
    <AppShell>
      {isGolf ? <DashboardContent /> : <NonGolfDashboard />}
    </AppShell>
  );
}
