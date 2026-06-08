import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { SAMPLE_REPORTS } from '@/content/sampleReports';

export const metadata = buildMetadata({
  title: 'Sample Swing Reports',
  description:
    'See exactly what a SwingVantage report looks like — the top priority fix, evidence, drills, a 7-day plan, and how to retest. Golf, baseball, slow pitch, and fast pitch.',
  path: '/sample-report',
});

export default function SampleReportIndexPage() {
  return (
    <main className="min-h-screen bg-muted">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: 'Sample Reports', path: '/sample-report' }]} className="mb-5" />
        <h1 className="text-3xl font-bold text-foreground">See what you&apos;ll get</h1>
        <p className="mt-2 text-muted-foreground">
          Every SwingVantage analysis leads with your single highest-priority fix — not an overwhelming list.
          Pick your sport to see a full worked example: the top issue, the evidence behind it, three drills,
          a 7-day plan, and how to retest. Each example uses sample data; your real report is built from your own swing.
        </p>

        <ul className="mt-6 grid gap-3">
          {SAMPLE_REPORTS.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/sample-report/${r.slug}`}
                className="group flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">
                    <span aria-hidden="true">{r.sportEmoji}</span> {r.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{r.intro}</span>
                </span>
                <ArrowRight
                  size={18}
                  className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 text-center">
          <Link href="/start" className="inline-block rounded-xl bg-primary px-8 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            Get My Real Report Free
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">No account required · Private by default</p>
        </div>
      </div>
    </main>
  );
}
