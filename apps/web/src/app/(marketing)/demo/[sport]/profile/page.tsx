import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import {
  buildDemoReport, sportForSlug, getDemoSportMeta, DEMO_SPORT_SLUGS,
} from '@/lib/demo/demo-report';
import { DemoProfileView } from '@/components/demo/DemoProfileView';

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
    title: `Sample ${meta.name} Athlete Profile`,
    description: `See how a ${meta.name} athlete profile personalizes every SwingVantage analysis, drill, and benchmark. Free sample.`,
    path: `/demo/${meta.slug}/profile`,
  });
}

export default async function DemoProfilePage({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;
  const id = sportForSlug(sport);
  if (!id) notFound();
  return <DemoProfileView report={buildDemoReport(id)} />;
}
