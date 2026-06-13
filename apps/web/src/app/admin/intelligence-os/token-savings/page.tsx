// Intelligence OS — Token Savings. The business case: third-party spend vs.
// avoided spend, by feature and provider. Honest "estimated" cost model.

import { Coins } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { IntelNav } from '@/components/admin/intelligence-os/IntelNav';
import { aiEventsRepo, tokenSavingsRepo } from '@/lib/intelligence-os/store';
import { summarizeTokenSavings } from '@/lib/intelligence-os/metrics';

export const dynamic = 'force-dynamic';

const money = (n: number) => `$${n.toFixed(2)}`;
const k = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export default async function TokenSavingsPage() {
  const [events, ledger] = await Promise.all([aiEventsRepo.list(), tokenSavingsRepo.list()]);
  const s = summarizeTokenSavings(events, ledger);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title="Token Savings"
        icon={Coins}
        description="How much third-party AI the OS is avoiding by serving cache / canonical / retrieval answers. Cost figures are estimates from a blended public rate — never billed amounts."
      />
      <IntelNav />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricStat label="Calls avoided" value={k(s.aiCallsAvoided)} status={s.aiCallsAvoided > 0 ? 'good' : undefined} />
        <MetricStat label="Tokens avoided" value={k(s.tokensAvoided)} />
        <MetricStat label="Est. saved" value={money(s.estimatedCostSaved)} status={s.estimatedCostSaved > 0 ? 'good' : undefined} />
        <MetricStat label="3P calls" value={k(s.thirdPartyCalls)} />
        <MetricStat label="3P tokens" value={k(s.thirdPartyTokens)} />
        <MetricStat label="3P cost" value={money(s.thirdPartyCost)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Savings by feature">
          {s.byFeature.length === 0 ? <p className="text-sm text-muted-foreground">No savings recorded yet.</p> : (
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr><th className="pb-2">Feature</th><th className="pb-2 text-right">Tokens</th><th className="pb-2 text-right">Saved</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {s.byFeature.map((f) => (
                  <tr key={f.feature}><td className="py-1.5">{f.feature}</td><td className="py-1.5 text-right tabular-nums">{k(f.tokensAvoided)}</td><td className="py-1.5 text-right tabular-nums">{money(f.costSaved)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>

        <SectionCard title="Third-party cost by provider">
          {s.byProvider.length === 0 ? <p className="text-sm text-muted-foreground">No third-party calls captured yet.</p> : (
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr><th className="pb-2">Provider</th><th className="pb-2 text-right">Calls</th><th className="pb-2 text-right">Cost</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {s.byProvider.map((p) => (
                  <tr key={p.provider}><td className="py-1.5">{p.provider}</td><td className="py-1.5 text-right tabular-nums">{p.calls}</td><td className="py-1.5 text-right tabular-nums">{money(p.cost)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
