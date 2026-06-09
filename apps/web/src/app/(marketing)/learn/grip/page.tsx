import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo/metadata';
import { getConceptEntry, conceptPath } from '@/lib/learn';
import { LearnArticle } from '@/components/learn/LearnArticle';

const SLUG = 'grip';
const entry = getConceptEntry(SLUG);

export const metadata = entry
  ? buildMetadata({
      title: entry.seoTitle,
      description: entry.seoDescription,
      path: conceptPath(SLUG),
      ogType: 'article',
    })
  : {};

export default function GripConceptPage() {
  if (!entry) notFound();
  return <LearnArticle entry={entry} />;
}
