// ============================================================
// /admin/approvals — Action Center
// ------------------------------------------------------------
// The single "what needs me" inbox. It does NOT reimplement any tool —
// it gathers, via thin adapters, everything that needs the owner's
// review / approval / implementation across the app (audit findings,
// Feature Education drafts, SEO opportunities, video opportunities,
// changelog drafts, generated fixes) and deep-links back to each tool.
// Pairs with /admin/audits (the audit reports themselves).
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Inbox, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { collectServerActions, summarizeActions } from '@/lib/admin/action-center';
import { ActionRow } from './ActionRow';
import { ClientActionItems } from './ClientActionItems';

export const metadata: Metadata = { title: 'Action Center | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function AdminApprovalsPage() {
  const items = await collectServerActions();
  const summary = summarizeActions(items);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Action Center"
        icon={Inbox}
        description="One inbox for everything that needs you — audit findings, drafts to approve, SEO opportunities and more. Each row links straight to the tool that handles it. Nothing here is invented: every count is read live from a real source."
        actions={
          <StatusBadge tone={summary.hasCritical ? 'danger' : summary.items > 0 ? 'warning' : 'success'}>
            {summary.items > 0 ? `${summary.total} to act on` : 'All clear'}
          </StatusBadge>
        }
      />

      {/* Roll-up */}
      <div className="grid grid-cols-3 gap-3">
        <MetricStat label="Things to act on" value={String(summary.total)} hint="across all sources" tone={summary.total > 0 ? 'default' : 'muted'} />
        <MetricStat label="Sources" value={String(summary.items)} hint="reporting work" />
        <MetricStat label="Critical" value={String(items.filter((i) => i.severity === 'critical').reduce((n, i) => n + i.count, 0))} hint="need it first" tone={summary.hasCritical ? 'warning' : 'muted'} />
      </div>

      {/* The inbox (server-derived) */}
      <SectionCard
        title="Needs your attention"
        description="Review / approve / implement. Highest severity first."
      >
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-gray-500">
            <CheckCircle2 className="h-8 w-8 text-emerald-500/70" />
            <p>Nothing in the automated queues right now.</p>
            <p className="text-xs">New audit findings, drafts and opportunities will appear here as your agents run.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <ActionRow key={item.id} item={item} />
            ))}
          </ul>
        )}

        {/* Browser-local queues (Generated Fixes) merge in here. */}
        <div className="mt-2">
          <ClientActionItems />
        </div>
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> Your one-stop hub for everything that
          needs the owner. Instead of hopping between Feature Education, Publishing, Video Studio, SEO and
          the <Link href="/admin/audits">Audit Reports</Link>, the Action Center collects each tool&apos;s
          pending work into one list and sends you straight to the right place to act.
        </p>
        <p>
          <strong className="text-gray-300">Why it&apos;s honest.</strong> Every row is a live count from a
          real source — never a placeholder. When a queue is empty it simply doesn&apos;t show. Some queues
          live in your browser (Generated Fixes), so they appear once the page loads.
        </p>
        <p>
          <strong className="text-gray-300">What it doesn&apos;t do.</strong> It doesn&apos;t replace the
          tools or push anything for you — actions still happen in each tool (and publish/apply still become
          a git diff you push), keeping the &ldquo;you review &amp; ship&rdquo; model intact.
        </p>
      </HelpPanel>
    </div>
  );
}
