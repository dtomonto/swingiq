// /design-lab/publishing — DEV-ONLY preview of the admin PublishingOS command
// center, including the new entity Detail drawer. notFound() in production +
// noindex. Renders the REAL PublishingOSClient with REAL data from the publish
// registries/stores (getPublishingOSData reads them; no secrets — it's the
// publish queue of public content), so the admin design can be reviewed without
// a Supabase session.
//
// NOTE: publish TOGGLES call the admin-gated /api/admin/updates and will return
// 401/403 here (no admin session) — this preview is for reviewing the UI +
// Detail drawer, not for actually publishing.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishingOSData } from '@/lib/publishing/admin-data.server';
import { PublishingOSClient } from '@/components/admin/publishing/PublishingOSClient';

export const metadata: Metadata = {
  title: 'Design Lab · PublishingOS (dev)',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function DesignLabPublishingPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  const data = await getPublishingOSData();
  return (
    <>
      <div className="border-b border-border bg-card/40 px-4 py-2">
        <p className="mx-auto max-w-[1500px] text-xs text-muted-foreground">
          <span className="font-semibold text-link">Design Lab · PublishingOS</span> — the real command center +
          entity Detail drawer (click a queue row), dev-only &amp; noindex. Toggles need an admin session, so they
          no-op here.
        </p>
      </div>
      <PublishingOSClient data={data} actor="design-lab" />
    </>
  );
}
