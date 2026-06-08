// ============================================================
// /admin/analytics — Analytics OS (PostHog control center)
// ------------------------------------------------------------
// One place to manage everything PostHog does: product & web analytics,
// session replay, funnels, retention, feature flags, experiments, surveys,
// cohorts and SQL. The server assembles the static dashboard (connection +
// capability coverage + catalog) with NO network call, so the page always
// loads instantly; the client fetches live numbers on demand and the
// personal API key never leaves the server.
// ============================================================

import type { Metadata } from 'next';
import { BarChart3 } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { buildAnalyticsOsDashboard } from '@/lib/posthog';
import { AnalyticsOsDashboard } from './AnalyticsOsDashboard';

export const metadata: Metadata = { title: 'Analytics OS | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default function AdminAnalyticsPage() {
  const dashboard = buildAnalyticsOsDashboard(process.env);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Analytics OS"
        icon={BarChart3}
        description="Your unified PostHog control center — product & web analytics, session replay, funnels, feature flags, experiments, surveys and SQL, managed in one place. Powered by PostHog."
      />
      <AnalyticsOsDashboard dashboard={dashboard} />
    </div>
  );
}
