import { notFound } from 'next/navigation';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { MARKETING_LOCALES } from '@/lib/marketing-i18n/dict';
import { localizedRoutes } from '@/lib/marketing-i18n/expose';
import type { LanguageCode } from '@/lib/i18n';
import { LocaleHtmlSetter } from './LocaleHtmlSetter';

/**
 * Localized marketing surface. English lives at the root; this `[lang]` segment
 * serves the translated mirror (e.g. /es, /es/...). Only locales that actually
 * have at least one fully-translated page are statically generated, and an
 * invalid/unsupported locale 404s — so we never serve an empty localized shell.
 */
export function generateStaticParams() {
  const langs = Array.from(new Set(localizedRoutes().map((r) => r.locale)));
  return langs.map((lang) => ({ lang }));
}

// Unknown first-path segments must not be treated as locales.
export const dynamicParams = true;

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!MARKETING_LOCALES.includes(lang as LanguageCode)) notFound();
  const locale = lang as LanguageCode;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LocaleHtmlSetter locale={locale} />
      <MarketingHeader locale={locale} />
      <div className="flex-1">{children}</div>
      <PublicFooter locale={locale} />
    </div>
  );
}
