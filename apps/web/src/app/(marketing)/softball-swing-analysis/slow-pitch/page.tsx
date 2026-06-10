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
  title: 'Slow-Pitch Softball Swing Analysis — Hit Line Drives',
  description:
    'Free AI slow-pitch softball swing analysis. Match your bat path to the arc, stop popping up, and drive line drives. Get your top fix, drills, and a 7-day plan.',
  path: '/softball-swing-analysis/slow-pitch',
  keywords: [
    'slow pitch softball swing analysis',
    'stop popping up slow pitch',
    'slow pitch line drives',
    'slow pitch bat path',
  ],
});

const faqItems = [
  {
    question: 'Why do I keep popping up in slow pitch?',
    answer:
      'Pop-ups in slow pitch almost always mean your bat is traveling under the ball — usually a dropped back shoulder or an exaggerated uppercut into a steeply descending pitch. Leveling your path to match the arc and staying through the middle of the ball fixes most of them.',
  },
  {
    question: 'What launch angle should I hit for in slow pitch?',
    answer:
      'A line-drive-to-slight-lift window carries best for most hitters. Because the ball is dropping at contact, a slightly upward path matched to the descent produces carry — an exaggerated uppercut just produces pop-ups.',
  },
  {
    question: 'How is slow pitch different from fast pitch?',
    answer:
      'Slow pitch arcs down steeply, so timing and matching the descent matter most. Fast pitch arrives flat and fast, so a short, early swing matters most. SwingVantage uses separate benchmarks and drills for each — if you play fast pitch, use the fast-pitch analyzer instead.',
  },
  {
    question: 'Do I need a bat sensor?',
    answer:
      'No. You can upload a side-view swing video and get a read on bat path, shoulder tilt, and contact. If you do have Blast Motion or similar data, you can add it for more detail.',
  },
];

const howSteps = [
  { name: 'Upload a side-view swing', text: 'Film one swing from the side (live or off a tee). The side angle shows your bat path against the descending pitch.' },
  { name: 'Get your top fix', text: 'SwingVantage leads with your single highest-priority issue — usually path or shoulder tilt — with the evidence behind it.' },
  { name: 'Follow the plan & retest', text: 'Run three targeted drills and a 7-day plan, then re-film from the same angle to track line-drive rate.' },
];

const crumbs = [
  { name: 'Home', path: '/' },
  { name: 'Softball Swing Analysis', path: '/softball-swing-analysis' },
  { name: 'Slow Pitch', path: '/softball-swing-analysis/slow-pitch' },
];

const pageGraph = buildGraph(
  organizationSchema(),
  websiteSchema(),
  howToSchema('How Slow-Pitch Swing Analysis Works', howSteps),
  faqPageSchema(faqItems),
);

export default function SlowPitchHubPage() {
  return (
    <>
      <SportPageEngagement sport="softball_slow" persona="slow-pitch" />
      <JsonLd data={pageGraph} />
      <Breadcrumbs items={crumbs} className="max-w-4xl mx-auto px-4 pt-4" />

      {/* Hero */}
      <SportAnalysisHero
        accentVar="--sport-softball-slow"
        eyebrow="Slow Pitch · Free Tool"
        title="Stop popping up."
        titleAccent="Start driving line drives."
        subtitle="Free AI slow-pitch swing analysis. Match your bat path to the arc, get your single highest-priority fix, three drills, and a 7-day plan — no account required."
        primaryCta={{ label: 'Analyze My Slow-Pitch Swing Free', href: '/start?sport=softball_slow' }}
        secondaryCta={{ label: 'See a Sample Report', href: '/sample-report/slow-pitch' }}
        chips={[]}
      />

      {/* What we analyze */}
      <section className="bg-card py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">What SwingVantage looks for in slow pitch</h2>
          <ul className="grid sm:grid-cols-2 gap-4">
            {[
              'Bat path angle relative to the descending pitch',
              'Back-shoulder tilt and posture through the swing',
              'Contact point on the ball (under vs. through the middle)',
              'Hip rotation and sequencing for power',
              'Pull / oppo spray tendencies',
              'Timing against the high arc',
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
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">How Slow-Pitch Analysis Works</h2>
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
        heading="Drive more line drives this week"
        body="Free. No subscription. Your data stays private."
        cta={{ label: 'Analyze My Slow-Pitch Swing Free', href: '/start?sport=softball_slow' }}
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

      <SportProofBlock reportSlug="slow-pitch" />

      <RelatedGuides sport="softball" discipline="slow_pitch" heading="Slow-pitch guides" />
    </>
  );
}
