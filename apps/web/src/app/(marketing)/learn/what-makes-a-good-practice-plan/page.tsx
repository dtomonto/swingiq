import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { NotCoachReplacementNotice } from '@/components/trust/NotCoachReplacementNotice';
import { EducationalLink } from '@/components/learn/EducationalLink';
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

export default function WhatMakesAGoodPracticePlanPage() {
  const crumbs = techEducationCrumbs(article);
  return (
    <main className="min-h-screen bg-card">
      <JsonLd data={buildTechEducationGraph(SLUG)} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={crumbs} className="mb-5" />
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Learn · How-to</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">{article.heading}</h1>
          <AnswerLead>{article.answerSummary}</AnswerLead>
          <CtaRow items={[{ href: '/start', label: 'Get your plan', primary: true }, { href: '/tools/practice-plan-generator', label: 'Practice plan generator' }]} />
        </header>

        <EduSection id="traits" eyebrow="The four traits" title="What separates a plan that works">
          <EduCardGrid>
            <EduCard title="One focus">A single fix to groove — not five changes competing for attention.</EduCard>
            <EduCard title="The right drills">Matched to your level and your specific fault, not generic tips.</EduCard>
            <EduCard title="Sensible dosage">Short, focused reps you will actually complete beat an abandoned marathon.</EduCard>
            <EduCard title="A retest">A built-in way to confirm the change worked before moving on.</EduCard>
          </EduCardGrid>
        </EduSection>

        <EduSection id="why" eyebrow="Why one fix" title="Focus is the multiplier">
          <p>
            Scattering attention across many changes is what stalls most improvement. SwingVantage builds plans
            around <strong>one fix, one plan, one retest</strong>, powered by a{' '}
            <EducationalLink term="heuristic-data">structured</EducationalLink> read of your swing — then
            prompts a <Link href="/learn/how-often-should-you-retest" className="font-medium text-primary hover:underline">retest</Link>{' '}
            so you keep going or adjust on evidence, not feel.
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>
        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Get started" title="Get a plan you’ll actually run">
          <CtaRow items={[{ href: '/start', label: 'Get your plan', primary: true }, { href: '/learn/how-to-read-your-swing-report', label: 'Read your report' }, { href: '/learn/how-often-should-you-retest', label: 'How often to retest' }]} />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/how-to-read-your-swing-report" className="text-primary hover:underline">How to Read Your Report</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/what-is-a-swing-fault" className="text-primary hover:underline">What Is a Swing Fault?</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn" className="inline-flex items-center gap-1 text-primary hover:underline">All learn guides <ArrowRight size={12} aria-hidden="true" /></Link>
        </nav>
      </div>
    </main>
  );
}
