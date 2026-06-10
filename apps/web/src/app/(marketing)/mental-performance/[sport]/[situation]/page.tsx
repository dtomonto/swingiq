import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildGraph, articleSchema, howToSchema, faqPageSchema, breadcrumbListSchema,
} from '@/lib/seo/jsonLd';
import { getRoutine, getAllSituationParams } from '@/lib/mental-performance/routines';
import { NON_MEDICAL_DISCLAIMER, CRISIS_NOTE } from '@/lib/mental-performance/constants';
import { sportDisplay } from '../../shared';

export async function generateStaticParams() {
  return getAllSituationParams();
}

function resolve(sport: string, situation: string) {
  const routine = getRoutine(situation);
  if (!routine || !routine.sports.includes(sport as never)) return null;
  return routine;
}

export async function generateMetadata({
  params,
}: { params: Promise<{ sport: string; situation: string }> }): Promise<Metadata> {
  const { sport, situation } = await params;
  const routine = resolve(sport, situation);
  if (!routine) return {};
  const { name } = sportDisplay(sport);
  return buildMetadata({
    title: `${routine.title} (${name}) — ${routine.durationSeconds}-Second Mental Reset`,
    description: `${routine.goal} A short, repeatable ${name.toLowerCase()} routine for "${routine.situation.toLowerCase()}" — steps, breathing, self-talk and how to practice it.`,
    path: `/mental-performance/${sport}/${situation}`,
    keywords: [`${name.toLowerCase()} ${routine.situation.toLowerCase()}`, routine.title.toLowerCase(), 'mental reset', 'sport psychology'],
  });
}

// Module-scope presentational component (no render-scope closure) so it isn't
// re-created on every render.
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-foreground">{value}</div>
    </div>
  );
}

export default async function RoutineDetailPage({
  params,
}: { params: Promise<{ sport: string; situation: string }> }) {
  const { sport, situation } = await params;
  const routine = resolve(sport, situation);
  if (!routine) notFound();

  const { name, emoji } = sportDisplay(sport);
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Mental Performance', path: '/mental-performance' },
    { name, path: `/mental-performance/${sport}` },
    { name: routine.title, path: `/mental-performance/${sport}/${situation}` },
  ];

  const faqs = [
    { question: 'When should I use this routine?', answer: routine.whenToUse },
    { question: 'How do I practice it?', answer: routine.howToPractice },
    { question: 'Is this medical or mental-health treatment?', answer: NON_MEDICAL_DISCLAIMER },
  ];

  const jsonLd = buildGraph(
    articleSchema({
      headline: `${routine.title} — ${name} mental reset`,
      description: routine.goal,
      path: `/mental-performance/${sport}/${situation}`,
    }),
    howToSchema(
      `${routine.title} (${name})`,
      routine.steps.map((s, i) => ({ name: `Step ${i + 1}`, text: s })),
      routine.goal,
    ),
    breadcrumbListSchema(crumbs),
    faqPageSchema(faqs),
  );

  return (
    <main className="min-h-screen bg-card">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={crumbs} className="mb-5" />

        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {emoji} {name} · {routine.durationSeconds}s reset
          </p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">{routine.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{routine.goal}</p>
        </header>

        <section aria-labelledby="steps-h" className="mt-10">
          <h2 id="steps-h" className="text-2xl font-bold text-foreground">The routine</h2>
          <ol className="mt-4 space-y-3">
            {routine.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                <span className="pt-0.5 text-foreground">{s}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="cues-h" className="mt-10">
          <h2 id="cues-h" className="sr-only">Cues</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Self-talk cue" value={`“${routine.selfTalkCue}”`} />
            <Field label="Breath pattern" value={routine.breathPattern} />
            <Field label="Physical anchor" value={routine.physicalAnchor} />
            <Field label="Reflection" value={routine.reflectionPrompt} />
          </div>
        </section>

        <section aria-labelledby="use-h" className="mt-10 space-y-3">
          <h2 id="use-h" className="text-xl font-bold text-foreground">When &amp; how to use it</h2>
          <p className="text-foreground"><strong>When:</strong> {routine.whenToUse}</p>
          <p className="text-foreground"><strong>Practice it:</strong> {routine.howToPractice}</p>
          {routine.safetyNote && (
            <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">{routine.safetyNote}</p>
          )}
        </section>

        <div className="mt-10 rounded-2xl bg-primary px-6 py-8 text-center text-primary-foreground">
          <h2 className="text-xl font-bold md:text-2xl">Run this with the coach, live</h2>
          <p className="mx-auto mt-2 max-w-md text-primary-foreground/90 text-sm">
            Get this reset the instant you need it, plus a drill to make it automatic.
          </p>
          <Link href="/mental" className="mt-5 inline-block rounded-xl bg-primary-foreground px-7 py-3 font-bold text-primary transition-colors hover:bg-primary-foreground/90">
            Open the Mental Performance Coach
          </Link>
        </div>

        <section aria-labelledby="more-h" className="mt-10">
          <h2 id="more-h" className="text-lg font-bold text-foreground">More {name} routines</h2>
          <Link href={`/mental-performance/${sport}`} className="mt-2 inline-block text-primary hover:underline">
            ← All {name} mental performance routines
          </Link>
        </section>

        <aside className="mt-10 rounded-xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
          <p>{NON_MEDICAL_DISCLAIMER}</p>
          <p className="mt-2">{CRISIS_NOTE}</p>
        </aside>
      </div>
      <JsonLd data={jsonLd} />
    </main>
  );
}
