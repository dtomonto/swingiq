// ============================================================
// /admin/feature-flags — feature management
// ============================================================

import type { Metadata } from 'next';
import { Flag } from 'lucide-react';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { FeatureFlagsClient } from './FeatureFlagsClient';

export const metadata: Metadata = { title: 'Feature Flags | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function AdminFeatureFlagsPage() {
  const user = await getAuthenticatedUser();
  const actor = user?.email ?? 'admin';

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Feature Flags"
        icon={Flag}
        description="Turn features on or off, set a rollout target and audience segments, and roll back instantly. Changes are saved on this device and recorded in the audit log."
      />

      <SectionCard
        title="Honest note"
        description="These toggles are saved on THIS device (operator overrides) — they are not global product switches, so they don't change what other users see. Flags marked “registry” aren't read by any feature yet, so toggling one changes nothing until it's wired; “wired” flags affect this browser today. Global, all-user availability lives in code/env — see Settings and Integrations."
      >
        <FeatureFlagsClient actor={actor} />
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> A safe switchboard for product features.
          Each flag shows its risk level and whether app code already reads it.
        </p>
        <p>
          <strong className="text-gray-300">High-risk flags.</strong> Enabling a high-risk flag (e.g.
          auto-publishing AI pages) asks for confirmation, because it can affect safety or what goes live.
        </p>
        <p>
          <strong className="text-gray-300">Rollback.</strong> Toggle off, or press Reset to return a flag to
          its registry default. Every change is in the audit log.
        </p>
      </HelpPanel>
    </div>
  );
}
