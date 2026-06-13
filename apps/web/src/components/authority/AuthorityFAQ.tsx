'use client';

import { ANALYTICS_EVENTS, track } from '@/lib/analytics';

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Accessible, keyboard-navigable FAQ list built on native <details>/<summary>
 * (so it works without JS and is crawlable). Pair the same `items` with
 * faqPageSchema() in the page's JSON-LD for FAQ rich results. Fires a
 * FAQ_EXPANDED analytics event the first time each question is opened.
 */
export function AuthorityFAQ({
  items,
  slug,
  heading = 'Frequently asked questions',
}: {
  items: FaqItem[];
  /** Page slug for analytics attribution. */
  slug: string;
  heading?: string;
}) {
  return (
    <section aria-labelledby="faq" className="mt-12">
      <h2 id="faq" className="text-2xl font-bold text-foreground">
        {heading}
      </h2>
      <div className="mt-4 space-y-3">
        {items.map((f) => (
          <details
            key={f.question}
            className="group rounded-xl border border-border bg-card p-0 [&_summary::-webkit-details-marker]:hidden"
            onToggle={(e) => {
              if ((e.currentTarget as HTMLDetailsElement).open) {
                track(ANALYTICS_EVENTS.FAQ_EXPANDED, { slug, question: f.question });
              }
            }}
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 p-5 font-semibold text-foreground">
              {f.question}
              <span
                aria-hidden="true"
                className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
