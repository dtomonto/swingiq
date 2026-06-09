// ============================================================
// SwingVantage — FeatureHighlights (server component)
// ------------------------------------------------------------
// A reusable cross-link block that surfaces a curated set of feature detail
// pages from any marketing surface (sport hubs, explainers, homepage). It is
// the main INBOUND-link path to /features/[slug] — those pages need links from
// high-authority pages to rank, not just from the /features hub. Reads the
// registry directly, so a renamed feature can never produce a broken link here.
// ============================================================

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getFeature, featureHref } from '@/content/features';

interface FeatureHighlightsProps {
  /** Feature slugs to surface, in display order. Unknown slugs are skipped. */
  slugs: string[];
  heading?: string;
  blurb?: string;
  className?: string;
}

export function FeatureHighlights({
  slugs,
  heading = 'Key features',
  blurb,
  className = '',
}: FeatureHighlightsProps) {
  const features = slugs.map(getFeature).filter((f): f is NonNullable<typeof f> => Boolean(f));
  if (features.length === 0) return null;

  return (
    <section className={className}>
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">{heading}</h2>
        {blurb && <p className="text-muted-foreground mb-8 text-sm">{blurb}</p>}
        <div className={`grid sm:grid-cols-2 gap-3 ${blurb ? '' : 'mt-8'}`}>
          {features.map((f) => (
            <Link
              key={f.slug}
              href={featureHref(f)}
              className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{f.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.summary}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          ))}
        </div>
        <Link href="/features" className="inline-flex items-center gap-1 mt-5 text-sm font-medium text-primary hover:underline">
          See all features <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
