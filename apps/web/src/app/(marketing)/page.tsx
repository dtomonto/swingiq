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
import { JsonLd } from '@/components/seo/JsonLd';
import { ThemePreviewStrip } from '@/components/theme/ThemePreviewStrip';
import {
  buildGraph,
  organizationSchema,
  websiteSchema,
  softwareApplicationSchema,
  faqPageSchema,
} from '@/lib/seo/jsonLd';

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
  { q: 'Does SwingIQ replace a coach?', a: 'SwingIQ is your everyday improvement edge — it pinpoints the single highest-impact fix in your swing and hands you the drills and plan to groove it, no appointment needed. For injury concerns or advanced technique work it pairs perfectly with a qualified coach, and you will show up to those sessions already ahead.' },
  { q: 'Is my swing video private?', a: 'Yes. Video analysis runs in your browser. Videos are not shared publicly by default.' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-golf-fairway rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-base">SQ</span>
            </div>
            <span className="text-primary-foreground font-bold text-2xl">SwingIQ</span>
          </div>
          <div className="mb-4 flex justify-center">
            <LiveAndFreeBadge />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            The Swing Coach in Your Pocket for<br />
            <span className="text-primary-foreground/80">Golf, Tennis, Baseball &amp; Softball</span>
          </h1>
          <p className="text-primary-foreground/90 text-xl mb-10 max-w-2xl mx-auto">
            The improvement edge every athlete — and every parent of an athlete — has wished for.
            Upload a swing and get the one fix that matters most, the drills to groove it, and a plan that gets you there.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/start" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-8 py-4 rounded-xl text-lg transition-colors">
              Start Here — Free
            </Link>
            <Link href="/dashboard" className="border border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
              Analyze My Swing
            </Link>
          </div>
          <p className="text-primary-foreground/80 text-sm mt-5">
            Your first result in about 3 minutes.{' '}
            <Link href="#sample-report" className="underline hover:text-primary-foreground">See a sample report</Link>.
            <span className="block mt-1">No account required. No credit card. Private by default.</span>
          </p>
          <TrustBar className="mt-6 text-primary-foreground/80" />
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-muted">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">How SwingIQ Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sports */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-4">5 Sports, 1 Platform</h2>
          <p className="text-center text-muted-foreground mb-10">Each sport has its own AI diagnostic engine, issue categories, and drill library.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SPORTS.map((sport) => (
              <Link key={sport.name} href={sport.href} className="block p-5 border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors">
                <div className="text-2xl mb-2">{sport.emoji}</div>
                <h3 className="font-semibold text-foreground mb-1">{sport.name}</h3>
                <p className="text-xs text-muted-foreground">{sport.desc}</p>
              </Link>
            ))}
          </div>
          <p className="text-center mt-8">
            <Link
              href="/sports"
              className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Choose My Sport
            </Link>
          </p>
        </div>
      </section>

      {/* Themes */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-3">Make it yours</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            Seven premium themes — from a clean Standard look to Dark Performance training mode.
            Themes change the look only; your coaching results never change.
          </p>
          <ThemePreviewStrip />
        </div>
      </section>

      {/* Why SwingIQ */}
      <section className="py-16 px-4 bg-muted">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-10">Why Athletes Choose SwingIQ</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Priority-First Coaching', desc: 'Instead of a list of 20 things to fix, SwingIQ identifies the single highest-impact issue to work on first.' },
              { title: 'Evidence-Based Drills', desc: 'Every recommended drill is tied to the specific issue detected — not generic advice.' },
              { title: 'Privacy-First Design', desc: 'Video analysis runs locally when possible. Your swing data is never shared publicly by default.' },
            ].map((item) => (
              <div key={item.title} className="bg-card border border-border p-6 rounded-xl shadow-xs">
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free tools */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-3">Free tools to get started</h2>
          <p className="text-center text-muted-foreground mb-10">No account needed — try a quick diagnosis or build a plan.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Golf Slice Fixer', desc: 'Diagnose your slice + 7-day plan', href: '/tools/golf-slice-fixer' },
              { name: 'Swing Mistake Quiz', desc: 'Find your top issue across 5 sports', href: '/tools/swing-mistake-quiz' },
              { name: 'Practice Plan Generator', desc: '7-day & 30-day plans with retests', href: '/tools/practice-plan-generator' },
              { name: 'At-Home Drill Generator', desc: 'Drills for your space, gear & time', href: '/tools/at-home-swing-drill-generator' },
              { name: 'Lesson Savings Calculator', desc: 'Estimate spend & smarter practice', href: '/tools/private-lesson-savings-calculator' },
              { name: 'Swing Challenges', desc: '7-day & 30-day guided challenges', href: '/challenges' },
            ].map((t) => (
              <Link key={t.href} href={t.href} className="block p-5 border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors">
                <h3 className="font-semibold text-foreground mb-1">{t.name}</h3>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </Link>
            ))}
          </div>
          <p className="text-center mt-6">
            <Link href="/tools" className="text-sm font-semibold text-primary hover:underline">See all free tools →</Link>
          </p>
        </div>
      </section>

      {/* Sample report preview */}
      <section id="sample-report" className="scroll-mt-16 py-16 px-4 bg-muted">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">See what you&apos;ll get</h2>
            <p className="text-muted-foreground mb-4">
              Every analysis leads with your single highest-priority issue — not an overwhelming list.
              You get the top fix, three beginner-safe drills tied to that issue, and a simple practice plan.
            </p>
            <Link href="/dashboard" className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 py-3 rounded-xl transition-colors">
              Analyze My Swing Free
            </Link>
          </div>
          <SampleReportPreview />
        </div>
      </section>

      {/* Parent & coach trust */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-3">Built for confident, private practice</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
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
      <section className="py-8 px-4 bg-warning/10 border-y border-warning/30">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-foreground">
            <strong>SwingIQ is your AI-powered improvement edge — confident, data-backed coaching you can use every day.</strong>{' '}
            Findings are heuristic estimates — smart reads that sharpen with every swing you add. For injury concerns or advanced competitive development, loop in a qualified coach,
            and keep young athletes supervised during practice.
          </p>
        </div>
      </section>

      {/* FAQ with JSON-LD */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-1">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JSON-LD structured data — site-wide Organization + WebSite + app entity,
          plus the homepage FAQ. Built from the canonical schema helpers so the
          Organization/WebSite nodes (entity grounding for search + AI engines)
          stay consistent across the site. */}
      <JsonLd
        data={buildGraph(
          organizationSchema(),
          websiteSchema(),
          softwareApplicationSchema(),
          faqPageSchema(FAQS.map((faq) => ({ question: faq.q, answer: faq.a }))),
        )}
      />

      {/* Final CTA */}
      <section className="bg-primary text-primary-foreground py-16 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Start Improving Your Swing Today</h2>
        <p className="text-primary-foreground/90 mb-8">Free AI analysis for golf, tennis, baseball, and softball. No account needed.</p>
        <Link href="/start" className="inline-block bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-10 py-4 rounded-xl text-lg transition-colors">
          Start Here — Free
        </Link>
      </section>

    </main>
  );
}
