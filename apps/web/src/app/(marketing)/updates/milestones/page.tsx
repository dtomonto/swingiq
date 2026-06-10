import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { MarketingCTA } from '@/components/marketing/MarketingCTA';
import { SITE_URL } from '@/config/site';
import { PUBLISHED_MILESTONES } from '@/content/milestones/published';
import { getPublicMilestone, milestonePath } from '@/lib/milestones/page-detail';

export const metadata: Metadata = {
  title: 'SwingVantage Milestones — Building Honest AI Swing Coaching',
  description:
    'Verifiable SwingVantage milestones — sports launched, education published, trust controls shipped — each explained in plain English. No vanity numbers, only what we can prove.',
  alternates: { canonical: '/updates/milestones' },
  openGraph: { title: 'SwingVantage Milestones', description: 'Verifiable progress building honest AI swing coaching across seven sports.', type: 'website', url: `${SITE_URL}/updates/milestones` },
};

export default function MilestonesIndexPage() {
  const items = PUBLISHED_MILESTONES
    .map((p) => getPublicMilestone(p.slug))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .sort((a, b) => b.published.achievedAt.localeCompare(a.published.achievedAt));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Updates', item: `${SITE_URL}/updates` },
          { '@type': 'ListItem', position: 3, name: 'Milestones', item: `${SITE_URL}/updates/milestones` },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: 'SwingVantage Milestones',
        url: `${SITE_URL}/updates/milestones`,
        description: 'Verifiable SwingVantage milestones, each explained in plain English.',
        isPartOf: { '@type': 'WebSite', name: 'SwingVantage', url: SITE_URL },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-card">
      <JsonLd data={jsonLd} />

      <section className="bg-theme-hero border-b border-border py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><Link href="/" className="text-link hover:underline">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/updates" className="text-link hover:underline">Updates</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground/60" aria-current="page">Milestones</li>
            </ol>
          </nav>
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3 leading-tight text-foreground">SwingVantage Milestones</h1>
          <p className="text-muted-foreground text-lg">
            Honest markers of our progress building AI swing coaching across seven sports. Every milestone here is
            verifiable — we never publish a number we can&apos;t prove.
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Milestones earned</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map(({ published, definition }) => (
                <Link key={published.slug} href={milestonePath(published.slug)} className="block rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-colors">
                  <span className="text-xs text-muted-foreground">{definition.category} · {published.achievedAt}</span>
                  <h3 className="mt-1 font-semibold text-foreground leading-snug">{definition.title}</h3>
                  <p className="mt-1 text-sm text-primary">{published.verifiedMetric}</p>
                </Link>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            More milestones are in progress. As SwingVantage grows — more athletes, more analyses, more sports
            education — we&apos;ll publish each one here once it&apos;s genuinely earned.
          </p>

          <p className="pt-2">
            <Link href="/updates" className="text-sm text-primary underline hover:no-underline">← Back to all SwingVantage updates</Link>
          </p>
        </div>
      </section>

      <MarketingCTA
        heading="Be part of the next milestone"
        body="Analyze a swing free — no account required — and see what honest AI coaching looks like."
        cta={{ label: 'Analyze My Swing Free', href: '/start' }}
      />
    </main>
  );
}
