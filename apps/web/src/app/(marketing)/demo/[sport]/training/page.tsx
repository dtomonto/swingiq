import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import {
  buildDemoReport, sportForSlug, getDemoSportMeta, DEMO_SPORT_SLUGS,
} from '@/lib/demo/demoReport';
import { DemoTrainingView } from '@/components/demo/DemoTrainingView';

export function generateStaticParams() {
  return DEMO_SPORT_SLUGS.map((sport) => ({ sport }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string }>;
}): Promise<Metadata> {
  const { sport } = await params;
  const id = sportForSlug(sport);
  if (!id) return {};
  const meta = getDemoSportMeta(id);
  return buildMetadata({
    title: `Sample ${meta.name} Training Plan`,
    description: `A ${meta.name} drill plan and 7-day practice schedule driven by the top fix — the same training a registered athlete gets. Free sample.`,
    path: `/demo/${meta.slug}/training`,
  });
}

export default async function DemoTrainingPage({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;
  const id = sportForSlug(sport);
  if (!id) notFound();
  return <DemoTrainingView report={buildDemoReport(id)} />;
}
