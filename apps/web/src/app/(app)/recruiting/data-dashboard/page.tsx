'use client';

import { useRecruitingStore } from '@/lib/recruiting';
import { DataDashboard, ImprovementTimeline } from '@/components/recruiting';

export default function DataDashboardPage() {
  const sport = useRecruitingStore((s) => s.profile?.primarySport ?? 'golf');
  return (
    <div className="space-y-5">
      <DataDashboard sport={sport} />
      <ImprovementTimeline sport={sport} />
    </div>
  );
}
