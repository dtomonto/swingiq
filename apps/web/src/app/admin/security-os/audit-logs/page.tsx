// ============================================================
// /admin/security-os/audit-logs — security audit log viewer
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { ScrollText, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { requireSecurityAccess } from '@/lib/security-os/access.server';
import { AuditLogsClient } from './AuditLogsClient';

export const metadata: Metadata = { title: 'Security Audit Log | securityOS', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function SecurityAuditLogsPage() {
  await requireSecurityAccess();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <Link href="/admin/security-os" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> securityOS
      </Link>
      <PageHeader
        title="Security audit log"
        icon={ScrollText}
        description="A record of security-relevant admin actions — finding status changes, risk acceptances, exports and settings changes. Secrets and keys are redacted before anything is stored. Filter, search and export."
      />

      <AuditLogsClient />

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> Every securityOS action that changes state
          writes an entry here, so security decisions are accountable and reviewable.
        </p>
        <p>
          <strong className="text-foreground">Redaction.</strong> Entry metadata is passed through a secret/PII
          redactor before persistence — API keys, tokens, JWTs and emails are masked. Nothing sensitive is
          stored raw.
        </p>
        <p>
          <strong className="text-foreground">Where it&apos;s stored.</strong> Locally on this device (most
          recent entries). A shared, server-side <code>security_audit_log</code> table can be mirrored later.
        </p>
      </HelpPanel>
    </div>
  );
}
