// ============================================================
// /admin/security-os/findings — findings management
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { ListChecks, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { requireSecurityAccess } from '@/lib/security-os/access.server';
import { runSecurityScan } from '@/lib/security-os/generate.server';
import { FindingsClient } from './FindingsClient';

export const metadata: Metadata = { title: 'Findings | securityOS', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function SecurityFindingsPage() {
  const ctx = await requireSecurityAccess();
  const scan = runSecurityScan();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <Link href="/admin/security-os" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300">
        <ArrowLeft className="h-3.5 w-3.5" /> securityOS
      </Link>
      <PageHeader
        title="Findings"
        icon={ListChecks}
        description="Every open security finding — derived from live posture checks and security-relevant audit findings. Filter, triage, accept risk with justification, and export. Status changes are saved in your browser and written to the security audit log."
      />

      <FindingsClient actor={ctx.email ?? 'admin'} findings={scan.findings} generatedAt={scan.generatedAt} />

      <HelpPanel>
        <p>
          <strong className="text-gray-300">Risk score</strong> combines severity, likelihood and impact.
          <strong className="text-gray-300"> Source</strong> shows whether a finding came from the posture
          scan or an internal audit robot.
        </p>
        <p>
          <strong className="text-gray-300">Accepting risk</strong> records your justification and removes the
          item from the active to-do — use it deliberately, and revisit accepted risks periodically.
        </p>
      </HelpPanel>
    </div>
  );
}
