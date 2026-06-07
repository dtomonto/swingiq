import Link from 'next/link';
import type { LanguageCode } from '@/lib/i18n';
import { getMarketingT } from '@/lib/marketing-i18n/dict';
import { localizedHref } from '@/lib/marketing-i18n/href';
import { JsonLd } from '@/components/seo/JsonLd';

// Group/feature structure (order + which fields exist). Copy comes from the
// dictionary via the flat translator; an absent detail key renders as ''.
const GROUPS: Array<{ key: string; features: string[] }> = [
  { key: 'diagnosis', features: ['f1', 'f2', 'f3'] },
  { key: 'dataImport', features: ['f1', 'f2', 'f3', 'f4'] },
  { key: 'training', features: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'] },
  { key: 'video', features: ['f1', 'f2', 'f3'] },
  { key: 'motionLab', features: ['f1'] },
  { key: 'equipment', features: ['f1', 'f2', 'f3'] },
  { key: 'progress', features: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'] },
  { key: 'dataSafety', features: ['f1', 'f2', 'f3'] },
];

const HERO_TAGS = ['tagGolf', 'tagTennis', 'tagPickleball', 'tagPadel', 'tagBaseball', 'tagSlowPitch', 'tagFastPitch'];

export function LocalizedFeatures({ locale }: { locale: LanguageCode }) {
  const t = getMarketingT(locale);
  const g = (group: string, field: string) => t(`features.groups.${group}.${field}`);

  const featureNames = GROUPS.flatMap((grp) => grp.features.map((f) => g(grp.key, `${f}Name`)));
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'SwingVantage', item: 'https://swingvantage.com' },
          { '@type': 'ListItem', position: 2, name: t('features.hero.title'), item: 'https://swingvantage.com' + localizedHref('/features', locale) },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'SwingVantage',
        applicationCategory: 'SportsApplication',
        operatingSystem: 'Web browser',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        featureList: featureNames.join(', '),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-card">
      <JsonLd data={structuredData} />

      {/* Header */}
      <div className="bg-primary text-primary-foreground py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">SV</span>
            </div>
            <Link href={localizedHref('/', locale)} className="text-white font-bold text-xl hover:text-primary-foreground/80 transition-colors">SwingVantage</Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('features.hero.title')}</h1>
          <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto">{t('features.hero.subtitle')}</p>
          <div className="flex flex-wrap justify-center gap-3 mt-6 text-sm">
            {HERO_TAGS.map((tag) => (
              <span key={tag} className="bg-primary/50 text-primary-foreground/90 px-3 py-1 rounded-full">{t(`features.hero.${tag}`)}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Feature groups */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-14">
        {GROUPS.map((grp) => (
          <section key={grp.key}>
            <h2 className="text-xl font-bold text-foreground mb-6 pb-2 border-b border-border">{g(grp.key, 'heading')}</h2>
            <div className="space-y-6">
              {grp.features.map((f) => {
                const detail = g(grp.key, `${f}Detail`);
                return (
                  <div key={f} className="flex gap-4">
                    <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{g(grp.key, `${f}Name`)}</h3>
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{g(grp.key, `${f}Sports`)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{g(grp.key, `${f}Desc`)}</p>
                      {detail && <p className="text-xs text-muted-foreground mt-1 italic">{detail}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* CTA */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">{t('features.ctaHeading')}</h3>
          <p className="text-muted-foreground text-sm mb-4">{t('features.ctaSubtitle')}</p>
          <Link
            href={localizedHref('/start', locale)}
            className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            {t('features.ctaButton')}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-wrap gap-4 text-sm pt-4 border-t border-border">
          <Link href={localizedHref('/', locale)} className="text-primary hover:underline">{t('features.navHome')}</Link>
          <Link href={localizedHref('/how-it-works', locale)} className="text-primary hover:underline">{t('features.navHowItWorks')}</Link>
          <Link href="/faq" className="text-primary hover:underline">{t('features.navFaq')}</Link>
          <Link href="/golf-swing-analysis" className="text-primary hover:underline">{t('features.navGolf')}</Link>
          <Link href="/pricing" className="text-primary hover:underline">{t('features.navPricing')}</Link>
        </nav>
      </div>
    </div>
  );
}
