import type { Metadata } from 'next';
import { Coins } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { MetricCard } from '@/components/admin/MetricStat';
import { SectionCard } from '@/components/admin/SectionCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { getSavingsBreakdown } from '@/lib/intelligence-os/dashboard';
import { IntelligenceTabs } from '../IntelligenceTabs';

export const metadata: Metadata = { title: 'Intelligence OS · Token Savings | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const cents = (n: number) => `$${(n / 100).toFixed(2)}`;

function BreakdownList({ rows }: { rows: { label: string; calls: number; costCents: number }[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No data yet.</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center justify-between gap-3 text-sm">
          <span className="truncate text-foreground">{r.label}</span>
          <span className="shrink-0 text-muted-foreground">{r.calls} avoided · {cents(r.costCents)}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function TokenSavingsPage() {
  const b = await getSavingsBreakdown();
  const empty = b.totalCallsAvoided === 0;
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Intelligence OS · Token Savings"
        icon={Coins}
        description="Business impact of first-party intelligence: AI calls and tokens avoided, and estimated cost saved. Savings from cache hits use the original call's real cost; estimated rows are labeled accordingly."
      />
      <IntelligenceTabs />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard label="Estimated cost saved" value={cents(b.totalSavedCents)} tone="success" />
        <MetricCard label="Tokens avoided" value={b.totalTokensAvoided.toLocaleString()} tone="success" />
        <MetricCard label="AI calls avoided" value={b.totalCallsAvoided} tone="success" />
      </div>

      {empty ? (
        <EmptyState
          title="No savings recorded yet"
          description="As the router serves answers from cache, canonical answers, rules or retrieval, each avoided third-party call is written to the token-savings ledger and summarized here."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard title="Saved by served-by"><BreakdownList rows={b.byServedBy} /></SectionCard>
          <SectionCard title="Saved by provider avoided"><BreakdownList rows={b.byProvider} /></SectionCard>
          <SectionCard title="Saved by feature"><BreakdownList rows={b.byFeature} /></SectionCard>
        </div>
      )}
    </div>
  );
}
