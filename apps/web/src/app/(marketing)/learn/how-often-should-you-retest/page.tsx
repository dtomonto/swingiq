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

const SLUG = 'how-often-should-you-retest';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

export default function HowOftenShouldYouRetestPage() {
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
          <CtaRow items={[{ href: '/retest', label: 'See your retest plan', primary: true }, { href: '/learn/how-retesting-improves-swing-feedback', label: 'Why retesting works' }]} />
        </header>

        <EduSection id="cadence" eyebrow="The rhythm" title="A simple retest cadence">
          <EduCardGrid>
            <EduCard title="After a focused block">Practice one change for a week or a few sessions, then retest — not after every swing.</EduCard>
            <EduCard title="One change at a time">Isolate a single fix so the retest result is easy to read.</EduCard>
            <EduCard title="Match conditions">Same angle, light, and club so you compare like with like.</EduCard>
            <EduCard title="Read the result">Use it to keep going, adjust the drill, or move to the next fix.</EduCard>
          </EduCardGrid>
        </EduSection>

        <EduSection id="goldilocks" eyebrow="Not too much, not too little" title="Why timing matters">
          <p>
            Day-to-day swings vary, so retesting constantly mostly captures noise; retesting too rarely lets a
            bad habit settle before you catch it. A focused block gives a change time to show up, and a clean{' '}
            <EducationalLink term="heuristic-data">structured</EducationalLink> read then tells you honestly
            whether it worked. The point of the “one retest” in <strong>one fix, one plan, one retest</strong>
            {' '}is exactly this loop.
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>
        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Keep going" title="Prove your next change">
          <CtaRow items={[{ href: '/retest', label: 'See your retest plan', primary: true }, { href: '/learn/how-to-film-your-swing', label: 'Film a clean retest' }, { href: '/learn/what-makes-a-good-practice-plan', label: 'Build a good plan' }]} />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/how-retesting-improves-swing-feedback" className="text-primary hover:underline">Why Retesting Improves Feedback</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/how-to-read-your-swing-report" className="text-primary hover:underline">How to Read Your Report</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn" className="inline-flex items-center gap-1 text-primary hover:underline">All learn guides <ArrowRight size={12} aria-hidden="true" /></Link>
        </nav>
      </div>
    </main>
  );
}
