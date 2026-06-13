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

const SLUG = 'is-ai-swing-analysis-worth-it';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

export default function IsAiSwingAnalysisWorthItPage() {
  const crumbs = techEducationCrumbs(article);
  return (
    <main className="min-h-screen bg-card">
      <JsonLd data={buildTechEducationGraph(SLUG)} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={crumbs} className="mb-5" />
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Learn · Value</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">{article.heading}</h1>
          <AnswerLead>{article.answerSummary}</AnswerLead>
          <CtaRow items={[{ href: '/start', label: 'Try it free', primary: true }, { href: '/pricing', label: 'See pricing' }]} />
        </header>

        <EduSection id="who" eyebrow="Who it’s for" title="Where the value is highest">
          <EduCardGrid>
            <EduCard title="Improving athletes">Turns a free clip into a prioritized fix and a plan — direction instead of guesswork.</EduCard>
            <EduCard title="Between lessons">Keeps you progressing without paying by the hour just to find what’s wrong.</EduCard>
            <EduCard title="Self-coached players">A structured second opinion that remembers your history and tracks progress.</EduCard>
            <EduCard title="Parents &amp; youth">Clear, honest, non-medical guidance you can follow together.</EduCard>
          </EduCardGrid>
        </EduSection>

        <EduSection id="honest" eyebrow="The honest caveat" title="When it matters less">
          <p>
            If you already have frequent coaching and a launch monitor, the marginal gain is smaller — though
            a fast <EducationalLink term="heuristic-data">heuristic</EducationalLink> read still makes those
            sessions more productive. And remember: worth and accuracy differ. AI analysis is a structured
            estimate with honest confidence labels, valuable for <em>direction</em>, not a lab measurement —
            see <Link href="/learn/is-ai-swing-analysis-accurate" className="font-medium text-primary hover:underline">is AI swing analysis accurate</Link>.
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>
        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Decide for yourself" title="The free tier already pays off">
          <CtaRow items={[{ href: '/start', label: 'Try it free', primary: true }, { href: '/learn/ai-analysis-vs-private-lessons', label: 'Vs private lessons' }, { href: '/sample-report', label: 'See a sample report' }]} />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/ai-analysis-vs-private-lessons" className="text-primary hover:underline">AI Analysis vs Private Lessons</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/is-ai-swing-analysis-accurate" className="text-primary hover:underline">Is AI Swing Analysis Accurate?</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn" className="inline-flex items-center gap-1 text-primary hover:underline">All learn guides <ArrowRight size={12} aria-hidden="true" /></Link>
        </nav>
      </div>
    </main>
  );
}
