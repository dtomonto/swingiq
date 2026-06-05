import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { getPublicUpdates, getFeaturedUpdate, getMilestones } from '@/data/updates';
import { UpdatesContent } from '@/components/updates/UpdatesContent';

// ── SEO Metadata ──────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'SwingVantage Updates | AI Swing Analysis Product Improvements',
  description:
    'See the latest SwingVantage updates, including AI swing analysis improvements, golf training tools, multi-sport features, equipment diagnostics, data insights, progress tracking, and user experience upgrades.',
  keywords: [
    'SwingVantage updates',
    'AI swing analysis',
    'golf training updates',
    'tennis swing updates',
    'baseball swing analysis',
    'softball swing training',
    'swing improvement platform',
    'equipment diagnostics',
    'progress tracking',
    'multi-sport swing analysis',
  ],
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
    a: 'SwingVantage is a free, web-based AI swing analysis platform that helps athletes understand and improve their technique for golf, tennis, baseball, slow pitch softball, and fast pitch softball.',
  },
  {
    q: 'What sports does SwingVantage support?',
    a: 'SwingVantage supports golf, tennis, baseball, slow pitch softball, and fast pitch softball. Each sport has its own coaching feedback, drill library, and diagnostic engine.',
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

export default function UpdatesPage() {
  const updates = getPublicUpdates();
  const featured = getFeaturedUpdate();
  const milestones = getMilestones();

  return (
    <main className="min-h-screen bg-card">
      {/* Page header */}
      <section className="bg-primary text-primary-foreground py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label="SwingVantage home">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">SV</span>
              </div>
              <span className="text-white font-bold text-lg">SwingVantage</span>
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">SwingVantage Updates</h1>
          <p className="text-primary-foreground/90 text-lg max-w-2xl">
            Follow meaningful SwingVantage improvements, new training features, and product progress — written in plain English, not technical notes.
          </p>
          <p className="text-primary-foreground/90 text-sm mt-4">
            {updates.length} update{updates.length !== 1 ? 's' : ''} published &mdash; newest first
          </p>
        </div>
      </section>

      {/* JSON-LD */}
      <JsonLd data={jsonLd} />

      {/* Dynamic content (filters, cards, FAQ, footer) */}
      <UpdatesContent updates={updates} milestones={milestones} featured={featured} />
    </main>
  );
}
