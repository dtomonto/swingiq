import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Free Baseball Swing Analysis — Exit Velocity, Launch Angle & Bat Speed | SwingIQ',
  description:
    'Analyze your baseball swing with AI. Track exit velocity, launch angle, bat speed, and attack angle. Get drill recommendations to fix your swing faults.',
  openGraph: {
    title: 'Free Baseball Swing Analysis — AI-Powered | SwingIQ',
    description:
      'Track exit velocity, launch angle, and bat speed. Get AI-powered swing fault diagnosis and drill recommendations — free.',
    type: 'website',
    url: 'https://swingiq.app/baseball-swing-analysis',
  },
  alternates: {
    canonical: '/baseball-swing-analysis',
  },
};

const faqItems = [
  {
    question: 'What baseball hitting metrics does SwingIQ track?',
    answer:
      'SwingIQ tracks exit velocity, launch angle, distance, bat speed, attack angle, time to contact, hand speed, spray angle, and on-plane percentage. Data can come from HitTrax, Rapsodo, Blast Motion, Diamond Kinetics, or manual entry.',
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
    question: 'Can SwingIQ help me fix a casting or long swing?',
    answer:
      'Yes. SwingIQ analyzes attack angle, time to contact, and hand path to identify casting, looping, and long-to-the-ball patterns. Targeted drills address each fault.',
  },
  {
    question: 'Is SwingIQ useful for youth baseball players?',
    answer:
      'Yes. SwingIQ adjusts benchmarks by age and skill level. Parents and coaches can track development over time and generate age-appropriate drill progressions.',
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <header className="bg-[#2a1a1a] text-white">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <p className="text-red-300 text-sm font-semibold uppercase tracking-widest mb-3">Free Tool</p>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">
            AI Baseball Swing Analysis<br className="sm:hidden" /> — Exit Velocity to Bat Path
          </h1>
          <p className="text-red-100 text-lg max-w-2xl mx-auto mb-8">
            Import HitTrax, Rapsodo, or Blast Motion data. Upload a swing video. Get instant AI
            diagnosis of your swing faults and a targeted drill plan — free.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/sessions/import/image"
              className="bg-red-500 hover:bg-red-400 text-white font-bold px-8 py-3 rounded-xl transition-colors"
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
      <section className="bg-white py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            How Baseball Swing Analysis Works
          </h2>
          <ol className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Import Your Data', desc: 'Connect HitTrax, Rapsodo, or Blast Motion. Or upload a screenshot from any device.' },
              { step: '2', title: 'AI Identifies Faults', desc: 'The system compares your EV, launch angle, bat speed, and attack angle to level-appropriate benchmarks.' },
              { step: '3', title: 'Drill & Improve', desc: 'Get specific drills for your pattern — whether it\'s early extension, casting, or a steep attack angle.' },
            ].map(({ step, title, desc }) => (
              <li key={step} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-500 text-white font-black text-lg flex items-center justify-center mb-4">
                  {step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Metrics */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Hitting Metrics SwingIQ Analyzes</h2>
          <p className="text-gray-600 mb-8 text-sm">
            All metrics are benchmarked by age group and competition level — from youth rec to professional.
          </p>
          <ul className="grid sm:grid-cols-2 gap-4">
            {metrics.map(({ label, detail }) => (
              <li key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{label}</h3>
                <p className="text-xs text-gray-500">{detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#2a1a1a] py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Start tracking your development</h2>
          <p className="text-red-200 mb-6 text-sm">Free. No subscription required. Your data stays private.</p>
          <Link
            href="/login"
            className="bg-red-500 hover:bg-red-400 text-white font-bold px-10 py-3 rounded-xl transition-colors inline-block"
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
          <Link href="/baseball-swing-analysis" className="text-red-700 hover:underline">Baseball Analysis</Link>
          <Link href="/softball-swing-analysis" className="text-gray-600 hover:text-gray-900">Softball Analysis</Link>
          <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</Link>
          <Link href="/login" className="text-gray-600 hover:text-gray-900">Sign In</Link>
          <Link href="/updates" className="text-green-700 hover:underline font-medium">Updates</Link>
        </div>
      </footer>
    </>
  );
}
