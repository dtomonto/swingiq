// ============================================================
// /admin/decisions — Decision Center
// ------------------------------------------------------------
// One ranked queue for everything that needs a decision. Absorbs the
// Action Center inbox (collectServerActions) into priority-ordered
// DecisionCards with an interpreted "our read" and a CTA back to the
// native tool. Audit-first: reuses the existing aggregator + adapters —
// it never reimplements a queue. Priority is derived transparently from
// severity + volume; nothing is invented.
// ============================================================

import type { Metadata } from 'next';
import { Scale, CheckCheck } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { type DecisionBand, type DecisionVM } from '@/components/admin/DecisionCard';
import { DecisionsClient } from '@/components/admin/DecisionsClient';
import { collectServerActions, summarizeActions, type ActionItem, type ActionSeverity } from '@/lib/admin/action-center';

export const metadata: Metadata = { title: 'Decision Center | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const BAND_FOR: Record<ActionSeverity, DecisionBand> = {
  critical: 'critical',
  warning: 'warning',
  info: 'watch',
  success: 'routine',
};
const BASE_SCORE: Record<ActionSeverity, number> = { critical: 84, warning: 64, info: 44, success: 28 };

function toDecision(item: ActionItem): DecisionVM {
  const cap = item.severity === 'critical' ? 16 : 10;
  const score = Math.min(100, BASE_SCORE[item.severity] + Math.min(Math.max(0, item.count), cap));
  return {
    id: item.id,
    score,
    band: BAND_FOR[item.severity],
    type: item.sourceLabel,
    title: item.title,
    read: item.detail,
    meta: [item.severity, `${item.count} item${item.count === 1 ? '' : 's'}`],
    href: item.href,
    cta: item.cta ?? 'Review',
    severity: item.severity,
    count: item.count,
  };
}

export default async function DecisionCenterPage() {
  let items: ActionItem[] = [];
  try {
    items = await collectServerActions();
  } catch {
    items = [];
  }
  const summary = summarizeActions(items);
  const decisions = items.map(toDecision).sort((a, b) => b.score - a.score);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Decision Center"
        icon={Scale}
        description={
          summary.items > 0
            ? `${summary.total} thing${summary.total === 1 ? '' : 's'} across ${summary.items} source${summary.items === 1 ? '' : 's'} need a decision — one ranked queue (priority = severity × volume), each linking to the tool that handles it.`
            : 'Every queue that used to be checked separately now lands here — ranked, with an interpreted read on each.'
        }
        actions={
          <StatusBadge tone={summary.hasCritical ? 'critical' : summary.items > 0 ? 'warning' : 'healthy'}>
            {summary.items} waiting
          </StatusBadge>
        }
      />

      {decisions.length === 0 ? (
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-6 shadow-theme">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-success/30 bg-success/10 text-success-text">
            <CheckCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Nothing waiting on you</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Every review, approval and audit queue is clear. New decisions surface here, ranked, as they arrive.
            </p>
          </div>
        </div>
      ) : (
        <DecisionsClient decisions={decisions} />
      )}

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> One ranked queue for every decision that needs
          you — approvals, audit findings, opportunities and review queues from across the admin. Instead of
          patrolling eight surfaces, you work one priority order, top-down.
        </p>
        <p>
          <strong className="text-foreground">How priority works.</strong> Each row is scored from its severity and
          how many underlying items it represents — critical and high-volume rise to the top. Every card links to the
          native tool that actually performs the action; the Decision Center only ranks and interprets.
        </p>
      </HelpPanel>
    </div>
  );
}
