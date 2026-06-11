import type { Metadata } from 'next';
import { ModuleHeader } from '../_components/ui';
import { RecordModule } from '../_components/RecordModule';
import { GROWTH_NAV_FLAT } from '@/lib/growth/nav';
import { creatorsRepo, affiliatesRepo } from '@/lib/growth/repository';

export const metadata: Metadata = { title: 'Creators / Affiliates | GrowthOS', robots: 'noindex, nofollow' };

export default async function CreatorsPage() {
  const nav = GROWTH_NAV_FLAT.find((n) => n.key === 'creators');
  const [creators, affiliates] = await Promise.all([creatorsRepo.list(), affiliatesRepo.list()]);
  return (
    <div className="space-y-8">
      <ModuleHeader icon={nav?.icon} title={nav?.label ?? 'Creators / Affiliates'} description={nav?.description ?? ''} />

      <div className="rounded-lg bg-primary/10 border border-primary/30 p-3 text-xs text-link">
        <strong>Compliance:</strong> every sponsored or affiliate placement must carry a clear disclosure (#ad / sponsored / FTC affiliate disclosure).
        Tracking links and coupon codes are placeholders until your affiliate platform is connected.
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Creator & influencer partners</h2>
        <RecordModule definitionId="creators" records={creators} hideNote />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Affiliate partners</h2>
        <RecordModule definitionId="affiliates" records={affiliates} />
      </section>
    </div>
  );
}
