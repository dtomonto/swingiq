import Link from 'next/link';
import type { LanguageCode } from '@/lib/i18n';
import { getMarketingDict } from '@/lib/marketing-i18n/dict';
import { localizedHref } from '@/lib/marketing-i18n/href';
import { JsonLd } from '@/components/seo/JsonLd';

/**
 * Localized "How It Works" page. Renders fully-translated content from the
 * marketing dictionary; presentation (colors, emoji, accent classes, hrefs)
 * lives here, copy lives in the dictionary. Sport/related links point at the
 * canonical English pages until those are localized.
 */
export function LocalizedHowItWorks({ locale }: { locale: LanguageCode }) {
  const dict = getMarketingDict(locale);
  const t = dict.howItWorks;

  const steps = [
    { n: '1', title: t.process.step1Title, desc: t.process.step1Desc, color: 'bg-primary' },
    { n: '2', title: t.process.step2Title, desc: t.process.step2Desc, color: 'bg-accent-secondary' },
    { n: '3', title: t.process.step3Title, desc: t.process.step3Desc, color: 'bg-accent-secondary' },
    { n: '4', title: t.process.step4Title, desc: t.process.step4Desc, color: 'bg-warning' },
  ];

  const sports = [
    { emoji: '⛳', name: t.sports.golfName, href: '/golf-swing-analysis', desc: t.sports.golfDesc, accent: 'border-primary/50 bg-primary/10' },
    { emoji: '🎾', name: t.sports.tennisName, href: '/tennis-swing-analysis', desc: t.sports.tennisDesc, accent: 'border-warning/50 bg-warning/10' },
    { emoji: '🏓', name: t.sports.pickleballName, href: '/pickleball', desc: t.sports.pickleballDesc, accent: 'border-success/50 bg-success/10' },
    { emoji: '🎾', name: t.sports.padelName, href: '/padel', desc: t.sports.padelDesc, accent: 'border-info/50 bg-info/10' },
    { emoji: '⚾', name: t.sports.baseballName, href: '/baseball-swing-analysis', desc: t.sports.baseballDesc, accent: 'border-error/50 bg-error/10' },
    { emoji: '🥎', name: t.sports.slowPitchName, href: '/softball-swing-analysis', desc: t.sports.slowPitchDesc, accent: 'border-warning/50 bg-warning/10' },
    { emoji: '🥎', name: t.sports.fastPitchName, href: '/softball-swing-analysis', desc: t.sports.fastPitchDesc, accent: 'border-primary/50 bg-primary/10' },
  ];

  const privacy = [
    { icon: '🔒', title: t.privacy.card1Title, desc: t.privacy.card1Desc },
    { icon: '⚙️', title: t.privacy.card2Title, desc: t.privacy.card2Desc },
    { icon: '📱', title: t.privacy.card3Title, desc: t.privacy.card3Desc },
  ];

  const faqs = [
    { q: t.faq.q1, a: t.faq.a1 },
    { q: t.faq.q2, a: t.faq.a2 },
    { q: t.faq.q3, a: t.faq.a3 },
    { q: t.faq.q4, a: t.faq.a4 },
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

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <p className="text-primary-foreground/80 text-sm font-semibold uppercase tracking-widest mb-3">{t.hero.eyebrow}</p>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">{t.hero.title}</h1>
          <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto mb-8">{t.hero.subtitle}</p>
          <Link
            href={localizedHref('/start', locale)}
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-8 py-3 rounded-xl transition-colors inline-block"
          >
            {t.hero.cta}
          </Link>
        </div>
      </header>

      {/* 4-step process */}
      <section className="bg-card py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">{t.process.heading}</h2>
          <div className="space-y-10">
            {steps.map((s) => (
              <div key={s.n} className="flex gap-6 items-start">
                <div className={`w-12 h-12 rounded-full ${s.color} text-white font-black text-xl flex items-center justify-center shrink-0 mt-1`}>
                  {s.n}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 sports */}
      <section className="bg-muted py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-3">{t.sports.heading}</h2>
          <p className="text-muted-foreground mb-8 text-sm">{t.sports.subtitle}</p>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sports.map((s) => (
              <li key={s.name}>
                <Link href={s.href} className={`block rounded-xl border-2 ${s.accent} p-5 hover:shadow-md transition-shadow`}>
                  <div className="text-3xl mb-2">{s.emoji}</div>
                  <h3 className="font-bold text-foreground mb-2">{s.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                  <span className="text-xs text-primary font-semibold mt-2 inline-block">{t.sports.learnMore}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Privacy & tech */}
      <section className="bg-card py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">{t.privacy.heading}</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {privacy.map((c) => (
              <div key={c.title} className="text-center">
                <div className="text-4xl mb-3">{c.icon}</div>
                <h3 className="font-bold text-foreground mb-2">{c.title}</h3>
                <p className="text-sm text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">{t.cta.heading}</h2>
          <p className="text-primary-foreground/90 mb-6 text-sm">{t.cta.subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-8 py-3 rounded-xl transition-colors"
            >
              {t.cta.createAccount}
            </Link>
            <Link
              href="/dashboard"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3 rounded-xl transition-colors border border-white/20"
            >
              {t.cta.goToDashboard}
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-card py-14">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8">{t.faq.heading}</h2>
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

      {/* Related (internal-linking graph) */}
      <nav aria-label="Related" className="bg-card pb-14">
        <div className="max-w-3xl mx-auto px-4 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">{t.related.label}</span>
          <Link href="/athlete-general-intelligence" className="text-primary hover:underline">{t.related.agi}</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/methodology" className="text-primary hover:underline">{t.related.methodology}</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/trust" className="text-primary hover:underline">{t.related.trust}</Link>
        </div>
      </nav>
    </>
  );
}
