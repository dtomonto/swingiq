import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MARKETING_LOCALES, getMarketingDict } from '@/lib/marketing-i18n/dict';
import { isLocaleCurrentFor } from '@/lib/marketing-i18n/expose';
import { buildMetadata } from '@/lib/seo/metadata';
import { LocalizedFeatures } from '@/components/marketing/LocalizedFeatures';
import type { LanguageCode } from '@/lib/i18n';

const PATH = '/features';

export function generateStaticParams() {
  return MARKETING_LOCALES.filter((l) => isLocaleCurrentFor(PATH, l)).map((lang) => ({ lang }));
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
    title: dict.features.meta.title,
    description: dict.features.meta.description,
    path: PATH,
    locale,
  });
}

export default async function LocalizedFeaturesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as LanguageCode;
  if (!MARKETING_LOCALES.includes(locale) || !isLocaleCurrentFor(PATH, locale)) notFound();
  return <LocalizedFeatures locale={locale} />;
}
