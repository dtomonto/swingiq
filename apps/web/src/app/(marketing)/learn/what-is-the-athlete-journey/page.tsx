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

export default function WhatIsTheAthleteJourneyPage() {
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
          <CtaRow items={[{ href: '/start', label: 'Start your journey', primary: true }, { href: '/learn/what-is-the-skill-tree', label: 'The skill tree' }]} />
        </header>

        <EduSection id="stages" eyebrow="The arc" title="From first upload to confident player">
          <EduCardGrid>
            <EduCard title="Start">Your first analysis and first fix — a clear, encouraging entry point.</EduCard>
            <EduCard title="Build">Grooving fundamentals with focused plans and retests.</EduCard>
            <EduCard title="Refine">More precise, advanced work as your history accumulates.</EduCard>
            <EduCard title="Own it">Confident, self-directed practice you can carry into play.</EduCard>
          </EduCardGrid>
        </EduSection>

        <EduSection id="adapts" eyebrow="Why it matters" title="Guidance that fits where you are">
          <p>
            The right next step depends on your stage: a beginner needs encouraging, foundational direction; an
            advanced player needs specificity. SwingVantage reads your stage from your profile and accumulating
            history and adapts accordingly — and it travels across the sports you analyze rather than resetting
            for each. It pairs with the{' '}
            <Link href="/learn/what-is-the-skill-tree" className="font-medium text-primary hover:underline">skill tree</Link>,
            which maps <em>which</em> fundamentals to train next.
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>
        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Get started" title="See your stage">
          <CtaRow items={[{ href: '/start', label: 'Start your journey', primary: true }, { href: '/learn/what-is-athlete-general-intelligence', label: 'Cross-sport intelligence' }, { href: '/learn/what-is-the-skill-tree', label: 'The skill tree' }]} />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/what-is-the-skill-tree" className="text-primary hover:underline">What Is the Skill Tree?</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/how-swingvantage-uses-player-profiles" className="text-primary hover:underline">How SwingVantage Uses Player Profiles</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn" className="inline-flex items-center gap-1 text-primary hover:underline">All learn guides <ArrowRight size={12} aria-hidden="true" /></Link>
        </nav>
      </div>
    </main>
  );
}
