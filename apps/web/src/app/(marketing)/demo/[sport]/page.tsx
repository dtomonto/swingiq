import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import {
  buildDemoReport, sportForSlug, getDemoSportMeta, DEMO_SPORT_SLUGS,
} from '@/lib/demo/demoReport';
import { DemoReportView } from '@/components/demo/DemoReportView';

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
    title: `Sample ${meta.name} Swing Report`,
    description: `A complete SwingVantage ${meta.name} analysis — swing score, primary fix, phase-by-phase breakdown, drills, and a 7-day plan. The same report registered athletes get. Free sample.`,
    path: `/demo/${meta.slug}`,
  });
}

export default async function DemoReportPage({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;
  const id = sportForSlug(sport);
  if (!id) notFound();
  return <DemoReportView report={buildDemoReport(id)} />;
}
