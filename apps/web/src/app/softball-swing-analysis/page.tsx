import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Free Softball Swing Analysis — Slow Pitch & Fast Pitch AI Tool | SwingIQ',
  description:
    'Analyze your softball swing with AI — for both slow pitch and fast pitch. Track exit velocity, launch angle, bat speed, and get personalized drill recommendations.',
  openGraph: {
    title: 'Free Softball Swing Analysis — Slow Pitch & Fast Pitch | SwingIQ',
    description:
      'AI swing analysis for slow pitch and fast pitch softball. Track exit velocity, launch angle, and bat speed — get personalized drills free.',
    type: 'website',
    url: 'https://swingiq.app/softball-swing-analysis',
  },
  alternates: {
    canonical: '/softball-swing-analysis',
  },
};

const faqItems = [
  {
    question: 'Does SwingIQ support both slow pitch and fast pitch softball?',
    answer:
      'Yes. SwingIQ has separate analysis profiles for slow pitch and fast pitch softball. Each uses sport-specific benchmarks — slow pitch focuses on arc timing, gap hitting, and power angles, while fast pitch emphasizes timing against faster pitches, attack angle, and contact point.',
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
    question: 'How do I import my hitting data into SwingIQ?',
    answer:
      'You can upload a CSV from Rapsodo, Blast Motion, or Diamond Kinetics. You can also take a screenshot of any device screen and manually enter your data using the image import tool.',
  },
  {
    question: 'Can coaches use SwingIQ for a whole team?',
    answer:
      'Team and facility accounts are on the roadmap. Currently, each athlete has their own account. Coaches can guide athletes through SwingIQ and review progress together.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'SwingIQ', item: 'https://swingiq.app' },
        { '@type': 'ListItem', position: 2, name: 'Softball Swing Analysis', item: 'https://swingiq.app/softball-swing-analysis' },
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

export default function SoftballSwingAnalysisPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <header className="bg-[#2a1a20] text-white">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <p className="text-pink-300 text-sm font-semibold uppercase tracking-widest mb-3">Free Tool</p>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">
            AI Softball Swing Analysis<br className="sm:hidden" /> — Slow Pitch &amp; Fast Pitch
          </h1>
          <p className="text-pink-100 text-lg max-w-2xl mx-auto mb-8">
            Import your hitting data or upload a swing video. Get AI analysis of your swing faults
            with drills designed for softball mechanics — free.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/sessions/import/image"
              className="bg-pink-500 hover:bg-pink-400 text-white font-bold px-8 py-3 rounded-xl transition-colors"
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
      <section className="bg-white py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Two Separate Analysis Modes
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Slow Pitch Softball',
                color: 'border-orange-400',
                badge: 'bg-orange-100 text-orange-700',
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
                color: 'border-pink-400',
                badge: 'bg-pink-100 text-pink-700',
                points: [
                  'Timing against 50–75 mph rise balls and drops',
                  'Short, efficient swing path analysis',
                  'Attack angle and contact point depth',
                  'Bat speed benchmarks for position players',
                  'Competition-level benchmarks (youth through college)',
                ],
              },
            ].map(({ title, color, badge, points }) => (
              <div key={title} className={`rounded-xl border-2 ${color} bg-white p-6`}>
                <span className={`text-xs font-bold px-2 py-1 rounded ${badge} mb-3 inline-block`}>
                  {title}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{title} Analysis</h3>
                <ul className="space-y-2">
                  {points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
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
      <section className="bg-gray-50 py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            How Softball Analysis Works
          </h2>
          <ol className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Select Your Sport Mode', desc: 'Choose slow pitch or fast pitch. SwingIQ loads the right benchmarks and drill library for your discipline.' },
              { step: '2', title: 'Import or Enter Data', desc: 'Upload a Blast Motion session, Rapsodo data, or use the photo import to manually enter stats from any device.' },
              { step: '3', title: 'Get Your Drill Plan', desc: 'Receive targeted drills, a weekly training schedule, and benchmarks tailored to your competition level.' },
            ].map(({ step, title, desc }) => (
              <li key={step} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-pink-500 text-white font-black text-lg flex items-center justify-center mb-4">
                  {step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#2a1a20] py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Elevate your softball swing</h2>
          <p className="text-pink-200 mb-6 text-sm">Free. No subscription. Your data stays private.</p>
          <Link
            href="/login"
            className="bg-pink-500 hover:bg-pink-400 text-white font-bold px-10 py-3 rounded-xl transition-colors inline-block"
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
          <Link href="/tennis-swing-analysis" className="text-gray-600 hover:text-gray-900">Tennis Analysis</Link>
          <Link href="/baseball-swing-analysis" className="text-gray-600 hover:text-gray-900">Baseball Analysis</Link>
          <Link href="/softball-swing-analysis" className="text-pink-700 hover:underline">Softball Analysis</Link>
          <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</Link>
          <Link href="/login" className="text-gray-600 hover:text-gray-900">Sign In</Link>
          <Link href="/updates" className="text-green-700 hover:underline font-medium">Updates</Link>
        </div>
      </footer>
    </>
  );
}
