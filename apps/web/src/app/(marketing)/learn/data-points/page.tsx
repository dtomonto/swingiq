import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import {
  getDataPointsByCategory,
  getConceptEntries,
  dataPointPath,
  learnPath,
} from '@/lib/learn';

const CATEGORY_LABEL: Record<string, string> = {
  setup: 'Setup',
  motion: 'Motion',
  sequencing: 'Sequencing & tempo',
  contact: 'Contact',
  release: 'Release & face',
  result: 'Result',
  mind: 'Mental',
};

export const metadata = buildMetadata({
  title: 'Swing Data Points — Learn What SwingVantage Measures',
  description:
    'A growing library of plain-English explanations for every swing data point SwingVantage analyzes — what it means, what good looks like, and the drills that fix it.',
  path: '/learn/data-points',
});

export default function DataPointsIndexPage() {
  const groups = getDataPointsByCategory();
  const concepts = getConceptEntries();

  return (
    <main className="min-h-screen bg-background">
      <div className="bg-muted">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Breadcrumbs
            className="mb-4"
            items={[
              { name: 'Home', path: '/' },
              { name: 'Learn', path: '/learn' },
              { name: 'Data points', path: '' },
            ]}
          />
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Swing data points</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Every meaningful thing SwingVantage looks at in your swing, explained in plain English —
            what it means, what good looks like, how we detect it, and the drills that move it.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
        {/* Flagship concepts first */}
        {concepts.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-bold text-foreground">Core concepts</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {concepts.map((c) => (
                <Link
                  key={c.slug}
                  href={learnPath(c)}
                  className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <p className="font-semibold text-foreground">{c.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.descriptionShort}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {groups.map((group) => (
          <section key={group.category}>
            <h2 className="mb-4 text-xl font-bold text-foreground">
              {CATEGORY_LABEL[group.category] ?? group.category}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.entries.map((e) => (
                <Link
                  key={e.slug}
                  href={dataPointPath(e.slug)}
                  className="group block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">{e.title}</p>
                    <ChevronRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{e.descriptionShort}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-2xl border border-border bg-muted p-6 text-center">
          <p className="text-lg font-semibold text-foreground">Want this analyzed on your own swing?</p>
          <p className="mt-1 text-sm text-muted-foreground">Get your top fix, three drills, and a 7-day plan — free.</p>
          <Link
            href="/start"
            className="mt-4 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
          >
            Analyze my swing free
          </Link>
        </section>
      </div>
    </main>
  );
}
