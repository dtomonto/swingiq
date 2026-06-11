// ============================================================
// /admin/security-os/recommendations — prioritized security to-dos
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Gauge, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { requireSecurityAccess } from '@/lib/security-os/access.server';
import { runSecurityScan } from '@/lib/security-os/generate.server';
import { RecommendationsClient } from './RecommendationsClient';

export const metadata: Metadata = { title: 'Recommendations | securityOS', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function SecurityRecommendationsPage() {
  const ctx = await requireSecurityAccess();
  const scan = runSecurityScan();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <Link href="/admin/security-os" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> securityOS
      </Link>
      <PageHeader
        title="Recommendations"
        icon={Gauge}
        description="What to do, prioritized — Do Today, This Week, Monitor, plus what needs manual setup or is waiting on credentials. Each item explains why it matters, the business impact, the exact steps, whether Claude Code can implement it now, and whether it belongs in CI."
      />

      <RecommendationsClient actor={ctx.email ?? 'admin'} findings={scan.findings} generatedAt={scan.generatedAt} />

      <HelpPanel>
        <p>
          <strong className="text-foreground">How priority is set.</strong> Severity drives most of the score,
          nudged by risk score and how easily it can be fixed now. Recommendations are recomputed from your
          OPEN findings, so triaging or accepting a risk removes it here too.
        </p>
      </HelpPanel>
    </div>
  );
}
