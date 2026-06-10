import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { FoundingJourney } from '@/components/founding/FoundingJourney';
import { FOUNDING_REQUIRED_COUNT } from '@/lib/central-intelligence';

export const metadata: Metadata = buildMetadata({
  title: `Founding Members — Free for Life | First ${FOUNDING_REQUIRED_COUNT}`,
  description: `Be one of the first ${FOUNDING_REQUIRED_COUNT} athletes to complete the SwingVantage Founding Journey and lock in a free account for life. Follow the guided checklist through every feature.`,
  path: '/founding',
  keywords: ['founding members', 'free for life', 'early access', 'swing analysis', 'founding journey'],
});

export default function FoundingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden bg-theme-hero px-4 pb-10 pt-16 text-center sm:pt-20">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-link">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Founding Members · Limited to {FOUNDING_REQUIRED_COUNT}
          </span>
          <h1 className="mt-6 font-heading text-4xl font-bold uppercase leading-[1.05] tracking-tight sm:text-5xl">
            Become a Founder.{' '}
            <span className="text-link">Free for life.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            The first {FOUNDING_REQUIRED_COUNT} athletes to complete the Founding Journey lock in a free
            account forever — even after paid memberships launch. Follow the checklist below; every step
            is a real feature, and it checks itself off as you go.
          </p>
        </div>
      </section>

      {/* The journey checklist */}
      <section className="px-4 pb-24 pt-4">
        <FoundingJourney />
      </section>
    </main>
  );
}
