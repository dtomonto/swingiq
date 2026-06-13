import type { Metadata } from 'next';
import { Settings } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { getSettings } from '@/lib/intelligence-os/store';
import { IntelligenceTabs } from '../IntelligenceTabs';
import { SettingsForm } from './SettingsForm';

export const metadata: Metadata = { title: 'Intelligence OS · Settings | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function IntelligenceSettingsPage() {
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Intelligence OS · Settings"
        icon={Settings}
        description="Thresholds and policies that govern routing, caching, knowledge promotion, privacy exclusions and data retention."
      />
      <IntelligenceTabs />
      <SectionCard title="Routing & learning thresholds">
        <SettingsForm initial={settings} />
      </SectionCard>
    </div>
  );
}
