// ============================================================
// /admin/ai-usage — AI usage tracking + "pay for more" in one place
// ------------------------------------------------------------
// One screen to (1) see what AI is costing — by operation and by day —
// and (2) top up capacity at your provider without leaving the dashboard.
// Spend figures are clearly-labelled upper-bound ESTIMATES; call counts
// are honest exact totals. Payment always completes on the provider's
// own secure billing page (we never take a card here).
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Coins, ExternalLink, CreditCard, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { RecheckButton } from '@/components/admin/RecheckButton';
import {
  getAiBudgetStatus,
  getAiUsageReport,
  getAiProviderBilling,
} from '@/lib/ai-budget';

export const metadata: Metadata = { title: 'AI Usage & Billing | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default async function AiUsagePage() {
  const [budget, usage, billing] = await Promise.all([
    getAiBudgetStatus(),
    getAiUsageReport(14),
    Promise.resolve(getAiProviderBilling()),
  ]);

  const maxDayCents = Math.max(1, ...usage.byDay.map((d) => d.cents));

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="AI Usage & Billing"
        icon={Coins}
        description="See what AI is costing — by feature and by day — and top up capacity without leaving the dashboard. Spend is an estimate; call counts are exact."
        actions={<RecheckButton />}
      />

      {/* ── Headline metrics ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat
          label="Spent today (est.)"
          value={usd(usage.today.cents)}
          hint={`${usage.today.calls} AI call${usage.today.calls === 1 ? '' : 's'}`}
          tone={budget.exceeded ? 'warning' : 'default'}
        />
        <MetricStat
          label="Last 14 days (est.)"
          value={usd(usage.totals.cents)}
          hint={`${usage.totals.calls} AI call${usage.totals.calls === 1 ? '' : 's'}`}
          tone="muted"
        />
        <MetricStat
          label="Daily cap"
          value={budget.configured ? usd(budget.limitCents) : 'None'}
          hint={budget.configured ? 'Kill-switch armed' : 'Uncapped'}
          tone={budget.configured ? 'success' : 'muted'}
        />
        <MetricStat
          label="Cap remaining"
          value={budget.configured ? usd(budget.remainingCents) : '—'}
          hint={budget.configured ? (budget.exceeded ? 'Paused until 00:00 UTC' : 'Today') : 'No cap set'}
          tone={budget.configured ? (budget.remainingCents > 0 ? 'success' : 'warning') : 'muted'}
        />
      </div>

      {!usage.enabled && (
        <div className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm text-gray-400">
          <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
          <p>
            No AI provider is configured yet, so there are no paid calls to meter — usage will start
            appearing here automatically once you connect a provider on the{' '}
            <Link className="text-emerald-400 hover:underline" href="/admin/integrations">Integrations</Link> page.
          </p>
        </div>
      )}

      {/* ── Pay for more usage ───────────────────────────── */}
      <SectionCard
        title="Add capacity / pay for more usage"
        description="Top up credits or raise your limit directly at your provider. Payment completes on their secure page — opens in a new tab."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {billing.links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between gap-3 rounded-lg border border-gray-800 bg-gray-950 p-3 transition hover:border-emerald-500/40 hover:bg-gray-900"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 shrink-0 text-gray-500" />
                  <span className="text-sm font-medium text-gray-200">{link.name}</span>
                  {link.configured ? (
                    <StatusBadge tone="success">In use</StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Not connected</StatusBadge>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">{link.detail}</p>
              </div>
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-gray-600 group-hover:text-emerald-400" />
            </a>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Want a hard spend ceiling instead? Set{' '}
          <code className="rounded bg-gray-800 px-1 text-gray-300">AI_DAILY_BUDGET_CENTS</code> (e.g.{' '}
          <code className="rounded bg-gray-800 px-1 text-gray-300">500</code> = $5.00/day). When reached, paid
          calls pause and the app serves its keyless fallback until the next UTC day. See{' '}
          <Link className="text-emerald-400 hover:underline" href="/admin/system-health">System Health</Link>.
        </p>
      </SectionCard>

      {/* ── By operation ─────────────────────────────────── */}
      <SectionCard
        title="Usage by feature (last 14 days)"
        description="Which AI-backed features are driving spend. Counts are exact; cost is an upper-bound estimate."
      >
        {usage.byOp.length === 0 ? (
          <p className="text-sm text-gray-500">No AI calls recorded in this window yet.</p>
        ) : (
          <ul className="divide-y divide-gray-800">
            {usage.byOp.map((row) => (
              <li key={row.op} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-200">{row.label}</p>
                  <p className="text-xs text-gray-500">{row.calls} call{row.calls === 1 ? '' : 's'}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-300">{usd(row.cents)}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* ── Daily trend ──────────────────────────────────── */}
      <SectionCard title="Daily trend" description="Estimated AI spend per UTC day (most recent first).">
        <ul className="space-y-1.5">
          {usage.byDay.map((d) => (
            <li key={d.date} className="flex items-center gap-3 text-xs">
              <span className="w-20 shrink-0 tabular-nums text-gray-500">{d.date.slice(5)}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-800">
                <div
                  className="h-full rounded-full bg-emerald-500/70"
                  style={{ width: `${Math.round((d.cents / maxDayCents) * 100)}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right tabular-nums text-gray-400">{usd(d.cents)}</span>
              <span className="w-14 shrink-0 text-right tabular-nums text-gray-600">{d.calls} ✕</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> A single place to watch AI spend and add
          capacity. Every paid AI call (vision, coaching, OCR, growth, etc.) is metered by feature and day.
        </p>
        <p>
          <strong className="text-gray-300">Estimates vs. exact.</strong> Costs are coarse upper-bound estimates
          (the guard errs toward protecting the bill), so they may read slightly high — call <em>counts</em> are
          exact. Figures reset daily at 00:00 UTC. Counter source:{' '}
          {usage.source === 'upstash'
            ? 'shared across all instances (Upstash).'
            : usage.source === 'memory'
              ? 'per-instance memory — set Upstash for fleet-wide accuracy.'
              : 'metering is currently off.'}
        </p>
        <p>
          <strong className="text-gray-300">Paying for more.</strong> The buttons above open your provider&apos;s
          own billing console; SwingVantage never stores a card. Topping up there raises your real API capacity
          immediately.
        </p>
      </HelpPanel>
    </div>
  );
}
