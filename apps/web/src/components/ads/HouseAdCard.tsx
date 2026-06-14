'use client';

// ============================================================
// SwingVantage — AdsOS: house ad creative
// ------------------------------------------------------------
// A self-promotion card. Transparently labeled "From SwingVantage" so it's
// never mistaken for a paid ad. Dismissible.
// ============================================================

import Link from 'next/link';
import { X, ArrowRight } from 'lucide-react';
import type { HouseAd } from '@/lib/ads';

const ACCENT: Record<HouseAd['accent'], string> = {
  primary: 'border-primary/30 bg-primary/5',
  success: 'border-success/30 bg-success/5',
  warning: 'border-warning/30 bg-warning/5',
};

export function HouseAdCard({ ad, onDismiss }: { ad: HouseAd; onDismiss: () => void }) {
  return (
    <div className={`relative rounded-2xl border p-4 ${ACCENT[ad.accent]}`}>
      <span className="text-3xs font-semibold uppercase tracking-wide text-muted-foreground">From SwingVantage</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X size={15} />
      </button>
      <p className="mt-1 font-semibold text-foreground">{ad.title}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{ad.body}</p>
      <Link
        href={ad.cta.href}
        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        {ad.cta.label} <ArrowRight size={14} />
      </Link>
    </div>
  );
}
