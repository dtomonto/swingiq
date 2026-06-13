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
  ComparisonTable,
  TrustCallout,
  CtaRow,
  type ComparisonRow,
} from '@/components/learn/education-ui';
import {
  getTechEducationArticle,
  techEducationCrumbs,
  buildTechEducationMetadata,
  buildTechEducationGraph,
} from '@/lib/learn/tech-education';
import { technologyClaims } from '@/content/technologyClaims';

const SLUG = 'ai-analysis-vs-launch-monitors';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const ROWS: ComparisonRow[] = [
  { dimension: 'What it captures', heuristic: 'The movement that caused the result.', ai: 'Precise ball & club numbers.' },
  { dimension: 'How', heuristic: 'Estimated from phone video.', ai: 'Measured by a sensor.' },
  { dimension: 'Hardware', heuristic: 'None — just a phone.', ai: 'A launch monitor.' },
  { dimension: 'Cost', heuristic: 'Free to start.', ai: 'Hundreds to thousands.' },
  { dimension: 'Best question', heuristic: 'Why is this happening, and what to fix?', ai: 'Exactly what were my numbers?' },
];

export default function AiAnalysisVsLaunchMonitorsPage() {
  const crumbs = techEducationCrumbs(article);

  return (
    <main className="min-h-screen bg-card">
      <JsonLd data={buildTechEducationGraph(SLUG)} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={crumbs} className="mb-5" />
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Learn · Comparison</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">{article.heading}</h1>
          <AnswerLead>{article.answerSummary}</AnswerLead>
          <CtaRow items={[{ href: '/start', label: 'Try AI analysis free', primary: true }, { href: '/learn/measured-vs-estimated', label: 'Measured vs estimated' }]} />
        </header>

        <EduSection id="compare" eyebrow="Side by side" title="Cause vs. numbers">
          <p>
            A launch monitor <strong>measures the result</strong>; <EducationalLink term="ai-sports">AI
            analysis</EducationalLink> <strong>reads the cause</strong>. Neither replaces the other.
          </p>
          <ComparisonTable
            caption="AI video swing analysis versus launch monitors across what they capture, how, hardware, cost, and best question."
            rows={ROWS}
            leftLabel="AI analysis"
            rightLabel="Launch monitor"
          />
        </EduSection>

        <EduSection id="together" eyebrow="Better together" title="Use both when you can">
          <p>
            Import your launch-monitor numbers and SwingVantage combines those measured values with the video
            read — the data corroborates the diagnosis and raises confidence. No monitor? AI analysis still
            gives you a prioritized fix and a plan from a free phone clip. See how the labels work in{' '}
            <Link href="/learn/measured-vs-estimated" className="font-medium text-primary hover:underline">measured vs estimated data</Link>.
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>
        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Get started" title="Start with what you have">
          <CtaRow items={[{ href: '/start', label: 'Try AI analysis free', primary: true }, { href: '/learn/is-ai-swing-analysis-accurate', label: 'Is it accurate?' }, { href: '/learn/is-ai-swing-analysis-worth-it', label: 'Is it worth it?' }]} />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/measured-vs-estimated" className="text-primary hover:underline">Measured vs Estimated Data</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/is-ai-swing-analysis-accurate" className="text-primary hover:underline">Is AI Swing Analysis Accurate?</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn" className="inline-flex items-center gap-1 text-primary hover:underline">All learn guides <ArrowRight size={12} aria-hidden="true" /></Link>
        </nav>
      </div>
    </main>
  );
}
