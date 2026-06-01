import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { CHALLENGES } from '@/content/challenges';

export const metadata = buildMetadata({
  title: 'Free Swing Challenges',
  description:
    'Free guided swing challenges: 7-day golf slice, 7-day slow-pitch line-drive, and the 30-day SwingIQ challenge. Daily focus and retests.',
  path: '/challenges',
});

export default function ChallengesIndex() {
  const list = Object.values(CHALLENGES);
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: 'Challenges', path: '/challenges' }]} className="mb-5" />
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Free Swing Challenges</h1>
        <p className="mt-2 text-gray-600">Short, guided plans with a daily focus and a retest. Pick one and start today.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {list.map((c) => (
            <Link key={c.slug} href={`/challenges/${c.slug}`} className="block rounded-2xl border border-gray-200 p-5 transition-colors hover:border-green-400 hover:bg-green-50">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{c.sport}</p>
              <h2 className="mt-1 font-semibold text-gray-900">{c.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{c.promise}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
