import { SportAnalysisHero } from '@/components/marketing/SportAnalysisHero';
import { MarketingCTA } from '@/components/marketing/MarketingCTA';
import { HowItWorksGrid } from '@/components/marketing/HowItWorksGrid';
import { MetricsGrid } from '@/components/marketing/MetricsGrid';
import { FAQSection } from '@/components/marketing/FAQSection';
import { RelatedGuides } from '@/components/seo/RelatedGuides';
import { FeatureHighlights } from '@/components/features/FeatureHighlights';
import { SportProofBlock } from '@/components/proof/SportProofBlock';
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
  title: 'Free Baseball Swing Analysis — Exit Velo & Bat Speed',
  ogImage: ogCardUrl({
    eyebrow: 'Baseball',
    title: 'Free Baseball Swing Analysis',
    subtitle: 'Exit velo, bat speed & mechanics — your top fix, ranked.',
  }),
  description:
    'Analyze your baseball swing with AI. Track exit velocity, launch angle, bat speed, and attack angle. Get drill recommendations to fix your swing faults.',
  path: '/baseball-swing-analysis',
  keywords: [
    'baseball swing analysis',
    'AI baseball hitting coach',
    'bat path analysis',
    'exit velocity',
  ],
});

const faqItems = [
  {
    question: 'What baseball hitting metrics does SwingVantage track?',
    answer:
      'SwingVantage tracks exit velocity, launch angle, distance, bat speed, attack angle, time to contact, hand speed, spray angle, and on-plane percentage. Data can come from HitTrax, Rapsodo, Blast Motion, Diamond Kinetics, or manual entry.',
  },
  {
    question: 'What is a good exit velocity for high school baseball?',
    answer:
      'A solid benchmark for high school hitters is 85–90+ mph EV. College-level players typically target 90–95 mph. Professional-level hitters average 92+ mph, with elite hitters exceeding 105 mph.',
  },
  {
    question: 'What launch angle should I target in baseball?',
    answer:
      'For maximum hard-hit authority, most coaches target a 10–20° launch angle for line drives and hard grounders. Optimal home run launch angles are 25–35°. Anything above 40° typically results in pop-ups.',
  },
  {
    question: 'Can SwingVantage help me fix a casting or long swing?',
    answer:
      'Yes. SwingVantage analyzes attack angle, time to contact, and hand path to identify casting, looping, and long-to-the-ball patterns. Targeted drills address each fault.',
  },
  {
    question: 'Is SwingVantage useful for youth baseball players?',
    answer:
      'Yes. SwingVantage adjusts benchmarks by age and skill level. Parents and coaches can track development over time and generate age-appropriate drill progressions.',
  },
];

// Single source of truth for the visible "How it works" steps AND the HowTo
// JSON-LD, so the page and structured data never drift.
const howSteps = [
  { name: 'Import Your Data', text: 'Connect HitTrax, Rapsodo, or Blast Motion. Or upload a screenshot from any device.' },
  { name: 'AI Identifies Faults', text: 'The system compares your EV, launch angle, bat speed, and attack angle to level-appropriate benchmarks.' },
  { name: 'Drill & Improve', text: "Get specific drills for your pattern — whether it's early extension, casting, or a steep attack angle." },
];

// Breadcrumb trail (also drives the BreadcrumbList JSON-LD via <Breadcrumbs>).
const crumbs = [
  { name: 'Home', path: '/' },
  { name: 'Baseball Swing Analysis', path: '/baseball-swing-analysis' },
];

const pageGraph = buildGraph(
  organizationSchema(),
  websiteSchema(),
  howToSchema('How Baseball Swing Analysis Works', howSteps),
  faqPageSchema(faqItems),
);

const metrics = [
  { label: 'Exit Velocity', detail: 'Ball speed off the bat. Primary indicator of hard-hit contact quality.' },
  { label: 'Launch Angle', detail: 'Vertical angle of the batted ball. 10–20° = line drives, 25–35° = home run trajectory.' },
  { label: 'Bat Speed', detail: 'Barrel speed through the zone. Foundation of exit velocity.' },
  { label: 'Attack Angle', detail: 'Upward swing path in degrees. Affects launch angle and ball flight.' },
  { label: 'Time to Contact', detail: 'Milliseconds from first move to contact. Shorter = more time to read pitches.' },
  { label: 'On-Plane %', detail: 'How often bat path matches pitch plane. Higher = more consistent contact.' },
  { label: 'Spray Angle', detail: 'Pull/push tendency. Identifies pitch coverage gaps.' },
  { label: 'Distance', detail: 'Projected distance of the batted ball based on EV and LA.' },
];

export default function BaseballSwingAnalysisPage() {
  return (
    <>
      <SportPageEngagement sport="baseball" persona="baseball" />
      <JsonLd data={pageGraph} />
      <Breadcrumbs items={crumbs} className="max-w-4xl mx-auto px-4 pt-4" />

      {/* Hero */}
      <SportAnalysisHero
        accentVar="--sport-baseball"
        eyebrow="Free Tool"
        title="AI Baseball Swing Analysis"
        titleAccent="— Exit Velocity to Bat Path"
        subtitle="Import HitTrax, Rapsodo, or Blast Motion data. Upload a swing video. Get instant AI diagnosis of your swing faults and a targeted drill plan — free."
        primaryCta={{ label: 'Import Hitting Data', href: '/sessions/import/image' }}
        secondaryCta={{ label: 'Upload Swing Video', href: '/video' }}
      />

      {/* How it works */}
      <HowItWorksGrid heading="How Baseball Swing Analysis Works" steps={howSteps} />

      {/* Metrics */}
      <MetricsGrid
        heading="Hitting Metrics SwingVantage Analyzes"
        intro="All metrics are benchmarked by age group and competition level — from youth rec to professional."
        items={metrics}
      />

      {/* Feature cross-links — inbound links to the per-feature guides */}
      <FeatureHighlights
        className="bg-card py-14"
        heading="The features behind your baseball analysis"
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
        heading="Start tracking your development"
        body="Free. No subscription required. Your data stays private."
        cta={{ label: 'Analyze My Baseball Swing Free', href: '/start' }}
      />

      {/* FAQ */}
      <FAQSection items={faqItems} />

      <SportProofBlock reportSlug="baseball" />

      <RelatedGuides sport="baseball" />

    </>
  );
}
