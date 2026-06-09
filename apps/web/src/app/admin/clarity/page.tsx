// ============================================================
// /admin/clarity — Clarity OS (Microsoft Clarity control center)
// ------------------------------------------------------------
// One place for everything Microsoft Clarity does: session recordings,
// heatmaps, traffic, engagement and the behavioral quality signals (rage
// clicks, dead clicks, script errors). The server assembles the static
// dashboard (connection + capability coverage) with NO network call, so the
// page always loads instantly; the client fetches live metrics on demand and
// the Data Export API token never leaves the server.
// ============================================================

import type { Metadata } from 'next';
import { Eye } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { buildClarityOsDashboard } from '@/lib/clarity';
import { ClarityOsDashboard } from './ClarityOsDashboard';

export const metadata: Metadata = { title: 'Clarity OS | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default function AdminClarityPage() {
  const dashboard = buildClarityOsDashboard(process.env);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Clarity OS"
        icon={Eye}
        description="Your Microsoft Clarity control center — session recordings, heatmaps, traffic, engagement and the behavioral quality signals (rage clicks, dead clicks, script errors), in one place. Powered by Microsoft Clarity."
      />
      <ClarityOsDashboard dashboard={dashboard} />
    </div>
  );
}
