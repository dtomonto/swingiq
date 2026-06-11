// ============================================================
// /admin/audit-log — admin activity history
// ============================================================

import type { Metadata } from 'next';
import { ScrollText } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { AuditLogClient } from './AuditLogClient';

export const metadata: Metadata = { title: 'Audit Log | Admin', robots: 'noindex, nofollow' };

export default function AdminAuditLogPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Audit Log"
        icon={ScrollText}
        description="A record of admin actions — who changed what and when. Search, filter by severity, and export."
      />

      <SectionCard>
        <AuditLogClient />
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> Every mutating admin action (toggling a
          flag, suspending a user, reviewing a generated fix) writes an entry here so changes are accountable.
        </p>
        <p>
          <strong className="text-foreground">Where it&apos;s stored.</strong> Entries are kept locally on this
          device (the most recent 500). For a shared, server-side trail across admins, an
          <code> admin_audit_log</code> table can be added later and mirrored automatically.
        </p>
        <p>
          <strong className="text-foreground">What to do next.</strong> Use it to confirm a change happened, or
          export a snapshot before a risky operation.
        </p>
      </HelpPanel>
    </div>
  );
}
