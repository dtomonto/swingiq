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

      <div className="rounded-lg bg-gray-900 border border-gray-800 p-3 text-xs text-gray-400">
        Competitor research treats public pages strictly as <strong className="text-gray-300">data</strong> — no aggressive scraping or ToS violations.
        Insights connect to a marketing implication and a recommended action.
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">Competitor insights</h2>
        <RecordModule definitionId="competitors" records={competitors} hideNote />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">Voice-of-customer insights</h2>
        <RecordModule definitionId="customer-insights" records={customerInsights} />
      </section>
    </div>
  );
}
