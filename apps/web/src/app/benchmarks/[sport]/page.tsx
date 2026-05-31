import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BENCHMARKS } from '@/data/benchmarks';
import { PublicFooter } from '@/components/layout/PublicFooter';

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
    title: `${data.sport} Benchmarks | SwingIQ Performance Standards`,
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
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#1a3a2a] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/benchmarks" className="text-green-300 text-sm hover:underline">
              ← Benchmarks
            </Link>
          </div>
          <div className="text-3xl mb-3">{data.emoji}</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{data.sport} Benchmarks</h1>
          <p className="text-green-100 text-lg max-w-2xl">{data.description}</p>
        </div>
      </section>

      {/* Benchmark table */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 min-w-[180px]">Metric</th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-500">Beginner</th>
                  <th className="text-center py-3 px-3 font-semibold text-blue-600">Intermediate</th>
                  <th className="text-center py-3 px-3 font-semibold text-green-600">Advanced</th>
                  <th className="text-center py-3 px-3 font-semibold text-purple-600">Elite</th>
                </tr>
              </thead>
              <tbody>
                {data.metrics.map((metric, i) => (
                  <tr key={metric.name} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">{metric.name}</div>
                      <div className="text-xs text-gray-400">{metric.unit}</div>
                    </td>
                    <td className="text-center py-4 px-3 text-gray-500">{metric.beginner}</td>
                    <td className="text-center py-4 px-3 text-blue-700 font-medium">{metric.intermediate}</td>
                    <td className="text-center py-4 px-3 text-green-700 font-medium">{metric.advanced}</td>
                    <td className="text-center py-4 px-3 text-purple-700 font-bold">{metric.elite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Metric descriptions */}
      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6">What Each Metric Means</h2>
          <dl className="space-y-4">
            {data.metrics.map((metric) => (
              <div key={metric.name} className="grid sm:grid-cols-[200px_1fr] gap-2 sm:gap-4">
                <dt className="font-semibold text-gray-900 text-sm">
                  {metric.name} <span className="font-normal text-gray-400">({metric.unit})</span>
                </dt>
                <dd className="text-sm text-gray-600 leading-relaxed">{metric.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1a3a2a] text-white py-16 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">See How Your Data Compares in SwingIQ</h2>
        <p className="text-green-200 mb-8 text-sm">Import a session and SwingIQ shows your {data.sport.toLowerCase()} numbers against these benchmarks automatically.</p>
        <Link href="/dashboard" className="inline-block bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-3 rounded-xl transition-colors">
          Analyze My Swing Free
        </Link>
      </section>

      <PublicFooter />
    </main>
  );
}
