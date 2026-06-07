// ============================================================
// SwingVantage — Admin: Feature Education Engine (server entry)
// ------------------------------------------------------------
// Guarded by app/admin/layout.tsx (ADMIN_SECRET in prod; open in dev).
// Loads the dashboard overview directly from the engine + repo (no HTTP
// round-trip) and hands it to the client cockpit. Mutations go through
// /api/feature-education/* (same admin guard).
// ============================================================

import type { Metadata } from 'next';
import { loadOverview } from '@/lib/feature-education/server/data';
import { FeatureEducationCockpit } from '@/components/feature-education/admin/FeatureEducationCockpit';

export const metadata: Metadata = {
  title: 'Feature Education | SwingVantage Admin',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function FeatureEducationAdminPage() {
  const overview = await loadOverview();
  return <FeatureEducationCockpit initial={overview} />;
}
