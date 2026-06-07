import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MARKETING_LOCALES, getMarketingDict } from '@/lib/marketing-i18n/dict';
import { isLocaleCurrentFor } from '@/lib/marketing-i18n/expose';
import { buildMetadata } from '@/lib/seo/metadata';
import { LocalizedHome } from '@/components/marketing/LocalizedHome';
import type { LanguageCode } from '@/lib/i18n';

/** Build the localized home only for locales where '/' is fully translated. */
export function generateStaticParams() {
  return MARKETING_LOCALES.filter((l) => isLocaleCurrentFor('/', l)).map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = lang as LanguageCode;
  const dict = getMarketingDict(locale);
  return buildMetadata({
    title: dict.home.meta.title,
    description: dict.home.meta.description,
    path: '/',
    locale,
  });
}

export default async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as LanguageCode;
  if (!MARKETING_LOCALES.includes(locale) || !isLocaleCurrentFor('/', locale)) notFound();
  return <LocalizedHome locale={locale} />;
}
