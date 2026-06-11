// ============================================================
// /admin/milestones — Milestone Authority System command center
// ------------------------------------------------------------
// Admin-only. Evaluates the 100-milestone catalog against REAL metrics
// (getPlatformMetrics + content registries; honest "needs data source" when a
// source is missing), scores each page's Authority Impact, and lets the admin
// review/approve/edit/preview and export earned milestones to publish public
// pages. Generation is server-side + stateless; owner state persists locally.
// ============================================================

import type { Metadata } from 'next';
import { Milestone } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { requireMilestonesAccess } from '@/lib/milestones/access.server';
import { runMilestoneScan } from '@/lib/milestones/generate.server';
import { MilestoneCenterClient } from './MilestoneCenterClient';

export const metadata: Metadata = { title: 'Milestone Authority | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function MilestonesAdminPage() {
  const ctx = await requireMilestonesAccess();
  const scan = await runMilestoneScan();
  const earned = scan.counts.byStatus.earned;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Milestone Authority System"
        icon={Milestone}
        description="A strategic authority engine — not vanity badges. Tracks 100 verifiable milestones against your real metrics, scores each page's Authority Impact, and turns genuinely-earned milestones into SEO/AEO/GEO pages that build domain authority. Unverifiable metrics are honestly marked 'Needs Data Source' and never auto-publish."
        actions={<StatusBadge tone={earned > 0 ? 'success' : 'neutral'}>{earned} earned</StatusBadge>}
      />

      <MilestoneCenterClient
        actor={ctx.email ?? 'admin'}
        snapshot={scan.snapshot}
        initialEvaluated={scan.evaluated}
      />

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> Every milestone is tied to a real,
          measurable trigger. The engine reads what it can (registered users, analyses, sports live,
          published pages, shipped features) and honestly marks the rest <em>Needs Data Source</em> — it
          never fabricates a number.
        </p>
        <p>
          <strong className="text-foreground">How publishing works.</strong> A milestone only gets a public
          page after you <em>approve</em> it and commit it. Use “Export approved” to copy the entries into
          <code> content/milestones/published.ts</code> and commit — that is what makes pages live and adds
          them to the sitemap. Drafts and estimates never become public pages.
        </p>
        <p>
          <strong className="text-foreground">Authority Impact Score.</strong> An admin-only 0–100 estimate of
          how much SEO/AEO/GEO authority a milestone page would add, so you publish the high-leverage ones
          first and hold “Do Not Publish Yet” items back.
        </p>
      </HelpPanel>
    </div>
  );
}
