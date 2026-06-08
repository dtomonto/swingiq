// ============================================================
// /admin/coach-mix — Coach Mix Learning Engine command center
// ------------------------------------------------------------
// Part of CentralIntelligenceOS. Admin-guarded by app/admin/layout
// (ADMIN_EMAILS allowlist / ADMIN_SECRET). The engine is pure + local-
// first, so the page hands the seed profiles to a client console that
// builds mixes, previews the resolved coaching strategy, runs the
// learned-concept review queue, and tests a mix against a sample
// diagnostic — all without a network round-trip.
//
// Everything here is ADMIN-ONLY. Nothing user-facing ships until the
// owner enables NEXT_PUBLIC_COACH_MIX_USER_MODULE.
// ============================================================

import type { Metadata } from 'next';
import { Blend } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { CoachMixDashboard } from './CoachMixDashboard';

export const metadata: Metadata = {
  title: 'Coach Mix | Admin',
  robots: 'noindex, nofollow',
};
export const dynamic = 'force-dynamic';

export default function CoachMixPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Coach Mix"
        icon={Blend}
        description="Study admin-approved coaching sources and turn them into ORIGINAL SwingVantage teaching frameworks. Blend coach-inspired influences, preview how the blend changes SwingVantage's coaching, and approve what's learned — never copying, cloning, or implying endorsement."
      />
      <CoachMixDashboard />
    </div>
  );
}
