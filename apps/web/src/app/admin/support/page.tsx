// ============================================================
// /admin/support — support center
// ============================================================

import type { Metadata } from 'next';
import { LifeBuoy } from 'lucide-react';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { SupportClient } from './SupportClient';

export const metadata: Metadata = { title: 'Support | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function AdminSupportPage() {
  const user = await getAuthenticatedUser();
  const actor = user?.email ?? 'admin';

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Support"
        icon={LifeBuoy}
        description="Track support tickets with user and sport context. Log issues, set priority, and move them through to resolution — every status change is audit-logged."
      />
      <SectionCard><SupportClient actor={actor} /></SectionCard>
      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> A lightweight ticket queue. It starts empty
          because there&apos;s no inbound channel wired yet — log tickets manually, or connect the contact form
          / email later to feed this automatically.
        </p>
        <p>
          <strong className="text-gray-300">What to do next.</strong> Triage by priority, resolve, and check
          the user&apos;s record (Users) for context when a ticket references their account.
        </p>
      </HelpPanel>
    </div>
  );
}
