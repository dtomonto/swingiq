'use client';

import { DashboardContent } from './DashboardContent';
import { NonGolfDashboard } from './NonGolfDashboard';
import { useSport } from '@/contexts/SportContext';

export default function DashboardPage() {
  const { isGolf } = useSport();

  return (
    <>
      {isGolf ? <DashboardContent /> : <NonGolfDashboard />}
    </>
  );
}
