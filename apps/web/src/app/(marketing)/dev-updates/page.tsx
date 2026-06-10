import type { Metadata } from 'next';
import Link from 'next/link';
import { DEV_STATS } from '@/data/devUpdates';
import { getEffectivePublicDevUpdates, getEffectiveDevMilestones } from '@/lib/publishing/public-updates.server';
import { DevUpdatesContent } from '@/components/dev-updates/DevUpdatesContent';
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld';
import { devUpdateUrl } from '@/lib/updates/dev-detail';

// ── SEO Metadata ──────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Developer Updates | The Engineering Behind SwingVantage',
  description:
    'A technical log of SwingVantage engineering — browser-native 3D motion analysis, real AI vision, a multi-sport diagnostic engine, and the CI quality gates behind it all.',
  openGraph: {
    title: 'Developer Updates | The Engineering Behind SwingVantage',
    description:
      'The technical story behind SwingVantage — 3D motion intelligence, real AI vision, multi-sport engines, and a local-first architecture.',
    type: 'website',
    url: 'https://swingvantage.com/dev-updates',
  },
  alternates: {
    canonical: '/dev-updates',
  },
};

// ── Structured data (JSON-LD) ─────────────────────────────────────────────

export default async function DevUpdatesPage() {
  // Override-aware reads: a durable PublishingOS publish decision (the prod path)
  // is honoured here. With no overrides these return exactly getDevUpdates()/
  // getDevMilestones() — a zero-behaviour-change wrapper.
  const updates = await getEffectivePublicDevUpdates();
  const milestones = await getEffectiveDevMilestones();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: 'SwingVantage Developer Updates',
        description:
          'A technical log of SwingVantage engineering milestones and developer updates.',
        url: 'https://swingvantage.com/dev-updates',
        isPartOf: { '@type': 'WebSite', name: 'SwingVantage', url: 'https://swingvantage.com' },
      },
      {
        '@type': 'ItemList',
        itemListElement: updates.map((u, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: u.title,
          description: u.headline,
          url: devUpdateUrl(u),
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Page header */}
      <section className="bg-primary px-4 py-16 text-primary-foreground">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            Engineering log
          </p>
          <h1 className="mb-3 text-3xl font-bold md:text-4xl">Developer Updates</h1>
          <p className="max-w-2xl text-lg text-primary-foreground/90">
            The technical story behind SwingVantage — the architecture, the AI work, and the motion
            intelligence that make a free, browser-based swing platform actually work.
          </p>
          <p className="mt-4 text-sm text-primary-foreground/90">
            Looking for the plain-English version?{' '}
            <Link href="/updates" className="font-semibold underline">
              See product updates
            </Link>
            .
          </p>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <DevUpdatesContent updates={updates} milestones={milestones} stats={DEV_STATS} />
    </main>
  );
}
