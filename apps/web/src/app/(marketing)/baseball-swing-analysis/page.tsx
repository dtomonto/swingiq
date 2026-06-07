import Link from 'next/link';
import { RelatedGuides } from '@/components/seo/RelatedGuides';
import { SportProofBlock } from '@/components/proof/SportProofBlock';
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
  title: 'Free Baseball Swing Analysis — Exit Velocity, Launch Angle & Bat Speed',
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
      <JsonLd data={pageGraph} />
      <Breadcrumbs items={crumbs} className="max-w-4xl mx-auto px-4 pt-4" />

      {/* Hero */}
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <p className="text-primary-foreground/80 text-sm font-semibold uppercase tracking-widest mb-3">Free Tool</p>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">
            AI Baseball Swing Analysis<br className="sm:hidden" /> — Exit Velocity to Bat Path
          </h1>
          <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto mb-8">
            Import HitTrax, Rapsodo, or Blast Motion data. Upload a swing video. Get instant AI
            diagnosis of your swing faults and a targeted drill plan — free.
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

      {/* How it works */}
      <section className="bg-card py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            How Baseball Swing Analysis Works
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

      {/* Metrics */}
      <section className="bg-muted py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-3">Hitting Metrics SwingVantage Analyzes</h2>
          <p className="text-muted-foreground mb-8 text-sm">
            All metrics are benchmarked by age group and competition level — from youth rec to professional.
          </p>
          <ul className="grid sm:grid-cols-2 gap-4">
            {metrics.map(({ label, detail }) => (
              <li key={label} className="bg-card rounded-xl border border-border px-4 py-4">
                <h3 className="font-semibold text-foreground text-sm mb-1">{label}</h3>
                <p className="text-xs text-muted-foreground">{detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-primary-foreground mb-3">Start tracking your development</h2>
          <p className="text-primary-foreground/90 mb-6 text-sm">Free. No subscription required. Your data stays private.</p>
          <Link
            href="/start"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-10 py-3 rounded-xl transition-colors inline-block"
          >
            Analyze My Baseball Swing Free
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

      <SportProofBlock reportSlug="baseball" />

      <RelatedGuides sport="baseball" />

    </>
  );
}
