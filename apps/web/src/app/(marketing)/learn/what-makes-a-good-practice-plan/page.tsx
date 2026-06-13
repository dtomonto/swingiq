import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { NotCoachReplacementNotice } from '@/components/trust/NotCoachReplacementNotice';
import {
  AnswerLead,
  FaqSection,
  EduSection,
  EduCard,
  EduCardGrid,
  TrustCallout,
  CtaRow,
} from '@/components/learn/education-ui';
import {
  getTechEducationArticle,
  techEducationCrumbs,
  buildTechEducationMetadata,
  buildTechEducationGraph,
} from '@/lib/learn/tech-education';
import { technologyClaims } from '@/content/technologyClaims';

const SLUG = 'what-makes-a-good-practice-plan';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const PARTS = [
  { title: 'One fix', body: 'A single focus for the session, so the result is easy to read and a retest can prove it.' },
  { title: 'A short warm-up', body: 'A few easy reps to get moving before you ask for quality — not the main event.' },
  { title: 'Targeted drills', body: 'Two or three drills that build from slow, aware reps to full-speed integration.' },
  { title: 'A pressure test', body: 'A small set with an explicit target, to check the change holds under a little pressure.' },
  { title: 'A success metric', body: 'A clear bar — like hitting your intent on six of ten reps — so you know it worked.' },
  { title: 'A retest', body: 'A follow-up clip under similar conditions that confirms the change actually stuck.' },
];

export default function WhatMakesAGoodPracticePlanPage() {
  const crumbs = techEducationCrumbs(article);

  return (
    <main className="min-h-screen bg-card">
      <JsonLd data={buildTechEducationGraph(SLUG)} />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={crumbs} className="mb-5" />

        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Learn · Technology</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">{article.heading}</h1>
          <AnswerLead>{article.answerSummary}</AnswerLead>
          <CtaRow
            items={[
              { href: '/start', label: 'Get your practice plan', primary: true },
              { href: '/learn/how-often-should-you-retest', label: 'How often to retest' },
            ]}
          />
        </header>

        <EduSection id="anatomy" eyebrow="The anatomy of a good plan" title="Short, focused, and provable">
          <p>
            The best practice plans are not long lists of everything to fix. They are short, focused, and built
            so you can tell whether they worked. SwingVantage assembles plans from these parts, scaled to the
            time you actually have:
          </p>
          <EduCardGrid>
            {PARTS.map((p) => (
              <EduCard key={p.title} title={p.title}>
                {p.body}
              </EduCard>
            ))}
          </EduCardGrid>
        </EduSection>

        <EduSection id="one-fix" eyebrow="Why one fix" title="Focus beats a long to-do list">
          <p>
            Changing several things at once muddies the result and stalls progress. Working a single fix keeps
            practice clear and makes the outcome easy to read — which is the whole idea behind one fix, one plan,
            one retest. A plan you can finish in the time you have beats an ambitious one you skip.
          </p>
        </EduSection>

        <EduSection id="proof" eyebrow="Make it provable" title="A plan you can actually grade">
          <p>
            A good plan ends with proof, not a shrug. The success metric tells you if the change held during
            practice, and a retest under similar conditions confirms it against your baseline. That is how a
            finished session becomes real progress — explained further in{' '}
            <Link href="/learn/how-retesting-improves-swing-feedback" className="font-medium text-primary hover:underline">
              Why Retesting Improves Swing Feedback
            </Link>
            .
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Try it" title="Turn your top fix into a plan">
          <CtaRow
            items={[
              { href: '/start', label: 'Get your practice plan', primary: true },
              { href: '/learn/how-often-should-you-retest', label: 'How often to retest' },
              { href: '/learn/how-to-read-your-swing-report', label: 'How to read your report' },
            ]}
          />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/how-often-should-you-retest" className="text-primary hover:underline">
            How Often Should You Retest?
          </Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/how-retesting-improves-swing-feedback" className="text-primary hover:underline">
            Why Retesting Improves Swing Feedback
          </Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn" className="inline-flex items-center gap-1 text-primary hover:underline">
            All learn guides <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </main>
  );
}
