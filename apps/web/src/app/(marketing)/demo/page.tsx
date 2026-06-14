import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { buildMetadata } from '@/lib/seo/metadata';
import { ALL_SPORTS_INCLUDING_GOLF } from '@swingiq/core';
import { slugForSport, type DemoSportId } from '@/lib/demo/demo-report';
import { DemoSampleBanner } from '@/components/demo/DemoSampleBanner';

export const metadata = buildMetadata({
  title: 'See a Live Sample Report — Pick Your Sport',
  description:
    'Explore a live SwingVantage sample report — pick any of 7 sports and see the full interactive breakdown, top fix, drills, and practice plan. Free, no account required.',
  path: '/demo',
});

const VALID_NEXT = new Set(['report', 'profile', 'training']);

export default async function DemoPickerPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const section = next && VALID_NEXT.has(next) && next !== 'report' ? `/${next}` : '';

  return (
    <>
      <DemoSampleBanner />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-link">Live sample</p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pick your sport
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            See a full, real analysis report — the same one registered athletes get — for your sport.
            Switch between sports any time. Free, no account needed.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ALL_SPORTS_INCLUDING_GOLF.map((s) => {
            const slug = slugForSport(s.id as DemoSportId);
            return (
              <Link
                key={s.id}
                href={`/demo/${slug}${section}`}
                className="group relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border border-border bg-card p-5 text-center transition-all hover:-translate-y-0.5 hover:shadow-theme-lg"
              >
                <span
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `radial-gradient(100% 80% at 50% 0%, ${s.accent_hex}22, transparent 70%)` }}
                />
                <span className="text-4xl" aria-hidden="true">{s.emoji}</span>
                <span className="font-heading text-sm font-bold text-foreground">{s.name}</span>
                <span
                  className="inline-flex items-center gap-1 text-2xs font-semibold opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: s.accent_hex }}
                >
                  View report <ArrowRight size={12} />
                </span>
              </Link>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Sample reports use representative data and are clearly labelled — never a real person&apos;s
          result.
        </p>
      </main>
    </>
  );
}
