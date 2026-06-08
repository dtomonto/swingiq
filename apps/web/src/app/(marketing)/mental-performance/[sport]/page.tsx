import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildGraph, articleSchema, faqPageSchema, breadcrumbListSchema,
} from '@/lib/seo/jsonLd';
import { getRoutinesForSport } from '@/lib/mental-performance/routines';
import { sportFamilyFor, NON_MEDICAL_DISCLAIMER, CRISIS_NOTE } from '@/lib/mental-performance/constants';
import type { MentalSport } from '@/lib/mental-performance/types';
import { MENTAL_SPORT_CARDS, MENTAL_SPORT_IDS, sportDisplay } from '../shared';

export async function generateStaticParams() {
  return MENTAL_SPORT_IDS.map((sport) => ({ sport }));
}

function isValidSport(s: string): s is MentalSport {
  return (MENTAL_SPORT_IDS as string[]).includes(s);
}

export async function generateMetadata({ params }: { params: Promise<{ sport: string }> }): Promise<Metadata> {
  const { sport } = await params;
  if (!isValidSport(sport)) return {};
  const { name } = sportDisplay(sport);
  return buildMetadata({
    title: `${name} Mental Performance — Recover After Mistakes & Stay Composed`,
    description: `Sport-psychology routines for ${name.toLowerCase()}: recover after mistakes, manage frustration, and reset in the moment with short, repeatable mental routines.`,
    path: `/mental-performance/${sport}`,
    keywords: [`${name.toLowerCase()} mental game`, `${name.toLowerCase()} mistake recovery`, 'sport psychology', 'composure under pressure'],
  });
}

// Recovery framework copy per sport family.
function framework(sport: MentalSport): { title: string; items: Array<{ h: string; p: string }> } {
  const fam = sportFamilyFor(sport);
  if (fam === 'racket') {
    return {
      title: 'Know which error you just made',
      items: [
        { h: 'Forced error', p: 'Your opponent created the pressure. Respond with tactical acceptance and one adjustment — not self-criticism.' },
        { h: 'Unforced error', p: 'You had control. Make a calm diagnosis and one simple correction, then move on.' },
        { h: 'Strategic error', p: 'Wrong shot selection. Recognize the pattern so you choose better next time.' },
        { h: 'Emotional error', p: 'Frustration changed your execution. The fix is a nervous-system reset, not a technical one.' },
      ],
    };
  }
  if (fam === 'bat') {
    return {
      title: 'Turn the error into "want the next one"',
      items: [
        { h: 'Reset fast', p: 'Tap the glove, breathe once, and look to the next play — the error is already in the past.' },
        { h: 'Separate luck from mistakes', p: 'A bad hop isn’t on you. Don’t let it make you tentative on the next ball.' },
        { h: 'Invite the ball', p: 'Replace "don’t hit it to me" with "hit it here" and an athletic ready position every pitch.' },
        { h: 'Leave at-bats behind', p: 'Take one note from a strikeout, then give your full focus to your next job.' },
      ],
    };
  }
  if (fam === 'golf') {
    return {
      title: 'Stop one bad swing from becoming three bad holes',
      items: [
        { h: 'Accept, assess, commit', p: 'Name the shot without judgment, take one useful lesson, then commit fully to the next.' },
        { h: 'Walk it off', p: 'Use the walk between shots to reset — present, not replaying.' },
        { h: 'Detach from the scorecard', p: 'Play targets, not numbers, especially when you’re protecting a good round.' },
        { h: 'Reset between holes', p: 'File the last hole — good or bad — and start the next with a clean slate.' },
      ],
    };
  }
  return {
    title: 'A simple framework for any mistake',
    items: [
      { h: 'Accept', p: 'Name the mistake once, without judgment.' },
      { h: 'Assess', p: 'Take one useful lesson — not a spiral of self-criticism.' },
      { h: 'Reset', p: 'Use a breath or a physical anchor to settle your system.' },
      { h: 'Commit', p: 'Give your full focus to the next play.' },
    ],
  };
}

export default async function MentalSportPage({ params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  if (!isValidSport(sport)) notFound();

  const { name, emoji } = sportDisplay(sport);
  const routines = getRoutinesForSport(sport);
  const fw = framework(sport);
  const otherSports = MENTAL_SPORT_CARDS.filter((c) => c.id !== sport);

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Mental Performance', path: '/mental-performance' },
    { name, path: `/mental-performance/${sport}` },
  ];

  const faqs = [
    {
      question: `How do I recover after a mistake in ${name.toLowerCase()}?`,
      answer: `Run a short reset: accept the mistake without judgment, take one useful lesson, settle with a breath or physical anchor, and commit fully to the next play. ${name} has specific routines for its most common moments below.`,
    },
    {
      question: 'Is this medical or mental-health treatment?',
      answer: NON_MEDICAL_DISCLAIMER,
    },
  ];

  const jsonLd = buildGraph(
    articleSchema({
      headline: `${name} Mental Performance — Recover After Mistakes & Stay Composed`,
      description: `Sport-psychology routines for ${name.toLowerCase()}.`,
      path: `/mental-performance/${sport}`,
    }),
    breadcrumbListSchema(crumbs),
    faqPageSchema(faqs),
  );

  return (
    <main className="min-h-screen bg-card">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Breadcrumbs items={crumbs} className="mb-5" />

        <header>
          <div className="text-4xl" aria-hidden="true">{emoji}</div>
          <h1 className="mt-2 text-3xl font-bold text-foreground md:text-4xl">{name} Mental Performance</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Recover faster after mistakes, manage frustration, and stay composed when {name.toLowerCase()} gets tense —
            with short routines you can run in the moment.
          </p>
          <Link href="/mental" className="mt-5 inline-block rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition-colors hover:bg-primary/90">
            Open the Mental Performance Coach
          </Link>
        </header>

        <section aria-labelledby="fw-h" className="mt-12">
          <h2 id="fw-h" className="text-2xl font-bold text-foreground">{fw.title}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {fw.items.map((it) => (
              <div key={it.h} className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground">{it.h}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{it.p}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="r-h" className="mt-12">
          <h2 id="r-h" className="text-2xl font-bold text-foreground">{name} reset routines</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {routines.map((r) => (
              <Link
                key={r.id}
                href={`/mental-performance/${sport}/${r.slug}`}
                className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground group-hover:text-primary">{r.title}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{r.durationSeconds}s</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{r.situation}</p>
                <p className="mt-2 text-sm font-medium text-primary">“{r.selfTalkCue}”</p>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="faq-h" className="mt-12">
          <h2 id="faq-h" className="text-2xl font-bold text-foreground">FAQ</h2>
          <dl className="mt-4 space-y-5">
            {faqs.map((f) => (
              <div key={f.question}>
                <dt className="font-semibold text-foreground">{f.question}</dt>
                <dd className="mt-1 text-muted-foreground">{f.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="other-h" className="mt-12">
          <h2 id="other-h" className="text-lg font-bold text-foreground">Other sports</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {otherSports.map((s) => (
              <Link key={s.id} href={`/mental-performance/${s.id}`} className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary">
                {s.emoji} {s.name}
              </Link>
            ))}
          </div>
        </section>

        <aside className="mt-12 rounded-xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
          <p>{NON_MEDICAL_DISCLAIMER}</p>
          <p className="mt-2">{CRISIS_NOTE}</p>
        </aside>
      </div>
      <JsonLd data={jsonLd} />
    </main>
  );
}
