import { SportAnalysisHero } from '@/components/marketing/SportAnalysisHero';
import { MarketingCTA } from '@/components/marketing/MarketingCTA';
import { RelatedGuides } from '@/components/seo/RelatedGuides';
import { SportProofBlock } from '@/components/proof/SportProofBlock';
import { buildMetadata } from '@/lib/seo/metadata';
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
  title: 'Fast-Pitch Softball Swing Analysis — Catch Up to Speed',
  description:
    'Free AI fast-pitch softball swing analysis. Shorten your path, start earlier, and stop getting jammed. Get your top fix, drills, and a 7-day plan — no account needed.',
  path: '/softball-swing-analysis/fast-pitch',
  keywords: [
    'fast pitch softball swing analysis',
    'fastpitch timing',
    'fast pitch contact point',
    'stop getting jammed fastpitch',
  ],
});

const faqItems = [
  {
    question: 'Why am I always late against fast pitching?',
    answer:
      'Late contact usually comes from starting the swing too late and taking a long, sweepy path to the ball. Starting your load earlier and shortening the path so the barrel reaches the zone sooner lets you meet the ball out front instead of getting jammed.',
  },
  {
    question: 'What contact point should I aim for in fast pitch?',
    answer:
      'Generally out in front of your lead hip for most pitches, so the barrel is squaring up as it reaches the ball. Deep contact is the signature of being late or jammed.',
  },
  {
    question: 'How is fast pitch different from slow pitch?',
    answer:
      'Fast pitch arrives flat and fast (50–75+ mph), so a short, early swing and timing matter most. Slow pitch arcs down steeply, so matching the descent matters most. SwingVantage uses separate benchmarks and drills for each — if you play slow pitch, use the slow-pitch analyzer instead.',
  },
  {
    question: 'Can I analyze a video without sensors?',
    answer:
      'Yes. Upload a side-view swing at game speed and get a read on timing, path length, and contact depth. If you have bat-sensor data, you can add it for more detail.',
  },
];

const howSteps = [
  { name: 'Upload a game-speed swing', text: 'Film one swing from the side at game speed (live or front toss). The side angle shows your timing and path length.' },
  { name: 'Get your top fix', text: 'SwingVantage leads with your single highest-priority issue — usually timing or path length — with the evidence behind it.' },
  { name: 'Follow the plan & retest', text: 'Run three targeted drills and a 7-day plan, then re-film at game speed to check timing and contact depth.' },
];

const crumbs = [
  { name: 'Home', path: '/' },
  { name: 'Softball Swing Analysis', path: '/softball-swing-analysis' },
  { name: 'Fast Pitch', path: '/softball-swing-analysis/fast-pitch' },
];

const pageGraph = buildGraph(
  organizationSchema(),
  websiteSchema(),
  howToSchema('How Fast-Pitch Swing Analysis Works', howSteps),
  faqPageSchema(faqItems),
);

export default function FastPitchHubPage() {
  return (
    <>
      <SportPageEngagement sport="softball_fast" persona="fast-pitch" />
      <JsonLd data={pageGraph} />
      <Breadcrumbs items={crumbs} className="max-w-4xl mx-auto px-4 pt-4" />

      {/* Hero */}
      <SportAnalysisHero
        accentVar="--sport-softball-fast"
        eyebrow="Fast Pitch · Free Tool"
        title="Catch up to speed."
        titleAccent="Stop getting jammed."
        subtitle="Free AI fast-pitch swing analysis. Shorten your path, start earlier, and improve your contact point — get your single highest-priority fix, three drills, and a 7-day plan. No account required."
        primaryCta={{ label: 'Analyze My Fast-Pitch Swing Free', href: '/start?sport=softball_fast' }}
        secondaryCta={{ label: 'See a Sample Report', href: '/sample-report/fast-pitch' }}
        chips={[]}
      />

      {/* What we analyze */}
      <section className="bg-card py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">What SwingVantage looks for in fast pitch</h2>
          <ul className="grid sm:grid-cols-2 gap-4">
            {[
              'Timing of the load and launch relative to the pitch',
              'Path length from launch to contact (short vs. sweepy)',
              'Contact point depth (out front vs. jammed)',
              'Attack angle against a flat, fast pitch',
              'Quickness and connection through the zone',
              'Adjustability to rise balls and drops',
            ].map((pt) => (
              <li key={pt} className="flex items-start gap-2 text-sm text-muted-foreground rounded-xl border border-border bg-card p-4">
                <span className="text-primary shrink-0 mt-0.5">✓</span>
                {pt}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">How Fast-Pitch Analysis Works</h2>
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
      <MarketingCTA
        heading="Get on time this week"
        body="Free. No subscription. Your data stays private."
        cta={{ label: 'Analyze My Fast-Pitch Swing Free', href: '/start?sport=softball_fast' }}
      />

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

      <SportProofBlock reportSlug="fast-pitch" />

      <RelatedGuides sport="softball" discipline="fast_pitch" heading="Fast-pitch guides" />
    </>
  );
}
