import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How SwingIQ Works — AI Swing Analysis for Golf, Tennis, Baseball & Softball',
  description:
    'Learn how SwingIQ analyzes your swing in 4 steps: select your sport, upload data or video, get AI analysis, and follow your personalized practice plan.',
  openGraph: {
    title: 'How SwingIQ Works — AI Swing Analysis',
    description:
      'Four steps to better technique: select your sport, upload data or video, get AI diagnosis, follow your practice plan.',
    type: 'website',
    url: 'https://swingiq.app/how-it-works',
  },
  alternates: {
    canonical: '/how-it-works',
  },
};

const steps = [
  {
    number: '1',
    title: 'Select Your Sport',
    desc: 'SwingIQ supports golf, tennis, baseball, slow pitch softball, and fast pitch softball. Each sport has its own analysis engine, drill library, and benchmarks calibrated for that discipline.',
    color: 'bg-primary',
  },
  {
    number: '2',
    title: 'Upload or Enter Your Data',
    desc: 'Import a CSV from your launch monitor, upload a swing video, take a screenshot and enter your stats manually, or connect a Bluetooth sensor. SwingIQ meets you where your data already lives.',
    color: 'bg-accent-secondary',
  },
  {
    number: '3',
    title: 'Get Your AI Analysis',
    desc: 'A deterministic rules engine cross-references your numbers against proven biomechanical benchmarks. Then an AI layer generates a ranked list of your top swing faults and identifies your highest-leverage fix.',
    color: 'bg-accent-secondary',
  },
  {
    number: '4',
    title: 'Follow Your Practice Plan',
    desc: 'Receive targeted drills matched to your exact fault pattern, a weekly practice schedule based on your availability, and progress benchmarks so you can see measurable improvement.',
    color: 'bg-warning',
  },
];

const sports = [
  {
    emoji: '⛳',
    name: 'Golf',
    href: '/golf-swing-analysis',
    description: 'Launch monitor data analysis. Club path, face angle, attack angle, spin, and distance benchmarks aligned with tour stats.',
    accentClass: 'border-primary/50 bg-primary/10',
  },
  {
    emoji: '🎾',
    name: 'Tennis',
    href: '/tennis-swing-analysis',
    description: 'Video-based stroke analysis. Forehand, backhand, serve, and volley phase-by-phase breakdown against ATP/WTA technical models.',
    accentClass: 'border-warning/50 bg-warning/10',
  },
  {
    emoji: '⚾',
    name: 'Baseball',
    href: '/baseball-swing-analysis',
    description: 'Exit velocity, launch angle, bat speed, and attack angle tracking. Integrates HitTrax, Rapsodo, and Blast Motion data.',
    accentClass: 'border-error/50 bg-error/10',
  },
  {
    emoji: '🥎',
    name: 'Slow Pitch Softball',
    href: '/softball-swing-analysis',
    description: 'Arc timing, launch angle optimization, and power metrics calibrated specifically for slow pitch mechanics and bat certifications.',
    accentClass: 'border-warning/50 bg-warning/10',
  },
  {
    emoji: '🥎',
    name: 'Fast Pitch Softball',
    href: '/softball-swing-analysis',
    description: 'Short-to-the-ball swing analysis. Contact point depth, attack angle, and timing benchmarks for competitive fast pitch levels.',
    accentClass: 'border-primary/50 bg-primary/10',
  },
];

const faqs = [
  {
    q: 'Is SwingIQ free to use?',
    a: 'The core analysis tools are free. Advanced features like unlimited session history, team accounts, and professional video review are on the paid roadmap.',
  },
  {
    q: 'Do I need special equipment?',
    a: 'No. A smartphone camera is enough to get started with video analysis. If you have launch monitor or sensor data, you can import it for deeper analysis.',
  },
  {
    q: 'Who is SwingIQ for?',
    a: 'SwingIQ is designed for self-coached athletes, athletes working with coaches who want data-informed instruction, parents tracking youth player development, and facility owners who want a scalable coaching tool.',
  },
  {
    q: 'Is SwingIQ a replacement for a human coach?',
    a: 'No. SwingIQ is a development tool that helps athletes practice more purposefully between coaching sessions. Human coaches provide context, feel-based feedback, and relationships that software cannot replicate.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function HowItWorksPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <p className="text-primary-foreground/80 text-sm font-semibold uppercase tracking-widest mb-3">How It Works</p>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">
            Better Technique in 4 Steps
          </h1>
          <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto mb-8">
            SwingIQ combines a deterministic analysis engine with AI to give every athlete a
            personalized, data-driven development path — across 5 sports.
          </p>
          <Link
            href="/login"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-8 py-3 rounded-xl transition-colors inline-block"
          >
            Start My Free Swing Check
          </Link>
        </div>
      </header>

      {/* 4-step how it works */}
      <section className="bg-card py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">
            The SwingIQ Process
          </h2>
          <div className="space-y-10">
            {steps.map(({ number, title, desc, color }) => (
              <div key={number} className="flex gap-6 items-start">
                <div
                  className={`w-12 h-12 rounded-full ${color} text-white font-black text-xl flex items-center justify-center shrink-0 mt-1`}
                >
                  {number}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 sports */}
      <section className="bg-muted py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-3">5 Sports, One Platform</h2>
          <p className="text-muted-foreground mb-8 text-sm">
            Every sport has a dedicated analysis engine. You can switch sports at any time.
          </p>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sports.map(({ emoji, name, href, description, accentClass }) => (
              <li key={name}>
                <Link
                  href={href}
                  className={`block rounded-xl border-2 ${accentClass} p-5 hover:shadow-md transition-shadow`}
                >
                  <div className="text-3xl mb-2">{emoji}</div>
                  <h3 className="font-bold text-foreground mb-2">{name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                  <span className="text-xs text-primary font-semibold mt-2 inline-block">
                    Learn more →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Privacy & tech */}
      <section className="bg-card py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            Privacy-First. Deterministic + AI Hybrid.
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: '🔒',
                title: 'Your Data Stays Yours',
                desc: 'Data is processed locally when possible. We never sell your data. Delete your account and all data at any time.',
              },
              {
                icon: '⚙️',
                title: 'Rules Engine + AI',
                desc: 'Deterministic rules based on biomechanical research run first. AI adds personalization and language — never hallucinated diagnosis.',
              },
              {
                icon: '📱',
                title: 'Mobile-First',
                desc: 'Built as a Progressive Web App. Works offline for basic features. Installable on any phone without an app store.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="text-4xl mb-3">{icon}</div>
                <h3 className="font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to get started?</h2>
          <p className="text-primary-foreground/90 mb-6 text-sm">Free. No subscription required. Works on any device.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-8 py-3 rounded-xl transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="/dashboard"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3 rounded-xl transition-colors border border-white/20"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-card py-14">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8">Common Questions</h2>
          <dl className="space-y-6">
            {faqs.map(({ q, a }) => (
              <div key={q}>
                <dt className="font-semibold text-foreground mb-1">{q}</dt>
                <dd className="text-sm text-muted-foreground leading-relaxed">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <footer className="bg-muted border-t border-border py-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap gap-4 justify-center text-sm">
          <Link href="/golf-swing-analysis" className="text-muted-foreground hover:text-foreground">Golf Analysis</Link>
          <Link href="/tennis-swing-analysis" className="text-muted-foreground hover:text-foreground">Tennis Analysis</Link>
          <Link href="/baseball-swing-analysis" className="text-muted-foreground hover:text-foreground">Baseball Analysis</Link>
          <Link href="/softball-swing-analysis" className="text-muted-foreground hover:text-foreground">Softball Analysis</Link>
          <Link href="/how-it-works" className="text-primary hover:underline">How It Works</Link>
          <Link href="/login" className="text-muted-foreground hover:text-foreground">Sign In</Link>
          <Link href="/updates" className="text-primary hover:underline font-medium">Updates</Link>
        </div>
      </footer>
    </>
  );
}
