import type { Metadata } from 'next';
import Link from 'next/link';
import {
  TrustBar,
  LiveAndFreeBadge,
  SampleReportPreview,
  PrivacyAssuranceBlock,
  YouthSafetyNotice,
  NotCoachReplacementNotice,
} from '@/components/trust';

export const metadata: Metadata = {
  title: 'SwingIQ — Free AI Swing Analysis for Golf, Tennis, Baseball & Softball',
  description:
    'Upload a swing video or import launch monitor data. Get a free AI-powered breakdown of your top swing fault, personalized drills, and a practice plan. Supports golf, tennis, baseball, and softball.',
  keywords: ['swing analysis', 'golf swing', 'tennis swing', 'baseball swing', 'softball hitting', 'AI coaching', 'launch monitor', 'swing improvement'],
  openGraph: {
    title: 'SwingIQ — Free AI Swing Analysis',
    description: 'Upload your swing video and get an AI diagnosis, drills, and practice plan — free for golf, tennis, baseball, and softball.',
    type: 'website',
  },
};

const SPORTS = [
  { emoji: '⛳', name: 'Golf', desc: 'Launch monitor analysis, club path, face angle, shot shape diagnosis', href: '/golf-swing-analysis' },
  { emoji: '🎾', name: 'Tennis', desc: 'Forehand, backhand, serve mechanics and phase-by-phase coaching', href: '/tennis-swing-analysis' },
  { emoji: '⚾', name: 'Baseball', desc: 'Full swing analysis from load through extension and follow-through', href: '/baseball-swing-analysis' },
  { emoji: '🥎', name: 'Slow Pitch Softball', desc: 'Arc timing, line-drive bat path, directional hitting coaching', href: '/softball-swing-analysis' },
  { emoji: '🥎', name: 'Fast Pitch Softball', desc: 'Compact launch, quick timing, pitch-speed adaptation drills', href: '/softball-swing-analysis' },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Choose Your Sport', desc: 'Select golf, tennis, baseball, or softball. SwingIQ adapts every analysis, drill, and coaching cue to your sport.' },
  { step: '2', title: 'Upload or Enter Data', desc: 'Upload a swing video, import launch monitor CSV data, or snap a photo of your performance table.' },
  { step: '3', title: 'Get Your Diagnosis', desc: "SwingIQ's diagnostic engine identifies your highest-priority swing issue with severity, evidence, and likely causes." },
  { step: '4', title: 'Follow Your Practice Plan', desc: 'Receive targeted drills, YouTube search links, and a next-session focus based on your actual swing data.' },
];

const FAQS = [
  { q: 'Is SwingIQ free?', a: "Yes. SwingIQ's full analysis, drill recommendations, and progress tracking are free. No credit card required." },
  { q: 'Do I need to create an account?', a: 'No account is required to start. Your data is saved locally in your browser. Account sync is coming soon.' },
  { q: 'What sports does SwingIQ support?', a: 'Golf, tennis, baseball, slow pitch softball, and fast pitch softball — each with its own sport-specific diagnostic engine.' },
  { q: 'Does SwingIQ replace a coach?', a: 'No. SwingIQ is an AI-powered improvement assistant. It helps you identify patterns and prioritize practice. For complex technique work or injury concerns, work with a qualified coach.' },
  { q: 'Is my swing video private?', a: 'Yes. Video analysis runs in your browser. Videos are not shared publicly by default.' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#1a3a2a] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-base">SQ</span>
            </div>
            <span className="text-white font-bold text-2xl">SwingIQ</span>
          </div>
          <div className="mb-4 flex justify-center">
            <LiveAndFreeBadge />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Free AI Swing Analysis for<br />
            <span className="text-green-400">Golf, Tennis, Baseball &amp; Softball</span>
          </h1>
          <p className="text-green-100 text-xl mb-10 max-w-2xl mx-auto">
            Upload a swing video or swing data. Get your top issue, beginner-safe drills, and a practice plan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors">
              Analyze My Swing Free
            </Link>
            <Link href="#sample-report" className="border border-green-400 text-green-200 hover:bg-green-900 font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
              See Sample Report
            </Link>
          </div>
          <p className="text-green-300 text-sm mt-5">No account required. No credit card. Private by default.</p>
          <TrustBar className="mt-6 text-green-200" />
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">How SwingIQ Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sports */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">5 Sports, 1 Platform</h2>
          <p className="text-center text-gray-500 mb-10">Each sport has its own AI diagnostic engine, issue categories, and drill library.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SPORTS.map((sport) => (
              <Link key={sport.name} href={sport.href} className="block p-5 border border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-colors">
                <div className="text-2xl mb-2">{sport.emoji}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{sport.name}</h3>
                <p className="text-xs text-gray-500">{sport.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why SwingIQ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Why Athletes Choose SwingIQ</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Priority-First Coaching', desc: 'Instead of a list of 20 things to fix, SwingIQ identifies the single highest-impact issue to work on first.' },
              { title: 'Evidence-Based Drills', desc: 'Every recommended drill is tied to the specific issue detected — not generic advice.' },
              { title: 'Privacy-First Design', desc: 'Video analysis runs locally when possible. Your swing data is never shared publicly by default.' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-6 rounded-xl shadow-xs">
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free tools */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">Free tools to get started</h2>
          <p className="text-center text-gray-500 mb-10">No account needed — try a quick diagnosis or build a plan.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Golf Slice Fixer', desc: 'Diagnose your slice + 7-day plan', href: '/tools/golf-slice-fixer' },
              { name: 'Swing Mistake Quiz', desc: 'Find your top issue across 5 sports', href: '/tools/swing-mistake-quiz' },
              { name: 'Practice Plan Generator', desc: '7-day & 30-day plans with retests', href: '/tools/practice-plan-generator' },
              { name: 'At-Home Drill Generator', desc: 'Drills for your space, gear & time', href: '/tools/at-home-swing-drill-generator' },
              { name: 'Lesson Savings Calculator', desc: 'Estimate spend & smarter practice', href: '/tools/private-lesson-savings-calculator' },
              { name: 'Swing Challenges', desc: '7-day & 30-day guided challenges', href: '/challenges' },
            ].map((t) => (
              <Link key={t.href} href={t.href} className="block p-5 border border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-colors">
                <h3 className="font-semibold text-gray-900 mb-1">{t.name}</h3>
                <p className="text-xs text-gray-500">{t.desc}</p>
              </Link>
            ))}
          </div>
          <p className="text-center mt-6">
            <Link href="/tools" className="text-sm font-semibold text-green-700 hover:underline">See all free tools →</Link>
          </p>
        </div>
      </section>

      {/* Sample report preview */}
      <section id="sample-report" className="scroll-mt-16 py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">See what you&apos;ll get</h2>
            <p className="text-gray-600 mb-4">
              Every analysis leads with your single highest-priority issue — not an overwhelming list.
              You get the top fix, three beginner-safe drills tied to that issue, and a simple practice plan.
            </p>
            <Link href="/dashboard" className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Analyze My Swing Free
            </Link>
          </div>
          <SampleReportPreview />
        </div>
      </section>

      {/* Parent & coach trust */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">Built for confident, private practice</h2>
          <p className="text-center text-gray-500 mb-10 max-w-2xl mx-auto">
            Parents, coaches, and players can trust how SwingIQ handles data and sets honest expectations.
          </p>
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <PrivacyAssuranceBlock />
            <div className="space-y-4">
              <YouthSafetyNotice />
              <NotCoachReplacementNotice />
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 px-4 bg-amber-50 border-y border-amber-200">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-amber-800">
            <strong>SwingIQ is an AI-powered improvement assistant — not a certified coach, medical professional, or training authority.</strong>{' '}
            Results are heuristic estimates. Always consult qualified professionals for safety-critical decisions, injury concerns, or advanced competitive development.
            Young athletes should practice with adult supervision.
          </p>
        </div>
      </section>

      {/* FAQ with JSON-LD */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-1">{faq.q}</h3>
                <p className="text-sm text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebApplication',
                name: 'SwingIQ',
                description: 'Free AI swing analysis for golf, tennis, baseball, and softball.',
                applicationCategory: 'SportsApplication',
                operatingSystem: 'Web browser',
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              },
              {
                '@type': 'FAQPage',
                mainEntity: FAQS.map((faq) => ({
                  '@type': 'Question',
                  name: faq.q,
                  acceptedAnswer: { '@type': 'Answer', text: faq.a },
                })),
              },
            ],
          }),
        }}
      />

      {/* Final CTA */}
      <section className="bg-[#1a3a2a] text-white py-16 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Start Improving Your Swing Today</h2>
        <p className="text-green-200 mb-8">Free AI analysis for golf, tennis, baseball, and softball. No account needed.</p>
        <Link href="/dashboard" className="inline-block bg-green-500 hover:bg-green-400 text-white font-bold px-10 py-4 rounded-xl text-lg transition-colors">
          Analyze My Swing Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-between items-center gap-4 text-xs">
          <span>&copy; {new Date().getFullYear()} SwingIQ. All rights reserved.</span>
          <div className="flex gap-4 flex-wrap">
            <Link href="/how-it-works" className="hover:text-white">How It Works</Link>
            <Link href="/tools" className="hover:text-white">Free Tools</Link>
            <Link href="/challenges" className="hover:text-white">Challenges</Link>
            <Link href="/coaches" className="hover:text-white">Coaches</Link>
            <Link href="/teams" className="hover:text-white">Teams</Link>
            <Link href="/parents" className="hover:text-white">Parents</Link>
            <Link href="/trust" className="hover:text-white">Trust &amp; Safety</Link>
            <Link href="/updates" className="hover:text-white text-green-400">Updates</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
