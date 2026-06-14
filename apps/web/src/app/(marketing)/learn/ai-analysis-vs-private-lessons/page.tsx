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

const SLUG = 'ai-analysis-vs-private-lessons';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

export default function AiAnalysisVsPrivateLessonsPage() {
  const crumbs = techEducationCrumbs(article);

  return (
    <main className="min-h-screen bg-card">
      <JsonLd data={buildTechEducationGraph(SLUG)} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={crumbs} className="mb-5" />
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Learn · Cost &amp; value</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">{article.heading}</h1>
          <AnswerLead>{article.answerSummary}</AnswerLead>
          <CtaRow items={[{ href: '/start', label: 'Try a free analysis', primary: true }, { href: '/pricing', label: 'See pricing' }]} />
        </header>

        <EduSection id="value" eyebrow="Where each wins" title="Two tools, two jobs">
          <p>
            This is not a contest — <EducationalLink term="ai-sports">AI analysis</EducationalLink> and a coach
            cover different needs. Spend your money where a human genuinely adds value, and let software handle
            the everyday reads.
          </p>
          <EduCardGrid>
            <EduCard title="AI analysis is for…">Instant, low-cost, repeatable reads; practice between lessons; tracking progress and history.</EduCard>
            <EduCard title="A coach is for…">Hands-on feel, in-person correction, accountability, injuries, and advanced technique.</EduCard>
            <EduCard title="The cost gap">One lesson can cost more than a month of practice; SwingVantage starts free.</EduCard>
            <EduCard title="The smart combo">Diagnose and practice with AI, then bring findings to a coach so paid time goes straight to fixing.</EduCard>
          </EduCardGrid>
        </EduSection>

        <EduSection id="combine" eyebrow="Get the most value" title="Use both, deliberately">
          <p>
            Bring your top fix, confidence labels, and progress to your next lesson. You will skip the
            diagnosis and your coach can go straight to hands-on work — and between lessons, a fast{' '}
            <EducationalLink term="heuristic-data">heuristic</EducationalLink> read plus a retest keeps you
            moving instead of waiting.
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>
        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Get started" title="Make every lesson go further">
          <CtaRow items={[{ href: '/start', label: 'Try a free analysis', primary: true }, { href: '/learn/does-ai-replace-a-coach', label: 'Does AI replace a coach?' }, { href: '/learn/is-ai-swing-analysis-worth-it', label: 'Is it worth it?' }]} />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/does-ai-replace-a-coach" className="text-primary hover:underline">Does AI Replace a Coach?</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/ai-analysis-vs-launch-monitors" className="text-primary hover:underline">AI vs Launch Monitors</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn" className="inline-flex items-center gap-1 text-primary hover:underline">All learn guides <ArrowRight size={12} aria-hidden="true" /></Link>
        </nav>
      </div>
    </main>
  );
}
