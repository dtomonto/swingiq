import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildGraph, articleSchema, softwareApplicationSchema, faqPageSchema, breadcrumbListSchema,
} from '@/lib/seo/jsonLd';
import { getRoutines } from '@/lib/mental-performance/routines';
import { NON_MEDICAL_DISCLAIMER, CRISIS_NOTE } from '@/lib/mental-performance/constants';
import { MENTAL_SPORT_CARDS } from './shared';

export const metadata = buildMetadata({
  title: 'Mental Performance — Recover & Reset Under Pressure',
  description:
    'Your mechanics matter — so does your response after a mistake. SwingVantage Mental Performance helps athletes manage emotions, recover from errors, and build reset routines.',
  path: '/mental-performance',
  keywords: [
    'mental performance', 'sport psychology', 'how to recover after a mistake',
    'golf mental game', 'between point reset', 'error recovery softball',
    'pre-game routine', 'composure under pressure',
  ],
});

const FAQS = [
  {
    question: 'Is Mental Performance therapy or mental-health treatment?',
    answer:
      'No. Mental Performance is sport coaching for focus, composure and confidence. It is not medical or clinical mental-health treatment, diagnosis, or therapy, and it does not replace a licensed professional. If you are in crisis, contact emergency services or a crisis line immediately.',
  },
  {
    question: 'Which sports are supported?',
    answer:
      'Golf, baseball, slow-pitch and fast-pitch softball, tennis, pickleball and padel — with sport-specific recovery routines for each, plus universal routines that work in any sport. More sports are on the way.',
  },
  {
    question: 'How is this different from swing analysis?',
    answer:
      'Swing analysis fixes the mechanics. Mental Performance trains the response — what you do in the 20 seconds after a bad shot, a fielding error, or a missed return, so one mistake doesn’t become three.',
  },
  {
    question: 'Does it cost anything or use AI?',
    answer:
      'The coach is deterministic and keyless — it works instantly with no AI cost. An optional AI polish layer exists but is off by default. Your reflections are stored only if you choose to save them.',
  },
  {
    question: 'How does it personalize over time?',
    answer:
      'As you log moments, it surfaces your most common triggers, your fastest and slowest recovery situations, and your composure and confidence trends — and tailors which routine it suggests first.',
  },
];

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Mental Performance', path: '/mental-performance' },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-12">
      <h2 id={id} className="text-2xl font-bold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-foreground">{children}</div>
    </section>
  );
}

export default function MentalPerformanceHub() {
  const shortRoutines = getRoutines({ maxDurationSeconds: 30 }).slice(0, 6);

  const jsonLd = buildGraph(
    articleSchema({
      headline: 'Mental Performance — Recover After Mistakes & Compete With Composure',
      description:
        'Sport coaching for emotion management and mistake recovery across golf, baseball, softball, tennis, pickleball and padel.',
      path: '/mental-performance',
    }),
    softwareApplicationSchema(),
    breadcrumbListSchema(CRUMBS),
    faqPageSchema(FAQS),
  );

  return (
    <main className="min-h-screen bg-card">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Breadcrumbs items={CRUMBS} className="mb-5" />

        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Mental Performance</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-5xl">
            Your mechanics matter. Your response after the mistake matters just as much.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            SwingVantage doesn’t only analyze how you move — it helps you manage how you respond under
            pressure. Recover faster after errors, stay composed in competition, and build repeatable
            mental routines you can run in the moment.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/mental" className="inline-block rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition-colors hover:bg-primary/90">
              Open the Mental Performance Coach
            </Link>
            <Link href="#sports" className="inline-block rounded-xl border border-border px-6 py-3 font-semibold text-foreground transition-colors hover:bg-muted">
              Find your sport
            </Link>
          </div>
        </header>

        <Section id="what" title="What Mental Performance is">
          <p>
            It’s a sport-psychology toolkit for everyday athletes: short reset routines, a guided coach,
            personalized training plans, and a private reflection journal. The goal is simple — turn a
            mistake into training intelligence instead of a spiral.
          </p>
        </Section>

        <Section id="why" title="Why emotional recovery matters">
          <p>
            One bad swing becomes three bad holes. One fielding error becomes a fear of the next ball.
            One missed return becomes a rushed game. The athletes who compete best aren’t the ones who
            never make mistakes — they’re the ones who recover the fastest. That’s a trainable skill.
          </p>
        </Section>

        <section id="sports" aria-labelledby="sports-h" className="mt-12">
          <h2 id="sports-h" className="text-2xl font-bold text-foreground">Sport-specific mistake recovery</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {MENTAL_SPORT_CARDS.map((s) => (
              <Link
                key={s.id}
                href={`/mental-performance/${s.id}`}
                className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">{s.emoji}</span>
                  <span className="font-semibold text-foreground group-hover:text-primary">{s.name}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{s.blurb}</p>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="resets-h" className="mt-12">
          <h2 id="resets-h" className="text-2xl font-bold text-foreground">Quick reset routines</h2>
          <p className="mt-2 text-muted-foreground">
            Short enough to run between a shot, a pitch, or a point. Here are a few:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {shortRoutines.map((r) => (
              <Link
                key={r.id}
                href={`/mental-performance/${r.sports[0]}/${r.slug}`}
                className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{r.title}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{r.durationSeconds}s</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{r.situation}</p>
                <p className="mt-2 text-sm font-medium text-primary">“{r.selfTalkCue}”</p>
              </Link>
            ))}
          </div>
        </section>

        <Section id="how" title="How the coach adapts to you">
          <p>
            The coach is deterministic and keyless, so it responds instantly with no AI cost. It maps your
            sport, what happened, and how you’re feeling to the right reset — and as you log moments, it
            learns your common triggers, your fastest and slowest recovery situations, and your composure
            and confidence trends, then tailors what it suggests first.
          </p>
        </Section>

        <section aria-labelledby="faq-h" className="mt-12">
          <h2 id="faq-h" className="text-2xl font-bold text-foreground">Frequently asked questions</h2>
          <dl className="mt-4 space-y-5">
            {FAQS.map((f) => (
              <div key={f.question}>
                <dt className="font-semibold text-foreground">{f.question}</dt>
                <dd className="mt-1 text-muted-foreground">{f.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Safety */}
        <aside className="mt-12 rounded-xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
          <p>{NON_MEDICAL_DISCLAIMER}</p>
          <p className="mt-2">{CRISIS_NOTE}</p>
        </aside>

        <div className="mt-10 rounded-2xl bg-primary px-6 py-10 text-center text-primary-foreground">
          <h2 className="text-2xl font-bold md:text-3xl">Train the response, not just the swing.</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
            Get an instant reset the next time you make a mistake — and build the routine that makes it automatic.
          </p>
          <Link href="/mental" className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-background px-8 py-3 font-bold text-foreground transition-opacity hover:opacity-90">
            Start with the Mental Performance Coach
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <JsonLd data={jsonLd} />
    </main>
  );
}
