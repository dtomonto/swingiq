// TierSection — an attention-tier header for the Command Center briefing.
// Server-safe. The dot + label colour follow the Admin OS severity scale;
// the cards under it carry the weight, so the header stays small (≤11.5px).

import type { ReactNode } from 'react';

export type Tier = 'critical' | 'warning' | 'watch' | 'routine' | 'explore';

const TIER_DOT: Record<Tier, string> = {
  critical: 'bg-error',
  warning: 'bg-warning',
  watch: 'bg-chart-1',
  routine: 'bg-success',
  explore: 'bg-muted-foreground/40',
};

export interface TierSectionProps {
  tier: Tier;
  /** Plain label, e.g. "Needs you now". */
  label: string;
  /** Optional mono count shown after the label. */
  count?: number;
  children: ReactNode;
}

export function TierSection({ tier, label, count, children }: TierSectionProps) {
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${TIER_DOT[tier]}`} aria-hidden />
        <h2 className="text-[11.5px] font-bold uppercase tracking-wider text-foreground">{label}</h2>
        {count != null && <span className="font-mono text-2xs tabular-nums text-muted-foreground">{count}</span>}
        <span className="h-px flex-1 bg-border" />
      </div>
      {children}
    </section>
  );
}
