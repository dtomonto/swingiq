import { buildMetadata } from '@/lib/seo/metadata';
import { SeoArticle } from '@/components/seo/SeoArticle';
import { getPublishedSeoPage } from '@/content/seoPages';

const SLUG = 'tennis/forehand-analysis';
const page = getPublishedSeoPage(SLUG)!;

export const metadata = buildMetadata({
  title: page.title,
  description: page.metaDescription,
  path: `/${SLUG}`,
  ogType: 'article',
  keywords: [page.keyword, 'tennis forehand', 'topspin forehand'],
});

export default function Page() {
  return <SeoArticle page={page} />;
}
