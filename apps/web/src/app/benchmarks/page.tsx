import type { Metadata } from 'next';
import Link from 'next/link';
import { BENCHMARKS } from '@/data/benchmarks';
import { PublicFooter } from '@/components/layout/PublicFooter';

export const metadata: Metadata = {
  title: 'SwingIQ Benchmarks | Performance Standards for Golf, Tennis, Baseball & Softball',
  description:
    'See what good looks like. SwingIQ benchmark ranges show performance standards for beginner through elite athletes across golf, tennis, baseball, and softball.',
  alternates: { canonical: '/benchmarks' },
};

export default function BenchmarksIndexPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#1a3a2a] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Performance Benchmarks</h1>
          <p className="text-green-100 text-xl max-w-2xl mx-auto">
            See what good looks like. Benchmark ranges for beginner through elite athletes across all four sports.
          </p>
        </div>
      </section>

      {/* Sport cards */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">Select a Sport</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {BENCHMARKS.map((sport) => (
              <Link
                key={sport.slug}
                href={`/benchmarks/${sport.slug}`}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6 hover:border-green-400 transition-colors block"
              >
                <div className="text-3xl mb-3">{sport.emoji}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{sport.sport}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{sport.description}</p>
                <div className="text-green-700 text-sm font-medium">{sport.metrics.length} metrics &rarr;</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1a3a2a] text-white py-16 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">See How Your Data Compares</h2>
        <p className="text-green-200 mb-8 text-sm">Import a session and SwingIQ shows your numbers against these benchmarks in real time.</p>
        <Link href="/dashboard" className="inline-block bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-3 rounded-xl transition-colors">
          Analyze My Swing Free
        </Link>
      </section>

      <PublicFooter />
    </main>
  );
}
