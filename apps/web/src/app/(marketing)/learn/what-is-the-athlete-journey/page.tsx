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

const SLUG = 'what-is-the-athlete-journey';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const PIECES = [
  { title: 'Ordered stages', body: 'Your development modeled as stages for your sport, from foundation up through advanced and elite.' },
  { title: 'Your placement', body: 'Calculated from a blend of signals — rating, video, sessions, and practice habits — not one test.' },
  { title: 'Momentum', body: 'How fast you are moving right now, so progress is visible between the bigger stage jumps.' },
  { title: 'Unlock criteria', body: 'The specific things you need to demonstrate to reach the next stage, shown plainly.' },
  { title: 'Milestones', body: 'Concrete achievements within a stage that prove progress is real, not just felt.' },
  { title: 'Honest coverage', body: 'Golf and tennis are most complete today; sports still in development are labeled, never faked.' },
];

export default function WhatIsTheAthleteJourneyPage() {
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
              { href: '/start', label: 'Start your journey', primary: true },
              { href: '/learn/what-is-the-skill-tree', label: 'The skill tree' },
            ]}
          />
        </header>

        <EduSection id="anatomy" eyebrow="What it is" title="Improvement as a path, not a single score">
          <p>
            The athlete journey turns “get better” into a clear path. Rather than reducing your game to one
            number, it places you on an ordered set of stages and shows what reaching the next one takes — so
            progress is something you can see and steer.
          </p>
          <EduCardGrid>
            {PIECES.map((p) => (
              <EduCard key={p.title} title={p.title}>
                {p.body}
              </EduCard>
            ))}
          </EduCardGrid>
        </EduSection>

        <EduSection id="placement" eyebrow="How placement works" title="A blend of signals, not one test">
          <p>
            Your stage is not decided by a single score. SwingVantage blends any rating you provide with your
            video analysis, session patterns, practice discipline, and self-assessment, so where you land
            reflects your real game. Those inputs are the same ones described in{' '}
            <Link href="/learn/what-data-swingvantage-uses" className="font-medium text-primary hover:underline">
              What Data Does SwingVantage Use?
            </Link>
          </p>
        </EduSection>

        <EduSection id="advance" eyebrow="Moving up" title="Transparent criteria, real milestones">
          <p>
            Each stage lists the criteria that unlock the next one, and SwingVantage points to the practice and
            data that close the gap. Milestones mark concrete wins along the way, so advancement is earned
            through evidence rather than handed out — and the weekly plan that gets you there is shaped like a
            good{' '}
            <Link href="/learn/what-makes-a-good-practice-plan" className="font-medium text-primary hover:underline">
              practice plan
            </Link>
            .
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Try it" title="See where you are on the path">
          <CtaRow
            items={[
              { href: '/start', label: 'Start your journey', primary: true },
              { href: '/learn/what-is-the-skill-tree', label: 'The skill tree' },
              { href: '/learn/what-makes-a-good-practice-plan', label: 'A good practice plan' },
            ]}
          />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/what-is-the-skill-tree" className="text-primary hover:underline">
            What Is the Skill Tree?
          </Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/what-makes-a-good-practice-plan" className="text-primary hover:underline">
            What Makes a Good Practice Plan?
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
