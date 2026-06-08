// ============================================================
// /admin/security-os — securityOS Executive Command Center
// ------------------------------------------------------------
// The founder's security operating cockpit: a live Security Health Score,
// risk-domain posture, and a prioritized "what to do today" list — each item
// explaining what's wrong, why it matters, what could happen, how urgent it
// is and exactly what to do. Generation is server-side + stateless
// (lib/security-os); owner state (finding status / settings / history /
// audit log) persists in the browser so it works in production's read-only FS.
// ============================================================

import type { Metadata } from 'next';
import { ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { requireSecurityAccess } from '@/lib/security-os/access.server';
import { runSecurityScan } from '@/lib/security-os/generate.server';
import { SecurityOSDashboardClient } from './SecurityOSDashboardClient';

export const metadata: Metadata = { title: 'securityOS | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function SecurityOSPage() {
  const ctx = await requireSecurityAccess();
  const scan = runSecurityScan();

  const critical = scan.score.counts.critical;
  const tone = critical > 0 ? 'danger' : scan.score.counts.high > 0 ? 'warning' : 'success';

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="securityOS"
        icon={ShieldAlert}
        description="Your security operating system. A live Security Health Score, prioritized findings and recommendations, AI/data/API risk posture, audit logging and incident runbooks — computed from your real configuration. Every number traces to a real signal; unknowns are labelled, never faked."
        actions={
          <StatusBadge tone={tone}>
            {critical > 0
              ? `${critical} critical`
              : scan.score.counts.high > 0
                ? `${scan.score.counts.high} high`
                : 'No critical/high'}
          </StatusBadge>
        }
      />

      <SecurityOSDashboardClient
        actor={ctx.email ?? 'admin'}
        score={scan.score}
        findings={scan.findings}
        recommendations={scan.recommendations}
        generatedAt={scan.generatedAt}
        hasUnknowns={scan.hasUnknowns}
      />

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> A security command center for the
          operator — what&apos;s vulnerable, why it matters, how urgent it is, and exactly what to do today.
          The Security Health Score is a weighted roll-up of real posture checks across seven domains.
        </p>
        <p>
          <strong className="text-gray-300">How it&apos;s honest.</strong> Checks resolve to pass, partial,
          fail or <em>unknown</em>. An <em>unknown</em> check (a signal we couldn&apos;t read) is excluded from
          the score and instead lowers the visible confidence — nothing is ever silently assumed safe.
        </p>
        <p>
          <strong className="text-gray-300">How your progress is saved.</strong> Triaging findings, accepting
          risk, notes, settings and the score history are saved in your browser, so this works in production
          and survives re-scans. Every status change writes a redacted entry to the security audit log.
        </p>
      </HelpPanel>
    </div>
  );
}
