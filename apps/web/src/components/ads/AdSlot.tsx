'use client';

// ============================================================
// SwingVantage — AdsOS: the drop-in <AdSlot>
// ------------------------------------------------------------
// Place <AdSlot placement="dashboard-feed" /> anywhere. It renders one of:
//   • nothing (minors, members, disabled slots, or no fill)
//   • a house promo (keyless default — grows the product now)
//   • a paid ad container (only when a network is configured), clearly
//     labeled "Advertisement" and non-personalized for youth-safety.
// The component never throws and never shifts layout when empty.
// ============================================================

import { useAds } from '@/lib/ads';
import type { AdPlacementId } from '@/lib/ads';
import { HouseAdCard } from './HouseAdCard';

const ADS_CLIENT_ID = process.env.NEXT_PUBLIC_ADS_CLIENT_ID || '';

export function AdSlot({
  placement,
  isMember = false,
  className = '',
}: {
  placement: AdPlacementId;
  isMember?: boolean;
  className?: string;
}) {
  const { decision, dismissHouse } = useAds(placement, isMember);

  if (decision.kind === 'none') return null;

  if (decision.kind === 'house') {
    return (
      <div className={className}>
        <HouseAdCard ad={decision.ad} onDismiss={() => dismissHouse(decision.ad.id)} />
      </div>
    );
  }

  // Paid: a labeled, non-personalized container ready for the configured
  // network. The network's own script fills it; if unfilled it stays empty.
  return (
    <div className={className}>
      <div
        className="overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30"
        role="complementary"
        aria-label="Advertisement"
        data-ad-client={ADS_CLIENT_ID || undefined}
        data-ad-slot={decision.placement.id}
      >
        <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Advertisement
        </p>
        {/* The configured ad network renders into this container. */}
        <div className="min-h-[60px] px-3 pb-3" />
      </div>
    </div>
  );
}
