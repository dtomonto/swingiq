// ============================================================
// /admin/mental-performance — Mental Performance management console
// ------------------------------------------------------------
// Part of CentralIntelligenceOS. Admin-guarded by app/admin/layout
// (ADMIN_EMAILS allowlist / ADMIN_SECRET). The pillar is pure + local-first,
// so the page hands off to a client console that reads the routine library,
// plans, coach vocabularies, the CIOS intelligence layer, GrowthOS
// opportunities, and the safety configuration — no network round-trip.
// ============================================================

import type { Metadata } from 'next';
import { Brain } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { MentalPerformanceDashboard } from './MentalPerformanceDashboard';

export const metadata: Metadata = {
  title: 'Mental Performance | Admin',
  robots: 'noindex, nofollow',
};
export const dynamic = 'force-dynamic';

export default function MentalPerformanceAdminPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Mental Performance"
        icon={Brain}
        description="Manage the emotion-management & mistake-recovery pillar: the routine library, training plans, coach vocabularies, the Mental Performance Intelligence layer (CentralIntelligenceOS), GrowthOS opportunities, and the safety/crisis configuration. Performance coaching only — never therapy."
      />
      <MentalPerformanceDashboard />
    </div>
  );
}
