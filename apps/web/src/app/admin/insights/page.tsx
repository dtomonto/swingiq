// ============================================================
// /admin/insights — Owner Insights / North-Star dashboard
// ------------------------------------------------------------
// The owner's growth scoreboard. Admin-guarded by app/admin/layout.tsx.
// ============================================================

import type { Metadata } from 'next';
import { InsightsDashboard } from '@/components/insights/InsightsDashboard';

export const metadata: Metadata = { title: 'Insights | Admin', robots: 'noindex, nofollow' };

export default function AdminInsightsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-100">Growth Insights</h1>
        <p className="mt-1 text-sm text-gray-400">
          Your North-Star, the funnel to steer by, and where the real numbers live.
        </p>
      </header>
      <InsightsDashboard />
    </div>
  );
}
