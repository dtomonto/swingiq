'use client';

import Link from 'next/link';
import { ANALYTICS_EVENTS, track } from '@/lib/analytics';

/**
 * The dual call-to-action that closes every authority page: a primary product
 * CTA (start a free analysis) and a secondary trust CTA (read how accuracy &
 * limitations work). Strong but not pushy — the trust link signals confidence,
 * not desperation. Fires AUTHORITY_CTA_CLICKED with the target.
 */
export function AuthorityCTA({
  slug,
  title = 'See it on your own swing',
  body = 'Import your data or upload a swing and get a confidence-labeled diagnosis, one priority fix, and a practice plan. Free, no account required.',
  primaryHref = '/start',
  primaryLabel = 'Start Free Analysis',
  trustHref = '/trust/accuracy-and-limitations',
  trustLabel = 'How accurate is it?',
}: {
  slug: string;
  title?: string;
  body?: string;
  primaryHref?: string;
  primaryLabel?: string;
  trustHref?: string;
  trustLabel?: string;
}) {
  return (
    <div className="mt-12 rounded-2xl border border-primary/30 bg-primary/10 p-6">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-foreground">{body}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href={primaryHref}
          onClick={() => track(ANALYTICS_EVENTS.AUTHORITY_CTA_CLICKED, { slug, target: 'start' })}
          className="inline-flex items-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {primaryLabel}
        </Link>
        <Link
          href={trustHref}
          onClick={() => track(ANALYTICS_EVENTS.AUTHORITY_CTA_CLICKED, { slug, target: 'trust' })}
          className="inline-flex items-center rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {trustLabel}
        </Link>
      </div>
    </div>
  );
}
