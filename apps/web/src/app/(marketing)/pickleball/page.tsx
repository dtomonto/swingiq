import { buildMetadata } from '@/lib/seo/metadata';
import { SeoArticle } from '@/components/seo/SeoArticle';
import { RelatedGuides } from '@/components/seo/RelatedGuides';
import { FeatureHighlights } from '@/components/features/FeatureHighlights';
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
      <FeatureHighlights
        className="py-12"
        heading="The features behind your pickleball analysis"
        slugs={[
          'ai-diagnostic-engine',
          'swing-video-upload',
          'phase-by-phase-timeline',
          'fix-stack',
          'motion-lab-3d',
          'athletic-journey',
        ]}
      />
      <RelatedGuides sport="pickleball" heading="Pickleball guides" />
    </>
  );
}
