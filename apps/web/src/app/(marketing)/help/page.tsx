import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { buildMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbListSchema } from '@/lib/seo/jsonLd';
import { getHelpGroups, helpPath, type HelpTopic } from '@/lib/feature-education/help-center';

export const metadata: Metadata = buildMetadata({
  title: 'Help Center',
  description:
    'Guides and answers for every SwingVantage feature — how it works, step-by-step walkthroughs, and FAQs. Golf, tennis, baseball, softball, pickleball & padel.',
  path: '/help',
});

function TopicGrid({ topics }: { topics: HelpTopic[] }) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {topics.map((t) => (
        <Link
          key={t.slug}
          href={helpPath(t.slug)}
          className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary hover:bg-primary/5"
        >
          <h3 className="text-base font-bold text-foreground">{t.title}</h3>
          <p className="mt-1 line-clamp-2 flex-1 text-xs text-muted-foreground">{t.lead}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Read guide
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function HelpCenterIndex() {
  const { user, admin } = getHelpGroups();

  return (
    <main className="bg-background">
      <JsonLd
        data={breadcrumbListSchema([
          { name: 'Home', path: '/' },
          { name: 'Help Center', path: '/help' },
        ])}
      />

      {/* Hero */}
      <section className="bg-primary px-4 py-16 text-primary-foreground">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-wide text-primary-foreground/80">Help Center</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">How can we help?</h1>
          <p className="mt-3 max-w-2xl text-sm text-primary-foreground/90 md:text-base">
            Plain-language guides for every part of SwingVantage — what each feature does, how to use
            it step by step, and answers to the questions people ask most.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/learn"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-background px-5 py-2.5 text-sm font-bold text-foreground transition-opacity hover:opacity-90"
            >
              Watch video walkthroughs
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary-foreground/40 px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Contact support
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Search size={16} aria-hidden="true" />
          <span>{user.length} feature guides</span>
        </div>

        <section aria-label="Feature guides" className="mt-6">
          <h2 className="text-2xl font-bold text-foreground">Feature guides</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything you can do in SwingVantage, explained.
          </p>
          <TopicGrid topics={user} />
        </section>

        {admin.length > 0 && (
          <section aria-label="Admin & operator guides" className="mt-14">
            <h2 className="text-2xl font-bold text-foreground">Admin &amp; operator guides</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Reference for the admin and publishing tools.
            </p>
            <TopicGrid topics={admin} />
          </section>
        )}
      </div>

      {/* Footer note */}
      <section className="border-t border-border bg-card px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Can&apos;t find what you need?{' '}
          <Link href="/contact" className="font-semibold text-primary hover:underline">
            Contact support
          </Link>{' '}
          and we&apos;ll help.
        </p>
      </section>
    </main>
  );
}
