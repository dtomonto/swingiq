import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { NotCoachReplacementNotice } from '@/components/trust/NotCoachReplacementNotice';
import {
  buildGraph,
  articleSchema,
  faqPageSchema,
  breadcrumbListSchema,
} from '@/lib/seo/jsonLd';

export const metadata = buildMetadata({
  title: 'Athlete General Intelligence — Cross-Sport AI Engine',
  description:
    'One reasoning engine across all your sports — it finds the single skill limiting the most of them, shows what transfers between sports, and builds one plan you can trust.',
  path: '/athlete-general-intelligence',
  keywords: [
    'athlete general intelligence',
    'cross-sport training',
    'what is the one thing to train',
    'AI sports analysis',
    'transfer between sports',
    'keystone skill',
  ],
});

const FAQS = [
  {
    question: 'Is this "artificial general intelligence"?',
    answer:
      'No. "AGI" here means Athlete General Intelligence. "General" is used in its real technical sense — breadth and transfer across many domains (your sports) instead of one narrow task. It is not self-aware and does not think like a person. We chose the honest reading of the letters.',
  },
  {
    question: 'What does it actually do?',
    answer:
      'It fuses everything you have analysed — across golf, tennis, baseball, and softball — into one model of you as an athlete, then finds your keystone: the single capability that limits the most sports at once. It also shows what transfers between your sports, factors in today\'s readiness, tracks your progress over time, and turns it into one prioritised plan.',
  },
  {
    question: 'How is it different from a single-swing analysis?',
    answer:
      'A normal analysis looks at one swing in one sport. Athlete General Intelligence reasons across all of them at once. That is what lets it answer a bigger question: of everything you could work on, which one thing improves the most sports? Train that, and you lift several at the same time.',
  },
  {
    question: 'How do I know how much to trust it?',
    answer:
      'Every capability carries a basis (measured vs estimate) and a confidence, and the whole picture gets a single A–D trust grade that explains what is holding it up and what would raise it. Single-camera analysis is always called an estimate, never a lab measurement.',
  },
  {
    question: 'Where does my data live?',
    answer:
      'On your device. Athlete General Intelligence reads the sessions you have already analysed locally — it sends nothing to a server. Nothing here is medical or injury advice.',
  },
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mt-10">
      <h2 id={id} className="text-xl font-bold text-foreground">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-foreground">{children}</div>
    </section>
  );
}

export default function AthleteGeneralIntelligencePage() {
  const jsonLd = buildGraph(
    articleSchema({
      headline: 'Athlete General Intelligence — One Engine Across All Your Sports',
      description:
        'One reasoning engine across all your sports: it finds the single skill limiting the most of them, shows what transfers, and builds one plan — with a trust grade on everything.',
      path: '/athlete-general-intelligence',
    }),
    breadcrumbListSchema([
      { name: 'Home', path: '/' },
      { name: 'Athlete General Intelligence', path: '/athlete-general-intelligence' },
    ]),
    faqPageSchema(FAQS),
  );

  return (
    <main className="min-h-screen bg-card">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs
          items={[
            { name: 'Home', path: '/' },
            { name: 'Athlete General Intelligence', path: '/athlete-general-intelligence' },
          ]}
          className="mb-5"
        />

        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Athlete General Intelligence</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">
            One engine across all your sports — the few things that move everything
          </h1>
          <p className="mt-3 text-muted-foreground">
            Most analysis tools are specialists: one looks at your swing, one matches drills, one tracks
            progress. Athlete General Intelligence is the generalist — it looks at everything you have
            analysed, across every sport, at the same time, and answers the bigger question a single
            specialist cannot: of everything you could train, which one thing improves the most?
          </p>
        </header>

        <Section id="general" title="What “general” means here">
          <p>
            <strong>AGI = Athlete General Intelligence.</strong> The word “general” is used in its real
            technical sense: <strong>breadth and transfer across domains</strong> — your sports — instead
            of one narrow task. It is the opposite of a single-purpose tool. It is <em>not</em> “artificial
            general intelligence” in the science-fiction sense: it is not self-aware and does not think like
            a person. We picked the honest reading of the letters.
          </p>
        </Section>

        <Section id="does" title="What it does">
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Finds your keystone</strong> — the single capability that limits the most sports at once. Train it, and you lift every sport that uses it.</li>
            <li><strong>Shows what transfers</strong> — a skill you already own in one sport often carries to another; it surfaces those links.</li>
            <li><strong>Factors in today</strong> — your readiness scales how hard to train, and a discomfort flag always comes first.</li>
            <li><strong>Tracks progress over time</strong> — it remembers your capabilities and tells you honestly whether the thing you trained actually moved.</li>
            <li><strong>Builds one plan</strong> — a prioritised week that leads with the drills you have personally found helpful.</li>
          </ul>
        </Section>

        <Section id="capabilities" title="The idea that makes it work">
          <p>
            Every sport-specific measurement is mapped onto a small set of <strong>sport-neutral
            capabilities</strong> — rotation &amp; coil, kinetic sequencing, balance &amp; posture, tempo
            &amp; timing, power &amp; speed, and consistency. These are the traits you actually carry between
            sports, so the engine can reason about <em>you</em>, not about one isolated swing. The same
            rotation that powers a golf drive powers a tennis forehand.
          </p>
        </Section>

        <Section id="honesty" title="How it stays honest">
          <p>
            Like the rest of SwingVantage, it shows its work. Every conclusion carries an inspectable chain of
            reasoning, every capability shows its basis (measured vs estimate) and confidence, and the whole
            picture gets a single <strong>A–D trust grade</strong> that always explains what would raise it.
            Single-camera analysis is an <strong>estimate</strong>, never a lab measurement, and nothing here
            is medical or injury advice.
          </p>
          <p>
            See the full{' '}
            <Link href="/methodology" className="text-primary hover:underline">
              methodology
            </Link>{' '}
            for exactly what SwingVantage measures, estimates, and does not.
          </p>
        </Section>

        {/* CTA */}
        <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/10 p-6">
          <h2 className="text-lg font-bold text-foreground">Try it free</h2>
          <p className="mt-1 text-sm text-foreground">
            Analyse one swing and Athlete General Intelligence builds your cross-sport model. Add a second
            sport and it starts finding what transfers between them. Free, no account.
          </p>
          <Link
            href="/start"
            className="mt-4 inline-flex items-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start Here — Free
          </Link>
        </div>

        {/* FAQ */}
        <section aria-labelledby="faq" className="mt-12">
          <h2 id="faq" className="text-2xl font-bold text-foreground">
            Frequently asked questions
          </h2>
          <div className="mt-4 space-y-4">
            {FAQS.map((f) => (
              <div key={f.question} className="rounded-xl border border-border p-5">
                <h3 className="font-semibold text-foreground">{f.question}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <NotCoachReplacementNotice className="mt-10" />

        <nav aria-label="Related" className="mt-8 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/methodology" className="text-primary hover:underline">Methodology</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/trust" className="text-primary hover:underline">Trust &amp; Safety</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/how-it-works" className="text-primary hover:underline">How It Works</Link>
        </nav>
      </div>

      <JsonLd data={jsonLd} />
    </main>
  );
}
