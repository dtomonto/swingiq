import Link from 'next/link';
import { CalendarCheck } from 'lucide-react';
import type { Challenge } from '@/content/challenges';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildGraph, howToSchema } from '@/lib/seo/jsonLd';
import { EmailCapture } from '@/components/email/EmailCapture';
import { NotCoachReplacementNotice } from '@/components/trust/NotCoachReplacementNotice';

export function ChallengeView({ challenge }: { challenge: Challenge }) {
  return (
    <main className="min-h-screen bg-card">
      <div className="bg-primary px-4 py-12 text-white">
        <div className="mx-auto max-w-2xl">
          <Breadcrumbs
            items={[{ name: 'Home', path: '/' }, { name: 'Challenges', path: '/challenges' }, { name: challenge.title, path: `/challenges/${challenge.slug}` }]}
            className="mb-4 **:text-primary-foreground/90!"
          />
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/40 px-3 py-1 text-xs font-semibold">
            <CalendarCheck size={14} aria-hidden="true" /> {challenge.sport} · Free
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">{challenge.title}</h1>
          <p className="mt-3 text-primary-foreground/90">{challenge.intro}</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <p className="text-sm text-primary"><strong>The promise:</strong> {challenge.promise}</p>
        </div>

        <ol className="mt-8 space-y-4">
          {challenge.days.map((d) => (
            <li key={d.day} className="flex items-start gap-4 rounded-xl border border-border p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {d.day}
              </span>
              <div>
                <p className="font-semibold text-foreground">{d.focus}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{d.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <NotCoachReplacementNotice className="mt-8" />
        <p className="mt-3 text-xs italic text-muted-foreground">{challenge.safetyNote}</p>

        <div className="mt-6">
          <EmailCapture
            source={challenge.leadSource}
            heading="Get daily reminders for this challenge"
            subheading="We'll email you each day's focus so you actually finish. No spam."
            meta={{ challenge: challenge.slug }}
          />
        </div>

        <div className="mt-6 rounded-2xl bg-primary p-6 text-center text-white">
          <p className="mb-4 text-lg font-bold">Track your progress with a free analysis</p>
          <Link href="/dashboard" className="inline-block rounded-xl bg-primary px-8 py-3 font-bold text-white transition-colors hover:bg-primary-foreground/90">
            Analyze My Swing Free
          </Link>
        </div>
      </div>

      <JsonLd data={buildGraph(howToSchema(challenge.title, challenge.days.map((d) => ({ name: `Day ${d.day}: ${d.focus}`, text: d.detail })), challenge.intro))} />
    </main>
  );
}
