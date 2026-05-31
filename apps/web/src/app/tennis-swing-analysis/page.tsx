import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Free Tennis Swing Analysis — AI Stroke Analysis & Drill Recommendations | SwingIQ',
  description:
    'Get a free AI tennis swing analysis. Upload a video of your groundstrokes, serve, or volleys and receive instant fault diagnosis and personalized drills.',
  openGraph: {
    title: 'Free Tennis Swing Analysis — AI-Powered | SwingIQ',
    description:
      'Upload a video of your groundstrokes, serve, or volleys and receive instant AI stroke analysis with personalized drill recommendations.',
    type: 'website',
    url: 'https://swingiq.app/tennis-swing-analysis',
  },
  alternates: {
    canonical: '/tennis-swing-analysis',
  },
};

const faqItems = [
  {
    question: 'What tennis strokes can SwingIQ analyze?',
    answer:
      'SwingIQ analyzes forehands, backhands (one-handed and two-handed), serves, volleys, and overhead smashes. Each stroke type has its own phase-by-phase checklist based on ATP/WTA technical models.',
  },
  {
    question: 'Do I need a tennis sensor or Hawk-Eye data?',
    answer:
      'No sensor is required. SwingIQ can analyze a simple phone video. If you have data from a tennis sensor (racquet speed, spin rate, efficiency), you can also import that for more detailed analysis.',
  },
  {
    question: 'What does the AI look for in a tennis swing?',
    answer:
      'The system checks shoulder unit turn, hip-to-shoulder separation, contact point depth and height, racquet path angle, follow-through position, grip pressure patterns, and footwork sequencing.',
  },
  {
    question: 'Can SwingIQ help me fix my double faults?',
    answer:
      'Yes. SwingIQ identifies serve mechanics issues — toss placement, trophy position, pronation timing, and contact point — that are the most common causes of double faults.',
  },
  {
    question: 'Is SwingIQ suitable for junior tennis players?',
    answer:
      'Absolutely. SwingIQ scales benchmarks by skill level (beginner through elite) and age group. Parents and coaches can use it alongside in-person coaching.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  })),
};

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <header className="bg-[#1a2a3a] text-white">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <p className="text-yellow-300 text-sm font-semibold uppercase tracking-widest mb-3">Free Tool</p>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">
            AI Tennis Stroke Analysis<br className="sm:hidden" /> — Free for Every Level
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            Upload a video of your forehand, backhand, or serve. Our AI diagnoses your stroke faults
            phase-by-phase and builds a personalized drill plan — free.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/video"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-8 py-3 rounded-xl transition-colors"
            >
              Analyze My Strokes
            </Link>
            <Link
              href="/login"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3 rounded-xl transition-colors border border-white/20"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </header>

      {/* How it works */}
      <section className="bg-white py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            How Tennis Stroke Analysis Works
          </h2>
          <ol className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Upload Your Video', desc: 'Film from the side or behind. Any phone camera works. Upload directly to SwingIQ.' },
              { step: '2', title: 'AI Diagnoses Each Phase', desc: 'The system checks preparation, backswing, forward swing, contact, and follow-through against technical benchmarks.' },
              { step: '3', title: 'Train With Purpose', desc: 'Get targeted drills, a weekly practice schedule, and progress tracking for each stroke.' },
            ].map(({ step, title, desc }) => (
              <li key={step} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-yellow-400 text-gray-900 font-black text-lg flex items-center justify-center mb-4">
                  {step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Strokes */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Tennis Strokes SwingIQ Covers</h2>
          <p className="text-gray-600 mb-8 text-sm">
            Each stroke has a dedicated phase checklist aligned with ATP/WTA technical models.
          </p>
          <ul className="grid sm:grid-cols-2 gap-4">
            {strokes.map(({ name, focus }) => (
              <li key={name} className="bg-white rounded-xl border border-gray-200 px-4 py-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{name}</h3>
                <p className="text-xs text-gray-500">{focus}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1a2a3a] py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Start improving your game today</h2>
          <p className="text-blue-200 mb-6 text-sm">Free. No subscription required. Cancel anytime.</p>
          <Link
            href="/login"
            className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-10 py-3 rounded-xl transition-colors inline-block"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-14">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <dl className="space-y-6">
            {faqItems.map(({ question, answer }) => (
              <div key={question}>
                <dt className="font-semibold text-gray-900 mb-1">{question}</dt>
                <dd className="text-sm text-gray-600 leading-relaxed">{answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap gap-4 justify-center text-sm">
          <Link href="/golf-swing-analysis" className="text-gray-600 hover:text-gray-900">Golf Analysis</Link>
          <Link href="/tennis-swing-analysis" className="text-yellow-700 hover:underline">Tennis Analysis</Link>
          <Link href="/baseball-swing-analysis" className="text-gray-600 hover:text-gray-900">Baseball Analysis</Link>
          <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</Link>
          <Link href="/login" className="text-gray-600 hover:text-gray-900">Sign In</Link>
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
          <Link href="/updates" className="text-green-700 hover:underline font-medium">Updates</Link>
        </div>
      </footer>
    </>
  );
}
