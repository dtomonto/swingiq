import Link from 'next/link';
import type { LanguageCode } from '@/lib/i18n';
import { getMarketingDict } from '@/lib/marketing-i18n/dict';
import { localizedHref } from '@/lib/marketing-i18n/href';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildGraph, organizationSchema, websiteSchema, softwareApplicationSchema, faqPageSchema } from '@/lib/seo/jsonLd';

/**
 * Localized marketing homepage. Renders fully-translated content from the
 * marketing dictionary — no English text leaks onto the page. Interactive,
 * not-yet-localized sections from the English home (persona cards, theme strip,
 * sample-report preview, proof block) are intentionally omitted until they are
 * localized in a later phase, so a Spanish visitor never sees English mid-page.
 */
export function LocalizedHome({ locale }: { locale: LanguageCode }) {
  const dict = getMarketingDict(locale);
  const { hero, how, why, faq, finalCta } = dict.home;

  const steps = [
    { title: how.step1Title, desc: how.step1Desc },
    { title: how.step2Title, desc: how.step2Desc },
    { title: how.step3Title, desc: how.step3Desc },
    { title: how.step4Title, desc: how.step4Desc },
  ];
  const whyItems = [
    { title: why.item1Title, desc: why.item1Desc },
    { title: why.item2Title, desc: why.item2Desc },
    { title: why.item3Title, desc: why.item3Desc },
  ];
  const faqs = [
    { q: faq.q1, a: faq.a1 },
    { q: faq.q2, a: faq.a2 },
    { q: faq.q3, a: faq.a3 },
    { q: faq.q4, a: faq.a4 },
    { q: faq.q5, a: faq.a5 },
    { q: faq.q6, a: faq.a6 },
  ];

  return (
    <main className="min-h-screen bg-background">
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
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              {hero.badge}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            {hero.titleLine1}
            <br />
            <span className="text-primary-foreground/80">{hero.titleLine2}</span>
          </h1>
          <p className="text-primary-foreground/90 text-xl mb-10 max-w-2xl mx-auto">{hero.subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={localizedHref('/start', locale)}
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              {hero.ctaStart}
            </Link>
            <Link
              href="/video"
              className="border border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              {hero.ctaAnalyze}
            </Link>
          </div>
          <p className="text-primary-foreground/80 text-sm mt-5">
            {hero.note}
            <span className="block mt-1">{hero.noteLine2}</span>
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-muted">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">{how.heading}</h2>
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

      {/* Why */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-10">{why.heading}</h2>
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

      {/* Disclaimer */}
      <section className="py-8 px-4 bg-warning/10 border-y border-warning/30">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-foreground">{dict.home.disclaimer}</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-10">{faq.heading}</h2>
          <div className="space-y-4">
            {faqs.map((item) => (
              <div key={item.q} className="border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-1">{item.q}</h3>
                <p className="text-sm text-muted-foreground">{item.a}</p>
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
          faqPageSchema(faqs.map((item) => ({ question: item.q, answer: item.a }))),
        )}
      />

      {/* Final CTA */}
      <section className="bg-primary text-primary-foreground py-16 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">{finalCta.heading}</h2>
        <p className="text-primary-foreground/90 mb-8">{finalCta.subtitle}</p>
        <Link
          href={localizedHref('/start', locale)}
          className="inline-block bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-10 py-4 rounded-xl text-lg transition-colors"
        >
          {finalCta.button}
        </Link>
      </section>
    </main>
  );
}
