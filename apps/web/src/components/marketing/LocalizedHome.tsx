import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  EyeOff,
  Clock,
  Target,
  Activity,
  User,
  Crosshair,
} from 'lucide-react';
import type { LanguageCode } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { designV2EnabledFromEnv } from '@/lib/design-v2';
import { getMarketingDict } from '@/lib/marketing-i18n/dict';
import { localizedHref } from '@/lib/marketing-i18n/href';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildGraph, organizationSchema, websiteSchema, softwareApplicationSchema, faqPageSchema } from '@/lib/seo/jsonLd';
import { SampleReportPreview } from '@/components/trust';
import { TutorialVideo } from '@/components/tutorial/TutorialVideo';
import { ReturningUserRedirect } from '@/components/marketing/ReturningUserRedirect';
import { TrustChips } from '@/components/marketing/TrustChips';
import { LiveKinematicPanel } from '@/components/demo/LiveKinematicPanel';

/**
 * The single marketing homepage, parameterized by locale — used by the English
 * page (locale="en") AND /es, /fr. Shared copy comes from the marketing
 * dictionary (one source of truth, no drift).
 *
 * Visual design = the "Dark Performance" (B) brand: green-on-near-black, big
 * Space Grotesk headlines, a glowing product-preview card. The theme tokens do
 * the heavy lifting (every page is dark by default), so this file only sets
 * structure + the B section flow. English gets the full B experience (problem,
 * sport selector, sample output, benefits); translated pages render a leaner
 * dict-only page so they never show English mid-page.
 */
export function LocalizedHome({ locale }: { locale: LanguageCode }) {
  const dict = getMarketingDict(locale);
  const h = dict.home;
  const isEn = locale === 'en';
  // Design V2: env-gated (keeps this a server component — no client JS on the
  // SEO homepage). When on, the sport cards light up with their identity layer.
  const v2 = designV2EnabledFromEnv();

  const steps = [
    { title: h.how.step1Title, desc: h.how.step1Desc },
    { title: h.how.step2Title, desc: h.how.step2Desc },
    { title: h.how.step3Title, desc: h.how.step3Desc },
    { title: h.how.step4Title, desc: h.how.step4Desc },
  ];
  const whyItems = [
    { title: h.why.item1Title, desc: h.why.item1Desc },
    { title: h.why.item2Title, desc: h.why.item2Desc },
    { title: h.why.item3Title, desc: h.why.item3Desc },
  ];
  const ft = h.freeTools;
  const tools = [
    { name: ft.t1Name, desc: ft.t1Desc, href: '/tools/golf-slice-fixer' },
    { name: ft.t2Name, desc: ft.t2Desc, href: '/tools/swing-mistake-quiz' },
    { name: ft.t3Name, desc: ft.t3Desc, href: '/tools/practice-plan-generator' },
    { name: ft.t4Name, desc: ft.t4Desc, href: '/tools/at-home-swing-drill-generator' },
    { name: ft.t5Name, desc: ft.t5Desc, href: '/tools/private-lesson-savings-calculator' },
    { name: ft.t6Name, desc: ft.t6Desc, href: '/challenges' },
  ];
  const faqs = [
    { q: h.faq.q1, a: h.faq.a1 },
    { q: h.faq.q2, a: h.faq.a2 },
    { q: h.faq.q3, a: h.faq.a3 },
    { q: h.faq.q4, a: h.faq.a4 },
    { q: h.faq.q5, a: h.faq.a5 },
    { q: h.faq.q6, a: h.faq.a6 },
    { q: h.faq.q7, a: h.faq.a7 },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Returning visitors skip the marketing splash (→ /login, or /dashboard
          if signed in). New visitors see the full page. */}
      <ReturningUserRedirect />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-theme-hero px-4 pb-16 pt-16 sm:pb-24 sm:pt-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-link">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {isEn ? 'Live now · Free performance analysis' : h.hero.badge}
            </span>

            <h1 className="mt-6 font-heading text-4xl font-bold uppercase leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {isEn ? (
                <>
                  Find the one fix{' '}
                  <span className="text-link">holding your swing back</span>
                </>
              ) : (
                <>
                  {h.hero.titleLine1}{' '}
                  <span className="text-link">{h.hero.titleLine2}</span>
                </>
              )}
            </h1>

            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              {isEn
                ? 'Upload a swing video or import launch-monitor data — get your top fix, the drills to groove it, and a practice plan. 100% free.'
                : h.hero.subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={localizedHref('/start', locale)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-4 text-base font-bold text-primary-foreground shadow-theme transition-colors hover:bg-primary/90"
              >
                {isEn ? 'Analyze My Swing — Free' : h.hero.ctaStart}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                href={isEn ? '#how-it-works' : '/video'}
                className="inline-flex items-center justify-center rounded-xl border border-border px-7 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                {isEn ? 'See how it works' : h.hero.ctaAnalyze}
              </Link>
            </div>

            {isEn ? (
              <TrustChips />
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">
                {h.hero.note}
                <span className="mt-1 block">{h.hero.noteLine2}</span>
              </p>
            )}
          </div>

          {/* Product-preview card (illustrative UI mock — English only). */}
          {isEn && <AnalysisReportCard />}
        </div>
      </section>

      {/* ── Problem (English only) ───────────────────────────────────────── */}
      {isEn && (
        <section className="px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
                Practice without proof is just repetition
              </h2>
              <p className="mt-4 text-muted-foreground">
                Most reps just groove the same mistakes. SwingVantage shows you exactly what to change —
                and gives you the evidence it worked.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: EyeOff,
                  title: "You can't see your own swing",
                  desc: 'Feel vs. real is the biggest gap in sports. We bridge it with frame-by-frame AI analysis that sees what the naked eye misses.',
                },
                {
                  icon: Clock,
                  title: 'Lessons are easy to forget',
                  desc: 'Instruction fades, but data stays. Get a permanent digital record of every session with clear, actionable takeaways.',
                },
                {
                  icon: Crosshair,
                  title: "Generic tips don't fit you",
                  desc: 'Stop following "standard" advice. Our AI analyzes your unique biomechanics for guidance tailored specifically to your body.',
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-theme border border-border bg-card p-6 shadow-theme">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
                    <Icon size={22} className="text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold uppercase tracking-tight text-foreground">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-16 border-y border-border bg-card/40 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
            {isEn ? 'From upload to improvement in 60 seconds' : h.how.heading}
          </h2>
          {isEn && (
            <div className="mx-auto mb-12 mt-8 max-w-2xl">
              <TutorialVideo placement="home-hero" page="/" />
            </div>
          )}
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {steps.map((item, i) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary font-heading text-lg font-bold text-primary-foreground ring-glow">
                  {i + 1}
                </div>
                <h3 className="font-heading font-semibold uppercase tracking-tight text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sport selector (English only) ────────────────────────────────── */}
      {isEn && (
        <section className="px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
                Choose your discipline
              </h2>
              <p className="mt-3 text-muted-foreground">Optimized engines for major rotational sports.</p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { glyph: '⛳', name: 'Golf', tagline: 'Perfect your drive mechanics.', href: '/golf-swing-analysis', accent: 'var(--sport-golf)' },
                { glyph: '🎾', name: 'Tennis', tagline: 'Serve and groundstroke power.', href: '/tennis-swing-analysis', accent: 'var(--sport-tennis)' },
                { glyph: '⚾', name: 'Baseball', tagline: 'Exit velocity and swing plane.', href: '/baseball-swing-analysis', accent: 'var(--sport-baseball)' },
                { glyph: '🥎', name: 'Softball', tagline: 'Fast-pitch swing efficiency.', href: '/softball-swing-analysis', accent: 'var(--sport-softball-fast)' },
              ].map((s) => {
                // Design V2: per-sport identity wash + pattern (mirrors the sport
                // landing heroes). data-sport is set LOCALLY on the card; the
                // wash/pattern are inline var() styles (they cascade-resolve on
                // the nested data-sport wrapper). Flag OFF = the card is unchanged.
                const slug = s.accent.replace('var(--sport-', '').replace(')', '').replace(/-/g, '_');
                const cardInner = (
                  <>
                    <div
                      className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl border bg-secondary text-2xl"
                      style={{ borderColor: `hsl(${s.accent})` }}
                      aria-hidden="true"
                    >
                      {s.glyph}
                    </div>
                    <h3 className="font-heading text-xl font-semibold uppercase tracking-tight text-foreground">{s.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.tagline}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-link">
                      Analyze
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </>
                );
                return (
                  <Link
                    key={s.name}
                    href={s.href}
                    {...(v2 ? { 'data-sport': slug } : {})}
                    className={cn(
                      'group rounded-theme border border-border bg-card p-6 shadow-theme transition-colors hover:border-primary/50',
                      v2 && 'relative overflow-hidden',
                    )}
                  >
                    {v2 && (
                      <>
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0"
                          style={{ backgroundImage: 'var(--sport-wash)' }}
                        />
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 bg-repeat"
                          style={{ backgroundImage: 'var(--sport-pattern)' }}
                        />
                      </>
                    )}
                    {v2 ? <span className="relative block">{cardInner}</span> : cardInner}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Sample output (English only) ─────────────────────────────────── */}
      {isEn && (
        <section id="sample-report" className="scroll-mt-16 border-y border-border bg-card/40 px-4 py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-link">What you&apos;ll actually receive</span>
              <h2 className="mt-3 font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
                See what you&apos;ll get
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every analysis leads with your single highest-priority issue — not an overwhelming list.
                You get the top fix, three beginner-safe drills tied to that issue, and a simple practice plan.
              </p>
              <Link
                href={localizedHref('/start', locale)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Analyze My Swing Free
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <SampleReportPreview href={localizedHref('/start', locale)} />
          </div>
        </section>
      )}

      {/* ── Why / benefits ───────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
            {isEn ? 'Built for athletes who want proof' : h.why.heading}
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {isEn
              ? [
                  { icon: ShieldCheck, title: 'Private by default', desc: 'Video analysis runs in your browser when possible. Your swing data is never shared publicly — and we run no ad cookies and never sell data.' },
                  { icon: Target, title: 'Pro-grade accuracy', desc: 'Frame-by-frame biomechanics powered by computer vision, graded against your level — not tour pros — so the feedback actually fits you.' },
                  { icon: Zap, title: 'Instant feedback', desc: 'Your top fix, matched drills, and a practice plan in minutes — no appointment, no waiting, no credit card.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-theme border border-border bg-card p-6 shadow-theme">
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
                      <Icon size={22} className="text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold uppercase tracking-tight text-foreground">{title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                  </div>
                ))
              : whyItems.map((item) => (
                  <div key={item.title} className="rounded-theme border border-border bg-card p-6 shadow-theme">
                    <h3 className="font-heading font-semibold uppercase tracking-tight text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ── Free tools (English only) ────────────────────────────────────── */}
      {isEn && (
        <section className="border-t border-border px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">{ft.heading}</h2>
            <p className="mt-3 text-center text-muted-foreground">{ft.subtitle}</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className="block rounded-theme border border-border bg-card p-5 transition-colors hover:border-primary/50"
                >
                  <h3 className="font-semibold text-foreground">{t.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
                </Link>
              ))}
            </div>
            <p className="mt-6 text-center">
              <Link href="/tools" className="text-sm font-semibold text-link hover:underline">{ft.seeAll}</Link>
            </p>
          </div>
        </section>
      )}

      {/* ── Disclaimer ───────────────────────────────────────────────────── */}
      <section className="border-y border-warning/30 bg-warning/10 px-4 py-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs text-foreground">{h.disclaimer}</p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">{h.faq.heading}</h2>
          <div className="mt-10 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-theme border border-border bg-card p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-foreground">
                  {faq.q}
                  <ArrowRight size={16} className="shrink-0 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden="true" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <JsonLd
        data={buildGraph(
          organizationSchema(),
          websiteSchema(),
          softwareApplicationSchema(),
          faqPageSchema(faqs.map((faq) => ({ question: faq.q, answer: faq.a }))),
        )}
      />

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="px-4 pb-20 pt-4">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground shadow-theme-lg">
          <h2 className="font-heading text-3xl font-bold uppercase tracking-tight sm:text-4xl">
            {isEn ? 'Ready to fix your swing?' : h.finalCta.heading}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/90">
            {isEn ? 'Find your top fix with frame-by-frame AI analysis — free, no account required.' : h.finalCta.subtitle}
          </p>
          <Link
            href={localizedHref('/start', locale)}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-background px-10 py-4 text-base font-bold text-foreground transition-opacity hover:opacity-90"
          >
            {isEn ? 'Analyze My Swing — Free' : h.finalCta.button}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}

/**
 * Illustrative product-preview card shown in the hero (English). This is a
 * static UI mockup of what a report looks like — not a real user's data — so
 * it carries representative chrome (sample session id, score, fix), never
 * fabricated metrics presented as fact.
 */
function AnalysisReportCard() {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const score = 88;
  const dash = (score / 100) * circumference;

  return (
    <div className="relative rounded-2xl border border-border bg-card p-5 shadow-theme-lg ring-glow lg:p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-foreground">Analysis Report</h3>
          <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">Session ID · SV-0842</p>
        </div>
        <div className="relative h-16 w-16" aria-hidden="true">
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
            <circle cx="32" cy="32" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-base font-bold text-link">{score}%</span>
            <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Score</span>
          </div>
        </div>
      </div>

      {/* Primary fix banner */}
      <div className="mt-5 rounded-xl border-l-2 border-primary bg-primary/10 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-link">Primary fix identified</p>
        <p className="mt-0.5 font-heading font-semibold uppercase tracking-tight text-foreground">Address hip rotation alignment</p>
      </div>

      {/* Drill tiles — each opens the matching surface in the live sample */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { icon: Target, label: 'Wall Drill', next: 'training' },
          { icon: Activity, label: 'Tempo Sync', next: 'training' },
          { icon: User, label: 'Profile', next: 'profile' },
        ].map(({ icon: Icon, label, next }) => (
          <Link
            key={label}
            href={`/demo?next=${next}`}
            className="group rounded-lg border border-border bg-secondary p-3 text-center transition-colors hover:border-primary/60 hover:bg-primary/5"
          >
            <Icon size={18} className="mx-auto text-primary" aria-hidden="true" />
            <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground group-hover:text-foreground">{label}</p>
          </Link>
        ))}
      </div>

      {/* Live kinematic tracking visual (cycles all 7 sports) */}
      <Link
        href="/demo?next=report"
        className="group mt-4 block aspect-video focus:outline-none"
        aria-label="See the live sample analysis report"
      >
        <LiveKinematicPanel className="h-full w-full transition-shadow group-hover:shadow-theme-lg group-focus-visible:ring-2 group-focus-visible:ring-ring" />
      </Link>

      {/* CTA into the real sample report */}
      <Link
        href="/demo?next=report"
        className="mt-3 flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2.5 text-left transition-colors hover:border-primary/60 hover:bg-primary/5"
      >
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-link">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" aria-hidden="true" />
          Kinematic tracking active
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-foreground">
          See the full report
          <ArrowRight size={13} aria-hidden="true" />
        </span>
      </Link>
    </div>
  );
}
