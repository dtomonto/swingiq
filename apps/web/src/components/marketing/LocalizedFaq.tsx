import Link from 'next/link';
import type { LanguageCode } from '@/lib/i18n';
import { getMarketingT } from '@/lib/marketing-i18n/dict';
import { localizedHref } from '@/lib/marketing-i18n/href';
import { MarketingHero } from '@/components/marketing/MarketingHero';
import { JsonLd } from '@/components/seo/JsonLd';

// Section structure (order + how many Q&As each has). Copy comes from the dict.
const SECTIONS: Array<{ key: string; count: number }> = [
  { key: 'gettingStarted', count: 4 },
  { key: 'sports', count: 3 },
  { key: 'ai', count: 4 },
  { key: 'dataImport', count: 3 },
  { key: 'privacy', count: 4 },
  { key: 'equipment', count: 2 },
];

export function LocalizedFaq({ locale }: { locale: LanguageCode }) {
  const t = getMarketingT(locale);

  const sections = SECTIONS.map((s) => ({
    heading: t(`faqPage.sections.${s.key}.heading`),
    items: Array.from({ length: s.count }, (_, i) => ({
      q: t(`faqPage.sections.${s.key}.q${i + 1}`),
      a: t(`faqPage.sections.${s.key}.a${i + 1}`),
    })),
  }));
  const allItems = sections.flatMap((s) => s.items);

  return (
    <div className="min-h-screen bg-card">
      {/* Header */}
      <MarketingHero title={t('faqPage.hero.title')} subtitle={t('faqPage.hero.subtitle')} />

      {/* FAQ content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-bold text-foreground mb-6 pb-2 border-b border-border">{section.heading}</h2>
            <dl className="space-y-6">
              {section.items.map((item) => (
                <div key={item.q}>
                  <dt className="font-semibold text-foreground mb-1 text-base">{item.q}</dt>
                  <dd className="text-muted-foreground text-sm leading-relaxed">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: allItems.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          }}
        />

        {/* CTA */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">{t('faqPage.ctaHeading')}</h3>
          <p className="text-muted-foreground text-sm mb-4">{t('faqPage.ctaSubtitle')}</p>
          <Link
            href={localizedHref('/start', locale)}
            className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            {t('faqPage.ctaButton')}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-wrap gap-4 text-sm pt-4 border-t border-border">
          <Link href={localizedHref('/', locale)} className="text-primary hover:underline">{t('faqPage.navHome')}</Link>
          <Link href={localizedHref('/how-it-works', locale)} className="text-primary hover:underline">{t('faqPage.navHowItWorks')}</Link>
          <Link href="/trust" className="text-primary hover:underline">{t('faqPage.navTrust')}</Link>
          <Link href="/parents" className="text-primary hover:underline">{t('faqPage.navParents')}</Link>
          <Link href="/updates" className="text-primary hover:underline">{t('faqPage.navUpdates')}</Link>
        </nav>
      </div>
    </div>
  );
}
