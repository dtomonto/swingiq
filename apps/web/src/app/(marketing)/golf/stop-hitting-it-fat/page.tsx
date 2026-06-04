import { buildMetadata } from '@/lib/seo/metadata';
import { SeoArticle } from '@/components/seo/SeoArticle';
import { getPublishedSeoPage } from '@/content/seoPages';

const SLUG = 'golf/stop-hitting-it-fat';
const page = getPublishedSeoPage(SLUG)!;

export const metadata = buildMetadata({
  title: page.title,
  description: page.metaDescription,
  path: `/${SLUG}`,
  ogType: 'article',
  keywords: [page.keyword, 'stop chunking irons', 'fat golf shots fix', 'low point control'],
});

export default function Page() {
  return <SeoArticle page={page} />;
}
