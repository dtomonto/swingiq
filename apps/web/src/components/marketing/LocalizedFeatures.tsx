import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { LanguageCode } from '@/lib/i18n';
import { getMarketingT } from '@/lib/marketing-i18n/dict';
import { localizedHref } from '@/lib/marketing-i18n/href';
import { MarketingHero } from '@/components/marketing/MarketingHero';
import { JsonLd } from '@/components/seo/JsonLd';
import { getFeature, featureHref } from '@/content/features';
import { LOCALIZED_FEATURE_GROUPS as GROUPS } from './localized-features-data';

// Group/feature structure lives in localized-features-data.ts (plain data, no
// JSX) so the slug→registry mapping can be unit-tested. Copy comes from the
// dictionary via the flat translator; each card links to the (English)
// comprehensive guide at /features/<slug>.

const HERO_TAGS = ['tagGolf', 'tagTennis', 'tagPickleball', 'tagPadel', 'tagBaseball', 'tagSlowPitch', 'tagFastPitch'];

export function LocalizedFeatures({ locale }: { locale: LanguageCode }) {
  const t = getMarketingT(locale);
  const g = (group: string, field: string) => t(`features.groups.${group}.${field}`);

  const featureNames = GROUPS.flatMap((grp) => grp.features.map((f) => g(grp.key, `${f.k}Name`)));
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
      {
        '@type': 'ItemList',
        name: t('features.hero.title'),
        itemListElement: GROUPS.flatMap((grp) => grp.features).map((f, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: 'https://swingvantage.com' + featureHref({ slug: f.slug }),
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-card">
      <JsonLd data={structuredData} />

      {/* Header */}
      <MarketingHero title={t('features.hero.title')} subtitle={t('features.hero.subtitle')}>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          {HERO_TAGS.map((tag) => (
            <span key={tag} className="rounded-full border border-border bg-secondary px-3 py-1 text-muted-foreground">{t(`features.hero.${tag}`)}</span>
          ))}
        </div>
      </MarketingHero>

      {/* Feature groups */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-14">
        {GROUPS.map((grp) => (
          <section key={grp.key}>
            <h2 className="text-xl font-bold text-foreground mb-6 pb-2 border-b border-border">{g(grp.key, 'heading')}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {grp.features.map((f) => {
                const detail = g(grp.key, `${f.k}Detail`);
                const exists = Boolean(getFeature(f.slug));
                const body = (
                  <>
                    <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{g(grp.key, `${f.k}Name`)}</h3>
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{g(grp.key, `${f.k}Sports`)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{g(grp.key, `${f.k}Desc`)}</p>
                      {detail && <p className="text-xs text-muted-foreground mt-1 italic">{detail}</p>}
                      {exists && (
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                          {/* The detail guides are English-only, so the label is
                              intentionally English even on /es and /fr. */}
                          Read the full guide
                          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  </>
                );
                // The comprehensive guides live at the canonical (English)
                // /features/<slug>; localized detail pages don't exist yet.
                return exists ? (
                  <Link
                    key={f.k}
                    href={featureHref({ slug: f.slug })}
                    className="group flex gap-3 rounded-xl border border-border bg-background p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    {body}
                  </Link>
                ) : (
                  <div key={f.k} className="flex gap-3 rounded-xl border border-border bg-background p-4">{body}</div>
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
