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

const SLUG = 'what-is-a-swing-fault';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

export default function WhatIsASwingFaultPage() {
  const crumbs = techEducationCrumbs(article);
  return (
    <main className="min-h-screen bg-card">
      <JsonLd data={buildTechEducationGraph(SLUG)} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={crumbs} className="mb-5" />
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Learn · Concept</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">{article.heading}</h1>
          <AnswerLead>{article.answerSummary}</AnswerLead>
          <CtaRow items={[{ href: '/start', label: 'Find your top fault', primary: true }, { href: '/learn/data-points', label: 'Browse data points' }]} />
        </header>

        <EduSection id="cause" eyebrow="Cause vs. symptom" title="A fault is the cause, not the miss">
          <p>
            A slice, a fat shot, a pop-up — those are <strong>symptoms</strong>. A swing fault is the
            underlying <strong>cause</strong>: a specific, repeatable flaw like an over-the-top path or early
            extension. One root fault often creates several symptoms, which is why chasing each miss rarely
            works.
          </p>
          <EduCardGrid>
            <EduCard title="Symptom">What you see in the result — the ball flight or contact.</EduCard>
            <EduCard title="Fault">The named movement error that produced it.</EduCard>
            <EduCard title="Root fault">The single fault driving the most symptoms — your top fix.</EduCard>
          </EduCardGrid>
        </EduSection>

        <EduSection id="detect" eyebrow="How we find it" title="Detecting and ranking faults">
          <p>
            SwingVantage reads setup, path, sequencing, balance, and ball-flight consequences from your video
            and inputs, maps them to the most likely fault with a{' '}
            <EducationalLink term="heuristic-data">structured</EducationalLink> and{' '}
            <EducationalLink term="ai-sports">AI</EducationalLink> read, and labels how confident it is. Then
            it prioritizes the one root fault most responsible for your results — see the canonical explainers
            in the <Link href="/learn/data-points" className="font-medium text-primary hover:underline">data points library</Link>.
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>
        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Get started" title="See your root fault">
          <CtaRow items={[{ href: '/start', label: 'Find your top fault', primary: true }, { href: '/learn/how-ai-swing-analysis-works', label: 'How detection works' }, { href: '/learn/how-to-read-your-swing-report', label: 'Read your report' }]} />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/how-ai-swing-analysis-works" className="text-primary hover:underline">How AI Swing Analysis Works</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/what-makes-a-good-practice-plan" className="text-primary hover:underline">What Makes a Good Practice Plan?</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn" className="inline-flex items-center gap-1 text-primary hover:underline">All learn guides <ArrowRight size={12} aria-hidden="true" /></Link>
        </nav>
      </div>
    </main>
  );
}
