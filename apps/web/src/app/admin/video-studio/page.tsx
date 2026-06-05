// ============================================================
// SwingVantage — Admin: Video Studio control panel (server entry)
// ------------------------------------------------------------
// Guarded by app/admin/layout.tsx (ADMIN_SECRET header in prod; open in
// dev). Loads the initial dashboard data directly from the engine + repo
// (no HTTP round-trip) and hands it to the client cockpit. Mutations go
// through /api/video-studio/* (which enforce the same admin guard).
// ============================================================

import type { Metadata } from 'next';
import {
  scanForOpportunities,
  getProviderConfigs,
  globalMaxCostCents,
  getRepo,
} from '@/lib/video-studio';
import { VideoStudioCockpit } from '@/components/video-studio/admin/VideoStudioCockpit';

export const metadata: Metadata = {
  title: 'Video Studio | SwingVantage Admin',
  robots: 'noindex, nofollow',
};

// Always render fresh (admin tool; reflects latest scan/repo state).
export const dynamic = 'force-dynamic';

export default async function VideoStudioAdminPage() {
  const repo = getRepo();
  const stored = await repo.listOpportunities();
  const opportunities = stored.length > 0 ? stored : scanForOpportunities();

  return (
    <VideoStudioCockpit
      initial={{
        opportunities,
        providers: getProviderConfigs(),
        budgetCents: globalMaxCostCents(),
        storage: { persistent: repo.isPersistent(), label: repo.backendLabel() },
      }}
    />
  );
}
