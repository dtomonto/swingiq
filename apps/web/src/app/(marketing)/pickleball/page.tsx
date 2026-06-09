import { buildMetadata } from '@/lib/seo/metadata';
import { SeoArticle } from '@/components/seo/SeoArticle';
import { RelatedGuides } from '@/components/seo/RelatedGuides';
import { getPublishedSeoPage } from '@/content/seoPages';
import { SportPageEngagement } from '@/components/persona/SportPageEngagement';

const SLUG = 'pickleball';
const page = getPublishedSeoPage(SLUG)!;

export const metadata = buildMetadata({
  title: page.title,
  description: page.metaDescription,
  path: `/${SLUG}`,
  keywords: [page.keyword, 'pickleball ai swing analysis', 'pickleball video analysis', 'pickleball coaching app'],
});

export default function Page() {
  return (
    <>
      <SportPageEngagement sport="pickleball" persona="pickleball" />
      <SeoArticle page={page} />
      <RelatedGuides sport="pickleball" heading="Pickleball guides" />
    </>
  );
}
