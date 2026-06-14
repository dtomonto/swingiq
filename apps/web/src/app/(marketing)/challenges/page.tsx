import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { IndexGrid } from '@/components/marketing/IndexGrid';
import { CHALLENGES } from '@/content/challenges';

export const metadata = buildMetadata({
  title: 'Free Swing Challenges',
  description:
    'Free guided swing challenges: 7-day golf slice, 7-day slow-pitch line-drive, and the 30-day SwingVantage challenge. Daily focus and retests.',
  path: '/challenges',
});

export default function ChallengesIndex() {
  const list = Object.values(CHALLENGES);
  return (
    <main className="min-h-screen bg-card">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: 'Challenges', path: '/challenges' }]} className="mb-5" />
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">Free Swing Challenges</h1>
        <p className="mt-2 text-muted-foreground">Short, guided plans with a daily focus and a retest. Pick one and start today.</p>
        <IndexGrid
          items={list.map((c) => ({
            href: `/challenges/${c.slug}`,
            eyebrow: c.sport,
            name: c.title,
            desc: c.promise,
          }))}
        />
      </div>
    </main>
  );
}
