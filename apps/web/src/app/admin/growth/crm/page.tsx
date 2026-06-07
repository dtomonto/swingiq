import type { Metadata } from 'next';
import { ShieldAlert } from 'lucide-react';
import { ModuleHeader } from '../_components/ui';
import { RecordModule } from '../_components/RecordModule';
import { GROWTH_NAV_FLAT } from '@/lib/growth/nav';
import { crmMessagesRepo, automationsRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'Email / CRM | GrowthOS', robots: 'noindex, nofollow' };

export default async function CrmPage() {
  const nav = GROWTH_NAV_FLAT.find((n) => n.key === 'crm');
  const [messages, automations] = await Promise.all([crmMessagesRepo.list(), automationsRepo.list()]);
  return (
    <div className="space-y-8">
      <ModuleHeader icon={nav?.icon} title={nav?.label ?? 'Email / CRM'} description={nav?.description ?? ''} />

      <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          <strong>Draft-first by default.</strong> GrowthOS never sends a real email, SMS, or push. Messages stay in
          draft until a provider is securely configured <em>and</em> a human explicitly enables sending. The
          "Send-enabled" count on each message starts at zero.
        </span>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">Messages</h2>
        <RecordModule definitionId="crm" records={messages} hideNote />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">Lifecycle automations</h2>
        <RecordModule definitionId="automations" records={automations} />
      </section>
    </div>
  );
}
