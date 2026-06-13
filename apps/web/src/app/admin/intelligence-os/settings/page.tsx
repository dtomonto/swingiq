// Intelligence OS — Settings. Thresholds, cache TTL, layered retention and the
// safety review gate. Persisted via the admin-guarded records API.

import { Settings as SettingsIcon } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { IntelNav } from '@/components/admin/intelligence-os/IntelNav';
import { SettingsForm } from '@/components/admin/intelligence-os/SettingsForm';
import { getSettings } from '@/lib/intelligence-os/store';

export const dynamic = 'force-dynamic';

export default async function IntelligenceSettingsPage() {
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <PageHeader
        title="Intelligence OS Settings"
        icon={SettingsIcon}
        description="Tune how aggressively the OS serves first-party answers, how long it retains data across hot / warm / cold tiers, and which content always requires human review."
      />
      <IntelNav />
      <SectionCard title="Routing, retention & safety">
        <SettingsForm initial={settings} />
      </SectionCard>
      <p className="mt-4 text-xs text-muted-foreground">
        Privacy exclusions (never stored in reusable knowledge): {settings.privacyExclusions.join(', ')}.
      </p>
    </div>
  );
}
