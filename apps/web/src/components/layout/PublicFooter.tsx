import Link from 'next/link';
import type { LanguageCode } from '@/lib/i18n';
import { getMarketingDict } from '@/lib/marketing-i18n/dict';
import { localizedHref } from '@/lib/marketing-i18n/href';
import { CookieSettingsLink } from '@/components/ui/CookieSettingsLink';

// Column structure: stable href + the dictionary key for the visible label.
// Labels are translated per locale; hrefs are English base paths and get
// localized by localizedHref() when the target page is available in the locale.
const COLUMN_DEFS = [
  {
    headingKey: 'sportsHeading',
    links: [
      { k: 'golf', href: '/golf-swing-analysis' },
      { k: 'tennis', href: '/tennis-swing-analysis' },
      { k: 'pickleball', href: '/pickleball' },
      { k: 'padel', href: '/padel' },
      { k: 'baseball', href: '/baseball-swing-analysis' },
      { k: 'softball', href: '/softball-swing-analysis' },
    ],
  },
  {
    headingKey: 'learnHeading',
    links: [
      { k: 'howItWorks', href: '/how-it-works' },
      { k: 'methodology', href: '/methodology' },
      { k: 'faq', href: '/faq' },
      { k: 'glossary', href: '/glossary' },
      { k: 'benchmarks', href: '/benchmarks' },
      { k: 'blog', href: '/blog' },
      { k: 'updates', href: '/updates' },
      { k: 'devUpdates', href: '/dev-updates' },
    ],
  },
  {
    headingKey: 'freeToolsHeading',
    links: [
      { k: 'allFreeTools', href: '/tools' },
      { k: 'golfSliceFixer', href: '/tools/golf-slice-fixer' },
      { k: 'swingMistakeQuiz', href: '/tools/swing-mistake-quiz' },
      { k: 'practicePlanGenerator', href: '/tools/practice-plan-generator' },
      { k: 'challenges', href: '/challenges' },
    ],
  },
  {
    headingKey: 'forYouHeading',
    links: [
      { k: 'parents', href: '/parents' },
      { k: 'coaches', href: '/coaches' },
      { k: 'teams', href: '/teams' },
      { k: 'creators', href: '/creators' },
      { k: 'partners', href: '/partners' },
    ],
  },
  {
    headingKey: 'productHeading',
    links: [
      { k: 'features', href: '/features' },
      { k: 'pricing', href: '/pricing' },
      { k: 'signUpFree', href: '/signup' },
      { k: 'sampleReport', href: '/sample-report' },
    ],
  },
  {
    headingKey: 'trustHeading',
    links: [
      { k: 'contactUs', href: '/contact' },
      { k: 'privacyPolicy', href: '/privacy' },
      { k: 'termsOfService', href: '/terms' },
      { k: 'trustSafety', href: '/trust' },
      { k: 'vulnerabilityDisclosure', href: '/vulnerability-disclosure' },
    ],
  },
] as const;

interface PublicFooterProps {
  className?: string;
  locale?: LanguageCode;
}

export function PublicFooter({ className, locale = 'en' }: PublicFooterProps) {
  const dict = getMarketingDict(locale);
  const f = dict.footer;

  return (
    <footer
      className={`bg-secondary text-muted-foreground pt-12 pb-8 px-4 ${className ?? ''}`}
      aria-label={f.footerAria}
    >
      <div className="max-w-5xl mx-auto">
        {/* Logo + tagline */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-black text-sm" aria-hidden="true">SV</span>
          </div>
          <div>
            <span className="text-foreground font-bold text-lg">SwingVantage</span>
            <p className="text-muted-foreground text-xs">{f.tagline}</p>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 mb-10">
          {COLUMN_DEFS.map((col) => (
            <div key={col.headingKey}>
              <h3 className="text-foreground text-sm font-semibold mb-3">{f[col.headingKey]}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={localizedHref(link.href, locale)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {f.links[link.k]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* In-development disclaimer — invites feedback site-wide */}
        <div className="border-t border-gray-800 pt-6">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            <strong className="text-foreground">{f.buildingTitle}</strong> {f.buildingBody}{' '}
            <Link href={localizedHref('/contact', locale)} className="font-semibold text-foreground underline hover:text-primary">
              {f.contactUsInline}
            </Link>{' '}
            {f.buildingCtaSuffix}
          </p>
        </div>

        {/* AI disclaimer + copyright */}
        <div className="border-t border-gray-800 pt-6 mt-6 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
            <strong className="text-muted-foreground">{f.aiDisclaimerLabel}</strong> {f.aiDisclaimerBody}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
            <span>{f.copyright.replace('{year}', String(new Date().getFullYear()))}</span>
            <div className="flex items-center gap-4">
              {/* Site-wide crawlable link to the Mental Performance pillar.
                  Un-dicted (like the Sitemap link below) so it never gates
                  localized-page visibility. */}
              <Link
                href={localizedHref('/mental-performance', locale)}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Mental Performance
              </Link>
              {/* Crawlable link to the HTML sitemap (every public page). Label is
                  intentionally un-dicted to avoid adding a shared footer key that
                  would gate localized-page visibility. */}
              <Link
                href={localizedHref('/sitemap', locale)}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Sitemap
              </Link>
              {/* Re-open the cookie-consent banner to change the choice.
                  Hidden when no cookie-setting analytics is configured. */}
              <CookieSettingsLink />
              <span>{f.privacyLine}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
