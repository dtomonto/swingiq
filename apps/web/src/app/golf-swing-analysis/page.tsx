import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Free Golf Swing Analysis — AI-Powered Launch Monitor Data | SwingIQ',
  description:
    'Upload your launch monitor data or swing video for a free AI golf swing analysis. Identify your top swing fault, get personalized drills, and track improvement.',
  openGraph: {
    title: 'Free Golf Swing Analysis — AI-Powered | SwingIQ',
    description:
      'Upload your launch monitor data or swing video for a free AI golf swing analysis. Identify your top swing fault, get personalized drills, and track improvement.',
    type: 'website',
    url: 'https://swingiq.app/golf-swing-analysis',
  },
  alternates: {
    canonical: '/golf-swing-analysis',
  },
};

const faqItems = [
  {
    question: 'What launch monitor data does SwingIQ accept?',
    answer:
      'SwingIQ accepts CSV exports from FlightScope, TrackMan, Foresight GCQuad, Garmin Approach, Rapsodo, and SkyTrak. You can also upload a screenshot and enter data manually.',
  },
  {
    question: 'How does the AI golf swing analysis work?',
    answer:
      'SwingIQ uses a hybrid approach: a deterministic rules engine identifies swing faults based on proven biomechanical benchmarks, then an AI layer generates personalized drill recommendations and practice plans based on your specific pattern.',
  },
  {
    question: 'What golf metrics does SwingIQ analyze?',
    answer:
      'SwingIQ analyzes ball speed, club speed, launch angle, spin rate, club path, face angle, face-to-path, attack angle, dynamic loft, smash factor, carry distance, and impact location.',
  },
  {
    question: 'Is my swing data private?',
    answer:
      'Yes. SwingIQ is privacy-first. Your data is processed locally in your browser when possible. We never sell your data, and you can delete your account and all associated data at any time.',
  },
  {
    question: 'Do I need a launch monitor to use SwingIQ?',
    answer:
      'No. You can upload a swing video for video-based analysis, or use the manual entry tools to log sessions from any source — even a simple radar gun or range session.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'SwingIQ', item: 'https://swingiq.app' },
        { '@type': 'ListItem', position: 2, name: 'Golf Swing Analysis', item: 'https://swingiq.app/golf-swing-analysis' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqItems.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
  ],
};

const metrics = [
  { label: 'Ball Speed', detail: 'Measures energy transfer from club to ball. Target smash factor 1.45–1.50.' },
  { label: 'Club Speed', detail: 'Raw clubhead velocity. Foundation for distance calculation.' },
  { label: 'Launch Angle', detail: 'Vertical angle off the face. Optimal 10–14° for driver.' },
  { label: 'Spin Rate', detail: 'Backspin and sidespin govern curve and descent. High spin = ballooning shots.' },
  { label: 'Club Path', detail: 'In-to-out vs. out-to-in path is the #1 factor in shot shape.' },
  { label: 'Face Angle', detail: 'Where the face points at impact. Determines starting direction.' },
  { label: 'Face-to-Path', detail: 'The gap between face and path creates draw or fade. ±2° is considered neutral.' },
  { label: 'Attack Angle', detail: 'Negative (hitting down) adds spin and reduces distance on driver.' },
  { label: 'Dynamic Loft', detail: 'Actual loft at impact — affected by shaft lean and attack angle.' },
  { label: 'Smash Factor', detail: 'Ball speed ÷ club speed. Measures strike quality and sweet spot consistency.' },
];

export default function GolfSwingAnalysisPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <p className="text-primary-foreground/80 text-sm font-semibold uppercase tracking-widest mb-3">Free Tool</p>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">
            AI Golf Swing Analysis<br className="sm:hidden" /> — Powered by Launch Monitor Data
          </h1>
          <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto mb-8">
            Import your FlightScope, TrackMan, or Foresight data. Get instant fault diagnosis,
            drill recommendations, and a personalized practice plan — free.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/sessions/import"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-8 py-3 rounded-xl transition-colors"
            >
              Import CSV Data
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
            How Golf Swing Analysis Works
          </h2>
          <ol className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Upload Your Data',
                desc: 'Import a CSV from your launch monitor, upload a screenshot, or manually enter key metrics.',
              },
              {
                step: '2',
                title: 'AI Diagnoses Your Faults',
                desc: 'Our rules engine cross-references 20+ biomechanical benchmarks to identify your top swing pattern issues.',
              },
              {
                step: '3',
                title: 'Get Your Practice Plan',
                desc: 'Receive drill recommendations, a weekly training schedule, and benchmarks to track improvement.',
              },
            ].map(({ step, title, desc }) => (
              <li key={step} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-white font-black text-lg flex items-center justify-center mb-4">
                  {step}
                </div>
                <h3 className="font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Metrics analyzed */}
      <section className="bg-muted py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-3">Golf Metrics SwingIQ Analyzes</h2>
          <p className="text-muted-foreground mb-8 text-sm">
            Every metric is compared to tour-calibrated benchmarks for your club and skill level.
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
          <h2 className="text-2xl font-bold text-primary-foreground mb-3">Ready to diagnose your swing?</h2>
          <p className="text-primary-foreground/90 mb-6 text-sm">
            Free. No subscription required. Your data stays private.
          </p>
          <Link
            href="/login"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-10 py-3 rounded-xl transition-colors inline-block"
          >
            Analyze My Golf Swing Free
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

      {/* Footer nav */}
      <footer className="bg-muted border-t border-border py-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap gap-4 justify-center text-sm">
          <Link href="/golf-swing-analysis" className="text-primary hover:underline">Golf Analysis</Link>
          <Link href="/tennis-swing-analysis" className="text-muted-foreground hover:text-foreground">Tennis Analysis</Link>
          <Link href="/baseball-swing-analysis" className="text-muted-foreground hover:text-foreground">Baseball Analysis</Link>
          <Link href="/how-it-works" className="text-muted-foreground hover:text-foreground">How It Works</Link>
          <Link href="/login" className="text-muted-foreground hover:text-foreground">Sign In</Link>
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
          <Link href="/updates" className="text-primary hover:underline font-medium">Updates</Link>
        </div>
      </footer>
    </>
  );
}
