// ============================================================
// /admin/branch-guardian — BranchGuardianOS command center
// ------------------------------------------------------------
// The developer-operations cockpit: a live Git Cleanliness Score, branch &
// worktree health, ranked NON-DESTRUCTIVE cleanup recommendations with
// copy-paste-safe commands, an audit log and settings. The git inventory is
// read from a committed snapshot (scripts/scan-branches.mjs) — the app never
// shells out to git. Generation is server-side + stateless; owner state
// (recommendation status / settings / history / audit) persists in the browser.
// ============================================================

import type { Metadata } from 'next';
import { GitBranch } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { requireDevOpsAccess } from '@/lib/branch-guardian/access.server';
import { getSnapshot, runBranchGuardianScan } from '@/lib/branch-guardian/generate.server';
import { BranchGuardianDashboardClient } from './BranchGuardianDashboardClient';

export const metadata: Metadata = { title: 'BranchGuardianOS | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function BranchGuardianPage() {
  const ctx = await requireDevOpsAccess();
  const snapshot = getSnapshot();
  const scan = runBranchGuardianScan();

  const counts = scan.recommendationCounts;
  const tone = counts.bySeverity.critical > 0 || counts.bySeverity.high > 0
    ? 'warning'
    : scan.cleanliness.band === 'high_risk' || scan.cleanliness.band === 'stale'
      ? 'warning'
      : 'success';

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="BranchGuardianOS"
        icon={GitBranch}
        description="Your Git/worktree governance system. A live Git Cleanliness Score, branch & worktree health, and a ranked list of NON-DESTRUCTIVE cleanup recommendations — what's stale, what's safe to delete, what needs a rebase — each with copy-paste-safe commands. Nothing is ever executed: it prepares commands and you approve them."
        actions={
          <StatusBadge tone={tone}>
            {!scan.isGitRepo
              ? 'No snapshot'
              : counts.bySeverity.high > 0
                ? `${counts.bySeverity.high} high`
                : `Cleanliness ${scan.cleanliness.value}`}
          </StatusBadge>
        }
      />

      <BranchGuardianDashboardClient
        actor={ctx.email ?? 'admin'}
        snapshot={snapshot}
        initialScan={scan}
      />

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> A developer-operations command center —
          which branches and worktrees are clean, stale, abandoned, merged or risky, and exactly what to do
          about each. The Git Cleanliness Score is a weighted roll-up of branch + worktree hygiene.
        </p>
        <p>
          <strong className="text-gray-300">How it stays safe.</strong> The app never runs git. The inventory
          comes from a committed snapshot (<code>npm run scan:branches</code>), and every cleanup is generated
          as copy-paste command text labelled by safety. Destructive commands sit behind an explicit approval
          and are never executed for you. Protected branches are never deletion candidates.
        </p>
        <p>
          <strong className="text-gray-300">How your progress is saved.</strong> Reviewing, snoozing and
          approving recommendations, settings and the score history are saved in your browser, so this works in
          production and survives re-scans. Every action writes a redacted entry to the audit log.
        </p>
      </HelpPanel>
    </div>
  );
}
