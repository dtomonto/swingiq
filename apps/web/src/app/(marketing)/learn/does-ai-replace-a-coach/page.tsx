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

const SLUG = 'does-ai-replace-a-coach';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const ROWS: ComparisonRow[] = [
  { dimension: 'Availability', heuristic: 'Every time you practice, instantly.', ai: 'Scheduled lessons.' },
  { dimension: 'Cost', heuristic: 'Free to start, low cost.', ai: 'Higher per hour.' },
  { dimension: 'Memory', heuristic: 'Remembers your full history.', ai: 'Relies on notes and recall.' },
  { dimension: 'Hands-on feel', heuristic: 'Cannot adjust you physically.', ai: 'Adjusts grip and posture by hand.' },
  { dimension: 'Motivation', heuristic: 'Structured nudges and plans.', ai: 'Personal accountability and rapport.' },
  { dimension: 'Injury & advanced work', heuristic: 'General, non-medical guidance.', ai: 'Essential for injuries and elite technique.' },
];

export default function DoesAiReplaceACoachPage() {
  const crumbs = techEducationCrumbs(article);

  return (
    <main className="min-h-screen bg-card">
      <JsonLd data={buildTechEducationGraph(SLUG)} />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={crumbs} className="mb-5" />

        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Learn · Trust</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">{article.heading}</h1>
          <AnswerLead>{article.answerSummary}</AnswerLead>
          <CtaRow
            items={[
              { href: '/start', label: 'Try a free analysis', primary: true },
              { href: '/coaches', label: 'For coaches' },
            ]}
          />
        </header>

        <EduSection id="short" eyebrow="The short answer" title="No — it makes coaching better">
          <p>
            <EducationalLink term="ai-sports">AI swing analysis</EducationalLink> is a powerful everyday edge,
            not a substitute for a human coach. It handles the fast first pass — spotting your top fault and
            handing you a plan you can act on today — so the time you spend with a coach goes straight to the
            work that needs a human. The honest framing: <strong>AI and a coach are complements</strong>.
          </p>
        </EduSection>

        <EduSection id="compare" eyebrow="Side by side" title="Where each one wins">
          <ComparisonTable
            caption="What AI swing analysis does well versus what a human coach does well."
            rows={ROWS}
            leftLabel="AI analysis"
            rightLabel="Human coach"
          />
        </EduSection>

        <EduSection id="together" eyebrow="Better together" title="How to use both">
          <p>
            Bring your SwingVantage findings, confidence labels, and progress to your next lesson. You will
            already know your top issue, so you can ask sharper questions and your coach can skip the
            diagnosis and go straight to fixing it. Between lessons, a fast{' '}
            <EducationalLink term="heuristic-data">heuristic</EducationalLink> read and a retest keep you
            progressing instead of guessing.
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Get started" title="Show up to your next lesson ahead">
          <CtaRow
            items={[
              { href: '/start', label: 'Try a free analysis', primary: true },
              { href: '/learn/how-to-read-your-swing-report', label: 'How to read your report' },
              { href: '/learn/future-of-ai-coaching-in-recreational-sports', label: 'The future of AI coaching' },
            ]}
          />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/ai-in-sports-performance" className="text-primary hover:underline">
            AI in Sports Performance
          </Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/is-ai-swing-analysis-accurate" className="text-primary hover:underline">
            Is AI Swing Analysis Accurate?
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
