'use client';

import { EngagementAnalyticsPanel, CoachNotesPanel } from '@/components/recruiting';

export default function AnalyticsPage() {
  return (
    <div className="space-y-5">
      <EngagementAnalyticsPanel />
      <CoachNotesPanel />
    </div>
  );
}
