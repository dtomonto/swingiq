import type { Metadata } from 'next';
import { ModuleHeader } from '../_components/ui';
import { RecordModule } from '../_components/RecordModule';
import { GROWTH_NAV_FLAT } from '@/lib/growth/nav';
import { competitorsRepo, customerInsightsRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'Market Intelligence | GrowthOS', robots: 'noindex, nofollow' };

export default async function MarketIntelPage() {
  const nav = GROWTH_NAV_FLAT.find((n) => n.key === 'market-intel');
  const [competitors, customerInsights] = await Promise.all([competitorsRepo.list(), customerInsightsRepo.list()]);
  return (
    <div className="space-y-8">
      <ModuleHeader icon={nav?.icon} title={nav?.label ?? 'Market Intelligence'} description={nav?.description ?? ''} />

      <div className="rounded-lg bg-card border border-border p-3 text-xs text-muted-foreground">
        Competitor research treats public pages strictly as <strong className="text-foreground">data</strong> — no aggressive scraping or ToS violations.
        Insights connect to a marketing implication and a recommended action.
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Competitor insights</h2>
        <RecordModule definitionId="competitors" records={competitors} hideNote />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Voice-of-customer insights</h2>
        <RecordModule definitionId="customer-insights" records={customerInsights} />
      </section>
    </div>
  );
}
