import Link from 'next/link';
import { RelatedGuides } from '@/components/seo/RelatedGuides';
import { buildMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import {
  buildGraph,
  organizationSchema,
  websiteSchema,
  howToSchema,
  faqPageSchema,
} from '@/lib/seo/jsonLd';

export const metadata = buildMetadata({
  title: 'Free Softball Swing Analysis — Slow Pitch & Fast Pitch AI Tool',
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
      <JsonLd data={pageGraph} />
      <Breadcrumbs items={crumbs} className="max-w-4xl mx-auto px-4 pt-4" />

      {/* Hero */}
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <p className="text-primary-foreground/80 text-sm font-semibold uppercase tracking-widest mb-3">Free Tool</p>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">
            AI Softball Swing Analysis<br className="sm:hidden" /> — Slow Pitch &amp; Fast Pitch
          </h1>
          <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto mb-8">
            Import your hitting data or upload a swing video. Get AI analysis of your swing faults
            with drills designed for softball mechanics — free.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/sessions/import/image"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-8 py-3 rounded-xl transition-colors"
            >
              Import Hitting Data
            </Link>
            <Link
              href="/video"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3 rounded-xl transition-colors border border-white/20"
            >
              Upload Swing Video
            </Link>
          </div>
        </div>
      </header>

      {/* Two modes */}
      <section className="bg-card py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            Two Separate Analysis Modes
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Slow Pitch Softball',
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
            ].map(({ title, color, badge, points }) => (
              <div key={title} className={`rounded-xl border-2 ${color} bg-card p-6`}>
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            How Softball Analysis Works
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

      {/* CTA */}
      <section className="bg-primary py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-primary-foreground mb-3">Elevate your softball swing</h2>
          <p className="text-primary-foreground/90 mb-6 text-sm">Free. No subscription. Your data stays private.</p>
          <Link
            href="/login"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-10 py-3 rounded-xl transition-colors inline-block"
          >
            Analyze My Softball Swing Free
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

      <RelatedGuides sport="softball" />

    </>
  );
}
