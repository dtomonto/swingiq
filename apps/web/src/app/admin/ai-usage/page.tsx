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
import { Coins, ExternalLink, CreditCard, BarChart3, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { RecheckButton } from '@/components/admin/RecheckButton';
import { AiBudgetEditor } from '@/components/admin/AiBudgetEditor';
import { AiUserCapEditor } from '@/components/admin/AiUserCapEditor';
import {
  getAiBudgetStatus,
  getAiUsageReport,
  getAiProviderBilling,
} from '@/lib/ai-budget';
import { getUserAiCapStatus } from '@/lib/ai/user-ai';

export const metadata: Metadata = { title: 'AI Usage & Billing | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default async function AiUsagePage() {
  const [budget, usage, billing, userCap] = await Promise.all([
    getAiBudgetStatus(),
    getAiUsageReport(14),
    Promise.resolve(getAiProviderBilling()),
    getUserAiCapStatus(),
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
        <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
          <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p>
            No AI provider is configured yet, so there are no paid calls to meter — usage will start
            appearing here automatically once you connect a provider on the{' '}
            <Link className="text-success-text hover:underline" href="/admin/integrations">Integrations</Link> page.
          </p>
        </div>
      )}

      {usage.enabled && usage.source === 'memory' && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-text" />
          <p>
            <strong className="font-medium">Usage tracking is degraded.</strong>{' '}
            AI calls are being metered, but counts are kept in <strong className="font-medium">per-instance
            memory</strong> because Upstash isn&apos;t configured — so figures reset on every deploy and don&apos;t
            add up across serverless instances. That&apos;s why this dashboard can read $0.00 even while AI is
            running, and your daily spend cap only holds per-server. Add{' '}
            <code className="rounded bg-muted px-1 text-foreground">UPSTASH_REDIS_REST_URL</code> and{' '}
            <code className="rounded bg-muted px-1 text-foreground">UPSTASH_REDIS_REST_TOKEN</code> (free at{' '}
            <a className="text-success-text hover:underline" href="https://upstash.com" target="_blank" rel="noopener noreferrer">upstash.com</a>),
            then redeploy — usage will persist fleet-wide. See the{' '}
            <Link className="text-success-text hover:underline" href="/admin/setup">Setup</Link> page for status.
          </p>
        </div>
      )}

      {/* ── Daily spend cap (editable) ────────────────────── */}
      <SectionCard
        title="Daily spend cap"
        description="The maximum estimated AI spend per UTC day across every feature (coaching, video, OCR…). When reached, paid AI calls pause and the app serves its keyless fallback until the next day. Set 0 for unlimited."
      >
        <AiBudgetEditor initialCents={budget.limitCents} initialSource={budget.limitSource} />
      </SectionCard>

      {/* ── Per-user daily spend cap (editable) ───────────── */}
      <SectionCard
        title="Per-user daily cap"
        description="The most estimated AI spend ONE signed-in account can use per UTC day. When a user reaches it, AI auto-pauses for that account (their app serves its keyless fallback) until the next day — everyone else is unaffected. Set 0 for no per-user limit. Anonymous traffic is governed by the global cap above."
      >
        <AiUserCapEditor initialCents={userCap.limitCents} initialSource={userCap.limitSource} />
      </SectionCard>

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
              className="group flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3 transition hover:border-success/40 hover:bg-card"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{link.name}</span>
                  {link.configured ? (
                    <StatusBadge tone="success">In use</StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Not connected</StatusBadge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{link.detail}</p>
              </div>
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70 group-hover:text-success-text" />
            </a>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Want a hard spend ceiling? Set it in <strong className="text-foreground">Daily spend cap</strong>{' '}
          above — no redeploy needed. The{' '}
          <code className="rounded bg-muted px-1 text-foreground">AI_DAILY_BUDGET_CENTS</code> env var is the
          deploy-time default the dashboard cap overrides.
        </p>
      </SectionCard>

      {/* ── By operation ─────────────────────────────────── */}
      <SectionCard
        title="Usage by feature (last 14 days)"
        description="Which AI-backed features are driving spend. Counts are exact; cost is an upper-bound estimate."
      >
        {usage.byOp.length === 0 ? (
          <p className="text-sm text-muted-foreground">No AI calls recorded in this window yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {usage.byOp.map((row) => (
              <li key={row.op} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.calls} call{row.calls === 1 ? '' : 's'}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{usd(row.cents)}</span>
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
              <span className="w-20 shrink-0 tabular-nums text-muted-foreground">{d.date.slice(5)}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-success/70"
                  style={{ width: `${Math.round((d.cents / maxDayCents) * 100)}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">{usd(d.cents)}</span>
              <span className="w-14 shrink-0 text-right tabular-nums text-muted-foreground/70">{d.calls} ✕</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> A single place to watch AI spend and add
          capacity. Every paid AI call (vision, coaching, OCR, growth, etc.) is metered by feature and day.
        </p>
        <p>
          <strong className="text-foreground">Estimates vs. exact.</strong> Costs are coarse upper-bound estimates
          (the guard errs toward protecting the bill), so they may read slightly high — call <em>counts</em> are
          exact. Figures reset daily at 00:00 UTC. Counter source:{' '}
          {usage.source === 'upstash'
            ? 'shared across all instances (Upstash).'
            : usage.source === 'memory'
              ? 'per-instance memory — set Upstash for fleet-wide accuracy.'
              : 'metering is currently off.'}
        </p>
        <p>
          <strong className="text-foreground">Paying for more.</strong> The buttons above open your provider&apos;s
          own billing console; SwingVantage never stores a card. Topping up there raises your real API capacity
          immediately.
        </p>
      </HelpPanel>
    </div>
  );
}
