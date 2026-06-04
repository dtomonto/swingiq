import type { Metadata } from 'next';
import Link from 'next/link';
import { getDevUpdates, getDevMilestones, DEV_STATS } from '@/data/devUpdates';
import { DevUpdatesContent } from '@/components/dev-updates/DevUpdatesContent';

// ── SEO Metadata ──────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Developer Updates | The Engineering Behind SwingIQ',
  description:
    'A technical log of SwingIQ engineering milestones — browser-native 3D motion analysis, real AI vision, a multi-sport diagnostic engine, a token-based theme system, local-first architecture, and the CI quality gates behind it all.',
  keywords: [
    'SwingIQ engineering',
    'developer updates',
    'browser 3D motion analysis',
    'AI swing analysis architecture',
    'pose estimation MediaPipe',
    'local-first app',
    'Turborepo',
    'changelog',
  ],
  openGraph: {
    title: 'Developer Updates | The Engineering Behind SwingIQ',
    description:
      'The technical story behind SwingIQ — 3D motion intelligence, real AI vision, multi-sport engines, and a local-first architecture.',
    type: 'website',
    url: 'https://swingiq.app/dev-updates',
  },
  alternates: {
    canonical: '/dev-updates',
  },
};

// ── Structured data (JSON-LD) ─────────────────────────────────────────────

export default function DevUpdatesPage() {
  const updates = getDevUpdates();
  const milestones = getDevMilestones();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: 'SwingIQ Developer Updates',
        description:
          'A technical log of SwingIQ engineering milestones and developer updates.',
        url: 'https://swingiq.app/dev-updates',
        isPartOf: { '@type': 'WebSite', name: 'SwingIQ', url: 'https://swingiq.app' },
      },
      {
        '@type': 'ItemList',
        itemListElement: updates.map((u, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: u.title,
          description: u.headline,
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
            The technical story behind SwingIQ — the architecture, the AI work, and the motion
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <DevUpdatesContent updates={updates} milestones={milestones} stats={DEV_STATS} />
    </main>
  );
}
