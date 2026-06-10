// ============================================================
// /admin/insights — Owner Insights / North-Star dashboard
// ------------------------------------------------------------
// The owner's growth scoreboard. Admin-guarded by app/admin/layout.tsx.
// ============================================================

import type { Metadata } from 'next';
import { Lightbulb } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { InsightsDashboard } from '@/components/insights/InsightsDashboard';

export const metadata: Metadata = { title: 'Insights | Admin', robots: 'noindex, nofollow' };

export default function AdminInsightsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <PageHeader
        title="Growth Insights"
        icon={Lightbulb}
        description="Your North-Star, the funnel to steer by, and where the real numbers live."
      />
      <InsightsDashboard />
    </div>
  );
}
