import { notFound } from 'next/navigation';
import { sportForSlug, getDemoSportMeta } from '@/lib/demo/demoReport';
import { DemoSampleBanner } from '@/components/demo/DemoSampleBanner';
import { DemoSportNav } from '@/components/demo/DemoSportNav';

export default async function DemoSportLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;
  const id = sportForSlug(sport);
  if (!id) notFound();
  const meta = getDemoSportMeta(id);

  return (
    <>
      <DemoSampleBanner />
      <DemoSportNav accent={meta.accent} />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </>
  );
}
