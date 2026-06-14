// ============================================================
// /admin/audits — Audit Reports
// ------------------------------------------------------------
// Every internal audit robot's findings, surfaced IN the dashboard
// (mirrored from docs/master-audit-report.json + docs/audits/* by
// scripts/sync-audit-reports.mjs). The owner can track each finding
// open → in-progress → done. Pairs with /admin/approvals (Action
// Center) — audits answer "what did the robots find", approvals answer
// "what needs me right now".
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { ClipboardCheck, ArrowUpRight } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import {
  loadFindings,
  summarizeFindings,
  loadAuditSources,
  reportMeta,
} from '@/lib/admin/audits/data';
import { AuditFindingsTable } from './AuditFindingsTable';

export const metadata: Metadata = { title: 'Audit Reports | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

function fmtDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

export default async function AdminAuditsPage() {
  const findings = loadFindings();
  const summary = summarizeFindings(findings);
  const sources = loadAuditSources();
  const meta = reportMeta();
  const hasData = findings.length > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Audit Reports"
        icon={ClipboardCheck}
        description="Every internal audit robot's findings, in one place. The SEO, AI, Engagement and Build-health audits each write a report on a schedule; this hub mirrors them in-app so you never have to open files on disk."
        actions={
          <StatusBadge tone={meta.writable ? 'success' : 'info'}>
            {meta.writable ? 'Tracking on' : 'View-only'}
          </StatusBadge>
        }
      />

      {/* Summary */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Findings at a glance</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <MetricStat label="Total findings" value={String(summary.total)} hint="across all audits" />
          <MetricStat label="Needs you (P0/P1)" value={String(summary.openCritical)} hint="open & high-priority" tone={summary.openCritical > 0 ? 'default' : 'muted'} />
          <MetricStat label="Open" value={String(summary.open)} hint="not started" />
          <MetricStat label="In progress" value={String(summary.inProgress)} hint="being worked" />
          <MetricStat label="Done" value={String(summary.done)} hint="resolved / tracked done" tone="muted" />
        </div>
        {meta.masterGenerated && (
          <p className="mt-2 text-xs text-muted-foreground">
            Master report generated {fmtDate(meta.masterGenerated)} · mirrored into the dashboard {fmtDate(meta.syncedAt)}.
          </p>
        )}
      </section>

      {/* Audit source cards */}
      <SectionCard
        title="The audits"
        description="What runs, how often, and when it next runs. Local commits only — the robots never push."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {sources.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-card/60 p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{a.label}</span>
                <StatusBadge tone="neutral">{a.cadence}</StatusBadge>
                {a.href && (
                  <Link href={a.href} className="ml-auto text-muted-foreground hover:text-link" aria-label={`Open ${a.label} tool`}>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{a.blurb}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted-foreground">
                <span>Last run: {fmtDate(a.lastRunDate)}</span>
                {a.nextRunIso && <span>· Next: {fmtDate(a.nextRunIso)}</span>}
                {a.lastReport && (
                  <span className="text-muted-foreground/70">· {a.lastReport.path}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Consolidated findings */}
      <SectionCard
        title="Consolidated findings"
        description="Every finding the master report compiled, newest audit cycle. Mark progress as you work them."
      >
        {hasData ? (
          <AuditFindingsTable findings={findings} writable={meta.writable} />
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <p>No findings yet.</p>
            <p className="mt-1">
              Run your audits (or <code className="text-muted-foreground">node scripts/sync-audit-reports.mjs</code>) to
              populate this from <code className="text-muted-foreground">docs/master-audit-report.json</code>.
            </p>
          </div>
        )}
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> Your scheduled audit robots (SEO, AI
          features, Engagement, Build-health) and the monthly master compiler write reports to{' '}
          <code>docs/</code>. This hub mirrors them into the dashboard so everything the robots find is
          visible here, alongside <Link href="/admin/approvals">the Action Center</Link> which collects
          what needs your review or approval.
        </p>
        <p>
          <strong className="text-foreground">How tracking is saved.</strong> Marking a finding
          open/in-progress/done edits a small versioned data file, so your change is a normal git diff you
          commit &amp; push — the same model as Publishing. Production runs read-only, so it&apos;s
          view-only there; track from local dev, then push.
        </p>
        <p>
          <strong className="text-foreground">Staying current.</strong> The mirror refreshes automatically
          after each commit (post-commit hook), or run{' '}
          <code>npm run audits:sync</code> any time.
        </p>
      </HelpPanel>
    </div>
  );
}
