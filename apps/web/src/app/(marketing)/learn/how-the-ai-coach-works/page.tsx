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

const SLUG = 'how-the-ai-coach-works';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

export default function HowTheAiCoachWorksPage() {
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
          <CtaRow items={[{ href: '/ai-coach', label: 'Ask the AI coach', primary: true }, { href: '/learn/how-ai-swing-analysis-works', label: 'How analysis works' }]} />
        </header>

        <EduSection id="grounded" eyebrow="What makes it useful" title="Grounded in your data, not generic">
          <p>
            The difference between the AI coach and a generic chatbot is <strong>context</strong>. It draws on
            your own <EducationalLink term="ai-sports">analysis</EducationalLink>, profile, and history, so the
            answers fit your sport, level, and goals.
          </p>
          <EduCardGrid>
            <EduCard title="Explains your fix">Turns the report’s top fix into plain language and the why behind it.</EduCard>
            <EduCard title="Suggests drills">Matches drills to your level and the specific fault.</EduCard>
            <EduCard title="Adapts to questions">Ask follow-ups and it refines, instead of repeating one canned tip.</EduCard>
            <EduCard title="Remembers history">Uses your sessions and retests so advice builds on what you’ve done.</EduCard>
          </EduCardGrid>
        </EduSection>

        <EduSection id="limits" eyebrow="Honest by design" title="What it won’t do">
          <p>
            It stays grounded in your data and SwingVantage’s structured logic, flags uncertainty with
            confidence labels rather than fabricating precision, and defers injuries, guaranteed outcomes, and
            hands-on technique to a human coach. It is conversational guidance — not a diagnosis or a
            replacement for in-person coaching.
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>
        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Try it" title="Talk through your swing">
          <CtaRow items={[{ href: '/ai-coach', label: 'Ask the AI coach', primary: true }, { href: '/learn/does-ai-replace-a-coach', label: 'Does AI replace a coach?' }, { href: '/learn/how-to-read-your-swing-report', label: 'Read your report' }]} />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/how-ai-swing-analysis-works" className="text-primary hover:underline">How AI Swing Analysis Works</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/does-ai-replace-a-coach" className="text-primary hover:underline">Does AI Replace a Coach?</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn" className="inline-flex items-center gap-1 text-primary hover:underline">All learn guides <ArrowRight size={12} aria-hidden="true" /></Link>
        </nav>
      </div>
    </main>
  );
}
