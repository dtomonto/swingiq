import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BENCHMARKS } from '@/data/benchmarks';

export async function generateStaticParams() {
  return BENCHMARKS.map((b) => ({ sport: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string }>;
}): Promise<Metadata> {
  const { sport } = await params;
  const data = BENCHMARKS.find((b) => b.slug === sport);
  if (!data) return {};
  return {
    title: `${data.sport} Benchmarks | SwingVantage Performance Standards`,
    description: `See performance benchmark ranges for ${data.sport} — beginner through elite levels. Includes ${data.metrics.map((m) => m.name).join(', ')}.`,
    alternates: { canonical: `/benchmarks/${sport}` },
  };
}

export default async function SportBenchmarkPage({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;
  const data = BENCHMARKS.find((b) => b.slug === sport);
  if (!data) notFound();

  return (
    <main className="min-h-screen bg-card">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/benchmarks" className="text-primary-foreground/80 text-sm hover:underline">
              ← Benchmarks
            </Link>
          </div>
          <div className="text-3xl mb-3">{data.emoji}</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{data.sport} Benchmarks</h1>
          <p className="text-primary-foreground/90 text-lg max-w-2xl">{data.description}</p>
        </div>
      </section>

      {/* Benchmark table */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground min-w-[180px]">Metric</th>
                  <th className="text-center py-3 px-3 font-semibold text-muted-foreground">Beginner</th>
                  <th className="text-center py-3 px-3 font-semibold text-accent-secondary">Intermediate</th>
                  <th className="text-center py-3 px-3 font-semibold text-primary">Advanced</th>
                  <th className="text-center py-3 px-3 font-semibold text-accent-secondary">Elite</th>
                </tr>
              </thead>
              <tbody>
                {data.metrics.map((metric, i) => (
                  <tr key={metric.name} className={`border-b border-border ${i % 2 === 0 ? 'bg-card' : 'bg-muted'}`}>
                    <td className="py-4 px-4">
                      <div className="font-medium text-foreground">{metric.name}</div>
                      <div className="text-xs text-muted-foreground">{metric.unit}</div>
                    </td>
                    <td className="text-center py-4 px-3 text-muted-foreground">{metric.beginner}</td>
                    <td className="text-center py-4 px-3 text-accent-secondary font-medium">{metric.intermediate}</td>
                    <td className="text-center py-4 px-3 text-primary font-medium">{metric.advanced}</td>
                    <td className="text-center py-4 px-3 text-accent-secondary font-bold">{metric.elite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Metric descriptions */}
      <section className="py-8 px-4 bg-muted">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-6">What Each Metric Means</h2>
          <dl className="space-y-4">
            {data.metrics.map((metric) => (
              <div key={metric.name} className="grid sm:grid-cols-[200px_1fr] gap-2 sm:gap-4">
                <dt className="font-semibold text-foreground text-sm">
                  {metric.name} <span className="font-normal text-muted-foreground">({metric.unit})</span>
                </dt>
                <dd className="text-sm text-muted-foreground leading-relaxed">{metric.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-16 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">See How Your Data Compares in SwingVantage</h2>
        <p className="text-primary-foreground/90 mb-8 text-sm">Import a session and SwingVantage shows your {data.sport.toLowerCase()} numbers against these benchmarks automatically.</p>
        <Link href="/start" className="inline-block bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-8 py-3 rounded-xl transition-colors">
          Analyze My Swing Free
        </Link>
      </section>

    </main>
  );
}
