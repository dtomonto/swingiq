import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicFooter } from '@/components/layout/PublicFooter';

export const metadata: Metadata = {
  title: 'About SwingIQ | Free AI Swing Analysis Platform',
  description:
    'SwingIQ is a free AI-powered swing analysis platform for golf, tennis, baseball, and softball. Learn about our mission to make professional-quality coaching accessible to every athlete.',
  alternates: { canonical: '/about' },
};

const BELIEFS = [
  {
    title: 'Everyone deserves real feedback',
    desc: 'Not just "keep your head down." Real, specific, evidence-based feedback about what is actually happening in your swing — the kind professionals get every day.',
  },
  {
    title: 'Practice without direction wastes time',
    desc: 'Hitting 200 balls with the same flaw builds bad habits. Understanding your swing first means every rep is purposeful.',
  },
  {
    title: 'Good coaching should cost $0 to start',
    desc: 'The insight that helps you break through should not require a $150-per-hour coach. We believe the first step to better technique should be free for everyone.',
  },
];

const SPORTS = [
  { emoji: '⛳', name: 'Golf', desc: 'Launch monitor analysis, club path, face angle, attack angle, spin, and distance benchmarks.' },
  { emoji: '🎾', name: 'Tennis', desc: 'Forehand, backhand, and serve mechanics with phase-by-phase coaching feedback.' },
  { emoji: '⚾', name: 'Baseball', desc: 'Exit velocity, launch angle, bat speed, and attack angle with full swing analysis.' },
  { emoji: '🥎', name: 'Slow Pitch Softball', desc: 'Arc timing, line-drive bat path, and directional hitting coaching.' },
  { emoji: '🥎', name: 'Fast Pitch Softball', desc: 'Compact launch, quick timing, and pitch-speed adaptation drills.' },
];

const WHO_USES = [
  {
    title: 'Athletes improving on their own',
    desc: 'Self-coached players who want structured feedback between lessons — or who have never had a coach and want to know where to start.',
  },
  {
    title: 'Parents supporting young players',
    desc: 'Parents who want to give their kids better feedback on the practice tee without needing to be experts themselves.',
  },
  {
    title: 'Coaches supplementing their teaching',
    desc: 'Instructors who want a data-driven tool their students can use between sessions to reinforce the work done in lessons.',
  },
];

export default function AboutPage() {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">About SwingIQ</h1>
          <p className="text-green-100 text-xl max-w-2xl mx-auto">
            Making professional-quality swing coaching accessible to every athlete, at every level, for free.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <div className="text-gray-600 text-sm leading-relaxed space-y-4 max-w-3xl">
            <p>
              SwingIQ was built because private coaching is expensive and inaccessible for most players. A single hour with a certified golf instructor can cost more than many people spend on a month of range balls. For tennis, baseball, and softball players, video analysis and data-driven coaching have historically been reserved for those at the highest levels of the sport.
            </p>
            <p>
              Our goal is to give any athlete — beginner or advanced, 8 years old or 80 — access to the same quality of feedback that professionals get. Not watered-down advice, but real diagnostic analysis: what is happening in your swing, why it matters, and exactly what to work on next.
            </p>
            <p>
              SwingIQ uses a hybrid approach: a deterministic rules engine that applies biomechanical research to your real data, combined with an AI layer that generates personalized coaching language around those findings. The result is specific, actionable, and free.
            </p>
          </div>
        </div>
      </section>

      {/* What we believe */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-10">What We Believe</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {BELIEFS.map((b) => (
              <div key={b.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{b.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported sports */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Supported Sports</h2>
          <p className="text-gray-600 text-sm mb-10">Each sport has its own dedicated analysis engine, drill library, and benchmark standards.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SPORTS.map((s) => (
              <div key={s.name} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
                <div className="text-2xl mb-2">{s.emoji}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{s.name}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who uses SwingIQ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-10">Who Uses SwingIQ</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {WHO_USES.map((w) => (
              <div key={w.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{w.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 px-4 bg-amber-50 border-y border-amber-200">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>SwingIQ is an AI-powered improvement assistant — not a certified coach, medical professional, or training authority.</strong>{' '}
            Findings are heuristic estimates based on data patterns. Always consult qualified professionals for safety-critical decisions, injury concerns, or advanced competitive development. Young athletes should practice under adult supervision.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1a3a2a] text-white py-16 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Start Improving Your Swing Today</h2>
        <p className="text-green-200 mb-8 text-sm">Free AI analysis for golf, tennis, baseball, and softball. No account needed.</p>
        <Link href="/dashboard" className="inline-block bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-3 rounded-xl transition-colors">
          Analyze My Swing Free
        </Link>
      </section>

      <PublicFooter />
    </main>
  );
}
