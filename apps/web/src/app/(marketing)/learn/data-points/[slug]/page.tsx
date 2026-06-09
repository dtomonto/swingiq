import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo/metadata';
import { getDataPointEntries, getDataPointEntry, dataPointPath } from '@/lib/learn';
import { LearnArticle } from '@/components/learn/LearnArticle';

// Only PUBLISHED data points get a static page; drafts resolve to notFound().
export function generateStaticParams() {
  return getDataPointEntries().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getDataPointEntry(slug);
  if (!entry) return {};
  return buildMetadata({
    title: entry.seoTitle,
    description: entry.seoDescription,
    path: dataPointPath(slug),
    ogType: 'article',
  });
}

export default async function DataPointPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getDataPointEntry(slug);
  if (!entry) notFound();
  return <LearnArticle entry={entry} />;
}
