import type { Metadata } from 'next';
import { MarketingHero } from '@/components/marketing/MarketingHero';
import { MarketingCTA } from '@/components/marketing/MarketingCTA';
import { EducationalLink } from '@/components/learn/EducationalLink';

export const metadata: Metadata = {
  title: 'About SwingVantage | Free AI Swing Analysis Platform',
  description:
    'SwingVantage is a free AI swing-analysis platform for golf, tennis, baseball, and softball — on a mission to make pro-quality coaching accessible to every athlete.',
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
  { emoji: '🏓', name: 'Pickleball', desc: 'Dinks, third-shot drops, drives, and resets with paddle-face and kitchen-game coaching.' },
  { emoji: '🎾', name: 'Padel', desc: 'Bandeja, víbora, smash, and wall play with net-control and doubles-positioning coaching.' },
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
    <main className="min-h-screen bg-card">
      {/* Hero */}
      <MarketingHero
        title="About"
        titleAccent="SwingVantage"
        subtitle="Making professional-quality swing coaching accessible to every athlete, at every level, for free."
      />

      {/* Mission */}
      <section className="py-16 px-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Our Mission</h2>
          <div className="text-muted-foreground text-sm leading-relaxed space-y-4 max-w-3xl">
            <p>
              SwingVantage was built because private coaching is expensive and inaccessible for most players. A single hour with a certified golf instructor can cost more than many people spend on a month of range balls. For tennis, baseball, and softball players, video analysis and data-driven coaching have historically been reserved for those at the highest levels of the sport.
            </p>
            <p>
              Our goal is to give any athlete — beginner or advanced, 8 years old or 80 — access to the same quality of feedback that professionals get. Not watered-down advice, but real diagnostic analysis: what is happening in your swing, why it matters, and exactly what to work on next.
            </p>
            <p>
              SwingVantage combines{' '}
              <EducationalLink term="heuristic-data">data-backed analysis</EducationalLink>{' '}
              grounded in biomechanical research with{' '}
              <EducationalLink term="ai-sports">AI coaching</EducationalLink>{' '}
              that turns those findings into personalized, plain-English guidance. The result is specific, actionable, and free.
            </p>
          </div>
        </div>
      </section>

      {/* What we believe */}
      <section className="py-16 px-4 bg-muted">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-10">What We Believe</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {BELIEFS.map((b) => (
              <div key={b.title} className="bg-card rounded-xl border border-border shadow-xs p-5 sm:p-6">
                <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported sports */}
      <section className="py-16 px-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Supported Sports</h2>
          <p className="text-muted-foreground text-sm mb-10">Each sport has its own dedicated analysis engine, drill library, and benchmark standards.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SPORTS.map((s) => (
              <div key={s.name} className="bg-card rounded-xl border border-border shadow-xs p-5 sm:p-6">
                <div className="text-2xl mb-2">{s.emoji}</div>
                <h3 className="font-semibold text-foreground mb-1">{s.name}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who uses SwingVantage */}
      <section className="py-16 px-4 bg-muted">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-10">Who Uses SwingVantage</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {WHO_USES.map((w) => (
              <div key={w.title} className="bg-card rounded-xl border border-border shadow-xs p-5 sm:p-6">
                <h3 className="font-semibold text-foreground mb-2">{w.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 px-4 bg-warning/10 border-y border-warning/30">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-warning leading-relaxed">
            <strong>SwingVantage is your AI-powered improvement edge — confident, data-backed coaching you can use every day.</strong>{' '}
            Findings are heuristic estimates that sharpen with every swing you add. For injury concerns or advanced competitive development, loop in a qualified coach, and keep young athletes supervised during practice.
          </p>
        </div>
      </section>

      {/* CTA */}
      <MarketingCTA
        heading="Start Improving Your Swing Today"
        body="Free AI analysis for golf, tennis, baseball, and softball. No account needed."
        cta={{ label: 'Analyze My Swing Free', href: '/start' }}
      />

    </main>
  );
}
