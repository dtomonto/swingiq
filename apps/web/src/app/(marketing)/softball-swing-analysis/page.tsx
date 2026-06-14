import Link from 'next/link';
import { SportAnalysisHero } from '@/components/marketing/SportAnalysisHero';
import { MarketingCTA } from '@/components/marketing/MarketingCTA';
import { HowItWorksGrid } from '@/components/marketing/HowItWorksGrid';
import { FAQSection } from '@/components/marketing/FAQSection';
import { RelatedGuides } from '@/components/seo/RelatedGuides';
import { FeatureHighlights } from '@/components/features/FeatureHighlights';
import { buildMetadata } from '@/lib/seo/metadata';
import { ogCardUrl } from '@/lib/og/card';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { SportPageEngagement } from '@/components/persona/SportPageEngagement';
import {
  buildGraph,
  organizationSchema,
  websiteSchema,
  howToSchema,
  faqPageSchema,
} from '@/lib/seo/jsonLd';

export const metadata = buildMetadata({
  title: 'Free Softball Swing Analysis — Slow & Fast Pitch',
  ogImage: ogCardUrl({
    eyebrow: 'Softball',
    title: 'Free Softball Swing Analysis',
    subtitle: 'Slow-pitch & fast-pitch — your top fix with personalized drills.',
  }),
  description:
    'Analyze your softball swing with AI — for both slow pitch and fast pitch. Track exit velocity, launch angle, bat speed, and get personalized drill recommendations.',
  path: '/softball-swing-analysis',
  keywords: [
    'softball swing analysis',
    'AI softball hitting coach',
    'slow pitch softball swing',
    'fast pitch softball hitting',
  ],
});

const faqItems = [
  {
    question: 'Does SwingVantage support both slow pitch and fast pitch softball?',
    answer:
      'Yes. SwingVantage has separate analysis profiles for slow pitch and fast pitch softball. Each uses sport-specific benchmarks — slow pitch focuses on arc timing, gap hitting, and power angles, while fast pitch emphasizes timing against faster pitches, attack angle, and contact point.',
  },
  {
    question: 'What metrics are most important in slow pitch softball?',
    answer:
      'Exit velocity, launch angle (25–35° is ideal for distance), spray angle (pulling vs. going the other way), and bat speed are the core metrics. Swing plane and timing against the arc are also critical.',
  },
  {
    question: 'What metrics matter most in fast pitch softball?',
    answer:
      'Time to contact, attack angle, launch angle, bat speed, and contact point depth are key in fast pitch. The faster pitch speeds (50–75 mph) demand a much shorter, more efficient swing path.',
  },
  {
    question: 'How do I import my hitting data into SwingVantage?',
    answer:
      'You can upload a CSV from Rapsodo, Blast Motion, or Diamond Kinetics. You can also take a screenshot of any device screen and manually enter your data using the image import tool.',
  },
  {
    question: 'Can coaches use SwingVantage for a whole team?',
    answer:
      'Team and facility accounts are on the roadmap. Currently, each athlete has their own account. Coaches can guide athletes through SwingVantage and review progress together.',
  },
];

// Single source of truth for the visible "How it works" steps AND the HowTo
// JSON-LD, so the page and structured data never drift.
const howSteps = [
  { name: 'Select Your Sport Mode', text: 'Choose slow pitch or fast pitch. SwingVantage loads the right benchmarks and drill library for your discipline.' },
  { name: 'Import or Enter Data', text: 'Upload a Blast Motion session, Rapsodo data, or use the photo import to manually enter stats from any device.' },
  { name: 'Get Your Drill Plan', text: 'Receive targeted drills, a weekly training schedule, and benchmarks tailored to your competition level.' },
];

// Breadcrumb trail (also drives the BreadcrumbList JSON-LD via <Breadcrumbs>).
const crumbs = [
  { name: 'Home', path: '/' },
  { name: 'Softball Swing Analysis', path: '/softball-swing-analysis' },
];

const pageGraph = buildGraph(
  organizationSchema(),
  websiteSchema(),
  howToSchema('How Softball Analysis Works', howSteps),
  faqPageSchema(faqItems),
);

export default function SoftballSwingAnalysisPage() {
  return (
    <>
      <SportPageEngagement sport="softball" persona="softball" />
      <JsonLd data={pageGraph} />
      <Breadcrumbs items={crumbs} className="max-w-4xl mx-auto px-4 pt-4" />

      {/* Hero */}
      <SportAnalysisHero
        accentVar="--sport-softball-fast"
        eyebrow="Free Tool"
        title="AI Softball Swing Analysis"
        titleAccent="— Slow Pitch & Fast Pitch"
        subtitle="Slow pitch and fast pitch need almost opposite swings. Pick your discipline below for a diagnosis, drills, and benchmarks built for it — free, no account required."
        primaryCta={{ label: 'Import Hitting Data', href: '/sessions/import/image' }}
        secondaryCta={{ label: 'Upload Swing Video', href: '/video' }}
      />

      {/* Choose your path */}
      <section className="bg-card py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-3">
            Choose your softball path
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            Pick the discipline you play to get a diagnosis, drills, and benchmarks built for it.
            Not sure? <Link href="/sample-report/softball" className="text-primary font-semibold hover:underline">See how the same hitter differs in each →</Link>
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Slow Pitch Softball',
                href: '/softball-swing-analysis/slow-pitch',
                color: 'border-warning/50',
                badge: 'bg-warning/15 text-warning',
                points: [
                  'Arc timing and launch angle optimization',
                  'Power hitting vs. gap-to-gap strategy',
                  'Bat certification considerations',
                  'Pull/oppo spray angle analysis',
                  'Exit velocity benchmarks by league tier',
                ],
              },
              {
                title: 'Fast Pitch Softball',
                href: '/softball-swing-analysis/fast-pitch',
                color: 'border-primary/50',
                badge: 'bg-primary/15 text-primary',
                points: [
                  'Timing against 50–75 mph rise balls and drops',
                  'Short, efficient swing path analysis',
                  'Attack angle and contact point depth',
                  'Bat speed benchmarks for position players',
                  'Competition-level benchmarks (youth through college)',
                ],
              },
            ].map(({ title, href, color, badge, points }) => (
              <Link
                key={title}
                href={href}
                className={`group block rounded-xl border-2 ${color} bg-card p-6 transition-colors hover:bg-muted`}
              >
                <span className={`text-xs font-bold px-2 py-1 rounded-sm ${badge} mb-3 inline-block`}>
                  {title}
                </span>
                <h3 className="text-lg font-bold text-foreground mb-3">{title} Analysis</h3>
                <ul className="space-y-2">
                  {points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary shrink-0 mt-0.5">✓</span>
                      {pt}
                    </li>
                  ))}
                </ul>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Analyze {title.replace(' Softball', '')} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <HowItWorksGrid heading="How Softball Analysis Works" steps={howSteps} bg="muted" />

      {/* Feature cross-links — inbound links to the per-feature guides */}
      <FeatureHighlights
        className="bg-card py-14"
        heading="The features behind your softball analysis"
        blurb="Each part of your hitting workflow has a full guide — tap any to learn how to use it."
        slugs={[
          'ai-diagnostic-engine',
          'swing-video-upload',
          'tracking-device-support',
          'fix-stack',
          'motion-lab-3d',
          'retest',
        ]}
      />

      {/* CTA */}
      <MarketingCTA
        heading="Elevate your softball swing"
        body="Free. No subscription. Your data stays private."
        cta={{ label: 'Analyze My Softball Swing Free', href: '/start' }}
      />

      {/* FAQ */}
      <FAQSection items={faqItems} />

      <RelatedGuides sport="softball" />

    </>
  );
}
