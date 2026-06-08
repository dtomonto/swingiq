// ============================================================
// /admin/central-intelligence — CentralIntelligenceOS command center
// ------------------------------------------------------------
// The platform's ethical intelligence brain. Admin-guarded by
// app/admin/layout (ADMIN_EMAILS allowlist / ADMIN_SECRET). Computes
// the dashboard server-side (real Founding campaign data + labelled
// aggregate intelligence) and hands it to a client shell for the
// tabbed panels + the membership-gate control.
// ============================================================

import type { Metadata } from 'next';
import { BrainCircuit } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { getCentralIntelligenceDashboard } from '@/lib/central-intelligence/dashboard';
import { CentralIntelligenceDashboard } from './CentralIntelligenceDashboard';

export const metadata: Metadata = {
  title: 'Central Intelligence | Admin',
  robots: 'noindex, nofollow',
};
export const dynamic = 'force-dynamic';

export default async function CentralIntelligencePage() {
  const data = await getCentralIntelligenceDashboard();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="CentralIntelligenceOS"
        icon={BrainCircuit}
        description="The platform's ethical intelligence brain — user memory, profile & session intelligence, the Founding Members campaign, recommendations and data governance. Built to make SwingVantage smarter over time without ever selling or exposing user data."
      />
      <CentralIntelligenceDashboard data={data} />
    </div>
  );
}
