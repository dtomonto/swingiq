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

const SLUG = 'what-is-the-skill-tree';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

export default function WhatIsTheSkillTreePage() {
  const crumbs = techEducationCrumbs(article);
  return (
    <main className="min-h-screen bg-card">
      <JsonLd data={buildTechEducationGraph(SLUG)} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={crumbs} className="mb-5" />
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Learn · Feature</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">{article.heading}</h1>
          <AnswerLead>{article.answerSummary}</AnswerLead>
          <CtaRow items={[{ href: '/start', label: 'Map your skills', primary: true }, { href: '/learn/what-is-the-athlete-journey', label: 'The athlete journey' }]} />
        </header>

        <EduSection id="how" eyebrow="How it’s built" title="Fundamentals, in a sensible order">
          <p>
            Skills depend on each other. The skill tree lays the fundamentals out as a progression so you work
            on what is actually in range — not an advanced move before the basics that support it.
          </p>
          <EduCardGrid>
            <EduCard title="Built">Skills you already own, confirmed by your analysis and retests.</EduCard>
            <EduCard title="In range">The next sensible steps for your sport and level.</EduCard>
            <EduCard title="Locked">Advanced skills that need their prerequisites first.</EduCard>
          </EduCardGrid>
        </EduSection>

        <EduSection id="why" eyebrow="Why order matters" title="The right step at the right time">
          <p>
            Trying an advanced skill before its foundation is in place usually forces compensations that
            create new faults. The tree keeps the order productive, adapts to your level and history, and stays
            sport-specific — and it pairs with the{' '}
            <Link href="/learn/what-is-the-athlete-journey" className="font-medium text-primary hover:underline">athlete journey</Link>{' '}
            to keep guidance appropriate to your stage.
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>
        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Get started" title="See what’s in range for you">
          <CtaRow items={[{ href: '/start', label: 'Map your skills', primary: true }, { href: '/learn/what-makes-a-good-practice-plan', label: 'Build a good plan' }, { href: '/learn/what-is-the-athlete-journey', label: 'The athlete journey' }]} />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/what-is-the-athlete-journey" className="text-primary hover:underline">What Is the Athlete Journey?</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/what-makes-a-good-practice-plan" className="text-primary hover:underline">What Makes a Good Practice Plan?</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn" className="inline-flex items-center gap-1 text-primary hover:underline">All learn guides <ArrowRight size={12} aria-hidden="true" /></Link>
        </nav>
      </div>
    </main>
  );
}
