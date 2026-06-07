import Link from 'next/link';
import type { LanguageCode } from '@/lib/i18n';
import { getMarketingDict } from '@/lib/marketing-i18n/dict';
import { localizedHref } from '@/lib/marketing-i18n/href';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildGraph, organizationSchema, websiteSchema, softwareApplicationSchema, faqPageSchema } from '@/lib/seo/jsonLd';
import {
  TrustBar,
  LiveAndFreeBadge,
  SampleReportPreview,
  PrivacyAssuranceBlock,
  YouthSafetyNotice,
  NotCoachReplacementNotice,
} from '@/components/trust';
import { ThemePreviewStrip } from '@/components/theme/ThemePreviewStrip';
import { TutorialVideo } from '@/components/tutorial/TutorialVideo';
import { PersonaPathCards } from '@/components/persona/PersonaPathCards';
import { SportProofBlock } from '@/components/proof/SportProofBlock';
import { ReturningUserRedirect } from '@/components/marketing/ReturningUserRedirect';

/**
 * The single marketing homepage, parameterized by locale — used by the English
 * page (locale="en") AND /es, /fr. All copy comes from the marketing dictionary
 * (one source of truth, no drift). Interactive sections that are not yet
 * localized (persona cards, tutorial video, theme strip, sample-report preview,
 * proof block, parent/coach trust blocks) render ONLY for English, so the
 * English page is lossless while translated pages never show English mid-page.
 */
export function LocalizedHome({ locale }: { locale: LanguageCode }) {
  const dict = getMarketingDict(locale);
  const h = dict.home;
  const isEn = locale === 'en';

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
    <main className="min-h-screen bg-background">
      {/* Returning visitors skip the marketing splash (→ /login, or /dashboard
          if signed in). New visitors see the full page. Client-only; renders
          nothing and leaves the server-rendered HTML (and SEO) intact. */}
      <ReturningUserRedirect />

      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-golf-fairway rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-base">SV</span>
            </div>
            <span className="text-primary-foreground font-bold text-2xl">SwingVantage</span>
          </div>
          <div className="mb-4 flex justify-center">
            {isEn ? (
              <LiveAndFreeBadge />
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                {h.hero.badge}
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            {h.hero.titleLine1}
            <br />
            <span className="text-primary-foreground/80">{h.hero.titleLine2}</span>
          </h1>
          <p className="text-primary-foreground/90 text-xl mb-10 max-w-2xl mx-auto">{h.hero.subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={localizedHref('/start', locale)} className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-8 py-4 rounded-xl text-lg transition-colors">
              {h.hero.ctaStart}
            </Link>
            <Link href="/video" className="border border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
              {h.hero.ctaAnalyze}
            </Link>
          </div>
          <p className="text-primary-foreground/80 text-sm mt-5">
            {h.hero.note}
            {isEn && (
              <>
                {' '}
                <Link href="#sample-report" className="underline hover:text-primary-foreground">See a sample report</Link>.
              </>
            )}
            <span className="block mt-1">{h.hero.noteLine2}</span>
          </p>
          {isEn && <TrustBar className="mt-6 text-primary-foreground/80" />}
        </div>
      </section>

      {/* Persona router (English-only for now) */}
      {isEn && <PersonaPathCards />}

      {/* How it works */}
      <section className="py-16 px-4 bg-muted">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">{h.how.heading}</h2>
          {isEn && (
            <div className="mx-auto mb-12 max-w-2xl">
              <TutorialVideo placement="home-hero" page="/" />
            </div>
          )}
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((item, i) => (
              <div key={item.title} className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Themes (English-only for now) */}
      {isEn && (
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
      )}

      {/* Why SwingVantage */}
      <section className="py-16 px-4 bg-muted">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-10">{h.why.heading}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {whyItems.map((item) => (
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
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-3">{ft.heading}</h2>
          <p className="text-center text-muted-foreground mb-10">{ft.subtitle}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((t) => (
              <Link key={t.href} href={t.href} className="block p-5 border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors">
                <h3 className="font-semibold text-foreground mb-1">{t.name}</h3>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </Link>
            ))}
          </div>
          <p className="text-center mt-6">
            <Link href="/tools" className="text-sm font-semibold text-primary hover:underline">{ft.seeAll}</Link>
          </p>
        </div>
      </section>

      {/* Sample report preview (English-only for now) */}
      {isEn && (
        <section id="sample-report" className="scroll-mt-16 py-16 px-4 bg-muted">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">See what you&apos;ll get</h2>
              <p className="text-muted-foreground mb-4">
                Every analysis leads with your single highest-priority issue — not an overwhelming list.
                You get the top fix, three beginner-safe drills tied to that issue, and a simple practice plan.
              </p>
              <Link href="/video" className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 py-3 rounded-xl transition-colors">
                Analyze My Swing Free
              </Link>
            </div>
            <SampleReportPreview />
          </div>
        </section>
      )}

      {/* Proof strip (English-only for now) */}
      {isEn && <SportProofBlock reportSlug="golf" heading="See the proof, not just the promise" />}

      {/* Parent & coach trust (English-only for now) */}
      {isEn && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-3">Built for confident, private practice</h2>
            <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
              Parents, coaches, and players can trust how SwingVantage handles data and sets honest expectations.
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
      )}

      {/* Disclaimer */}
      <section className="py-8 px-4 bg-warning/10 border-y border-warning/30">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-foreground">{h.disclaimer}</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-10">{h.faq.heading}</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-1">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
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

      {/* Final CTA */}
      <section className="bg-primary text-primary-foreground py-16 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">{h.finalCta.heading}</h2>
        <p className="text-primary-foreground/90 mb-8">{h.finalCta.subtitle}</p>
        <Link href={localizedHref('/start', locale)} className="inline-block bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-10 py-4 rounded-xl text-lg transition-colors">
          {h.finalCta.button}
        </Link>
      </section>
    </main>
  );
}
