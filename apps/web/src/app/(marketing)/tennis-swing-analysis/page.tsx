import Link from 'next/link';
import { SportAnalysisHero } from '@/components/marketing/SportAnalysisHero';
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
  title: 'Free Tennis Swing Analysis — AI Stroke Breakdown',
  ogImage: ogCardUrl({
    eyebrow: 'Tennis',
    title: 'Free Tennis Swing Analysis',
    subtitle: 'AI stroke breakdown by phase — your top fix and a drill plan.',
  }),
  description:
    'Get a free AI tennis swing analysis. Upload a video of your groundstrokes, serve, or volleys and receive instant fault diagnosis and personalized drills.',
  path: '/tennis-swing-analysis',
  keywords: [
    'tennis swing analysis',
    'AI tennis coach',
    'tennis stroke analysis app',
    'improve forehand',
  ],
});

const faqItems = [
  {
    question: 'What tennis strokes can SwingVantage analyze?',
    answer:
      'SwingVantage analyzes forehands, backhands (one-handed and two-handed), serves, volleys, and overhead smashes. Each stroke type has its own phase-by-phase checklist based on ATP/WTA technical models.',
  },
  {
    question: 'Do I need a tennis sensor or Hawk-Eye data?',
    answer:
      'No sensor is required. SwingVantage can analyze a simple phone video. If you have data from a tennis sensor (racquet speed, spin rate, efficiency), you can also import that for more detailed analysis.',
  },
  {
    question: 'What does the AI look for in a tennis swing?',
    answer:
      'The system checks shoulder unit turn, hip-to-shoulder separation, contact point depth and height, racquet path angle, follow-through position, grip pressure patterns, and footwork sequencing.',
  },
  {
    question: 'Can SwingVantage help me fix my double faults?',
    answer:
      'Yes. SwingVantage identifies serve mechanics issues — toss placement, trophy position, pronation timing, and contact point — that are the most common causes of double faults.',
  },
  {
    question: 'Is SwingVantage suitable for junior tennis players?',
    answer:
      'Absolutely. SwingVantage scales benchmarks by skill level (beginner through elite) and age group. Parents and coaches can use it alongside in-person coaching.',
  },
];

// Single source of truth for the visible "How it works" steps AND the HowTo
// JSON-LD, so the page and structured data never drift.
const howSteps = [
  { name: 'Upload Your Video', text: 'Film from the side or behind. Any phone camera works. Upload directly to SwingVantage.' },
  { name: 'AI Diagnoses Each Phase', text: 'The system checks preparation, backswing, forward swing, contact, and follow-through against technical benchmarks.' },
  { name: 'Train With Purpose', text: 'Get targeted drills, a weekly practice schedule, and progress tracking for each stroke.' },
];

// Breadcrumb trail (also drives the BreadcrumbList JSON-LD via <Breadcrumbs>).
const crumbs = [
  { name: 'Home', path: '/' },
  { name: 'Tennis Swing Analysis', path: '/tennis-swing-analysis' },
];

const pageGraph = buildGraph(
  organizationSchema(),
  websiteSchema(),
  howToSchema('How Tennis Stroke Analysis Works', howSteps),
  faqPageSchema(faqItems),
);

const strokes = [
  { name: 'Forehand', focus: 'Unit turn, contact point depth, follow-through height' },
  { name: 'Backhand (2H)', focus: 'Hip-shoulder separation, left-arm drive, extension' },
  { name: 'Backhand (1H)', focus: 'Shoulder rotation, grip position, finish height' },
  { name: 'Serve', focus: 'Toss placement, trophy position, pronation timing' },
  { name: 'Volley', focus: 'Compact stroke, contact point in front, split step' },
  { name: 'Overhead', focus: 'Shoulder turn, trophy position, contact above head' },
];

export default function TennisSwingAnalysisPage() {
  return (
    <>
      <SportPageEngagement sport="tennis" persona="tennis" />
      <JsonLd data={pageGraph} />
      <Breadcrumbs items={crumbs} className="max-w-4xl mx-auto px-4 pt-4" />

      {/* Hero */}
      <SportAnalysisHero
        accentVar="--sport-tennis"
        eyebrow="Free Tool"
        title="AI Tennis Stroke Analysis"
        titleAccent="— Free for Every Level"
        subtitle="Upload a video of your forehand, backhand, or serve. Our AI diagnoses your stroke faults phase-by-phase and builds a personalized drill plan — free."
        primaryCta={{ label: 'Analyze My Strokes', href: '/video' }}
        secondaryCta={{ label: 'Create Free Account', href: '/signup' }}
      />

      {/* How it works */}
      <section className="bg-card py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            How Tennis Stroke Analysis Works
          </h2>
          <ol className="grid sm:grid-cols-3 gap-6">
            {howSteps.map((s, i) => (
              <li key={s.name} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-black text-lg flex items-center justify-center mb-4">
                  {i + 1}
                </div>
                <h3 className="font-bold text-foreground mb-2">{s.name}</h3>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Strokes */}
      <section className="bg-muted py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-3">Tennis Strokes SwingVantage Covers</h2>
          <p className="text-muted-foreground mb-8 text-sm">
            Each stroke has a dedicated phase checklist aligned with ATP/WTA technical models.
          </p>
          <ul className="grid sm:grid-cols-2 gap-4">
            {strokes.map(({ name, focus }) => (
              <li key={name} className="bg-card rounded-xl border border-border px-4 py-4">
                <h3 className="font-semibold text-foreground text-sm mb-1">{name}</h3>
                <p className="text-xs text-muted-foreground">{focus}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Feature cross-links — inbound links to the per-feature guides */}
      <FeatureHighlights
        className="bg-card py-14"
        heading="The features behind your tennis analysis"
        blurb="Each part of your stroke workflow has a full guide — tap any to learn how to use it."
        slugs={[
          'ai-diagnostic-engine',
          'swing-video-upload',
          'phase-by-phase-timeline',
          'fix-stack',
          'motion-lab-3d',
          'athletic-journey',
        ]}
      />

      {/* CTA */}
      <section className="bg-primary py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-primary-foreground mb-3">Start improving your game today</h2>
          <p className="text-primary-foreground/90 mb-6 text-sm">Free. No subscription required. Cancel anytime.</p>
          <Link
            href="/start"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-10 py-3 rounded-xl transition-colors inline-block"
          >
            Analyze My Tennis Swing Free
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-card py-14">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8">Frequently Asked Questions</h2>
          <dl className="space-y-6">
            {faqItems.map(({ question, answer }) => (
              <div key={question}>
                <dt className="font-semibold text-foreground mb-1">{question}</dt>
                <dd className="text-sm text-muted-foreground leading-relaxed">{answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <RelatedGuides sport="tennis" />

    </>
  );
}
