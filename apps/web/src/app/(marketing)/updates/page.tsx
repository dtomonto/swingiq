import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingHero } from '@/components/marketing/MarketingHero';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  getEffectivePublicUpdates,
  getEffectiveFeaturedUpdate,
  getEffectiveMilestones,
} from '@/lib/publishing/public-updates.server';
import { UpdatesContent } from '@/components/updates/UpdatesContent';
import { PUBLISHED_MILESTONES } from '@/content/milestones/published';
import { getPublicMilestone, milestonePath } from '@/lib/milestones/page-detail';

// ── SEO Metadata ──────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'SwingVantage Updates | AI Swing Analysis Product Improvements',
  description:
    'See the latest SwingVantage updates — AI swing-analysis improvements, multi-sport features, equipment diagnostics, data insights, and progress tracking.',
  openGraph: {
    title: 'SwingVantage Updates | AI Swing Analysis Product Improvements',
    description:
      'Follow meaningful SwingVantage improvements, new training features, and product progress in plain English. Golf, tennis, baseball, and softball.',
    type: 'website',
    url: 'https://swingvantage.com/updates',
  },
  alternates: {
    canonical: '/updates',
  },
};

// ── Structured data (JSON-LD) ─────────────────────────────────────────────

const FAQS_SCHEMA = [
  {
    q: 'What is SwingVantage?',
    a: 'SwingVantage is a free, web-based AI swing analysis platform that helps athletes understand and improve their technique for golf, tennis, pickleball, padel, baseball, slow pitch softball, and fast pitch softball.',
  },
  {
    q: 'What sports does SwingVantage support?',
    a: 'SwingVantage supports seven sports: golf, tennis, pickleball, padel, baseball, slow pitch softball, and fast pitch softball. Each sport has its own coaching feedback, drill library, and diagnostic engine.',
  },
  {
    q: 'Does SwingVantage replace private coaching?',
    a: 'No. SwingVantage is an AI-powered improvement assistant. It helps you identify patterns and prioritize practice. For complex technique work or injury concerns, work with a qualified coach.',
  },
  {
    q: 'Can SwingVantage analyze equipment?',
    a: 'Yes. You can optionally add details about your clubs, racket, or bat. SwingVantage uses that information to give more personalized feedback. Adding equipment details is never required.',
  },
  {
    q: 'Can SwingVantage help track progress over time?',
    a: 'Yes. SwingVantage saves your training history and shows how your key metrics change across sessions. You can also back up your progress and restore it on any device.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: 'SwingVantage Updates',
      description:
        'Follow meaningful SwingVantage product improvements in plain English — new training features, multi-sport support, equipment tools, and more.',
      url: 'https://swingvantage.com/updates',
      isPartOf: { '@type': 'WebSite', name: 'SwingVantage', url: 'https://swingvantage.com' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS_SCHEMA.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    },
  ],
};

// ── Page component ────────────────────────────────────────────────────────

export default async function UpdatesPage() {
  const [updates, featured, milestones] = await Promise.all([
    getEffectivePublicUpdates(),
    getEffectiveFeaturedUpdate(),
    getEffectiveMilestones(),
  ]);
  const authorityMilestones = PUBLISHED_MILESTONES
    .map((p) => getPublicMilestone(p.slug))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .sort((a, b) => b.published.achievedAt.localeCompare(a.published.achievedAt))
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-card">
      {/* Page header */}
      <MarketingHero
        title="SwingVantage"
        titleAccent="Updates"
        subtitle="Follow meaningful SwingVantage improvements, new training features, and product progress — written in plain English, not technical notes."
      >
        <p className="text-sm text-muted-foreground">
          {updates.length} update{updates.length !== 1 ? 's' : ''} published &mdash; newest first
        </p>
      </MarketingHero>

      {/* JSON-LD */}
      <JsonLd data={jsonLd} />

      {/* Milestones Earned — authority milestones, linking to the dedicated hub */}
      {authorityMilestones.length > 0 && (
        <section className="py-10 px-4 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end justify-between gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Milestones earned</h2>
                <p className="text-sm text-muted-foreground mt-1">Verifiable progress markers — no vanity numbers.</p>
              </div>
              <Link href="/updates/milestones" className="shrink-0 text-sm text-primary underline hover:no-underline">All milestones →</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {authorityMilestones.map(({ published, definition }) => (
                <Link key={published.slug} href={milestonePath(published.slug)} className="block rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors">
                  <span className="text-xs text-muted-foreground">{definition.category}</span>
                  <h3 className="mt-1 font-semibold text-foreground text-sm leading-snug">{definition.title}</h3>
                  <p className="mt-1 text-xs text-primary">{published.verifiedMetric}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Dynamic content (filters, cards, FAQ, footer) */}
      <UpdatesContent updates={updates} milestones={milestones} featured={featured} />
    </main>
  );
}
