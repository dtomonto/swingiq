import type { Metadata } from 'next';
import Link from 'next/link';
import { BENCHMARKS } from '@/data/benchmarks';

export const metadata: Metadata = {
  title: 'SwingVantage Benchmarks | Performance Standards for Golf, Tennis, Baseball & Softball',
  description:
    'See what good looks like. SwingVantage benchmark ranges show performance standards for beginner through elite athletes across golf, tennis, baseball, and softball.',
  alternates: { canonical: '/benchmarks' },
};

export default function BenchmarksIndexPage() {
  return (
    <main className="min-h-screen bg-card">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Performance Benchmarks</h1>
          <p className="text-primary-foreground/90 text-xl max-w-2xl mx-auto">
            See what good looks like. Benchmark ranges for beginner through elite athletes across all four sports.
          </p>
        </div>
      </section>

      {/* Sport cards */}
      <section className="py-16 px-4 bg-muted">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">Select a Sport</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {BENCHMARKS.map((sport) => (
              <Link
                key={sport.slug}
                href={`/benchmarks/${sport.slug}`}
                className="bg-card rounded-xl border border-border shadow-xs p-5 sm:p-6 hover:border-primary/50 transition-colors block"
              >
                <div className="text-3xl mb-3">{sport.emoji}</div>
                <h3 className="text-xl font-bold text-foreground mb-2">{sport.sport}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{sport.description}</p>
                <div className="text-primary text-sm font-medium">{sport.metrics.length} metrics &rarr;</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-16 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">See How Your Data Compares</h2>
        <p className="text-primary-foreground/90 mb-8 text-sm">Import a session and SwingVantage shows your numbers against these benchmarks in real time.</p>
        <Link href="/start" className="inline-block bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-8 py-3 rounded-xl transition-colors">
          Analyze My Swing Free
        </Link>
      </section>

    </main>
  );
}
