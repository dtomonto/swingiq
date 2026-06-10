// ============================================================
// /admin/publishing — PublishingOS command center
// ------------------------------------------------------------
// The central operating layer that turns admin decisions into safe, live
// product changes. Reads the REAL publish snapshot + durable override store and
// renders the switchable-direction command center. Admin-gated by the parent
// admin/layout guard; content.publish is re-asserted on every write in the API.
// ============================================================

import type { Metadata } from 'next';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { getPublishingOSData } from '@/lib/publishing/admin-data.server';
import { PublishingOSClient } from '@/components/admin/publishing/PublishingOSClient';

export const metadata: Metadata = { title: 'PublishingOS | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function PublishingOSPage() {
  const user = await getAuthenticatedUser();
  const actor = user?.email ?? 'admin';
  const data = await getPublishingOSData();
  return <PublishingOSClient data={data} actor={actor} />;
}
