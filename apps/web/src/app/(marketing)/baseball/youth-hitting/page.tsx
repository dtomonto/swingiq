import { buildMetadata } from '@/lib/seo/metadata';
import { SeoArticle } from '@/components/seo/SeoArticle';
import { getPublishedSeoPage } from '@/content/seoPages';

const SLUG = 'baseball/youth-hitting';
const page = getPublishedSeoPage(SLUG)!;

export const metadata = buildMetadata({
  title: page.title,
  description: page.metaDescription,
  path: `/${SLUG}`,
  ogType: 'article',
  keywords: [page.keyword, 'youth baseball', 'kids hitting drills'],
});

export default function Page() {
  return <SeoArticle page={page} />;
}
